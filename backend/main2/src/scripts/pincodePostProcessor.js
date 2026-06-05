import "dotenv/config";
import mongoose from "mongoose";
import { processAllUnprocessed } from "../utils/pincodeProcessor.js";

const DB_NAME = process.env.DB_NAME || "statathon";

async function run() {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log("✅ Connected to MongoDB\n");

        await processAllUnprocessed();

    } catch (err) {
        console.error("❌ Fatal Error:", err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
