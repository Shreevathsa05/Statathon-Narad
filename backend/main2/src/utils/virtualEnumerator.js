import { SurveyResponse } from "../models/responsesSchema.js";
import { Survey } from "../models/surveySchema.js";
import { processResponsePincode } from "./pincodeProcessor.js";
import crypto from "crypto";

// --- Heuristics Functions ---

function calculateShannonEntropy(str) {
    if (!str || str.length === 0) return 0;
    const len = str.length;
    const frequencies = {};
    for (let i = 0; i < len; i++) {
        frequencies[str[i]] = (frequencies[str[i]] || 0) + 1;
    }
    let entropy = 0;
    for (const char in frequencies) {
        const p = frequencies[char] / len;
        entropy -= p * Math.log2(p);
    }
    return entropy;
}

function countWords(str) {
    if (!str) return 0;
    return str.trim().split(/\s+/).length;
}

function hasKeyboardSmash(str) {
    const smashes = ['asdf', 'qwer', 'zxcv'];
    str = str.toLowerCase();
    if (smashes.some(s => str.includes(s))) return true;
    
    // Check for 4+ consecutive identical characters
    if (/(.)\1{3,}/.test(str)) return true;
    
    return false;
}

function getPlausibleWordRatio(str) {
    if (!str) return 0;
    const letters = str.toLowerCase().replace(/[^a-z]/g, '');
    if (letters.length === 0) return 1; // Not a word-based string
    
    const vowels = letters.match(/[aeiou]/g) || [];
    const consonants = letters.length - vowels.length;
    
    if (consonants === 0) return 0; // All vowels is suspicious
    return vowels.length / consonants;
}

function hashResponse(responseArray) {
    const simplified = responseArray.map(r => ({ qid: r.qid, answer: r.answer }));
    simplified.sort((a, b) => a.qid.localeCompare(b.qid));
    const str = JSON.stringify(simplified);
    return crypto.createHash('sha256').update(str).digest('hex');
}

/**
 * Executes heuristics on a single response document.
 * Designed to be run asynchronously in the background upon response submission.
 */
