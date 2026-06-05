import mongoose from "mongoose";
import dotenv from "dotenv";
import { Survey } from "../models/Survey.js";
import { CampaignTarget } from "../models/CampaignTarget.js";
import { SurveySession } from "../models/SurveySession.js";
import { SurveyResponse } from "../models/SurveyResponse.js";
import { RespondentMaster } from "../models/RespondentMaster.js";
import { OTPVerification } from "../models/OTPVerification.js";
import { handleIncomingMessage } from "../controllers/whatsapp.controller.js";

dotenv.config({ path: "../.env" });

const TEST_PHONE = "9876543210";
const TEST_SURVEY_ID = "whatsapp-test-survey-01";

// Helper to simulate Express Request/Response objects
const mockReqRes = (payload) => {
  const req = {
    body: {
      object: "whatsapp_business_account",
      entry: [
        {
          id: "12345",
          changes: [
            {
              value: {
                messaging_product: "whatsapp",
                messages: [payload]
              },
              field: "messages"
            }
          ]
        }
      ]
    }
  };

  const res = {
    statusVal: 200,
    status(code) {
      this.statusVal = code;
      return this;
    },
    send(data) {
      return this;
    },
    sendStatus(code) {
      this.statusVal = code;
      return this;
    }
  };

  return { req, res };
};

