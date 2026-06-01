import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Survey } from "../models/surveySchema.js";

function toMap(obj) {
    return new Map(Object.entries(obj));
}

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
        surveyId,
        name,
        status,
        supportedLanguages,
        questionSections,
        categories,
        createdBy,
    } = req.body;

    if (!name || !status || !createdBy || !surveyId) {
        throw new ApiError(400, "name, status, surveyId and createdBy are required");
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

    if (!Array.isArray(questionSections) || questionSections.length === 0) {
        throw new ApiError(400, "Survey must contain at least one questionSection");
    }

    if (!Array.isArray(categories) || categories.length === 0) {
        throw new ApiError(400, "categories must be a non-empty array");
    }

    const normalizedSections = questionSections.map(section => ({
        ...section,
        questions: section.questions.map(q => ({
            ...q,
            text: q.text ? toMap(q.text) : undefined,
            audio: q.audio ? toMap(q.audio) : undefined,
            options: q.options?.map(opt => ({
                ...opt,
                label: opt.label ? toMap(opt.label) : undefined
            }))
        }))
    }));

    const survey = await Survey.create({
        surveyId,
        name,
        status,
        supportedLanguages,
        questionSections: normalizedSections,
        categories,
        createdBy,
    });

    return res.status(201).json(
        new ApiResponse(201, survey, "Survey created successfully")
    );
});

export const getAllSurveys = asyncHandler(async (req, res) => {
    const surveys = await Survey.find().select("name surveyId status questionSections supportedLanguages createdAt");

    return res.status(200).json(
        new ApiResponse(200, surveys, "Successfully fetched surveys")
    );
})

export const updateSurvey = asyncHandler(async (req, res) => {
    const { survey_id } = req.params;

    if (!survey_id) {
        throw new ApiError(400, "Survey id is required");
    }

    const existingSurvey = await Survey.findOne({ surveyId: survey_id });

    if (!existingSurvey) {
        throw new ApiError(404, "Survey not found");
    }

    if (existingSurvey.status === "active" || existingSurvey.status === "complete") {
        throw new ApiError(400, "Active or completed surveys cannot be edited");
    }

    const updates = req.body;

    if (updates.questionSections) {
        if (!Array.isArray(updates.questionSections) || updates.questionSections.length === 0) {
            throw new ApiError(400, "questionSections must be a non-empty array");
        }

        updates.questionSections = updates.questionSections.map((section) => ({
            ...section,
            questions: section.questions?.map((q) => ({
                ...q,
                text: q.text ? toMap(q.text) : undefined,
                audio: q.audio ? toMap(q.audio) : undefined,
                options: q.options?.map((opt) => ({
                    ...opt,
                    label: opt.label ? toMap(opt.label) : undefined,
                })),
            })),
        }));
    }

    const survey = await Survey.findOneAndUpdate(
        { surveyId: survey_id },
        { $set: updates },
        { returnDocument: 'after', runValidators: true }
    );

    if (!survey) {
        throw new ApiError(404, "Survey not found");
    }

    return res.status(200).json(
        new ApiResponse(200, survey, "Survey updated successfully")
    );
});

export const deleteSurvey = asyncHandler(async (req, res) => {
    const { survey_id } = req.params;

    if (!survey_id) {
        throw new ApiError(400, "Survey id is required");
    }

    const survey = await Survey.findOneAndDelete({ surveyId: survey_id });

    if (!survey) {
        throw new ApiError(404, "Survey not found");
    }

    return res.status(200).json(
        new ApiResponse(200, {}, "Survey deleted successfully")
    );
});
