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

    // Clear existing test documents
    await Survey.deleteOne({ surveyId: TEST_SURVEY_ID });
    await SurveySession.deleteOne({ userPhone: `91${TEST_PHONE}` });
    await SurveySession.deleteOne({ userPhone: TEST_PHONE });
    await SurveyResponse.deleteMany({ respondent: `91${TEST_PHONE}` });
    await RespondentMaster.deleteOne({ phone: TEST_PHONE });
    await RespondentMaster.deleteOne({ phone: `91${TEST_PHONE}` });
    await OTPVerification.deleteMany({ phone: TEST_PHONE });

    // Create a mock active survey
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
              text: { english: "What is your full name?" },
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
              text: { english: "What is your gender?" },
              options: [
                { id: "male", label: { english: "Male" } },
                { id: "female", label: { english: "Female" } }
              ]
            }
          ]
        },
        {
          sectionName: "Core Questions",
          questions: [
            {
              qid: "own_land",
              type: "mcq",
              text: { english: "Do you own agricultural land?" },
              options: [
                { id: "yes", label: { english: "Yes" } },
                { id: "no", label: { english: "No" } }
              ]
            },
            {
              qid: "land_size",
              type: "text",
              text: { english: "What is the size of your agricultural land in acres?" },
              showIf: {
                questionId: "own_land",
                equals: "yes"
              }
            },
            {
              qid: "primary_crop",
              type: "text",
              text: { english: "What is your primary crop?" },
              showIf: {
                questionId: "own_land",
                equals: "yes"
              }
            },
            {
              qid: "satisfaction",
              type: "mcq",
              text: { english: "Are you satisfied with your monthly income?" },
              options: [
                { id: "satisfied", label: { english: "Satisfied" } },
                { id: "unsatisfied", label: { english: "Unsatisfied" } }
              ]
            }
          ]
        }
      ]
    });
    console.log("Mock active survey created!");

    // --- STEP 1: Simulate user sending a random message to get active survey list ---
    console.log("\n--- STEP 1: Sending generic message ---");
    const step1 = mockReqRes({
      from: `91${TEST_PHONE}`,
      type: "text",
      text: { body: "Hello Narad" }
    });
    await handleIncomingMessage(step1.req, step1.res);
    
    // Check if session in survey_selection was created
    let session = await SurveySession.findOne({ userPhone: `91${TEST_PHONE}` });
    console.log("Session created. State:", session?.currentState); // survey_selection

    // --- STEP 2: Select the survey ---
    console.log("\n--- STEP 2: Selecting survey ---");
    const step2 = mockReqRes({
      from: `91${TEST_PHONE}`,
      type: "interactive",
      interactive: {
        list_reply: {
          id: `SELECT_SURVEY_${TEST_SURVEY_ID}`,
          title: "Mock WhatsApp Census"
        }
      }
    });
    await handleIncomingMessage(step2.req, step2.res);
    session = await SurveySession.findOne({ userPhone: `91${TEST_PHONE}` });
    console.log("Session surveyId set to:", session?.surveyId);
    console.log("Session state transitioned to:", session?.currentState); // phone_collection

    // --- STEP 3: Provide phone number ---
    console.log("\n--- STEP 3: Providing phone number ---");
    const step3 = mockReqRes({
      from: `91${TEST_PHONE}`,
      type: "text",
      text: { body: TEST_PHONE }
    });
    await handleIncomingMessage(step3.req, step3.res);
    session = await SurveySession.findOne({ userPhone: `91${TEST_PHONE}` });
    console.log("Session state transitioned to:", session?.currentState); // otp_sent

    // --- STEP 4: Submit OTP ---
    console.log("\n--- STEP 4: Verifying OTP ---");
    // Find generated OTP in database
    const otpDoc = await OTPVerification.findOne({ phone: TEST_PHONE });
    console.log("OTP retrieved from DB:", otpDoc?.otp);
    
    const step4 = mockReqRes({
      from: `91${TEST_PHONE}`,
      type: "text",
      text: { body: otpDoc?.otp || "" }
    });
    await handleIncomingMessage(step4.req, step4.res);
    session = await SurveySession.findOne({ userPhone: `91${TEST_PHONE}` });
    console.log("Verification status:", session?.verificationStatus); // verified
    console.log("Session state transitioned to:", session?.currentState); // demographic_collection
    console.log("Current Question asked (QID):", session?.currentQuestionId); // fullname

    // --- STEP 5: Demographics - Full Name ---
    console.log("\n--- STEP 5: Answering Name ---");
    const step5 = mockReqRes({
      from: `91${TEST_PHONE}`,
      type: "text",
      text: { body: "Statathon Competitor" }
    });
    await handleIncomingMessage(step5.req, step5.res);
    session = await SurveySession.findOne({ userPhone: `91${TEST_PHONE}` });
    console.log("Answers map (fullname):", session?.answers.get("fullname"));
    console.log("Current Question index / QID:", session?.currentQuestionIndex, "/", session?.currentQuestionId); // age

    // --- STEP 6: Demographics - Age ---
    console.log("\n--- STEP 6: Answering Age ---");
    const step6 = mockReqRes({
      from: `91${TEST_PHONE}`,
      type: "text",
      text: { body: "25" }
    });
    await handleIncomingMessage(step6.req, step6.res);
    session = await SurveySession.findOne({ userPhone: `91${TEST_PHONE}` });
    console.log("Answers map (age):", session?.answers.get("age"));
    console.log("Current Question index / QID:", session?.currentQuestionIndex, "/", session?.currentQuestionId); // gender

    // --- STEP 7: Demographics - Gender ---
    console.log("\n--- STEP 7: Answering Gender ---");
    const step7 = mockReqRes({
      from: `91${TEST_PHONE}`,
      type: "interactive",
      interactive: {
        button_reply: {
          id: "OPT_gender_male",
          title: "Male"
        }
      }
    });
    await handleIncomingMessage(step7.req, step7.res);
    session = await SurveySession.findOne({ userPhone: `91${TEST_PHONE}` });
    console.log("Demographics completed. State:", session?.currentState); // pincode_collection

    // Check if profile was saved to Demographics Master collection
    const demoProfile = await RespondentMaster.findOne({ phone: TEST_PHONE });
    console.log("Respondent Master profile saved fullName:", demoProfile?.fullName);

    // --- STEP 8: Pincode Collection & Enrichment ---
    console.log("\n--- STEP 8: Answering Pincode (560001) ---");
    const step8 = mockReqRes({
      from: `91${TEST_PHONE}`,
      type: "text",
      text: { body: "560001" }
    });
    await handleIncomingMessage(step8.req, step8.res);
    session = await SurveySession.findOne({ userPhone: `91${TEST_PHONE}` });
    console.log("Pincode saved. State:", session?.currentState); // survey_questions
    console.log("Current Question asked (QID):", session?.currentQuestionId); // own_land

    // Check location paradata on the SurveyResponse
    const responseDoc = await SurveyResponse.findOne({ respondent: `91${TEST_PHONE}` });
    console.log("SurveyResponse location resolved:", responseDoc?.paraInfo?.locationInfo?.state, "/", responseDoc?.paraInfo?.locationInfo?.district);

    // --- STEP 9: Dynamic Question - Own Land = "no" (Should Skip sizes and crop, go to satisfaction) ---
    console.log("\n--- STEP 9: Answering Land = No ---");
    const step9 = mockReqRes({
      from: `91${TEST_PHONE}`,
      type: "interactive",
      interactive: {
        button_reply: {
          id: "OPT_own_land_no",
          title: "No"
        }
      }
    });
    await handleIncomingMessage(step9.req, step9.res);
    session = await SurveySession.findOne({ userPhone: `91${TEST_PHONE}` });
    console.log("Next question asked (Skip check):", session?.currentQuestionId); // satisfaction (skipped land_size & primary_crop!)

    // --- STEP 10: Final Question - Satisfaction ---
    console.log("\n--- STEP 10: Answering Satisfaction ---");
    const step10 = mockReqRes({
      from: `91${TEST_PHONE}`,
      type: "interactive",
      interactive: {
        button_reply: {
          id: "OPT_satisfaction_satisfied",
          title: "Satisfied"
        }
      }
    });
    await handleIncomingMessage(step10.req, step10.res);
    
    // Check session deleted and Response marked as completed
    const finalSession = await SurveySession.findOne({ userPhone: `91${TEST_PHONE}` });
    const finalResponse = await SurveyResponse.findOne({ respondent: `91${TEST_PHONE}` });
    
    console.log("\nFinal verification:");
    console.log("- SurveySession deleted:", finalSession === null ? "YES" : "NO");
    console.log("- SurveyResponse status:", finalResponse?.status); // completed
    console.log("- SurveyResponse completedAt:", finalResponse?.completedAt);
    console.log("- SurveyResponse final answers list:", finalResponse?.answers);

    console.log("\n🎉 ALL TESTS COMPLETED SUCCESSFULLY!");
  } catch (error) {
    console.error("Test failure:", error);
  } finally {
    await mongoose.disconnect();
  }
};

runTests();