export async function evaluateSingleResponse(responseId) {
    const doc = await SurveyResponse.findById(responseId);
    if (!doc) throw new Error(`SurveyResponse with id '${responseId}' not found.`);

    const survey = await Survey.findById(doc.surveyId);
    if (!survey) throw new Error(`Survey for response '${responseId}' not found.`);

    const questionMap = new Map();
    survey.questionSections.forEach(section => {
        section.questions.forEach(q => questionMap.set(q.qid, q));
    });

    const flags = [];

    // 1. Invalid Data Detection
    const loc = doc.paraInfo?.locationInfo || {};
    if (!loc.districtLGDCode) {
        flags.push({
            type: "invalid_data",
            reason: `Missing LGD Code for provided Pincode: ${loc.pincode || 'None'}`,
            severity: "high"
        });
    }

    // 2. Time Difference
    if (doc.paraInfo?.interviewInfo) {
        const start = new Date(doc.paraInfo.interviewInfo.interviewStartTime);
        const end = new Date(doc.paraInfo.interviewInfo.interviewEndTime);
        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
            const diffSeconds = (end.getTime() - start.getTime()) / 1000;
            const numQuestions = doc.response.length;
            if (numQuestions > 0) {
                const secondsPerQuestion = diffSeconds / numQuestions;
                if (secondsPerQuestion < 2) {
                    flags.push({
                        type: "time",
                        reason: `Unrealistically fast completion time: ${secondsPerQuestion.toFixed(1)} seconds per question`,
                        severity: "high"
                    });
                }
            }
        }
    }

    // 3. Behavioral Fraud Detection - Duplicates
    const hash = hashResponse(doc.response);
    const otherDocs = await SurveyResponse.find({ surveyId: doc.surveyId, _id: { $ne: doc._id } });
    let existingDuplicates = false;
    for (const other of otherDocs) {
        if (hashResponse(other.response) === hash) {
            existingDuplicates = true;
            break;
        }
    }

    if (existingDuplicates) {
        flags.push({
            type: "behavioral",
            reason: `Duplicate Response Array detected across multiple submissions`,
            severity: "high"
        });
    }

    // 4. Behavioral Fraud Detection - Straight-lining & Text Quality & Contextual Anomalies
    let mcqCount = 0;
    let lastMcqAnswer = null;
    let straightLineCount = 0;

    for (const ans of doc.response) {
        const question = questionMap.get(ans.qid);
        if (!question) continue;

        const englishText = (question.text?.english || "").toLowerCase();
        
        if (question.type === 'mcq') {
            mcqCount++;
            if (ans.answer === lastMcqAnswer) {
                straightLineCount++;
            } else {
                lastMcqAnswer = ans.answer;
                straightLineCount = 1;
            }
        }

        if (question.type === 'text' && typeof ans.answer === 'string') {
            const textAns = ans.answer;
            
            if (hasKeyboardSmash(textAns)) {
                flags.push({
                    type: "text_quality",
                    reason: `Keyboard smash detected in question ${ans.qid}: '${textAns}'`,
                    severity: "high"
                });
            }

            const entropy = calculateShannonEntropy(textAns);
            if (textAns.length > 5 && (entropy < 1.0 || entropy > 4.5)) {
                flags.push({
                    type: "text_quality",
                    reason: `Unnatural character entropy (${entropy.toFixed(2)}) in question ${ans.qid}`,
                    severity: "medium"
                });
            }

            if (englishText.includes("age") && !isNaN(textAns)) {
                const age = parseInt(textAns);
                if (age < 0 || age > 120) {
                    flags.push({
                        type: "invalid_data",
                        reason: `Age value is out of bounds (${age}) for question ${ans.qid}`,
                        severity: "high"
                    });
                }
            }

            if (englishText.includes("name") || ans.qid.toLowerCase().includes("name")) {
                if (textAns.length <= 2) {
                    flags.push({
                        type: "invalid_data",
                        reason: `Name length is impossibly short (${textAns.length} chars) for question ${ans.qid}`,
                        severity: "high"
                    });
                }
            }
            
            if (textAns.length > 4) {
                const ratio = getPlausibleWordRatio(textAns);
                if (ratio === 0 || ratio > 4) {
                    flags.push({
                        type: "text_quality",
                        reason: `Gibberish detected (vowel-consonant ratio ${ratio.toFixed(2)}) in question ${ans.qid}`,
                        severity: "medium"
                    });
                }
            }
        }
    }

    if (straightLineCount >= 5) {
        flags.push({
            type: "behavioral",
            reason: `Straight-Lining detected: 5 or more consecutive identical MCQ option choices`,
            severity: "high"
        });
    }

    // Save flags
    doc.flags = flags;
    doc.isFlagged = flags.length > 0;
    await doc.save();
    
    if (doc.isFlagged) {
        console.log(`⚠️ Flagged ID: ${doc._id} | Flags: ${flags.map(f => f.type).join(', ')}`);
    }

    return doc;
}

/**
 * Executes the Virtual Enumerator scanning process.
 * NOTE: This is now a legacy manual bulk scanner for terminal usage.
 * Real-time responses use evaluateSingleResponse instead.
 */
