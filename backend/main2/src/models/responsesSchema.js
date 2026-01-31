import mongoose, { Schema } from "mongoose"

export const userInfoSchema = new Schema(
    {
        fullname: {
            type: String,
            required: true,
            trim: true
        },
        phone_no: {
            type: String,
            required: true
        },
        // adharNo:
    },
    {
        _id: false
    }
);

export const paraInfoSchema = new Schema(
    {
        location: {
            type: {
                type: String,
                enum: ["Point"],
                default: "Point"
            },
            coordinates: {
                type: [Number], // [longitude, latitude]
            },
            accuracyMeters: Number
        },

        deviceInfo: {
            deviceType: String,        // mobile / tablet / desktop
            os: String,                // Android / iOS / Windows
            browserOrApp: String,      // Chrome / App
            interviewMode: {
                type: String,
                enum: ["CAPI", "CATI", "CAWI"],
            }
        }
    },
    {
        _id: false
    }
);

const responseItemSchema = new Schema(
  {
    qid: {
      type: String,
      required: true,
    },
    optionId: {
      type: String,
    },
    value: {
      type: Schema.Types.Mixed, // string | number
    },
  },
  { _id: false } // ✅ IMPORTANT
);

const surveyResponseSchema = new Schema(
  {
    surveyId: {
      type: String,
      required: true,
      index: true,
    },
    user: {
      type: userInfoSchema,
      required: true,
    },
    paraInfo: {
      type: paraInfoSchema,
    },
    response: {
      type: [responseItemSchema],
      required: true,
    },
  },
  {
    timestamps: true,
    strict: true,
  }
);

export const SurveyResponse = mongoose.model("SurveyResponse", surveyResponseSchema);
