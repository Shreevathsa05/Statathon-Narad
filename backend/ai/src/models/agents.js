// agents and their integerations here
import { llm_chat, gemini } from "./llms.js";
import { mcp_tools } from "../tools/multi_mcp_client.js"
import { createAgent, HumanMessage } from "langchain";
import { context_collector_system_prompt, summarizer_system_prompt, question_generator_system_prompt } from "../prompts/question_generation/index.js";
import fs from "fs";
import { SurveyGenSchema } from "../schema/questionSchema.js";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
// context collector agent
export async function context_collector_agent(user_input) {
    const collector = createAgent({
        model: llm_chat,
        tools: mcp_tools,
        max_iterations: 3,
    });

    const res = await collector.invoke({
        messages: [
            {
                role: "user",
                content: `${context_collector_system_prompt}\n${user_input}`
            }
        ]
    });

    const final = getFinalMessage(res.messages);

    return final;
}

function getFinalMessage(messages) {
    return messages[messages.length - 1].content;
}
// const a = await context_collector_agent("Generate a survey for consumption study number of questions");
// console.log(a);


export async function summarizer_agent(user_input, context_extracted) {
    const summarizer = createAgent({
        model: llm_chat,
        tools: mcp_tools,
    });
    const res = await summarizer.invoke({
        messages: [
            {
                role: "user",
                content: `${summarizer_system_prompt}\n User Input: ${user_input} \n Context Extracted:- ${context_extracted}`
            }
        ]
    });
    console.log(res);
    return res;
}

export async function question_generator_agent(user_input, context_summarized) {
    // const structured_llm = llm_chat.withStructuredOutput(SurveyGenSchema)
    const structured_llm = new ChatGoogleGenerativeAI({
        model: "gemini-3-flash-preview",
        apiKey: process.env.GOOGLE_API_KEY,
        temperature: 0,
    })

    const questions = await llm_chat.invoke(`${question_generator_system_prompt}\n Form should be based on following:- \nTopic: ${user_input} \n MOSPI extracted Context: ${context_summarized}`);
    console.log(questions);
    return questions;
}
