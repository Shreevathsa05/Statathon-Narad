import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Survey } from "../models/surveySchema.js";

export const getSurveyById = asyncHandler(async (req, res) => {
    const { survey_id } = req.params;

    if (!survey_id) {
        throw new ApiError(400, "Survey id is required");
    }

    const survey = await Survey.findOne({ surveyId: survey_id });

    if (!survey) {
        throw new ApiError(404, "Survey not found");
    }

    return res.status(200).json(
        new ApiResponse(200, survey, "Successfully fetched survey")
    );
});

export const createSurvey = asyncHandler(async (req, res) => {
    const {
        name,
        status,
        supportedLanguages,
        questions,
        categories,
        createdBy,
    } = req.body;

    if (!name || !status || !createdBy) {
        throw new ApiError(400, "name, status, and createdBy are required");
    }

    if (
        !Array.isArray(supportedLanguages) ||
        supportedLanguages.length === 0
    ) {
        throw new ApiError(
            400,
            "supportedLanguages must be a non-empty array"
        );
    }

    if (!Array.isArray(questions) || questions.length === 0) {
        throw new ApiError(400, "Survey must contain at least one question");
    }

    if (!Array.isArray(categories) || categories.length === 0) {
        throw new ApiError(400, "categories must be a non-empty array");
    }

    const survey = await Survey.create({
        name,
        status,
        supportedLanguages,
        questions,
        categories,
        createdBy,
    });

    return res.status(201).json(
        new ApiResponse(201, survey, "Survey created successfully")
    );
});
