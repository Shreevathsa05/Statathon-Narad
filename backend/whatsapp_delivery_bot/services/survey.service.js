import { Survey } from "../models/Survey.js";

/**
 * Fetch all active surveys from the database.
 * @returns {Promise<Array>} List of active surveys
 */
export const getActiveSurveys = async () => {
  try {
    return await Survey.find({ status: "active" });
  } catch (error) {
    console.error("Error fetching active surveys:", error.message);
    throw error;
  }
};

/**
 * Fetch a survey by its surveyId (UUID or slug).
 * @param {string} surveyId 
 * @returns {Promise<Object|null>} The Survey document
 */
export const getSurveyById = async (surveyId) => {
  try {
    return await Survey.findOne({ surveyId });
  } catch (error) {
    console.error(`Error fetching survey ${surveyId}:`, error.message);
    throw error;
  }
};

/**
 * Flatten all questions from survey sections into a single flat list,
 * enriching each question with its original section name and section index.
 * @param {Object} survey - The Survey document
 * @returns {Array} List of flattened, section-enriched questions
 */
export const getFlatQuestions = (survey) => {
  if (!survey || !Array.isArray(survey.questionSections)) {
    return [];
  }

  const flatQuestions = [];
  survey.questionSections.forEach((section, sectionIndex) => {
    if (Array.isArray(section.questions)) {
      section.questions.forEach((question, questionIndex) => {
        flatQuestions.push({
          ...question.toObject ? question.toObject() : question,
          sectionName: section.sectionName,
          sectionIndex,
          questionIndex
        });
      });
    }
  });

  return flatQuestions;
};
