import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  try {
    const statathonUri = process.env.STATATHON_MONGODB_URI;
    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017";
    const dbName = process.env.DB_NAME || "statathon";

    let finalUri = statathonUri || mongoUri;

    // For mongodb+srv/mongodb URIs, append the dbName if it doesn't already contain a database path.
    if (finalUri.startsWith("mongodb+srv") || finalUri.startsWith("mongodb")) {
      const urlWithoutProtocol = finalUri.replace(/^mongodb(\+srv)?:\/\//, "");
      if (!urlWithoutProtocol.includes("/")) {
        finalUri = `${finalUri}/${dbName}`;
      }
    }

    // Mask password in connection URI logs for security
    const maskedUri = finalUri.replace(/:([^@]+)@/, ":****@");
    console.log(`Connecting to MongoDB at: ${maskedUri}...`);
    const connectionInstance = await mongoose.connect(finalUri);
    console.log(`✅ MongoDB connected successfully to database: ${connectionInstance.connection.name}`);
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;
