import mongoose from "mongoose";

const DemographicSchema = new mongoose.Schema(
    {
        aadhaarNo: {
            type: String,
            trim: true,
            unique: true,
            match: /^[0-9]{12}$/,
            required: true,
        },

        phone: {
            type: String,
            trim: true,
            unique: true,
            match: /^[0-9]{10}$/,
            required: true,
        },

        fullName: {
            type: String,
            lowercase: true,
            required: true,
            trim: true,
        },

        age: {
            type: Number,
            required: true,
            min: 0,
            max: 120,
        },

        gender: {
            type: String,
            required: true,
            enum: ["male", "female", "other"],
        },

        primaryLanguage: {
            type: String,
            required: true,
            trim: true,
        },

        pincode: {
            type: String,
            required: true,
            match: /^[0-9]{6}$/,
        },

        area: {
            type: String,
            required: true,
            trim: true,
        },
    },
    { timestamps: true }
);

export const Demographics = mongoose.model("Demographics", DemographicSchema);