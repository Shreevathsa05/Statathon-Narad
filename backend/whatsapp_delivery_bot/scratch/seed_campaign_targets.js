import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { Survey } from "../models/Survey.js";
import { CampaignTarget } from "../models/CampaignTarget.js";
import { numbers } from "../numbers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const dbName = process.env.DB_NAME || "statathon";

const seedCampaignTargets = async () => {
  try {
    console.log(`Connecting to MongoDB at: ${mongoUri}/${dbName}...`);
    await mongoose.connect(`${mongoUri}/${dbName}`);
    console.log("✅ Connected to MongoDB!");

    // 1. Find or create an active survey
    let survey = await Survey.findOne({ status: "active" });
    if (!survey) {
      console.log("⚠️ No active survey found in the database. Creating a default test survey...");
      survey = await Survey.create({
        surveyId: "whatsapp-test-survey-01",
        name: "Mock WhatsApp Census 2026",
        status: "active",
        accessType: "targeted",
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
                text: { english: "What is your full name?" }
              },
              {
                qid: "age",
                type: "text",
                text: { english: "What is your age?" }
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
      console.log(`✅ Default test survey created: "${survey.name}" (ID: ${survey.surveyId})`);
    } else {
      console.log(`ℹ️ Found existing active survey: "${survey.name}" (ID: ${survey.surveyId})`);
    }

    console.log(`\nImporting numbers from numbers.js...`);
    console.log(`Found numbers: ${JSON.stringify(numbers)}`);

    let addedCount = 0;
    let updatedCount = 0;

    for (const phone of numbers) {
      const phoneStr = phone.toString();
      const userKey = `user_${phoneStr}`;

      // Check if campaign target already exists for this survey and phone
      const existing = await CampaignTarget.findOne({ surveyId: survey._id, phone: phoneStr });

      if (existing) {
        // Reset status to pending so it sends again
        existing.status = "pending";
        existing.sentAt = undefined;
        await existing.save();
        updatedCount++;
        console.log(`🔄 Reset target ${phoneStr} status to 'pending'`);
      } else {
        await CampaignTarget.create({
          surveyId: survey._id,
          userKey,
          phone: phoneStr,
          status: "pending"
        });
        addedCount++;
        console.log(`➕ Created new pending campaign target: ${phoneStr}`);
      }
    }

    console.log(`\n🎉 Seeding complete!`);
    console.log(`-------------------------------------`);
    console.log(`Active Survey: ${survey.name} (ObjectId: ${survey._id})`);
    console.log(`New targets added: ${addedCount}`);
    console.log(`Existing targets reset to pending: ${updatedCount}`);
    console.log(`-------------------------------------\n`);

  } catch (error) {
    console.error("❌ Seeding failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
};

seedCampaignTargets();
