// llm or ai models defined here
import "dotenv/config"
import fs from "fs";
import { ChatOpenAI } from "@langchain/openai"
import Groq from "groq-sdk";
import { SarvamAIClient } from "sarvamai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

// reasoning
const llm_chat = new ChatOpenAI({
  model: process.env.CHAT_MODEL,
  apiKey: process.env.OPENAI_API_KEY,
  temprature: 1,
  configuration: {
    baseURL: process.env.CHAT_MODEL_BASEURL,
  },
});

const gemini = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  apiKey: process.env.GEMINI_API_KEY,
  temprature: 1,
})

// stt - (groq)
const stt = async (filename = "audio.m4a") => {
  const groq = new Groq();
  const transcription = await groq.audio.transcriptions.create({
    file: fs.createReadStream(filename),
    model: "whisper-large-v3-turbo",
    response_format: "verbose_json",
    temperature: 0,
  });
  return transcription.text;
};

// tts and stt
const sarvam_voice = new SarvamAIClient({
  apiSubscriptionKey: process.env.SARVAM_API_KEY
});

export { llm_chat, gemini, stt, sarvam_voice }
