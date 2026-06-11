import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}?ssl=true&replicaSet=atlas-d4v24w-shard-0&authSource=admin&appName=narad`);
        console.log(`MongoDB connected || DB HOST: ${connectionInstance.connection.host}`)

    } catch (error) {
        console.log("MONGODB connection failed", error);
        process.exit(1);
    }
}

export default connectDB;