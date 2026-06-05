import mongoose from "mongoose";

const RespondentMasterSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    // Hashed identifier
    aadhaarNo: {
      type: String,
      trim: true
    },
    // Root fields to match existing demographics schema
    fullName: {
      type: String,
      trim: true
    },
    age: {
      type: Number,
      min: 0,
      max: 120
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"]
    },
    primaryLanguage: {
      type: String,
      default: "english"
    },
    pincode: {
      type: String
    },
    area: {
      type: String
    },
    // User requested demographic data wrapper
    demographicData: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  { timestamps: true, collection: "demographics" }
);

export const RespondentMaster = mongoose.model("RespondentMaster", RespondentMasterSchema);
