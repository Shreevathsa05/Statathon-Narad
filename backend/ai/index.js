import "dotenv/config";
import app from "./app.js";
import connectDB from "./src/mongodb/connect.js";

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`Server listening on ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start application:", error);
        process.exit(1);
    }
}

startServer();