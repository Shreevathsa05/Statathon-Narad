import { improve_section_agent } from "../models/agents.js";
import { Survey } from "../mongodb/surveySchema.js";
import SurveyPlan from "../mongodb/surveyPlan.js";

export default async function improve_english_section(surveyId, sectionName, user_instructions) {
    try {
        console.log(`Improving section "${sectionName}" for survey: ${surveyId}`);

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

        // 3. Call Agent to revise questions
        let revised_questions = await improve_section_agent(
            user_instructions,
            surveyPlan.mcp_context,
            sectionPlan,
            current_questions
        );

        if (!Array.isArray(revised_questions)) {
            console.warn("Improvement agent did not return a valid array. Falling back to existing questions.");
            revised_questions = current_questions;
        }

        // 4. Update the Survey document in MongoDB
        console.log(`Updating survey ${surveyId} section "${sectionName}" in DB...`);
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

        console.log("Section improvement complete and saved!");
        return updatedSurvey;

    } catch (error) {
        console.error("Error improving section:", error);
        throw error;
    }
}