const runTests = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017";
    const dbName = process.env.DB_NAME || "statathon";

    console.log(`Connecting to Mongoose database: ${mongoUri}/${dbName}`);
    await mongoose.connect(`${mongoUri}/${dbName}`);
    console.log("Connected to MongoDB!");

    // ==========================================
    // TEST 1: SURVEY SELECTION, POST-PRIMARYLANGUAGE LANGUAGE PROMPT & EXIT SURVEY
    // ==========================================
    console.log("\n=== RUNNING TEST 1: SURVEY SELECTION, POST-PRIMARYLANGUAGE LANGUAGE PROMPT & EXIT SURVEY ===");
    
    // Clear existing test documents
    await Survey.deleteOne({ surveyId: TEST_SURVEY_ID });
    await SurveySession.deleteOne({ userPhone: `91${TEST_PHONE}` });
    await SurveySession.deleteOne({ userPhone: TEST_PHONE });
    await SurveyResponse.deleteMany({ respondent: `91${TEST_PHONE}` });
    await RespondentMaster.deleteOne({ phone: TEST_PHONE });
    await RespondentMaster.deleteOne({ phone: `91${TEST_PHONE}` });
    await OTPVerification.deleteMany({ phone: TEST_PHONE });

    // Create a mock active survey with primarylanguage demographics and core questions in multiple languages
    const surveyDoc = await Survey.create({
      surveyId: TEST_SURVEY_ID,
      name: "Mock WhatsApp Census 2026",
      status: "active",
      accessType: "general",
      supportedLanguages: ["english", "hindi"],
      categories: ["Census"],
      createdBy: "Admin",
      questionSections: [
        {
          sectionName: "Demographics",
          questions: [
            {
              qid: "fullname",
              type: "text",
              text: { 
                english: "What is your full name?",
                hindi: "आपका पूरा नाम क्या है?"
              },
              options: []
            },
            {
              qid: "age",
              type: "text",
              text: { english: "What is your age?" },
              options: []
            },
            {
              qid: "gender",
              type: "mcq",
              text: { 
                english: "What is your gender?",
                hindi: "आपका लिंग क्या है?"
              },
              options: [
                { id: "male", label: { english: "Male", hindi: "पुरुष" } },
                { id: "female", label: { english: "Female", hindi: "महिला" } }
              ]
            },
            {
              qid: "primarylanguage",
              type: "text",
              text: { english: "What is your primary language?" },
              options: []
            }
          ]
        },
        {
          sectionName: "Core Questions",
          questions: [
            {
              qid: "own_land",
              type: "mcq",
              text: { 
                english: "Do you own agricultural land?",
                hindi: "क्या आपके पास कृषि भूमि है?"
              },
              options: [
                { id: "yes", label: { english: "Yes", hindi: "हाँ" } },
                { id: "no", label: { english: "No", hindi: "नहीं" } }
              ]
            },
            {
              qid: "satisfaction",
              type: "mcq",
              text: { 
                english: "Are you satisfied with your monthly income?",
                hindi: "क्या आप अपनी मासिक आय से संतुष्ट हैं?"
              },
              options: [
                { id: "satisfied", label: { english: "Satisfied", hindi: "संतुष्ट" } },
                { id: "unsatisfied", label: { english: "Unsatisfied", hindi: "असंतुष्ट" } }
              ]
            }
          ]
        }
      ]
    });
    console.log("Mock active survey created!");

    // --- STEP 1.1: Send generic message "Hello" ---
    console.log("\n--- STEP 1.1: Sending generic Hello message ---");
    const step1_1 = mockReqRes({
      from: `91${TEST_PHONE}`,
      type: "text",
      text: { body: "Hello" }
    });
    await handleIncomingMessage(step1_1.req, step1_1.res);
    
    let session = await SurveySession.findOne({ userPhone: `91${TEST_PHONE}` });
    console.log("Session created. State:", session?.currentState); // otp_sent

    // --- STEP 1.2: Verify OTP ---
    console.log("\n--- STEP 1.2: Verifying OTP ---");
    const step1_2 = mockReqRes({
      from: `91${TEST_PHONE}`,
      type: "text",
      text: { body: "123456" }
    });
    await handleIncomingMessage(step1_2.req, step1_2.res);
    session = await SurveySession.findOne({ userPhone: `91${TEST_PHONE}` });
    console.log("Session state transitioned to:", session?.currentState); // survey_selection

    // --- STEP 1.3: Select Survey (should start directly in English default) ---
    console.log("\n--- STEP 1.3: Selecting Survey ---");
    const step1_3 = mockReqRes({
      from: `91${TEST_PHONE}`,
      type: "interactive",
      interactive: {
        list_reply: {
          id: `SELECT_SURVEY_${TEST_SURVEY_ID}`,
          title: "Mock WhatsApp Census"
        }
      }
    });
    await handleIncomingMessage(step1_3.req, step1_3.res);
    session = await SurveySession.findOne({ userPhone: `91${TEST_PHONE}` });
    console.log("Session state transitioned to:", session?.currentState); // survey_questions
    console.log("Current Question ID (should be fullname):", session?.currentQuestionId); // fullname

    // --- STEP 1.4: Answer fullname ---
    console.log("\n--- STEP 1.4: Answering Name ---");
    const step1_4 = mockReqRes({
      from: `91${TEST_PHONE}`,
      type: "text",
      text: { body: "Statathon Competitor" }
    });
    await handleIncomingMessage(step1_4.req, step1_4.res);
    session = await SurveySession.findOne({ userPhone: `91${TEST_PHONE}` });
    console.log("Answers map (fullname):", session?.answers.get("fullname"));
    console.log("Current Question ID:", session?.currentQuestionId); // age

    // --- STEP 1.5: Answer age ---
    console.log("\n--- STEP 1.5: Answering Age ---");
    const step1_5 = mockReqRes({
      from: `91${TEST_PHONE}`,
      type: "text",
      text: { body: "25" }
    });
    await handleIncomingMessage(step1_5.req, step1_5.res);
    session = await SurveySession.findOne({ userPhone: `91${TEST_PHONE}` });
    console.log("Answers map (age):", session?.answers.get("age"));
    console.log("Current Question ID:", session?.currentQuestionId); // gender

    // --- STEP 1.6: Answer gender ---
    console.log("\n--- STEP 1.6: Answering Gender ---");
    const step1_6 = mockReqRes({
      from: `91${TEST_PHONE}`,
      type: "interactive",
      interactive: {
        button_reply: {
          id: "OPT_gender_male",
          title: "Male"
        }
      }
    });
    await handleIncomingMessage(step1_6.req, step1_6.res);
    session = await SurveySession.findOne({ userPhone: `91${TEST_PHONE}` });
    console.log("Answers map (gender):", session?.answers.get("gender"));
    console.log("Current Question ID:", session?.currentQuestionId); // primarylanguage

    // --- STEP 1.7: Answer primarylanguage (should trigger language selection menu!) ---
    console.log("\n--- STEP 1.7: Answering Primary Language (should trigger language selection prompt) ---");
    const step1_7 = mockReqRes({
      from: `91${TEST_PHONE}`,
      type: "text",
      text: { body: "Hindi" }
    });
    await handleIncomingMessage(step1_7.req, step1_7.res);
    session = await SurveySession.findOne({ userPhone: `91${TEST_PHONE}` });
    console.log("Session state transitioned to (should be language_selection):", session?.currentState);

    if (session?.currentState !== "language_selection") {
      throw new Error("FAIL: State was not transitioned to language_selection after answering primarylanguage.");
    }
    console.log("✅ SUCCESS: language_selection state triggered successfully post-primarylanguage!");

    // --- STEP 1.8: Select Language (Hindi) ---
    console.log("\n--- STEP 1.8: Selecting Language (Hindi) ---");
    const step1_8 = mockReqRes({
      from: `91${TEST_PHONE}`,
      type: "interactive",
      interactive: {
        button_reply: {
          id: "SELECT_LANG_hindi",
          title: "Hindi"
        }
      }
    });
    await handleIncomingMessage(step1_8.req, step1_8.res);
    session = await SurveySession.findOne({ userPhone: `91${TEST_PHONE}` });
    console.log("Session language set to:", session?.surveyLanguage); // hindi
    console.log("Session state transitioned back to:", session?.currentState); // survey_questions
    console.log("Current Question ID (should be own_land):", session?.currentQuestionId); // own_land

    if (session?.surveyLanguage !== "hindi") {
      throw new Error("FAIL: Survey language was not saved as hindi.");
    }
    console.log("✅ SUCCESS: Language selection saved successfully and questions resumed!");

    // --- STEP 1.9: Click Exit Survey ---
    console.log("\n--- STEP 1.9: Clicking Exit Survey Button ---");
    const step1_9 = mockReqRes({
      from: `91${TEST_PHONE}`,
      type: "interactive",
      interactive: {
        button_reply: {
          id: "EXIT_SURVEY",
          title: "Exit Survey"
        }
      }
    });
    await handleIncomingMessage(step1_9.req, step1_9.res);

    // Check session deleted and Response marked as exited
    const exitSession = await SurveySession.findOne({ userPhone: `91${TEST_PHONE}` });
    const exitResponse = await SurveyResponse.findOne({ respondent: `91${TEST_PHONE}` });
    
    console.log("\nExit verification:");
    console.log("- SurveySession deleted:", exitSession === null ? "YES" : "NO");
    console.log("- SurveyResponse status (should be exited):", exitResponse?.status);

    if (exitResponse?.status !== "exited") {
      throw new Error("FAIL: SurveyResponse was not marked as exited.");
    }
    console.log("✅ SUCCESS: Exit survey flow works perfectly!");

    // ==========================================
    // TEST 2: STANDARD SURVEY FLOW TO COMPLETION (English)
    // ==========================================
    console.log("\n=== RUNNING TEST 2: STANDARD SURVEY FLOW TO COMPLETION (English) ===");

    // Clear session, response, and demographics again
    await SurveySession.deleteOne({ userPhone: `91${TEST_PHONE}` });
    await SurveyResponse.deleteMany({ respondent: `91${TEST_PHONE}` });
    await RespondentMaster.deleteOne({ phone: TEST_PHONE });
    await RespondentMaster.deleteOne({ phone: `91${TEST_PHONE}` });

    // --- STEP 2.1: Simulate user sending starting message for a specific survey ---
    console.log("\n--- STEP 2.1: Sending START_SURVEY payload ---");
    const step2_1 = mockReqRes({
      from: `91${TEST_PHONE}`,
      type: "interactive",
      interactive: {
        button_reply: {
          id: `START_SURVEY_${TEST_SURVEY_ID}`,
          title: "Start Survey"
        }
      }
    });
    await handleIncomingMessage(step2_1.req, step2_1.res);
    
    session = await SurveySession.findOne({ userPhone: `91${TEST_PHONE}` });
    console.log("Session created. State:", session?.currentState); // otp_sent

    // --- STEP 2.2: Verify OTP ---
    console.log("\n--- STEP 2.2: Verifying OTP ---");
    const step2_2 = mockReqRes({
      from: `91${TEST_PHONE}`,
      type: "text",
      text: { body: "123456" }
    });
    await handleIncomingMessage(step2_2.req, step2_2.res);
    session = await SurveySession.findOne({ userPhone: `91${TEST_PHONE}` });
    console.log("Session state transitioned to:", session?.currentState); // survey_questions

    // --- STEP 2.3: Demographics - Full Name ---
    console.log("\n--- STEP 2.3: Answering Name ---");
    const step2_3 = mockReqRes({
      from: `91${TEST_PHONE}`,
      type: "text",
      text: { body: "Statathon Competitor" }
    });
    await handleIncomingMessage(step2_3.req, step2_3.res);

    // --- STEP 2.4: Demographics - Age ---
    console.log("\n--- STEP 2.4: Answering Age ---");
    const step2_4 = mockReqRes({
      from: `91${TEST_PHONE}`,
      type: "text",
      text: { body: "25" }
    });
    await handleIncomingMessage(step2_4.req, step2_4.res);

    // --- STEP 2.5: Demographics - Gender ---
    console.log("\n--- STEP 2.5: Answering Gender ---");
    const step2_5 = mockReqRes({
      from: `91${TEST_PHONE}`,
      type: "interactive",
      interactive: {
        button_reply: {
          id: "OPT_gender_male",
          title: "Male"
        }
      }
    });
    await handleIncomingMessage(step2_5.req, step2_5.res);

    // --- STEP 2.6: Demographics - Primary Language ---
    console.log("\n--- STEP 2.6: Answering Primary Language ---");
    const step2_6 = mockReqRes({
      from: `91${TEST_PHONE}`,
      type: "text",
      text: { body: "English" }
    });
    await handleIncomingMessage(step2_6.req, step2_6.res);
    session = await SurveySession.findOne({ userPhone: `91${TEST_PHONE}` });
    console.log("Session state transitioned to:", session?.currentState); // language_selection

    // --- STEP 2.7: Select Language (English) ---
    console.log("\n--- STEP 2.7: Selecting Language (English) ---");
    const step2_7 = mockReqRes({
      from: `91${TEST_PHONE}`,
      type: "interactive",
      interactive: {
        button_reply: {
          id: "SELECT_LANG_english",
          title: "English"
        }
      }
    });
    await handleIncomingMessage(step2_7.req, step2_7.res);
    session = await SurveySession.findOne({ userPhone: `91${TEST_PHONE}` });
    console.log("Session language set to:", session?.surveyLanguage); // english
    console.log("Session state transitioned to:", session?.currentState); // survey_questions

    // --- STEP 2.8: Answer land ---
    console.log("\n--- STEP 2.8: Answering Land = No ---");
    const step2_8 = mockReqRes({
      from: `91${TEST_PHONE}`,
      type: "interactive",
      interactive: {
        button_reply: {
          id: "OPT_own_land_no",
          title: "No"
        }
      }
    });
    await handleIncomingMessage(step2_8.req, step2_8.res);
    session = await SurveySession.findOne({ userPhone: `91${TEST_PHONE}` });
    console.log("Current Question ID:", session?.currentQuestionId); // satisfaction

    // --- STEP 2.9: Answer satisfaction ---
    console.log("\n--- STEP 2.9: Answering Satisfaction ---");
    const step2_9 = mockReqRes({
      from: `91${TEST_PHONE}`,
      type: "interactive",
      interactive: {
        button_reply: {
          id: "OPT_satisfaction_satisfied",
          title: "Satisfied"
        }
      }
    });
    await handleIncomingMessage(step2_9.req, step2_9.res);

    // Check session deleted and Response marked as completed
    const finalSession = await SurveySession.findOne({ userPhone: `91${TEST_PHONE}` });
    const finalResponse = await SurveyResponse.findOne({ respondent: `91${TEST_PHONE}` });
    
    console.log("\nFinal verification:");
    console.log("- SurveySession deleted:", finalSession === null ? "YES" : "NO");
    console.log("- SurveyResponse status:", finalResponse?.status); // completed
    console.log("- SurveyResponse completedAt:", finalResponse?.completedAt);
    console.log("- SurveyResponse interviewEndTime:", finalResponse?.paraInfo?.interviewInfo?.interviewEndTime);

    if (finalResponse?.status === "completed" && finalResponse?.paraInfo?.interviewInfo?.interviewEndTime) {
      console.log("\n🎉 ALL TESTS COMPLETED SUCCESSFULLY!");
    } else {
      console.log("\n❌ TEST FAILED: Response was not marked completed or interviewEndTime was not set.");
    }
  } catch (error) {
    console.error("Test failure:", error);
  } finally {
    await mongoose.disconnect();
  }
};

runTests();
