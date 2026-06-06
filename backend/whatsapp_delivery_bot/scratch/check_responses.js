import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const run = async () => {
  const uri = process.env.STATATHON_MONGODB_URI + "/statathon";
  console.log("Connecting to:", uri.replace(/:([^@]+)@/, ":****@"));
  await mongoose.connect(uri);

  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log("Collections in database:");
  collections.forEach(c => console.log(`- ${c.name}`));

  // Check both "surveyresponses" and potential custom names
  for (const colName of ["surveyresponses", "responses", "survey_responses"]) {
    try {
      const docs = await mongoose.connection.db.collection(colName).find({}).toArray();
      console.log(`\n=== Documents in '${colName}' (Count: ${docs.length}) ===`);
      docs.slice(-5).forEach(d => {
        console.log(JSON.stringify({
          _id: d._id,
          surveyId: d.surveyId,
          respondent: d.respondent,
          status: d.status,
          response: d.response,
          answers: d.answers,
          createdAt: d.createdAt
        }, null, 2));
      });
    } catch (err) {
      console.log(`Error reading from ${colName}:`, err.message);
    }
  }

  await mongoose.disconnect();
};

run();
