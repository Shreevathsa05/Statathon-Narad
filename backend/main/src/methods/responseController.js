import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { SurveyResponse } from "../models/responsesSchema.js";
import { Survey } from "../models/surveySchema.js";

export const submitSurveyResponse = asyncHandler(async (req, res) => {
    const { survey_id } = req.params;

    if (!survey_id) {
        throw new ApiError(400, "Survey id is required");
    }

    const survey = await Survey.findOne({ surveyId: survey_id });
    if (!survey) {
        throw new ApiError(404, "Survey not found");
    }

    if (survey.status !== "active") {
        throw new ApiError(403, "Survey is not accepting responses");
    }

    const { response, user, paraInfo } = req.body;

    if (!Array.isArray(response) || response.length === 0) {
        throw new ApiError(400, "Response must be a non-empty array");
    }

    const surveyQuestionId = new Set(survey.questions.map(q => q.qid));

    for (const ans of response) {
        if (!surveyQuestionId.has(ans.qid)) {
            throw new ApiError(400, `Invalid questionId ${ans.qid}`);
        }
    }

    const surveyResponse = await SurveyResponse.create({
        surveyId: survey_id,
        user,
        paraInfo,
        response
    }); // need changes

    return res.status(201).json(
        new ApiResponse(201, surveyResponse, "Successfully created survey response")
    );
});

export const getSurveyResponseById = asyncHandler(async (req, res) => {
    const { survey_id } = req.params;

    if (!survey_id) {
        throw new ApiError(400, "Survey id is required");
    }

    const surveyResponse = await SurveyResponse.find({ surveyId: survey_id });

    return res.status(200).json(
        new ApiResponse(200, surveyResponse, "successfully fetched survey response")
    );
})