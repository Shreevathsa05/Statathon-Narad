//Survey Response Schema
import { Schema } from "mongoose";

const UserInfoSchema = new mongoose.Schema({
    fullname: {
        type: String,
        required: true,
        trim: true
    },
    phone_no: {
        type: String,
        required: true
    },
}, { _id: false });

const ParaInfoSchema = new mongoose.Schema({
    latitude: {
        type: String,
        required: true
    },
    longitude: {
        type: String,
        required: true
    },
    deviceInfo: {
        os: {
            type: String,
            default: "unknown"
        },
    },
    interviewInfo: {
        interviewMode: {
            type: String,
            required: true
        },
        interviewDurationMinutes: {
            type: Number,
            required: true
        },
    },
    lgdInfo: {
        stateCode: {
            type: String,
            required: true
        },
        districtCode: {
            type: String,
            required: true
        },
        shortNameOfDistrict: {
            type: String,
            required: true
        },
    },
    samplingInfo: {
        nssRegionCode: {
            type: Number,
            required: true
        },
    }
}, { _id: false });

const ResponseSchema = new mongoose.Schema({
    qid: {
        type: String,
        required: true,
    },
    optionId: {
        type: String,
    },
    value: {
        type: Schema.Types.Mixed,
    },
}, { _id: false });

const SurveyResponseSchema = new mongoose.Schema({

    surveyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Survey",
        required: true
    },
    surveyVersion: {
        type: Number,
        default: 1
    },

    userInfo: UserInfoSchema,

    paraInfo: ParaInfoSchema,

    responses: [ResponseSchema],
}, { timestamps: true });

export default mongoose.model("SurveyResponse", SurveyResponseSchema);