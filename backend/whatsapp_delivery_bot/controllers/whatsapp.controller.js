import { getSession, createSession, updateSession, deleteSession, saveIncrementalAnswer } from "../services/session.service.js";
import { getActiveSurveys, getSurveyById, getFlatQuestions } from "../services/survey.service.js";
import { sendOtp, verifyOtp, generateOtpCode } from "../services/otp.service.js";
import { lookupRespondent, saveRespondentDemographics } from "../services/respondent.service.js";
import { resolveLocationByPincode, validatePincodeFormat } from "../services/location.service.js";
import { getNextQuestionIndex, shouldShowQuestion } from "../services/skipLogic.service.js";
import { sendTextMessage, sendInteractiveButtons, sendInteractiveList } from "../utils/whatsappHelper.js";
import { SurveyResponse } from "../models/SurveyResponse.js";
import { Survey } from "../models/Survey.js";

/**
 * Handle verification of the webhook by WhatsApp Cloud API (GET request).
 */
export const verifyWebhook = (req, res) => {
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || "narad_whatsapp_verify_token";
  
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token) {
    if (mode === "subscribe" && token === verifyToken) {
      console.log("✅ Webhook verified successfully!");
      return res.status(200).send(challenge);
    } else {
      console.warn("❌ Webhook verification failed: token mismatch.");
      return res.sendStatus(403);
    }
  }
  return res.sendStatus(400);
};

const getMapValue = (mapObj, key, fallbackKey = "english") => {
  if (!mapObj) return "";
  if (mapObj instanceof Map) {
    return mapObj.get(key) || mapObj.get(fallbackKey) || "";
  }
  if (typeof mapObj === "object") {
    return mapObj[key] || mapObj[fallbackKey] || "";
  }
  return "";
};

/**
 * Helper to dynamically format and send the current question to the respondent.
 * Handles text, checkbox, mcq, and yes/no formats using appropriate WhatsApp message types.
 * @param {string} userPhone 
 * @param {Object} question - The question object
 * @param {string} lang - Selected language (e.g. "english", "hindi")
 * @param {Array} currentSelections - Optional list of currently checked options for checkboxes
 */
const askQuestion = async (userPhone, question, lang = "english", currentSelections = []) => {
  const qText = getMapValue(question.text, lang) || "Question text not available.";
  const qid = question.qid;

  console.log(`[Ask Question] QID: ${qid}, Type: ${question.type}, Language: ${lang}`);

  // 1. MCQ (Single Choice)
  if (question.type === "mcq") {
    const options = question.options || [];
    const formattedOptions = options.map(o => ({
      id: `OPT_${qid}_${o.id}`,
      title: getMapValue(o.label, lang) || o.id
    }));

    if (formattedOptions.length === 0) {
      return await sendTextMessage(userPhone, qText);
    }

    if (formattedOptions.length <= 3) {
      // Send Quick Reply Buttons
      return await sendInteractiveButtons(userPhone, qText, formattedOptions);
    } else {
      // Send Interactive List Message
      return await sendInteractiveList(
        userPhone,
        qText,
        "Select Option",
        "Options",
        formattedOptions.map(opt => ({
          id: opt.id,
          title: opt.title
        }))
      );
    }
  }

  // 2. Checkbox (Multiple Choice)
  // WhatsApp lists are single-select, so we simulate multiple selection:
  // Show selections so far, list remaining options, and add a "Submit / Done" row.
  if (question.type === "checkbox") {
    const options = question.options || [];
    const rows = options.map(o => {
      const isSelected = currentSelections.includes(o.id);
      return {
        id: `CHK_${qid}_${o.id}`,
        title: `${isSelected ? "☑️ " : "⬜ "} ${getMapValue(o.label, lang) || o.id}`
      };
    });

    // Add a Done option
    rows.push({
      id: `CHK_DONE_${qid}`,
      title: "👉 [ Done / Submit ]",
      description: "Click to save all selections and continue"
    });

    const activeSelectionsStr = currentSelections.length > 0 
      ? `\n\n(Current Selections: ${currentSelections.join(", ")})` 
      : "";

    return await sendInteractiveList(
      userPhone,
      `${qText}${activeSelectionsStr}\n\nSelect all that apply, then select 'Done / Submit'.`,
      "Select Choices",
      "Choices Available",
      rows
    );
  }

  // 3. Text or general inputs
  return await sendTextMessage(userPhone, qText);
};

