import "dotenv/config";
import app from "./app.js";
import connectDB from "./src/mongodb/connect.js";

import { Survey } from "./src/mongodb/surveySchema.js";

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        await connectDB();

        // Reset any surveys that were stuck due to a previous crash
        const stuckSurveys = await Survey.updateMany(
            { status: { $in: ["translating", "updating", "generating_audio"] } },
            { $set: { status: "pending" } }
        );
        if (stuckSurveys.modifiedCount > 0) {
            console.log(`Reset ${stuckSurveys.modifiedCount} stuck surveys to 'pending'.`);
        }

        app.listen(PORT, () => {
            console.log(`Server listening on ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start application:", error);
        process.exit(1);
    }
}

startServer();