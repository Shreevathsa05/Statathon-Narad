import mongoose from "mongoose";

export const SurveyResponse = mongoose.model(
  "SurveyResponse",
  new mongoose.Schema(
    {
      surveyId: String,
      telegramChatId: String,

      user: {
        fullname: String,
        phone_no: String
      },

      response: [
        {
          qid: String,
          optionId: String
        }
      ],

      currentIndex: Number,
      status: {
        type: String,
        enum: ["in_progress", "completed"],
        default: "in_progress"
      }
    },
    { timestamps: true }
  ),
  "survey_responses"
);
