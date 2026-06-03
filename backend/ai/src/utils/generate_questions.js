import { context_collector_agent, section_planner_agent, question_generator_agent } from "../models/agents.js";
import { Survey } from "../mongodb/surveySchema.js";
import SurveyPlan from "../mongodb/surveyPlan.js";
import connectDB from "../mongodb/connect.js";
import crypto from "crypto";
import { surveyLogs } from "../router/question_generation_route.js";

function pushLog(id, msg) {
    console.log(msg);
    if (!id) return;
    if (!surveyLogs.has(id)) surveyLogs.set(id, []);
    surveyLogs.get(id).push(msg);
}

export async function generate_english_questions(user_input, surveyId, survey_name) {
    // 1. Ensure DB connection
    await connectDB();

    const id = surveyId;

    pushLog(id, `Starting full generation pipeline for: ${user_input}`);

    // 2. Collect Context
    const context = await context_collector_agent(user_input, id);
    if (!context) {
        throw new Error("No context found from MoSPI");
    }

    // 3. Plan Sections
    const sectionsPlan = await section_planner_agent(user_input, context, id);
    if (!Array.isArray(sectionsPlan) || sectionsPlan.length === 0) {
        throw new Error("Section planner failed to return valid sections array");
    }

    // 4. Generate Questions for each Section Iteratively
    const questionSections = [];

    // add section one as constant here berfore any sections 
    const demographicsSection = {
        sectionName: "Demographics",
        questions: [
            {
                qid: "fullname",
                type: "text",
                text: { english: "Full Name" },
                audio: { english: "" }
            },
            {
                qid: "age",
                type: "text",
                text: { english: "Age" },
                audio: { english: "" }
            },
            {
                qid: "gender",
                type: "mcq",
                text: { english: "Gender" },
                audio: { english: "" },
                options: [
                    { id: "male", label: { english: "Male" } },
                    { id: "female", label: { english: "Female" } },
                    { id: "other", label: { english: "Other" } }
                ]
            },
            {
                qid: "primarylanguage",
                type: "text",
                text: { english: "Primary Language" },
                audio: { english: "" }
            },
            {
                qid: "uid-type",
                type: "mcq",
                text: { english: "UID Type" },
                audio: { english: "" },
                options: [
                    { id: "aadhaar", label: { english: "Aadhaar" } },
                    { id: "phone_no", label: { english: "Phone no." } },
                ]
            },
            {
                qid: "uid",
                type: "text",
                text: { english: "UID" },
                audio: { english: "" }
            },
            {
                qid: "pincode",
                type: "text",
                text: { english: "Pincode" },
                audio: { english: "" }
            },
            {
                qid: "area",
                type: "text",
                text: { english: "Area" },
                audio: { english: "" }
            }
        ]
    };
    questionSections.push(demographicsSection);

    let allGeneratedQuestions = [
        {
            sectionName: demographicsSection.sectionName,
            questions: demographicsSection.questions.map(q => ({ qid: q.qid }))
        }
    ];

    for (const section of sectionsPlan) {
        pushLog(id, `Generating questions for section: ${section.sectionName}`);
        let questionsForSection = await question_generator_agent(user_input, context, section, allGeneratedQuestions, id);

        // Safety check if response is not array
        if (!Array.isArray(questionsForSection)) {
            pushLog(id, "Warning: generator did not return array, defaulting to empty");
            questionsForSection = [];
        }

        allGeneratedQuestions.push({
            sectionName: section.sectionName || "General",
            questions: questionsForSection.map(q => ({ qid: q.qid }))
        });

        questionSections.push({
            sectionName: section.sectionName || "General",
            questions: questionsForSection
        });
    }

    // 5. Save survey contenxt
    // 5. Save survey contenxt
    pushLog(id, `Planned Sections: ${sectionsPlan.map(s => s.sectionName).join(", ")}`);

    pushLog(id, "Saving Survey Plan to MongoDB...");
    await SurveyPlan.findOneAndUpdate(
        { surveyId: id },
        {
            $set: {
                surveyId: id,
                mcp_context: context,
                sectionPlan: sectionsPlan
            }
        },
        { upsert: true, new: true }
    );

    // 6. Merge into Final JSON and Save to MongoDB
    const surveyData = {
        surveyId: id,
        name: survey_name || `Survey on ${user_input}`.substring(0, 100),
        status: "pending",
        supportedLanguages: ["english"],
        questionSections: questionSections,
        categories: ["AI Generated"],
        createdBy: "AI-Agent"
    };

    pushLog(id, `Saving survey to MongoDB with ID: ${surveyData.surveyId}`);

    // Upsert or Save
    const savedSurvey = await Survey.findOneAndUpdate(
        { surveyId: surveyData.surveyId },
        { $set: surveyData },
        { upsert: true, new: true }
    );

    console.log("Successfully saved to MongoDB");
    return savedSurvey;
}

export default async function generate_english_questions_retry(user_input, id, survey_name) {
    for (let i = 0; i < 3; i++) {
        try {
            console.log(`Attempt ${i + 1} for query: ${user_input}`);
            const survey = await generate_english_questions(user_input, id, survey_name);
            if (survey) {
                return survey;
            }
            break;
        } catch (error) {
            console.error("Error in generation loop:", error);
            continue;
        }
    }
    return null;
}

// // Test IIFE to verify execution flow
// if (process.argv[1] && process.argv[1].endsWith("generate_questions.js")) {
//     (async () => {
//         try {
//             console.log("=== Running Test IIFE ===");
//             const survey = await generate_english_questions_retry("unemployment rate in rural and urban areas", "test-survey-123");
//             console.log("\n=== Final Survey Output ===");
//             console.log(JSON.stringify(survey, null, 2));
//             process.exit(0);
//         } catch (error) {
//             console.error("Test failed:", error);
//             process.exit(1);
//         }
//     })();
// }
