import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017";
    const dbName = process.env.DB_NAME || "statathon";
    
    console.log(`Connecting to MongoDB at: ${mongoUri}/${dbName}...`);
    const connectionInstance = await mongoose.connect(`${mongoUri}/${dbName}`);
    console.log(`✅ MongoDB connected successfully to database: ${connectionInstance.connection.name}`);
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;
