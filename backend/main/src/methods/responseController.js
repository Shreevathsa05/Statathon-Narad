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

    if (survey.status !== "active" && survey.status !== "approved") {
        throw new ApiError(403, "Survey is not accepting responses");
    }

    const { response, user, paraInfo = "" } = req.body;

    if (!Array.isArray(response) || response.length === 0) {
        throw new ApiError(400, "Response must be a non-empty array");
    }

    const surveyQuestionId = new Set(survey.questions.map(q => q.qid));

    for (const ans of response) {
        if (!surveyQuestionId.has(ans.qid)) {
            throw new ApiError(400, `Invalid questionId ${ans.qid}`);
        }
    }

    const questionMap = new Map(
        survey.questions.map(q => [q.qid, q])
    );

    for (const ans of response) {
        const question = questionMap.get(ans.qid);

        if (!question) {
            throw new ApiError(400, `Invalid questionId ${ans.qid}`);
        }

        // ---- MCQ ----
        if (question.type === "mcq") {
            if (!ans.optionId) {
                throw new ApiError(
                    400,
                    `optionId is required for MCQ question ${ans.qid}`
                );
            }

            const validOptions = question.options.map(o => o.id);
            if (!validOptions.includes(ans.optionId)) {
                throw new ApiError(
                    400,
                    `Invalid optionId ${ans.optionId} for question ${ans.qid}`
                );
            }
        }

        // ---- TEXT ----
        if (question.type === "text") {
            if (
                typeof ans.value !== "string" ||
                ans.value.trim().length === 0
            ) {
                throw new ApiError(
                    400,
                    `Valid text value required for question ${ans.qid}`
                );
            }
        }

        // ---- NUMBER ----
        if (question.type === "number") {
            if (typeof ans.value !== "number" || Number.isNaN(ans.value)) {
                throw new ApiError(
                    400,
                    `Valid numeric value required for question ${ans.qid}`
                );
            }
        }
    }


    const responseObj = {
        surveyId: survey_id,
        user,
        response
    }
    if (paraInfo) {
        responseObj.paraInfo = paraInfo
    }

    const surveyResponse = await SurveyResponse.create(responseObj); // need changes

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