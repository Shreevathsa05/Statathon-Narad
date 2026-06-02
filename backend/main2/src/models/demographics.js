const DemographicSchema = new mongoose.Schema(
    {
        surveyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Survey",
            required: true,
        },

        paraInfo: ParaInfoSchema,

        response: [ResponseSchema],
    },
    { timestamps: true },
);

export const Demographics = mongoose.model(
    "Demographics",
    DemographicSchema,
);