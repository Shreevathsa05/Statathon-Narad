import mongoose from "mongoose";

const SurveySessionSchema = new mongoose.Schema(
  {
    userPhone: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    surveyId: {
      type: String, // Stored as surveyId slug or UUID string
      required: true
    },
    currentState: {
      type: String,
      enum: [
        "survey_selection",
        "language_selection",
        "phone_collection",
        "otp_sent",
        "otp_verified",
        "demographic_collection",
        "pincode_collection",
        "survey_questions",
        "completed"
      ],
      default: "survey_selection"
    },
    currentSectionIndex: {
      type: Number,
      default: 0
    },
    currentQuestionIndex: {
      type: Number,
      default: 0
    },
    currentQuestionId: {
      type: String,
      default: ""
    },
    progress: {
      type: Number,
      default: 0 // Completion percentage (0 to 100)
    },
    verificationStatus: {
      type: String,
      enum: ["unverified", "verified"],
      default: "unverified"
    },
    surveyLanguage: {
      type: String,
      default: "english"
    },
    // Temporarily stored answers during session progression
    answers: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  { timestamps: true, collection: "survey_sessions" }
);

export const SurveySession = mongoose.model("SurveySession", SurveySessionSchema);
