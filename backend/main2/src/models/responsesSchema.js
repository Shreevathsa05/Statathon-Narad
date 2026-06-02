import mongoose, { Schema } from "mongoose";

// const requiredOnComplete = function () {
// 	const doc = this.ownerDocument ? this.ownerDocument() : this;
// 	return doc.status === "completed";
// };

const ParaInfoSchema = new mongoose.Schema(
	{
		deviceInfo: {
			os: {
				type: String,
				default: "unknown",
			},
		},
		status: {
			type: String,
			enum: ["in_progress", "completed"],
			default: "in_progress"
		},
		interviewInfo: {
			interviewMode: {
				type: String,
				required: true,
			},
			interviewStartTime: {
				type: Date,
				required: true,
			},
			interviewEndTime: {
				type: Date,
				required: true
			},
		},
		locationInfo: {
			stateLGDCode: {
				type: String,
			},
			districtLGDCode: {
				type: String,
			},
			state: {
				type: String,
				required: true
			},
			district: {
				type: String,
				required: true
			},
			subDistrict: {
				type: String,
				required: true
			},
			blockName: {
				type: String,
				required: true
			},
			census_2011: {
				type: String,
			},
		},
		samplingInfo: {
			nssRegionCode: {
				type: Number,
			},
		},
	},
	{ _id: false },
);

const ResponseSchema = new mongoose.Schema(
	{
		qid: {
			type: String,
			required: true,
		},
		answer: {
			type: mongoose.Schema.Types.Mixed,
		},
	},
	{ _id: false },
);

const SurveyResponseSchema = new mongoose.Schema(
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

export const SurveyResponse = mongoose.model(
	"SurveyResponse",
	SurveyResponseSchema,
);
