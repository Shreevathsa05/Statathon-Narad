import "dotenv/config";
import mongoose from "mongoose";
import { runVirtualEnumerator } from "../utils/virtualEnumerator.js";

const DB_NAME = process.env.DB_NAME || "statathon";

async function run() {
    const args = process.argv.slice(2);
    const surveyIdArgIndex = args.indexOf('--surveyId');
    
    if (surveyIdArgIndex === -1 || !args[surveyIdArgIndex + 1]) {
        console.error("❌ Error: --surveyId argument is required.");
        console.error("Usage: node virtualEnumerator.js --surveyId <survey_id>");
        process.exit(1);
    }
    
    const surveyId = args[surveyIdArgIndex + 1];

    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`✅ Connected to MongoDB. Database: ${DB_NAME}`);
        console.log(`🔍 Starting Virtual Enumerator for surveyId: ${surveyId}`);

        const flaggedResponses = await runVirtualEnumerator(surveyId);

        console.log(`\n🎉 Virtual Enumerator completed. Flagged: ${flaggedResponses.length}.`);

    } catch (err) {
        console.error("❌ Fatal Error:", err.message);
    } finally {
        await mongoose.disconnect();
        console.log("✅ Disconnected from MongoDB");
    }
}

run();
