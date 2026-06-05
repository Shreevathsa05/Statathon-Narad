import { getSession, createSession, updateSession, deleteSession, saveIncrementalAnswer } from "../services/session.service.js";
import { getActiveSurveys, getSurveyById, getFlatQuestions } from "../services/survey.service.js";
import { sendOtp, verifyOtp, generateOtpCode } from "../services/otp.service.js";
import { lookupRespondent, saveRespondentDemographics } from "../services/respondent.service.js";
import { resolveLocationByPincode, validatePincodeFormat } from "../services/location.service.js";
import { getNextQuestionIndex, shouldShowQuestion } from "../services/skipLogic.service.js";
import { sendTextMessage, sendInteractiveButtons, sendInteractiveList } from "../utils/whatsappHelper.js";
import { SurveyResponse } from "../models/SurveyResponse.js";
import { Survey } from "../models/Survey.js";
import { CampaignTarget } from "../models/CampaignTarget.js";

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
      return await sendInteractiveButtons(userPhone, qText, [{ id: "EXIT_SURVEY", title: "Exit Survey" }]);
    }

    if (formattedOptions.length <= 2) {
      // Send Quick Reply Buttons (including Exit Survey button, total <= 3)
      formattedOptions.push({
        id: "EXIT_SURVEY",
        title: "Exit Survey"
      });
      return await sendInteractiveButtons(userPhone, qText, formattedOptions);
    } else {
      // Send Interactive List Message with Exit Survey row at the end
      const listRows = formattedOptions.map(opt => ({
        id: opt.id,
        title: opt.title
      }));
      listRows.push({
        id: "EXIT_SURVEY",
        title: "❌ Exit Survey",
        description: "Exit the current survey"
      });
      return await sendInteractiveList(
        userPhone,
        qText,
        "Select Option",
        "Options",
        listRows
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

    // Add Exit Survey option
    rows.push({
      id: "EXIT_SURVEY",
      title: "❌ Exit Survey",
      description: "Exit the current survey"
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
  return await sendInteractiveButtons(userPhone, qText, [{ id: "EXIT_SURVEY", title: "Exit Survey" }]);
};

/**
 * Prompt the user to select the language they want to attempt the survey in.
 */
const promptLanguageSelection = async (userPhone, session, survey) => {
  const supported = survey.supportedLanguages || [];

  if (supported.length <= 1) {
    session.surveyLanguage = supported[0] || "english";
    session.surveyId = survey.surveyId;
    await session.save();
    await startSelectedSurvey(userPhone, session, survey);
    return;
  }

  // Save the surveyId and transition state to language_selection
  session.surveyId = survey.surveyId;
  session.currentState = "language_selection";
  await session.save();

  // Present language choices using quick reply buttons or list
  const formattedLanguages = supported.map(lang => {
    // Capitalize for title display
    const title = lang.charAt(0).toUpperCase() + lang.slice(1);
    return {
      id: `SELECT_LANG_${lang.toLowerCase()}`,
      title: title
    };
  });

  if (formattedLanguages.length <= 3) {
    await sendInteractiveButtons(
      userPhone,
      `Please select your preferred language to attempt the survey "${survey.name}":`,
      formattedLanguages
    );
  } else {
    await sendInteractiveList(
      userPhone,
      `Please select your preferred language to attempt the survey "${survey.name}":`,
      "Select Language",
      "Languages Available",
      formattedLanguages.map(opt => ({
        id: opt.id,
        title: opt.title
      }))
    );
  }
};

/**
 * Starts a selected survey for the user.
 * Initializes the session, sets up the response document, pre-fills demographics, and asks the first question.
 */
const startSelectedSurvey = async (userPhone, session, survey) => {
  session.surveyId = survey.surveyId;
  session.currentState = "survey_questions";
  session.answers = new Map();
  await session.save();

  // Initialize SurveyResponse
  const surveyDoc = await Survey.findOne({ surveyId: survey.surveyId });
  if (surveyDoc) {
    await SurveyResponse.findOneAndUpdate(
      { surveyId: surveyDoc._id, respondent: userPhone, status: "in_progress" },
      {
        $setOnInsert: {
          startedAt: new Date(),
          answers: {},
          response: [],
          paraInfo: {
            deviceInfo: { os: "whatsapp" },
            interviewInfo: {
              interviewMode: "whatsapp",
              interviewStartTime: new Date()
            }
          }
        }
      },
      { upsert: true, new: true }
    );
  }

  // Prefill demographics
  const profile = await lookupRespondent(userPhone);
  const flatQuestions = getFlatQuestions(survey);

  if (profile) {
    console.log(`[Demographics Prefill] Found demographics profile for ${userPhone}. Prefilling...`);
    const demoQuestions = flatQuestions.filter(q => q.sectionName === "Demographics");
    demoQuestions.forEach(q => {
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
    await session.save();

    // Prefill pincode location codes in paradata if pincode is present
    if (profile.pincode) {
      try {
        const locDetails = await resolveLocationByPincode(profile.pincode);
        if (surveyDoc) {
          await SurveyResponse.findOneAndUpdate(
            { surveyId: surveyDoc._id, respondent: userPhone, status: "in_progress" },
            {
              $set: {
                "paraInfo.locationInfo": {
                  pincode: profile.pincode,
                  state: locDetails.state,
                  district: locDetails.district,
                  blockName: locDetails.block,
                  village: locDetails.village,
                  stateLGDCode: locDetails.lgdStateCode,
                  districtLGDCode: locDetails.lgdDistrictCode
                }
              }
            }
          );
        }
      } catch (err) {
        console.warn(`[Demographics Prefill] Failed to resolve prefilled pincode ${profile.pincode}:`, err.message);
      }
    }
  }

  // Get next unanswered question index
  const nextIdx = getNextQuestionIndex(flatQuestions, 0, session.answers);

  if (nextIdx === -1) {
    session.currentState = "completed";
    await session.save();
    await triggerCompletionFlow(session, survey);
    return;
  }

  session.currentQuestionIndex = nextIdx;
  const nextQ = flatQuestions[nextIdx];
  session.currentQuestionId = nextQ.qid;
  await session.save();

  // Send a welcome greeting
  await sendTextMessage(userPhone, `Welcome to the survey: "${survey.name}".`);

  // Ask the first question
  await askQuestion(userPhone, nextQ, session.surveyLanguage);
};

/**
 * Resolves the surveys eligible for the user and presents them as a list menu,
 * or starts the survey immediately if only one is available.
 */
const presentSurveysList = async (userPhone, session) => {
  const activeSurveys = await Survey.find({ status: "active" });

  // Get campaign target details for this user to check whitelist eligibility
  const cleanPhone = userPhone.replace(/\D/g, "");
  const phoneVariants = [cleanPhone, cleanPhone.substring(2), `+${cleanPhone}`, `+${cleanPhone.substring(2)}`].filter(Boolean);
  const campaigns = await CampaignTarget.find({ phone: { $in: phoneVariants } });
  const targetedSurveyIds = campaigns.map(c => c.surveyId.toString());

  // Filter surveys: general surveys + targeted surveys if whitelisted
  const allowedSurveys = activeSurveys.filter(survey => {
    if (survey.accessType === "targeted") {
      return targetedSurveyIds.includes(survey._id.toString());
    }
    return true; // general or null
  });

  console.log(`[Surveys Filter] User: ${userPhone}, Allowed Surveys: ${allowedSurveys.map(s => s.surveyId).join(", ")}`);

  // If a specific survey was requested in the invitation campaign
  if (session.surveyId && session.surveyId !== "pending") {
    const matchedSurvey = allowedSurveys.find(s => s.surveyId === session.surveyId);
    if (matchedSurvey) {
      await startSelectedSurvey(userPhone, session, matchedSurvey);
      return;
    }
  }

  if (allowedSurveys.length === 0) {
    await sendTextMessage(userPhone, "There are no active surveys available for you at this time. Thank you.");
    await deleteSession(userPhone);
    return;
  }

  // Present menu for the surveys (even if there is only 1)
  const rows = allowedSurveys.map(s => ({
    id: `SELECT_SURVEY_${s.surveyId}`,
    title: s.name.substring(0, 24),
    description: s.categories?.join(", ") || ""
  }));

  session.currentState = "survey_selection";
  await session.save();

  await sendInteractiveList(
    userPhone,
    "Welcome to the MoSPI NARAD Survey Platform. Please select one of the available active surveys to begin:",
    "Select Survey",
    "Active Surveys",
    rows
  );
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

    // --- CHECK EXIT REQUESTS ---
    const isExitRequest = 
      interactivePayload === "EXIT_SURVEY" || 
      messageText.toLowerCase() === "exit" || 
      messageText.toLowerCase() === "exit survey" || 
      messageText.toLowerCase() === "quit";

    if (session && isExitRequest) {
      const survey = session.surveyId ? await getSurveyById(session.surveyId) : null;
      await triggerExitFlow(session, survey);
      return res.sendStatus(200);
    }

    // --- CASE 1: NO ACTIVE SESSION -> SEND OTP IMMEDIATELY ---
    if (!session) {
      let targetSurveyId = "pending";
      if (interactivePayload.startsWith("START_SURVEY_")) {
        targetSurveyId = interactivePayload.replace("START_SURVEY_", "");
      }

      session = await createSession(userPhone, targetSurveyId);
      session.currentState = "otp_sent";
      await session.save();

      // Trigger Exotel OTP service
      await sendOtp(userPhone);
      await sendTextMessage(
        userPhone,
        `Welcome to the MoSPI NARAD Survey Platform. We have sent a 6-digit verification code to your phone number (+${userPhone}) to verify your identity. Please enter the code below (or type "RESEND" to try again):`
      );
      return res.sendStatus(200);
    }

    // --- CASE 2: OTP VERIFICATION ---
    if (session.currentState === "otp_sent") {
      const enteredCode = messageText.trim();

      if (enteredCode.toLowerCase() === "resend") {
        await sendOtp(userPhone);
        await sendTextMessage(userPhone, `OTP code resent to +${userPhone}. Please enter the code:`);
        return res.sendStatus(200);
      }

      const verified = await verifyOtp(userPhone, enteredCode);
      if (!verified) {
        await sendTextMessage(userPhone, "⚠️ Invalid or expired code. Please enter the correct code, or reply 'RESEND':");
        return res.sendStatus(200);
      }

      // OTP verified successfully!
      session.verificationStatus = "verified";
      await session.save();
      await sendTextMessage(userPhone, "✅ Identity verified successfully!");

      // Resolve eligible surveys and present list or start the single survey
      await presentSurveysList(userPhone, session);
      return res.sendStatus(200);
    }

    // --- CASE 3: SURVEY SELECTION ---
    if (session.currentState === "survey_selection") {
      if (interactivePayload.startsWith("SELECT_SURVEY_")) {
        const surveyId = interactivePayload.replace("SELECT_SURVEY_", "");
        const survey = await getSurveyById(surveyId);
        if (!survey || survey.status !== "active") {
          await sendTextMessage(userPhone, "Selected survey is not active or not found. Please select a survey from the menu list.");
          return res.sendStatus(200);
        }
        await startSelectedSurvey(userPhone, session, survey);
      } else {
        await sendTextMessage(userPhone, "Please select a survey from the menu list above.");
      }
      return res.sendStatus(200);
    }

    // --- CASE 3.5: LANGUAGE SELECTION ---
    if (session.currentState === "language_selection") {
      let selectedLang = "";
      if (interactivePayload.startsWith("SELECT_LANG_")) {
        selectedLang = interactivePayload.replace("SELECT_LANG_", "").toLowerCase();
      } else {
        // Fallback: match text if they typed the language name
        const surveyDoc = await getSurveyById(session.surveyId);
        const supported = surveyDoc?.supportedLanguages || [];
        const matched = supported.find(lang => lang.toLowerCase() === messageText.toLowerCase().trim());
        if (matched) {
          selectedLang = matched;
        }
      }

      if (selectedLang) {
        const surveyDoc = await getSurveyById(session.surveyId);
        if (!surveyDoc || surveyDoc.status !== "active") {
          await sendTextMessage(userPhone, "Selected survey is no longer active. Closing session.");
          await deleteSession(userPhone);
          return res.sendStatus(200);
        }

        session.surveyLanguage = selectedLang;
        session.currentState = "survey_questions";
        await session.save();

        const flatQuestions = getFlatQuestions(surveyDoc);
        const primaryLangIndex = flatQuestions.findIndex(q => q.qid === "primarylanguage" || q.qid === "primaryLanguage");
        const startIndex = primaryLangIndex !== -1 ? primaryLangIndex : session.currentQuestionIndex;

        await proceedToNextQuestion(session, flatQuestions, startIndex, userPhone, surveyDoc);
      } else {
        await sendTextMessage(userPhone, "Please select a valid language from the options provided.");
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

    // --- CASE 4: SURVEY QUESTIONS ENGINE ---
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

      // --- LANGUAGE PROMPT TRIGGER POST-PRIMARYLANGUAGE ---
      if (question.qid === "primarylanguage" || question.qid === "primaryLanguage") {
        session.currentState = "language_selection";
        await session.save();

        const supported = survey.supportedLanguages || [];
        const formattedLanguages = supported.map(lang => {
          const title = lang.charAt(0).toUpperCase() + lang.slice(1);
          return {
            id: `SELECT_LANG_${lang.toLowerCase()}`,
            title: title
          };
        });

        if (formattedLanguages.length <= 3) {
          await sendInteractiveButtons(
            userPhone,
            "Please select the language you want to attempt the rest of the survey in:",
            formattedLanguages
          );
        } else {
          await sendInteractiveList(
            userPhone,
            "Please select the language you want to attempt the rest of the survey in:",
            "Select Language",
            "Languages Available",
            formattedLanguages.map(opt => ({
              id: opt.id,
              title: opt.title
            }))
          );
        }

        // Also update demographics details as it's a demographic question
        const answersMap = {};
        session.answers.forEach((v, k) => {
          answersMap[k] = v;
        });
        await saveRespondentDemographics(userPhone, answersMap);

        return res.sendStatus(200);
      }

      // Update demographics master collection if this is a demographic question
      if (question.sectionName === "Demographics") {
        const answersMap = {};
        session.answers.forEach((v, k) => {
          answersMap[k] = v;
        });

        await saveRespondentDemographics(userPhone, answersMap);
      }

      // If pincode was answered, resolve geo paradata
      if (question.qid === "pincode" || question.qid === "pinCode") {
        try {
          const locDetails = await resolveLocationByPincode(validatedVal);
          await SurveyResponse.findOneAndUpdate(
            { surveyId: survey._id, respondent: userPhone, status: "in_progress" },
            {
              $set: {
                "paraInfo.locationInfo": {
                  pincode: validatedVal,
                  state: locDetails.state,
                  district: locDetails.district,
                  blockName: locDetails.block,
                  village: locDetails.village,
                  stateLGDCode: locDetails.lgdStateCode,
                  districtLGDCode: locDetails.lgdDistrictCode
                }
              }
            }
          );
        } catch (err) {
          console.warn("Failed to resolve pincode during survey questions flow:", err.message);
        }
      }

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
          completedAt: new Date(),
          "paraInfo.interviewInfo.interviewEndTime": new Date()
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
 * Handle exiting the survey response early.
 */
const triggerExitFlow = async (session, survey) => {
  console.log(`[Survey Exit] Exited survey ${session?.surveyId} for respondent: ${session?.userPhone}`);
  
  if (session && session.surveyId && session.surveyId !== "pending") {
    // 1. Finalize Response record in DB as exited
    const surveyDoc = await Survey.findOne({ surveyId: session.surveyId });
    if (surveyDoc) {
      await SurveyResponse.findOneAndUpdate(
        { surveyId: surveyDoc._id, respondent: session.userPhone, status: "in_progress" },
        {
          $set: {
            status: "exited",
            completedAt: new Date(),
            "paraInfo.interviewInfo.interviewEndTime": new Date()
          }
        }
      );
    }
  }

  // 2. Clean up active session
  await deleteSession(session.userPhone);

  // 3. Send exit message
  await sendTextMessage(
    session.userPhone,
    "You have successfully exited the survey. Your partial responses have been recorded. You can start a new survey anytime by typing hello. Thank you! 🙏"
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
