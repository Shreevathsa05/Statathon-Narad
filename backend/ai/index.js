import "dotenv/config";
import app from "./app.js";
import connectDB from "./src/mongodb/connect.js";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { LangfuseSpanProcessor } from "@langfuse/otel";
import { CallbackHandler } from "@langfuse/langchain";

const sdk = new NodeSDK({
    spanProcessors: [new LangfuseSpanProcessor()],
});

// Initialize the Langfuse CallbackHandler
export const langfuseHandler = new CallbackHandler();

sdk.start();
const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        await connectDB();

        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server listening on ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start application:", error);
        process.exit(1);
    }
}

startServer();