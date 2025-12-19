import { ChatOllama } from "@langchain/ollama";
// import { ChatOpenAI } from "@langchain/openai";
import { createAgent } from "langchain";
import { configDotenv } from "dotenv";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";
configDotenv();

// export const nativeModel = new ChatGoogleGenerativeAI({
//     model: "models/gemini-2.5-flash",
//     temperature: 0,
//     apiKey: process.env.GEMINI_API_KEY
// })


export const nativeModel = new ChatOllama({
    model:"qwen2.5:7b",
    baseURL:'http://localhost:11434',
});

// export const nativeModel = new ChatOpenAI({
//     model: "llama3.1:8b",
//     apiKey: 'docker',
//     configuration: {
//         baseURL: 'http://localhost:11434/v1',
//     }
// });

// -----------------------------------------------
// export const model = new ChatOpenAI({
//     model: "deepseek-r1:7b",
//     apiKey: 'docker',
//     configuration: {
//         baseURL: 'http://localhost:11434/v1',
//     }
// });

// const agent = createAgent({
//     model,
//     tools: []
// });
// -----------------------------------------------

// -----------------------TEST------------------------
// (
//     async () => {
//         const res = await agent.invoke(`Generate 3 questions for survey of college`)
//         console.log(res)
//     }
// )();