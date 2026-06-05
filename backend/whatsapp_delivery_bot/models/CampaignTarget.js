import mongoose from "mongoose";

const CampaignTargetSchema = new mongoose.Schema(
  {
    surveyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Survey",
      required: true,
      index: true
    },
    userKey: {
      type: String,
      required: true,
      index: true
    },
    phone: {
      type: String,
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ["pending", "sent", "failed", "responded"],
      default: "pending",
      index: true
    },
    sentAt: {
      type: Date
    }
  },
  { timestamps: true, collection: "campaigntargets" }
);

// Prevent duplicates for targeted campaigns
CampaignTargetSchema.index(
  { surveyId: 1, userKey: 1 },
  { unique: true }
);

export const CampaignTarget = mongoose.model("CampaignTarget", CampaignTargetSchema);
