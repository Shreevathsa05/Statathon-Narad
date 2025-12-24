import mongoose from "mongoose";

const OptionSchema = new mongoose.Schema({
  id: String,
  label: Object
});

const QuestionSchema = new mongoose.Schema({
  qid: String,
  type: String,
  text: Object,
  options: [OptionSchema],
  showIf: {
    questionId: String,
    equals: String
  }
});

export const Survey = mongoose.model(
  "Survey",
  new mongoose.Schema({
    surveyId: String,
    name: String,
    status: String,
    supportedLanguages: [String],
    questions: [QuestionSchema],
    categories: [String]
  })
);
