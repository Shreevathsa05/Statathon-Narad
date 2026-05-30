import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        const mongoURI = `${process.env.MONGODB_URI}/${DB_NAME}`;

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