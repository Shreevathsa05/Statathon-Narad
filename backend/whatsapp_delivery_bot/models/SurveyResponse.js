import mongoose from "mongoose";

const ParaInfoSchema = new mongoose.Schema(
  {
    deviceInfo: {
      os: { type: String, default: "whatsapp" }
    },
    interviewInfo: {
      interviewMode: { type: String, default: "whatsapp" },
      interviewStartTime: { type: Date, required: true },
      interviewEndTime: { type: Date }
    },
    locationInfo: {
      stateLGDCode: { type: String },
      districtLGDCode: { type: String },
      state: { type: String },
      district: { type: String },
      subDistrict: { type: String },
      blockName: { type: String },
      pincode: { type: String },
      census_2011: { type: String }
    },
    samplingInfo: {
      nssRegionCode: { type: Number }
    }
  },
  { _id: false }
);

const ResponseSchema = new mongoose.Schema(
  {
    qid: { type: String, required: true },
    answer: { type: mongoose.Schema.Types.Mixed }
  },
  { _id: false }
);

const SurveyResponseSchema = new mongoose.Schema(
  {
    surveyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Survey",
      required: true
    },
    // Custom requirements fields
    respondent: {
      type: String, // phone number of user
      required: true,
      index: true
    },
    answers: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {} // Key-value answers: { "fullname": "John", "age": 28 }
    },
    status: {
      type: String,
      enum: ["in_progress", "completed", "exited"],
      default: "in_progress",
      index: true
    },
    startedAt: {
      type: Date,
      default: Date.now
    },
    completedAt: {
      type: Date
    },
    // NARAD core platform fields
    paraInfo: {
      type: ParaInfoSchema
    },
    response: {
      type: [ResponseSchema],
      default: []
    },
    flags: {
      type: [mongoose.Schema.Types.Mixed],
      default: []
    },
    isFlagged: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true, collection: "surveyresponses" }
);

export const SurveyResponse = mongoose.model("SurveyResponse", SurveyResponseSchema);