/**
 * Central router for incoming WhatsApp webhook messages (POST request).
 */
export const handleIncomingMessage = async (req, res) => {
  try {
    const body = req.body;

    if (body.object !== "whatsapp_business_account") {
      return res.sendStatus(404);
    }

    const value = body.entry?.[0]?.changes?.[0]?.value;
    const message = value?.messages?.[0];

    if (!message) {
      // Not a user message event (could be a status update, delivery receipt, etc.)
      return res.sendStatus(200);
    }

    const userPhone = message.from;
    const messageText = message.text?.body?.trim() || "";
    const interactivePayload = message.interactive?.button_reply?.id || message.interactive?.list_reply?.id || "";

    console.log(`[Incoming Message] From: ${userPhone}, Text: "${messageText}", Payload: "${interactivePayload}"`);

    // Fetch active session
    let session = await getSession(userPhone);

    // --- STATE 1: SURVEY SELECTION / INVITATION (NO ACTIVE SESSION) ---
    if (!session) {
      // Check if starting a specific survey from template invitation
      if (interactivePayload.startsWith("START_SURVEY_")) {
        const surveyId = interactivePayload.replace("START_SURVEY_", "");
        const survey = await getSurveyById(surveyId);
        if (!survey || survey.status !== "active") {
          await sendTextMessage(userPhone, "This survey is no longer active. Thank you for your interest.");
          return res.sendStatus(200);
        }

        session = await createSession(userPhone, surveyId);
        await sendTextMessage(userPhone, `Welcome to the survey: "${survey.name}".\n\nPlease enter your phone number to verify your identity:`);
        return res.sendStatus(200);
      }

      // Check if starting any active survey
      const activeSurveys = await getActiveSurveys();
      if (activeSurveys.length === 0) {
        await sendTextMessage(userPhone, "There are no active surveys available at this time. Thank you.");
        return res.sendStatus(200);
      }

      if (activeSurveys.length === 1) {
        const survey = activeSurveys[0];
        session = await createSession(userPhone, survey.surveyId);
        await sendTextMessage(userPhone, `Welcome to the survey: "${survey.name}".\n\nPlease enter your phone number to verify your identity:`);
        return res.sendStatus(200);
      }

      // If multiple active surveys, present list
      const rows = activeSurveys.map(s => ({
        id: `SELECT_SURVEY_${s.surveyId}`,
        title: s.name.substring(0, 24),
        description: s.categories?.join(", ") || ""
      }));

      await sendInteractiveList(
        userPhone,
        "Welcome to the MoSPI NARAD Survey Platform. Please select one of the active surveys to begin:",
        "Select Survey",
        "Active Surveys",
        rows
      );

      // Create a temporary session in survey_selection state
      await SurveySession.create({
        userPhone,
        surveyId: "pending",
        currentState: "survey_selection"
      });

      return res.sendStatus(200);
    }

    // --- RESUME SESSION IN STATE survey_selection ---
    if (session.currentState === "survey_selection") {
      if (interactivePayload.startsWith("SELECT_SURVEY_")) {
        const surveyId = interactivePayload.replace("SELECT_SURVEY_", "");
        const survey = await getSurveyById(surveyId);
        if (!survey) {
          await sendTextMessage(userPhone, "Invalid survey selection. Please try again.");
          return res.sendStatus(200);
        }

        // Initialize active session
        session = await createSession(userPhone, surveyId);
        await sendTextMessage(userPhone, `Welcome to the survey: "${survey.name}".\n\nPlease enter your phone number (10 digits) to verify your identity:`);
      } else {
        await sendTextMessage(userPhone, "Please select a survey from the list menu above.");
      }
      return res.sendStatus(200);
    }

    // Fetch survey and flattened questions list for session processing
    const survey = await getSurveyById(session.surveyId);
    if (!survey || survey.status !== "active") {
      await sendTextMessage(userPhone, "This survey is no longer active. Closing session.");
      await deleteSession(userPhone);
      return res.sendStatus(200);
    }

    const flatQuestions = getFlatQuestions(survey);

    // --- STATE 2: PHONE COLLECTION ---
    if (session.currentState === "phone_collection") {
      const cleanPhone = messageText.replace(/\D/g, "");
      if (cleanPhone.length !== 10) {
        await sendTextMessage(userPhone, "Invalid phone number format. Please enter a valid 10-digit phone number:");
        return res.sendStatus(200);
      }

      // Generate OTP and send it
      const otpCode = generateOtpCode();
      session.currentState = "otp_sent";
      // Save phone number temporary target
      session.currentQuestionId = cleanPhone; 
      await session.save();

      await sendOtp(cleanPhone, otpCode);
      await sendTextMessage(
        userPhone,
        `We have sent a 6-digit verification code to +91${cleanPhone}.\n\nPlease enter the code below (or type "RESEND" to try again):`
      );
      return res.sendStatus(200);
    }

    // --- STATE 3: OTP SENT/VERIFICATION ---
    if (session.currentState === "otp_sent") {
      const enteredCode = messageText.trim();
      const targetPhone = session.currentQuestionId;

      if (enteredCode.toLowerCase() === "resend") {
        const otpCode = generateOtpCode();
        await sendOtp(targetPhone, otpCode);
        await sendTextMessage(userPhone, `OTP resent to +91${targetPhone}. Enter the code:`);
        return res.sendStatus(200);
      }

      const verified = await verifyOtp(targetPhone, enteredCode);
      if (!verified) {
        await sendTextMessage(userPhone, "Invalid or expired code. Please enter the correct code, or reply 'RESEND':");
        return res.sendStatus(200);
      }

      // OTP Verified successfully!
      session.verificationStatus = "verified";
      session.currentState = "demographic_collection";
      await session.save();

      await sendTextMessage(userPhone, "✅ Identity verified successfully!");

      // --- STATE 4: EXISTING RESPONDENT LOOKUP ---
      const profile = await lookupRespondent(targetPhone);
      if (profile) {
        await sendTextMessage(userPhone, "Existing citizen profile found. Pre-populating demographics and skipping completed fields.");
        
        // Prefill demographic answers
        const demoQuestions = flatQuestions.filter(q => q.sectionName === "Demographics");
        demoQuestions.forEach(q => {
          // Map properties appropriately
          let val = "";
          if (q.qid === "fullname" || q.qid === "fullName") val = profile.fullname;
          else if (q.qid === "age") val = profile.age;
          else if (q.qid === "gender") val = profile.gender;
          else if (q.qid === "primarylanguage" || q.qid === "primaryLanguage") val = profile.primarylanguage;
          else if (q.qid === "pincode") val = profile.pincode;
          else if (q.qid === "area") val = profile.area;
          else if (q.qid === "education") val = profile.education;
          else if (q.qid === "occupation") val = profile.occupation;

          if (val) {
            session.answers.set(q.qid, val);
          }
        });

        // Determine if pincode is missing, or continue
        if (profile.pincode) {
          session.currentState = "survey_questions";
          // Check location codes to enrich Response paradata
          const locDetails = await resolveLocationByPincode(profile.pincode);
          const responseDoc = await SurveyResponse.findOne({ 
            surveyId: survey._id, 
            respondent: session.userPhone, 
            status: "in_progress" 
          });
          if (responseDoc) {
            responseDoc.paraInfo.locationInfo = {
              pincode: profile.pincode,
              state: locDetails.state,
              district: locDetails.district,
              blockName: locDetails.block,
              village: locDetails.village,
              stateLGDCode: locDetails.lgdStateCode,
              districtLGDCode: locDetails.lgdDistrictCode
            };
            await responseDoc.save();
          }

          // Move directly to core questions
          const nextIdx = getNextQuestionIndex(flatQuestions, demoQuestions.length, session.answers);
          if (nextIdx === -1) {
            session.currentState = "completed";
            await session.save();
            await triggerCompletionFlow(session, survey);
            return res.sendStatus(200);
          }

          session.currentQuestionIndex = nextIdx;
          const nextQ = flatQuestions[nextIdx];
          session.currentQuestionId = nextQ.qid;
          await session.save();

          await askQuestion(userPhone, nextQ, session.surveyLanguage);
        } else {
          session.currentState = "pincode_collection";
          await session.save();
          await sendTextMessage(userPhone, "Please enter your 6-digit postal pincode:");
        }
      } else {
        // New user - start demographics questioning
        const firstDemoQ = flatQuestions.find(q => q.sectionName === "Demographics");
        if (firstDemoQ) {
          session.currentQuestionIndex = flatQuestions.indexOf(firstDemoQ);
          session.currentQuestionId = firstDemoQ.qid;
          await session.save();
          await askQuestion(userPhone, firstDemoQ, session.surveyLanguage);
        } else {
          // If no Demographics section exists (unlikely in NARAD), go straight to pincode
          session.currentState = "pincode_collection";
          await session.save();
          await sendTextMessage(userPhone, "Please enter your 6-digit postal pincode:");
        }
      }
      return res.sendStatus(200);
    }

    // --- STATE 5: DEMOGRAPHIC COLLECTION (MANUAL QUESTIONING) ---
    if (session.currentState === "demographic_collection") {
      const qIndex = session.currentQuestionIndex;
      const question = flatQuestions[qIndex];

      // Validate answer
      const validatedVal = validateAnswerInput(question, messageText, interactivePayload);
      if (validatedVal === null) {
        await sendTextMessage(userPhone, `⚠️ Invalid option selected. Please try again.`);
        await askQuestion(userPhone, question, session.surveyLanguage);
        return res.sendStatus(200);
      }

      // Save answer incrementally
      await saveIncrementalAnswer(session, question.qid, validatedVal, flatQuestions);

      // Find next question in Demographics section
      const nextIdx = qIndex + 1;
      const nextQ = flatQuestions[nextIdx];

      if (nextQ && nextQ.sectionName === "Demographics") {
        session.currentQuestionIndex = nextIdx;
        session.currentQuestionId = nextQ.qid;
        await session.save();
        await askQuestion(userPhone, nextQ, session.surveyLanguage);
      } else {
        // Demographics completed! Save to Master profile first
        const answersMap = {};
        session.answers.forEach((v, k) => {
          answersMap[k] = v;
        });

        // Set primary language
        if (answersMap.primarylanguage || answersMap.primaryLanguage) {
          session.surveyLanguage = (answersMap.primarylanguage || answersMap.primaryLanguage).toString().toLowerCase();
        }

        await saveRespondentDemographics(session.userPhone, answersMap);

        // Transition to pincode
        session.currentState = "pincode_collection";
        await session.save();
        await sendTextMessage(userPhone, "Please enter your 6-digit postal pincode:");
      }
      return res.sendStatus(200);
    }

    // --- STATE 6: PINCODE COLLECTION & ENRICHMENT ---
    if (session.currentState === "pincode_collection") {
      const pincode = messageText.trim();
      if (!validatePincodeFormat(pincode)) {
        await sendTextMessage(userPhone, "⚠️ Invalid pincode format. Please enter a valid 6-digit postal pincode (e.g. 560001):");
        return res.sendStatus(200);
      }

      // Resolve geo LGD codes
      try {
        const locationDetails = await resolveLocationByPincode(pincode);
        
        // Save pincode in session answers
        session.answers.set("pincode", pincode);
        session.answers.set("area", locationDetails.village || locationDetails.block);
        
        // Save to SurveyResponse paradata
        const responseDoc = await SurveyResponse.findOne({ 
          surveyId: survey._id, 
          respondent: session.userPhone, 
          status: "in_progress" 
        });

        if (responseDoc) {
          responseDoc.paraInfo.locationInfo = {
            pincode,
            state: locationDetails.state,
            district: locationDetails.district,
            subDistrict: locationDetails.district,
            blockName: locationDetails.block,
            village: locationDetails.village,
            stateLGDCode: locationDetails.lgdStateCode,
            districtLGDCode: locationDetails.lgdDistrictCode
          };
          await responseDoc.save();
        }

        // Upsert demographics
        const answersMap = {};
        session.answers.forEach((v, k) => {
          answersMap[k] = v;
        });
        await saveRespondentDemographics(session.userPhone, answersMap);

        await sendTextMessage(userPhone, `📍 Pincode resolved: ${locationDetails.village || locationDetails.block}, ${locationDetails.district}, ${locationDetails.state}.`);

        // Transition to survey questions
        session.currentState = "survey_questions";
        
        // Find first question index after Demographics section
        const firstSurveyQIdx = flatQuestions.findIndex(q => q.sectionName !== "Demographics");
        const nextIdx = getNextQuestionIndex(flatQuestions, firstSurveyQIdx === -1 ? 0 : firstSurveyQIdx, session.answers);

        if (nextIdx === -1) {
          session.currentState = "completed";
          await session.save();
          await triggerCompletionFlow(session, survey);
          return res.sendStatus(200);
        }

        session.currentQuestionIndex = nextIdx;
        const nextQ = flatQuestions[nextIdx];
        session.currentQuestionId = nextQ.qid;
        await session.save();

        await askQuestion(userPhone, nextQ, session.surveyLanguage);

      } catch (error) {
        console.error(`Pincode enrichment API failed for ${pincode}:`, error.message);
        await sendTextMessage(userPhone, "⚠️ Failed to resolve location details from that pincode. Let's try again. Please enter a valid 6-digit postal pincode:");
      }
      return res.sendStatus(200);
    }

    // --- STATE 7: SURVEY QUESTIONS ENGINE & SKIP LOGIC ---
    if (session.currentState === "survey_questions") {
      const qIndex = session.currentQuestionIndex;
      const question = flatQuestions[qIndex];

      // Handle Checkbox accumulator logic
      if (question.type === "checkbox") {
        let currentSelections = session.answers.get(question.qid) || [];
        if (!Array.isArray(currentSelections)) {
          currentSelections = [];
        }

        // Check if user clicked Done
        if (interactivePayload === `CHK_DONE_${question.qid}`) {
          if (currentSelections.length === 0) {
            await sendTextMessage(userPhone, "⚠️ Please select at least one choice before clicking Done.");
            await askQuestion(userPhone, question, session.surveyLanguage, currentSelections);
            return res.sendStatus(200);
          }

          // Save answer and proceed to next question
          await saveIncrementalAnswer(session, question.qid, currentSelections, flatQuestions);
          await proceedToNextQuestion(session, flatQuestions, qIndex, userPhone, survey);
          return res.sendStatus(200);
        }

        // Check if user selected an option
        if (interactivePayload.startsWith(`CHK_${question.qid}_`)) {
          const optId = interactivePayload.replace(`CHK_${question.qid}_`, "");
          
          // Toggle selection
          if (currentSelections.includes(optId)) {
            currentSelections = currentSelections.filter(id => id !== optId);
          } else {
            currentSelections.push(optId);
          }

          // Save active selections array to session answers temporarily
          session.answers.set(question.qid, currentSelections);
          await session.save();

          // Re-ask question displaying updated status checklist
          await askQuestion(userPhone, question, session.surveyLanguage, currentSelections);
          return res.sendStatus(200);
        }

        // If they replied text instead of list selection
        await sendTextMessage(userPhone, "⚠️ Please use the selection menu to check options.");
        await askQuestion(userPhone, question, session.surveyLanguage, currentSelections);
        return res.sendStatus(200);
      }

      // Handle MCQ / Text validations
      const validatedVal = validateAnswerInput(question, messageText, interactivePayload);
      if (validatedVal === null) {
        await sendTextMessage(userPhone, "⚠️ Invalid answer. Please select a valid option or enter non-empty text:");
        await askQuestion(userPhone, question, session.surveyLanguage);
        return res.sendStatus(200);
      }

      // Save answer incrementally
      await saveIncrementalAnswer(session, question.qid, validatedVal, flatQuestions);
      await proceedToNextQuestion(session, flatQuestions, qIndex, userPhone, survey);
      return res.sendStatus(200);
    }

  } catch (error) {
    console.error("Critical error in WhatsApp incoming webhook controller:", error);
    return res.sendStatus(500);
  }
};

