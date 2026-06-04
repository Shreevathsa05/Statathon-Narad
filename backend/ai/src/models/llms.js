// llm or ai models defined here
import "dotenv/config"
import fs from "fs";
import { ChatOpenAI } from "@langchain/openai"
import { CallbackHandler } from "@langfuse/langchain";
import Groq from "groq-sdk";
import { SarvamAIClient } from "sarvamai";

// Initialize Langfuse callback handler
const langfuseHandler = new CallbackHandler({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  baseUrl: process.env.LANGFUSE_BASE_URL,
  enabled: process.env.LANGFUSE_ENABLED === "true"
});

// reasoning - with Langfuse tracing
const llm_chat = new ChatOpenAI({
  model: process.env.CHAT_MODEL,
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0.2,
  maxTokens: 4000,
  configuration: {
    baseURL: process.env.CHAT_MODEL_BASEURL,
  },
});

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

export { llm_chat, stt, sarvam_voice, langfuseHandler }
