import { context_collector_agent, summarizer_agent, question_generator_agent } from "../models/agents.js";

export async function generate_english_questions(user_input) {
    const context = await context_collector_agent(user_input);
    const summarized = await summarizer_agent(user_input, context);
    let questions = await question_generator_agent(user_input, summarized);

    // Remove ```json, ```JSON, and ``` from the AI response
    if (typeof questions === "string") {
        questions = questions.replace(/```json/gi, "").replace(/```/g, "").trim();
    }

    return questions;
}

export default async function generate_english_questions_retry(user_input, id) {
    for (let i = 0; i < 3; i++) {
        try {
            const questions = await generate_english_questions(user_input);
            if (questions) {
                // validate and store response in mongoose
                // store_response(id, JSON.stringify(questions));

                return questions;
            }
            break;
        } catch (error) {
            console.log(error);
            continue;
        }
    }
    return null;
}