/**
 * Helper to proceed to the next survey question or trigger completion.
 */
const proceedToNextQuestion = async (session, flatQuestions, currentIndex, userPhone, survey) => {
  const nextIdx = getNextQuestionIndex(flatQuestions, currentIndex + 1, session.answers);
  
  if (nextIdx === -1) {
    session.currentState = "completed";
    await session.save();
    await triggerCompletionFlow(session, survey);
  } else {
    session.currentQuestionIndex = nextIdx;
    const nextQ = flatQuestions[nextIdx];
    session.currentQuestionId = nextQ.qid;
    await session.save();
    await askQuestion(userPhone, nextQ, session.surveyLanguage);
  }
};

/**
 * Handle completing the survey response and sending final thank-you.
 */
const triggerCompletionFlow = async (session, survey) => {
  console.log(`[Survey Completion] Completed survey ${session.surveyId} for respondent: ${session.userPhone}`);
  
  // 1. Finalize Response record in DB
  const surveyDoc = await Survey.findOne({ surveyId: session.surveyId });
  if (surveyDoc) {
    await SurveyResponse.findOneAndUpdate(
      { surveyId: surveyDoc._id, respondent: session.userPhone, status: "in_progress" },
      {
        $set: {
          status: "completed",
          completedAt: new Date()
        }
      }
    );
  }

  // 2. Clean up active session
  await deleteSession(session.userPhone);

  // 3. Send final thank-you message
  await sendTextMessage(
    session.userPhone,
    "Thank you for completing the survey. Your responses have been successfully recorded with the Ministry of Statistics (MoSPI). 🙏"
  );
};

/**
 * Validate incoming message format depending on question configurations.
 * @param {Object} question - Question schema
 * @param {string} text - Plain text message
 * @param {string} payload - Interactive payload id
 * @returns {any|null} Validated output, or null if validation failed
 */
const validateAnswerInput = (question, text, payload) => {
  if (question.type === "mcq") {
    if (payload.startsWith(`OPT_${question.qid}_`)) {
      return payload.replace(`OPT_${question.qid}_`, "");
    }
    // Fallback: If they typed the text of an option label, match it
    const options = question.options || [];
    const matched = options.find(o => {
      const labels = o.label instanceof Map ? Array.from(o.label.values()) : Object.values(o.label || {});
      return labels.some(lbl => lbl.toString().toLowerCase().trim() === text.toLowerCase().trim()) ||
             o.id.toLowerCase().trim() === text.toLowerCase().trim();
    });
    return matched ? matched.id : null;
  }

  if (question.type === "text") {
    return text.length > 0 ? text : null;
  }

  return null;
};
