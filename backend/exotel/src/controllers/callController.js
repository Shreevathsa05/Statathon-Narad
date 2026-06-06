import { triggerOutboundCall, updateLiveCall } from "../services/twilioService.js";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

// In-memory store for active calls
// Key: CallSid
// Value: { surveyId, citizenNumber, language, surveyData, responses, retryCount, currentQIndex }
export const activeCalls = new Map();

// Helper to flatten questions from sections
const flattenQuestions = (surveyData) => {
    let questions = [];
    if (surveyData.questionSections) {
        surveyData.questionSections.forEach(section => {
            if (section.questions) questions.push(...section.questions);
        });
    } else if (surveyData.questions) {
        questions = surveyData.questions;
    }
    return questions;
};

// Helper to evaluate branching logic
const evaluateShowIf = (question, responses) => {
    if (!question.showIf) return true;
    const { questionId, equals } = question.showIf;
    const parentResponse = responses.find(r => r.qid === questionId);
    if (!parentResponse) return false;
    return parentResponse.answer === equals;
};

// Helper to find the next valid question
const getNextQuestionIndex = (questions, currentIndex, responses) => {
    for (let i = currentIndex + 1; i < questions.length; i++) {
        if (evaluateShowIf(questions[i], responses)) {
            return i;
        }
    }
    return -1; // No more questions
};

// Helper to submit to main2
const submitResponsesToMain2 = async (session) => {
    try {
        const payload = {
            surveyId: session.surveyId,
            paraInfo: {
                interviewInfo: {
                    interviewMode: "ivr",
                    interviewStartTime: session.startTime,
                    interviewEndTime: new Date()
                }
            },
            response: session.responses
        };
        const main2Url = process.env.MAIN2_API_URL || 'http://localhost:3000';
        await axios.post(`${main2Url}/api/response/${session.surveyId}`, payload);
        console.log(`✅ Responses submitted to main2 for Call ${session.CallSid}`);
    } catch (e) {
        console.error("Error submitting to main2:", e.message);
    }
};

/**
 * Step 1: Trigger IVR Survey from Frontend
 */
export const triggerIvrSurvey = async (req, res) => {
  try {
    const { phoneNumber, surveyId, language } = req.body;

    if (!phoneNumber || !surveyId || !language) {
      return res.status(400).json({ error: "phoneNumber, surveyId, and language are required." });
    }

    // 1. Fetch survey from main2
    const main2Url = process.env.MAIN2_API_URL || 'http://localhost:3000';
    let surveyData;
    try {
      const surveyRes = await axios.get(`${main2Url}/api/survey/${surveyId}`);
      surveyData = surveyRes.data.data || surveyRes.data; 
    } catch (err) {
      console.error("Error fetching survey from main2:", err.message);
      return res.status(404).json({ error: "Survey not found or could not be fetched." });
    }

    // 2. The URL Twilio will hit when the citizen answers
    const webhookUrl = `${process.env.NGROK_URL}/api/survey/webhook/start?phoneNumber=${encodeURIComponent(phoneNumber)}&surveyId=${surveyId}&language=${language}`;
    console.log("🔗 Sending this webhook URL to Twilio:", webhookUrl);

    // 3. Trigger call
    const statusCallbackUrl = `${process.env.NGROK_URL}/api/survey/webhook/status`;
    const callData = await triggerOutboundCall(phoneNumber, webhookUrl, statusCallbackUrl);

    const callSid = callData.sid;
    activeCalls.set(callSid, {
      CallSid: callSid,
      surveyId,
      citizenNumber: phoneNumber,
      language,
      surveyData,
      responses: [], 
      currentQIndex: 0,
      retryCount: 0,
      startTime: new Date()
    });

    res.status(200).json({
      message: "Call initiated successfully to Twilio.",
      data: callData,
    });
  } catch (error) {
    console.error("Initiate Call Error:", error.message);
    res.status(500).json({ error: "Internal Server Error while triggering call." });
  }
};

/**
 * Step 2: Twilio hits this webhook when the citizen picks up. We return ExML/TwiML.
 */
