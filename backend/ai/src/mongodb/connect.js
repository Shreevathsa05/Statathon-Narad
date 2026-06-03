import mongoose from "mongoose";
import "dotenv/config"
// import dns from "dns";
// dns.setServers(["8.8.8.8", "8.8.4.4"]);

const connectDB = async () => {
    try {
        const DB_NAME = process.env.DB_NAME + "?ssl=true&replicaSet=atlas-d4v24w-shard-0&authSource=admin&appName=narad";
        const mongoURI = `${process.env.MONGODB_URI}/${DB_NAME}`;
        console.log(mongoURI);
        const connection = await mongoose.connect(mongoURI);

        console.log(
            `MongoDB Connected | Host: ${connection.connection.host}`
        );

        mongoose.connection.on("disconnected", () => {
            console.warn("MongoDB disconnected");
        });

        mongoose.connection.on("reconnected", () => {
            console.log("MongoDB reconnected");
        });

        mongoose.connection.on("error", (err) => {
            console.error("MongoDB error:", err);
        });

        return connection;
    } catch (error) {
        console.error("MongoDB connection failed:", error);
        throw error;
    }
};

export default connectDB;

// connectDB()