import app from "./app.js";
import connectDB from "./config/db.js";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 5001;

// Connect to MongoDB and start the server
const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`🚀 NARAD WhatsApp Bot Service is running on port ${PORT}`);
      console.log(`📡 Webhook verification endpoint: GET http://localhost:${PORT}/webhook`);
      console.log(`📥 Incoming webhook receiver: POST http://localhost:${PORT}/webhook`);
      console.log(`📢 Campaign dispatcher endpoint: POST http://localhost:${PORT}/api/campaign/dispatch`);
    });
  } catch (error) {
    console.error("❌ Failed to start the server:", error.message);
    process.exit(1);
  }
};

startServer();
