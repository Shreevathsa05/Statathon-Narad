import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { CampaignTarget } from "../models/CampaignTarget.js";
import { Survey } from "../models/Survey.js";
import { SurveySession } from "../models/SurveySession.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const dbName = process.env.DB_NAME || "statathon";

const checkStatus = async () => {
  try {
    await mongoose.connect(`${mongoUri}/${dbName}`);
    console.log("Connected to MongoDB.\n");

    const surveys = await Survey.find({});
    console.log("=== Active Surveys ===");
    surveys.forEach(s => {
      console.log(`- ID: ${s.surveyId}, Name: ${s.name}, Status: ${s.status}, Access: ${s.accessType}`);
    });

    const targets = await CampaignTarget.find({}).populate("surveyId");
    console.log("\n=== Campaign Targets ===");
    if (targets.length === 0) {
      console.log("(No targets in database)");
    } else {
      targets.forEach(t => {
        console.log(`- Phone: ${t.phone}, Status: ${t.status}, Survey: ${t.surveyId?.name || "Unknown"}, SentAt: ${t.sentAt || "N/A"}`);
      });
    }

    const sessions = await SurveySession.find({});
    console.log("\n=== Survey Sessions ===");
    if (sessions.length === 0) {
      console.log("(No active sessions)");
    } else {
      sessions.forEach(s => {
        console.log(`- Phone: ${s.userPhone}, SurveyId: ${s.surveyId}, State: ${s.currentState}, Question: ${s.currentQuestionId}`);
      });
    }
    console.log("");

  } catch (error) {
    console.error("Error checking DB status:", error);
  } finally {
    await mongoose.disconnect();
  }
};

checkStatus();