export const handleCallConnect = (req, res) => {
  const { CallSid, To } = req.body;
  console.log(`📞 Call connected! CallSid: ${CallSid}, Citizen: ${To}`);

  let session = activeCalls.get(CallSid);
  if (!session) {
      console.error("Session not found for CallSid", CallSid);
      return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?><Response><Say>System error. Goodbye.</Say><Hangup/></Response>`);
  }

  const questions = flattenQuestions(session.surveyData);
  let firstQIndex = -1;
  for (let i = 0; i < questions.length; i++) {
      if (evaluateShowIf(questions[i], session.responses)) {
          firstQIndex = i;
          break;
      }
  }

  if (firstQIndex === -1) {
      activeCalls.delete(CallSid);
      return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?><Response><Say>No questions available. Goodbye.</Say><Hangup/></Response>`);
  }

  session.currentQIndex = firstQIndex;
  
  const question = questions[firstQIndex];
  let audioFileId = question.audio && question.audio[session.language]; 
  if (audioFileId && audioFileId.get) audioFileId = audioFileId.get(session.language); // Map handling
  else if (question.audio && question.audio instanceof Map) audioFileId = question.audio.get(session.language);
  
  // Proxy URL
  const audioUrl = `${process.env.NGROK_URL}/api/survey/proxy-audio?surveyId=${session.surveyId}&audioId=${audioFileId}`;

  const recordingActionUrl = `${process.env.NGROK_URL}/api/survey/webhook/answer`;

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
    <Response>
        <Play>${audioUrl}</Play>
        <Record action="${recordingActionUrl}" maxLength="60" />
    </Response>`;

  res.set("Content-Type", "text/xml");
  res.status(200).send(twiml);
};

/**
 * Step 3: Twilio hits this webhook with the recording MP3.
 */
export const handleAnswer = async (req, res) => {
  const { CallSid, RecordingUrl } = req.body;
  const session = activeCalls.get(CallSid);

  // Immediate response to keep call alive
  const pleaseWaitAudio = `${process.env.NGROK_URL}/audio/please_wait.mp3`;
  res.set("Content-Type", "text/xml");
  res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?><Response><Play>${pleaseWaitAudio}</Play><Pause length="20"/></Response>`);

  if (!session) {
    console.error("Session missing for answer", CallSid);
    return;
  }

  // Asynchronous STT and branching processing
  try {
    const aiApiUrl = process.env.AI_API_URL || 'http://localhost:3001';
    
    const sttRes = await axios.post(`${aiApiUrl}/speech/stt-twilio-sarvam`, { url: RecordingUrl });
    const transcribedText = sttRes.data; 
    console.log(`STT Result for Call ${CallSid}: ${transcribedText}`);

    const questions = flattenQuestions(session.surveyData);
    const currentQ = questions[session.currentQIndex];

    let isValid = false;
    let matchedOptionId = null;

    if (currentQ.type === "mcq" || currentQ.type === "checkbox") {
        const lowerText = (transcribedText || "").toLowerCase();
        for (const opt of currentQ.options) {
            let optLabel = opt.label[session.language] || opt.label;
            if (optLabel.get) optLabel = optLabel.get(session.language);
            
            optLabel = (optLabel || "").toLowerCase();
            if (lowerText.includes(optLabel) || optLabel.includes(lowerText)) {
                isValid = true;
                matchedOptionId = opt.id;
                break;
            }
        }
    } else {
        isValid = true;
        matchedOptionId = transcribedText; 
    }

    if (!isValid && session.retryCount < 1) {
        session.retryCount += 1;
        
        const invalidAudioUrl = `${process.env.NGROK_URL}/audio/invalid_response.mp3`;
        let qAudioId = currentQ.audio && currentQ.audio[session.language];
        if (currentQ.audio && currentQ.audio.get) qAudioId = currentQ.audio.get(session.language);
        const qAudioUrl = `${process.env.NGROK_URL}/api/survey/proxy-audio?surveyId=${session.surveyId}&audioId=${qAudioId}`;

        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
        <Response>
            <Play>${invalidAudioUrl}</Play>
            <Play>${qAudioUrl}</Play>
            <Record action="${process.env.NGROK_URL}/api/survey/webhook/answer" maxLength="60" />
        </Response>`;

        await updateLiveCall(CallSid, twiml);
        return;
    }

    let finalAnswer = matchedOptionId;
    if (!isValid && session.retryCount >= 1) {
       finalAnswer = null; 
    }

    session.responses.push({ qid: currentQ.qid, answer: finalAnswer });
    session.retryCount = 0; 

    const nextQIndex = getNextQuestionIndex(questions, session.currentQIndex, session.responses);

    if (nextQIndex !== -1) {
        session.currentQIndex = nextQIndex;
        const nextQ = questions[nextQIndex];
        let nextAudioId = nextQ.audio && nextQ.audio[session.language];
        if (nextQ.audio && nextQ.audio.get) nextAudioId = nextQ.audio.get(session.language);
        const nextAudioUrl = `${process.env.NGROK_URL}/api/survey/proxy-audio?surveyId=${session.surveyId}&audioId=${nextAudioId}`;

        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
        <Response>
            <Play>${nextAudioUrl}</Play>
            <Record action="${process.env.NGROK_URL}/api/survey/webhook/answer" maxLength="60" />
        </Response>`;

        await updateLiveCall(CallSid, twiml);
    } else {
        await submitResponsesToMain2(session);
        
        const thankYouAudio = `${process.env.NGROK_URL}/audio/thank_you.mp3`;
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
        <Response>
            <Play>${thankYouAudio}</Play>
            <Hangup />
        </Response>`;

        await updateLiveCall(CallSid, twiml);
        activeCalls.delete(CallSid);
    }

  } catch (err) {
      console.error("Error processing answer:", err.message);
      const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Say>A system error occurred. Goodbye.</Say><Hangup/></Response>`;
      try { await updateLiveCall(CallSid, twiml); } catch(e){}
  }
};

/**
 * Step 4: Handle premature hangup (CallStatus changes)
 */
export const handleCallStatus = async (req, res) => {
    const { CallSid, CallStatus } = req.body;
    if (['completed', 'failed', 'busy', 'no-answer', 'canceled'].includes(CallStatus)) {
        const session = activeCalls.get(CallSid);
        if (session) {
            console.log(`📞 Call ended prematurely (${CallStatus}). Submitting partial responses.`);
            await submitResponsesToMain2(session);
            activeCalls.delete(CallSid);
        }
    }
    res.sendStatus(200);
};

/**
 * Step 5: Proxy audio from AI service (MinIO) to be accessible to Twilio
 */
export const proxyAudio = async (req, res) => {
    const { surveyId, audioId } = req.query;
    try {
        const aiApiUrl = process.env.AI_API_URL || 'http://localhost:3001';
        const response = await axios({
            method: 'get',
            url: `${aiApiUrl}/speech/audio/${surveyId}/${audioId}`,
            responseType: 'stream'
        });
        res.setHeader('Content-Type', 'audio/mpeg');
        response.data.pipe(res);
    } catch (e) {
        console.error("Error proxying audio:", e.message);
        res.status(500).send("Error proxying audio");
    }
};