export async function runVirtualEnumerator(surveyId) {
    const survey = await Survey.findOne({ surveyId: surveyId });
    if (!survey) {
        throw new Error(`Survey with surveyId '${surveyId}' not found.`);
    }

    const responses = await SurveyResponse.find({ surveyId: survey._id });
    if (responses.length === 0) {
        return []; // Return empty array if no responses
    }

    console.log(`\n--- PASS 1: Pincode LGD Pre-processing ---`);
    for (const response of responses) {
        const loc = response.paraInfo?.locationInfo || {};
        if (!loc.districtLGDCode) {
            await processResponsePincode(response._id);
        }
    }

    console.log(`\n--- PASS 2: Heuristics Evaluation ---`);
    const updatedResponses = await SurveyResponse.find({ surveyId: survey._id });
    
    const questionMap = new Map();
    survey.questionSections.forEach(section => {
        section.questions.forEach(q => {
            questionMap.set(q.qid, q);
        });
    });

    const responseHashes = new Set();
    const flaggedResponses = [];

    for (const doc of updatedResponses) {
        if (doc.isFlagged) {
            responseHashes.add(hashResponse(doc.response));
            flaggedResponses.push(doc);
            continue;
        }

        const flags = [];
        
        // 1. Invalid Data Detection
        const loc = doc.paraInfo?.locationInfo || {};
        if (!loc.districtLGDCode) {
            flags.push({
                type: "invalid_data",
                reason: `Missing LGD Code for provided Pincode: ${loc.pincode || 'None'}`,
                severity: "high"
            });
        }

        // 2. Time Difference
        if (doc.paraInfo?.interviewInfo) {
            const start = new Date(doc.paraInfo.interviewInfo.interviewStartTime);
            const end = new Date(doc.paraInfo.interviewInfo.interviewEndTime);
            if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                const diffSeconds = (end.getTime() - start.getTime()) / 1000;
                const numQuestions = doc.response.length;
                if (numQuestions > 0) {
                    const secondsPerQuestion = diffSeconds / numQuestions;
                    if (secondsPerQuestion < 2) {
                        flags.push({
                            type: "time",
                            reason: `Unrealistically fast completion time: ${secondsPerQuestion.toFixed(1)} seconds per question`,
                            severity: "high"
                        });
                    }
                }
            }
        }

        // 3. Behavioral Fraud Detection - Duplicates
        const hash = hashResponse(doc.response);
        if (responseHashes.has(hash)) {
            flags.push({
                type: "behavioral",
                reason: `Duplicate Response Array detected across multiple submissions`,
                severity: "high"
            });
        } else {
            responseHashes.add(hash);
        }

        // 4. Behavioral Fraud Detection - Straight-lining & Text Quality & Contextual Anomalies
        let mcqCount = 0;
        let lastMcqAnswer = null;
        let straightLineCount = 0;

        for (const ans of doc.response) {
            const question = questionMap.get(ans.qid);
            if (!question) continue;

            const englishText = (question.text?.english || "").toLowerCase();
            
            if (question.type === 'mcq') {
                mcqCount++;
                if (ans.answer === lastMcqAnswer) {
                    straightLineCount++;
                } else {
                    lastMcqAnswer = ans.answer;
                    straightLineCount = 1;
                }
            }

            if (question.type === 'text' && typeof ans.answer === 'string') {
                const textAns = ans.answer;
                
                if (hasKeyboardSmash(textAns)) {
                    flags.push({
                        type: "text_quality",
                        reason: `Keyboard smash detected in question ${ans.qid}: '${textAns}'`,
                        severity: "high"
                    });
                }

                const entropy = calculateShannonEntropy(textAns);
                if (textAns.length > 5 && (entropy < 1.0 || entropy > 4.5)) {
                    flags.push({
                        type: "text_quality",
                        reason: `Unnatural character entropy (${entropy.toFixed(2)}) in question ${ans.qid}`,
                        severity: "medium"
                    });
                }

                if (englishText.includes("age") && !isNaN(textAns)) {
                    const age = parseInt(textAns);
                    if (age < 0 || age > 120) {
                        flags.push({
                            type: "invalid_data",
                            reason: `Age value is out of bounds (${age}) for question ${ans.qid}`,
                            severity: "high"
                        });
                    }
                }

                if (englishText.includes("name") || ans.qid.toLowerCase().includes("name")) {
                    if (textAns.length <= 2) {
                        flags.push({
                            type: "invalid_data",
                            reason: `Name length is impossibly short (${textAns.length} chars) for question ${ans.qid}`,
                            severity: "high"
                        });
                    }
                }
                
                if (textAns.length > 4) {
                    const ratio = getPlausibleWordRatio(textAns);
                    if (ratio === 0 || ratio > 4) {
                        flags.push({
                            type: "text_quality",
                            reason: `Gibberish detected (vowel-consonant ratio ${ratio.toFixed(2)}) in question ${ans.qid}`,
                            severity: "medium"
                        });
                    }
                }
            }
        }

        if (straightLineCount >= 5) {
            flags.push({
                type: "behavioral",
                reason: `Straight-Lining detected: 5 or more consecutive identical MCQ option choices`,
                severity: "high"
            });
        }

        // Save flags
        doc.flags = flags;
        doc.isFlagged = flags.length > 0;
        await doc.save();
        
        if (doc.isFlagged) {
            flaggedResponses.push(doc);
            console.log(`⚠️ Flagged ID: ${doc._id} | Flags: ${flags.map(f => f.type).join(', ')}`);
        }
    }

    return flaggedResponses;
}
