import mongoose from "mongoose";

const SectionPlanSchema = new mongoose.Schema(
    {
        sectionName: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        questionCount: {
            type: Number,
            required: true,
            min: 0,
        },
    },
    { _id: false }
);

const SurveyPlanSchema = new mongoose.Schema(
    {
        surveyId: {
            type: String,
            required: true,
        },
        mcp_context: {
            type: String,
            required: true,
        },

        sectionPlan: {
            type: [SectionPlanSchema],
            required: true,
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model("SurveyPlan", SurveyPlanSchema);