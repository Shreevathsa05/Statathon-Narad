import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { Survey } from "../models/Survey.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const run = async () => {
  const uri = process.env.STATATHON_MONGODB_URI + "/statathon";
  console.log("Connecting to:", uri.replace(/:([^@]+)@/, ":****@"));
  await mongoose.connect(uri);
  const surveys = await Survey.find({});
  console.log("All Surveys in Cluster:");
  surveys.forEach(s => {
    console.log(`- ID: ${s.surveyId}, Name: ${s.name}, Status: ${s.status}, Access: ${s.accessType}`);
  });
  await mongoose.disconnect();
};

run();
