import mongoose from "mongoose";

const ShowIfSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true },
    equals: { type: String, required: true }
  },
  { _id: false }
);

const OptionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    label: { type: Map, of: String, required: true }
  },
  { _id: false }
);

const QuestionSchema = new mongoose.Schema(
  {
    qid: { type: String, required: true },
    type: { type: String, enum: ["mcq", "text", "checkbox"], required: true },
    text: { type: Map, of: String, required: true },
    audio: { type: Map, of: String, required: false },
    options: { type: [OptionSchema], required: false },
    prefill: { type: String, required: false },
    showIf: { type: ShowIfSchema, required: false }
  },
  { _id: false }
);

const QuestionSectionSchema = new mongoose.Schema(
  {
    sectionName: { type: String, required: true },
    questions: { type: [QuestionSchema], required: true }
  },
  { _id: false }
);

const SurveySchema = new mongoose.Schema(
  {
    surveyId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "active", "complete", "updating", "translating", "generating_audio"],
      required: true
    },
    accessType: { type: String, enum: ["general", "targeted"], default: "general" },
    supportedLanguages: { type: [String], required: true },
    questionSections: { type: [QuestionSectionSchema], required: true },
    allowedChannels: { type: [String] },
    categories: { type: [String], required: true },
    createdBy: { type: String, required: true }
  },
  { timestamps: true, collection: "surveys" }
);

export const Survey = mongoose.model("Survey", SurveySchema);
