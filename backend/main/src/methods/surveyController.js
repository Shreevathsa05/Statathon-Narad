import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Survey } from "../models/surveySchema.js";

import { generateAudioFile } from "../../../delivery/src/service/ttsService.js";

export const getSurveyById = asyncHandler(async (req, res) => {
  const { survey_id } = req.params;

  if (!survey_id) {
    throw new ApiError(400, "Survey id is required");
  }

  const survey = await Survey.findOne({ surveyId: survey_id });

  if (!survey) {
    throw new ApiError(404, "Survey not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, survey, "Successfully fetched survey"));
});

export const createSurvey = asyncHandler(async (req, res) => {
  const {
    surveyId,
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

  if (!Array.isArray(supportedLanguages) || supportedLanguages.length === 0) {
    throw new ApiError(400, "supportedLanguages must be a non-empty array");
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    throw new ApiError(400, "Survey must contain at least one question");
  }

  if (!Array.isArray(categories) || categories.length === 0) {
    throw new ApiError(400, "categories must be a non-empty array");
  }

  const survey = await Survey.create({
    surveyId,
    name,
    status,
    supportedLanguages,
    questions,
    categories,
    createdBy,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, survey, "Survey created successfully"));
});

export const generateAudioForSurvey = asyncHandler(async (req, res) => {
  const { survey_id } = req.params;
  const { language } = req.body; // e.g., "hindi"

  if (!survey_id || !language) {
    throw new ApiError(400, "Survey ID and Target Language are required");
  }

  const survey = await Survey.findOne({ surveyId: survey_id });
  if (!survey) throw new ApiError(404, "Survey not found");

  // Validate if the survey actually supports this language
  if (!survey.supportedLanguages.includes(language)) {
    throw new ApiError(
      400,
      `This survey does not support language: ${language}`
    );
  }

  let updatedCount = 0;

  // Loop through every question in the survey
  for (const question of survey.questions) {
    // 1. Get the text for the specific language (Mongoose Map .get)
    const questionText = question.text.get(language);

    // 2. Check if audio already exists (Mongoose Map .get)
    const existingAudio = question.audio ? question.audio.get(language) : null;

    // 3. Only generate if text exists and audio is missing
    if (questionText && !existingAudio) {
      console.log(`Generating audio for Q: ${question.qid} in ${language}...`);

      // Call the shared service
      const audioUrl = await generateAudioFile(questionText, language);

      if (audioUrl) {
        // Initialize map if it doesn't exist
        if (!question.audio) {
          question.audio = new Map();
        }

        question.audio.set(language, audioUrl);
        updatedCount++;
      }
    }
  }

  // Save strictly if we made changes
  if (updatedCount > 0) {
    await survey.save();
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        survey,
        `Process complete. Generated audio for ${updatedCount} questions.`
      )
    );
});
