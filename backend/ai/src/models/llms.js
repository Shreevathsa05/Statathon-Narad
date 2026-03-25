// llm or ai models defined here
import "dotenv/config"
import fs from "fs";
import { ChatOpenAI } from "@langchain/openai"
import Groq from "groq-sdk";
import { SarvamAIClient } from "sarvamai";

// reasoning
const llm_chat = new ChatOpenAI({
  model: process.env.CHAT_MODEL,
  apiKey: process.env.OPENAI_API_KEY,
  temprature: 1,
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

// tts
const tts = new SarvamAIClient({
  apiSubscriptionKey: process.env.SARVAM_API_KEY
});

export { llm_chat, stt, tts }

// ---------------------------------------------------------
//                       iffi test
// ---------------------------------------------------------
// (async () => {
//   try {
//     const res = await tts.textToSpeech.convert({
//       text: "Hello, this is a test generation.",
//       model: "bulbul:v3",
//       speaker: "shubh",
//       target_language_code: "hi-IN"
//     });
//     console.log("TTS Response:", res);
//   } catch (error) {
//     console.error("TTS Error:", error);
//   }
// })();

// (async () => {
//   try {
//     const dummyBlob = new Blob(["dummy audio data"], { type: "audio/m4a" });
//     const res = await stt(dummyBlob, "test_audio.m4a");
//     console.log("STT Response:", res);
//   } catch (error) {
//     console.error("STT Error:", error);
//   }
// })();