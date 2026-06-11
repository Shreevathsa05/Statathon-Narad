import { improve_section_agent } from "../models/agents.js";
import { Survey } from "../mongodb/surveySchema.js";
import SurveyPlan from "../mongodb/surveyPlan.js";
import { logger } from "./logger.js";

export default async function improve_english_section(surveyId, sectionName, user_instructions) {
    try {
        logger.info(`Improving section "${sectionName}" for survey: ${surveyId}`);

        // 1. Fetch Survey Plan for Context and Section Description
        const surveyPlan = await SurveyPlan.findOne({ surveyId });
        if (!surveyPlan) {
            throw new Error(`SurveyPlan not found for surveyId: ${surveyId}`);
        }

        const sectionPlan = surveyPlan.sectionPlan.find(s => s.sectionName === sectionName);
        if (!sectionPlan) {
            throw new Error(`Section "${sectionName}" not found in SurveyPlan.`);
        }

        // 2. Fetch current Survey for existing questions
        const survey = await Survey.findOne({ surveyId });
        if (!survey) {
            throw new Error(`Survey not found for surveyId: ${surveyId}`);
        }

        const existingSection = survey.questionSections.find(s => s.sectionName === sectionName);
        if (!existingSection) {
            throw new Error(`Section "${sectionName}" not found in Survey document.`);
        }

        const current_questions = existingSection.questions;

        // 3. Call Agent to revise questions (with up to 3 retries)
        let revised_questions = null;
        for (let i = 0; i < 3; i++) {
            try {
                revised_questions = await improve_section_agent(
                    user_instructions,
                    surveyPlan.mcp_context,
                    sectionPlan,
                    current_questions
                );

                if (Array.isArray(revised_questions)) {
                    break; // Success, break out of retry loop
                } else {
                    logger.warn(`Attempt ${i + 1} failed: Agent did not return a valid array. Retrying...`);
                }
            } catch (err) {
                logger.warn(`Attempt ${i + 1} encountered an error: ${err.message}. Retrying...`);
            }
        }

        if (!Array.isArray(revised_questions)) {
            logger.error("Improvement agent failed to return a valid array after 3 attempts. Falling back to existing questions.");
            revised_questions = current_questions;
        }

        // 4. Update the Survey document in MongoDB
        logger.info(`Updating survey ${surveyId} section "${sectionName}" in DB...`);
        const updatedSurvey = await Survey.findOneAndUpdate(
            { 
                surveyId: surveyId,
                "questionSections.sectionName": sectionName
            },
            {
                $set: {
                    "questionSections.$.questions": revised_questions
                }
            },
            { new: true }
        );

        logger.info("Section improvement complete and saved!");
        return updatedSurvey;

    } catch (error) {
        logger.error("Error improving section:", error);
        throw error;
    }
}
