import mongoose, { Schema } from "mongoose";

/* ---------------------------------- */
/* Supported Languages (Zod-aligned)  */
/* ---------------------------------- */

export const LANGUAGES = [
    "hindi",
    "english",
    "bengali",
    "telugu",
    "tamil",
    "marathi",
    "gujarati",
    "kannada",
    "malayalam",
    "odia",
    "punjabi",
    "urdu",
];

/* ---------------------------------- */
/* Localized Text (dynamic + strict)  */
/* ---------------------------------- */

const LocalizedTextSchema = {
    type: Map,
    of: {
        type: String,
        minlength: 1,
        required: true,
    },
};


/* ---------------------------------- */
/* ShowIf                             */
/* ---------------------------------- */

const ShowIfSchema = new Schema(
    {
        questionId: { type: String, required: true },
        equals: { type: String, required: true },
    },
    { _id: false }
);

/* ---------------------------------- */
/* Option                             */
/* ---------------------------------- */

const OptionSchema = new Schema(
    {
        id: { type: String, required: true },
        label: {
            type: Map,
            of: {
                type: String,
                minlength: 1,
            },
            required: true,
        },
    },
    { _id: false }
);


/* ---------------------------------- */
/* Question                           */
/* ---------------------------------- */

const QuestionSchema = new Schema(
    {
        qid: { type: String, required: true },

        type: {
            type: String,
            enum: ["mcq"],
            required: true,
        },

        text: {
            type: Map,
            of: {
                type: String,
                minlength: 1,
            },
            required: true,
        },

        options: {
            type: [OptionSchema],
            required: true,
            validate: {
                validator: (v) => Array.isArray(v) && v.length >= 2 && v.length <= 5,
                message: "MCQ must have between 2 and 5 options",
            },
        },

        showIf: { type: ShowIfSchema, required: false },
    },
    { _id: false }
);

/* ---------------------------------- */
/* Survey (Monolith)                  */
/* ---------------------------------- */

export const SurveySchema = new Schema(
    {
        surveyId: {
            type: String,
            required: true,
            index: true,
            unique: true
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        status: {
            type: String,
            enum: ["approved", "active", "complete"],
            required: true,
        },

        supportedLanguages: {
            type: [String],
            enum: LANGUAGES,
            required: true,
            validate: {
                validator: (langs) =>
                    Array.isArray(langs) &&
                    langs.length > 0 &&
                    new Set(langs).size === langs.length,
                message: "supportedLanguages must be a unique non-empty array",
            },
        },

        questions: {
            type: [QuestionSchema],
            required: true,
            validate: {
                validator: (v) => Array.isArray(v) && v.length >= 1,
                message: "Survey must have at least one question",
            },
        },

        categories: {
            type: [String],
            required: true,
        },
        createdBy: {
            type: String,
            required: true,
        },
    },
    {
        strict: true,
        timestamps: true,
    }
);

/* ---------------------------------- */
/* Model                              */
/* ---------------------------------- */

export const Survey = mongoose.model("Survey", SurveySchema);
