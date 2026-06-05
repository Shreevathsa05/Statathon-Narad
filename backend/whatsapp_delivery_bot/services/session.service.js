import { SurveySession } from "../models/SurveySession.js";
import { SurveyResponse } from "../models/SurveyResponse.js";
import { Survey } from "../models/Survey.js";

/**
 * Retrieve the active survey session for a phone number.
 * @param {string} userPhone 
 * @returns {Promise<Object|null>} The SurveySession document
 */
export const getSession = async (userPhone) => {
  try {
    return await SurveySession.findOne({ userPhone });
  } catch (error) {
    console.error(`Error getting session for ${userPhone}:`, error.message);
    throw error;
  }
};

/**
 * Create a new survey session.
 * @param {string} userPhone 
 * @param {string} surveyId 
 * @returns {Promise<Object>} The new SurveySession document
 */
export const createSession = async (userPhone, surveyId) => {
  try {
    // Delete any existing session for this number first
    await SurveySession.deleteOne({ userPhone });

    const session = await SurveySession.create({
      userPhone,
      surveyId,
      currentState: "phone_collection", // Start by asking for phone verification
      currentSectionIndex: 0,
      currentQuestionIndex: 0,
      currentQuestionId: "",
      progress: 0,
      verificationStatus: "unverified",
      answers: {}
    });

    // Also initialize the SurveyResponse in_progress document
    const surveyDoc = await Survey.findOne({ surveyId });
    if (surveyDoc) {
      await SurveyResponse.findOneAndUpdate(
        { surveyId: surveyDoc._id, respondent: userPhone, status: "in_progress" },
        {
          $setOnInsert: {
            startedAt: new Date(),
            answers: {},
            response: [],
            paraInfo: {
              deviceInfo: { os: "whatsapp" },
              interviewInfo: {
                interviewMode: "whatsapp",
                interviewStartTime: new Date()
              }
            }
          }
        },
        { upsert: true, new: true }
      );
    }

    return session;
  } catch (error) {
    console.error(`Error creating session for ${userPhone}:`, error.message);
    throw error;
  }
};

/**
 * Update the active session fields.
 * @param {string} userPhone 
 * @param {Object} updates 
 * @returns {Promise<Object|null>} The updated session
 */
export const updateSession = async (userPhone, updates) => {
  try {
    return await SurveySession.findOneAndUpdate(
      { userPhone },
      { $set: updates },
      { new: true }
    );
  } catch (error) {
    console.error(`Error updating session for ${userPhone}:`, error.message);
    throw error;
  }
};

/**
 * Delete a survey session upon completion.
 * @param {string} userPhone 
 */
export const deleteSession = async (userPhone) => {
  try {
    await SurveySession.deleteOne({ userPhone });
  } catch (error) {
    console.error(`Error deleting session for ${userPhone}:`, error.message);
    throw error;
  }
};

/**
 * Calculate the progress percentage of the survey.
 * @param {Object} session 
 * @param {Array} flatQuestions 
 * @returns {number} Progress percentage (0 to 100)
 */
export const calculateProgress = (session, flatQuestions) => {
  if (!flatQuestions || flatQuestions.length === 0) return 0;
  
  // Progress can be computed as answered questions / total questions
  const answeredCount = session.answers ? session.answers.size : 0;
  const progressPercent = Math.min(
    Math.round((answeredCount / flatQuestions.length) * 100),
    100
  );
  return progressPercent;
};

/**
 * Save an answer incrementally to both the session and the response collections.
 * @param {Object} session 
 * @param {string} qid 
 * @param {any} answer 
 * @param {Array} flatQuestions 
 */
export const saveIncrementalAnswer = async (session, qid, answer, flatQuestions) => {
  try {
    // 1. Save to session
    session.answers.set(qid, answer);
    session.progress = calculateProgress(session, flatQuestions);
    await session.save();

    // 2. Save to response
    const surveyDoc = await Survey.findOne({ surveyId: session.surveyId });
    if (surveyDoc) {
      const answersMap = {};
      session.answers.forEach((val, key) => {
        answersMap[key] = val;
      });

      // Construct flat response array for NARAD compatibility
      const responseArray = Object.keys(answersMap).map((key) => ({
        qid: key,
        answer: answersMap[key]
      }));

      await SurveyResponse.findOneAndUpdate(
        { surveyId: surveyDoc._id, respondent: session.userPhone, status: "in_progress" },
        {
          $set: {
            answers: answersMap,
            response: responseArray,
            progress: session.progress
          }
        }
      );
    }
  } catch (error) {
    console.error(`Error saving incremental answer for ${session.userPhone}:`, error.message);
    throw error;
  }
};
