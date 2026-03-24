import mongoose from "mongoose";

const LANGUAGES = [
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

const ShowIfSchema = new mongoose.Schema({
    questionId: {
        type: String,
        required: true
    },
    equals: {
        type: String,
        required: true
    },
}, { _id: false });

const OptionSchema = new mongoose.Schema({
    id: { type: String, required: true },
    label: {
        type: Map,
        of: {
            type: String,
            minlength: 1
        },
        required: true
    }
}, { _id: false });

const QuestionSchema = new mongoose.Schema({

    qid: {
        type: String,
        required: true
    },

    type: {
        type: String,
        enum: ["mcq", "text", "checkbox"],
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

    audio: {
        type: Map,
        of: {
            type: String,
            minlength: 1,
        },
        required: true,
    },

    options: {
        type: [OptionSchema],
        required: function () {
            return this.type === "mcq" || this.type === "checkbox";
        },
        validate: {
            validator: function (v) {
                if (this.type === "mcq" || this.type === "checkbox") {
                    return Array.isArray(v) && v.length >= 2 && v.length <= 5;
                }
                return true;
            },
            message: "MCQ/Checkbox must have between 2 and 5 options",
        },
    },

    showIf: {
        type: ShowIfSchema,
        required: false
    },
}, { _id: false });

const questionSectionSchema = new mongoose.Schema({
    sectionName: {
        type: String,
        required: true
    },
    questions: {
        type: [QuestionSchema],
        required: true,
        validate: {
            validator: (v) => Array.isArray(v) && v.length >= 1,
            message: "Survey must have at least one question",
        },
    }
}, { _id: false });

const SurveySchema = new mongoose.Schema({
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
        enum: ["pending", "approved", "active", "complete"],
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

    questionSections: {
        type: [questionSectionSchema],
        required: true,
    },

    categories: {
        type: [String],
        required: true,
    },
    createdBy: {
        type: String,
        required: true,
    },
}, {
    strict: true,
    timestamps: true,
});

export const Survey = mongoose.model("Survey", SurveySchema);