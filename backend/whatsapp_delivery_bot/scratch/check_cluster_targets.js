import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { CampaignTarget } from "../models/CampaignTarget.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const run = async () => {
  const uri = process.env.STATATHON_MONGODB_URI + "/statathon";
  console.log("Connecting to:", uri.replace(/:([^@]+)@/, ":****@"));
  await mongoose.connect(uri);
  const targets = await CampaignTarget.find({});
  console.log("All Campaign Targets in Cluster:");
  targets.forEach(t => {
    console.log(`- Phone: ${t.phone}, Status: ${t.status}, SurveyId: ${t.surveyId}`);
  });
  await mongoose.disconnect();
};

run();
