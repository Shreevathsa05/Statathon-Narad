// llm or ai models defined here
import { ChatOpenAI } from "@langchain/openai"
import "dotenv/config"
import { SarvamAIClient } from "sarvamai";

// reasoning
const llm_chat=new ChatOpenAI({
    model:process.env.CHAT_MODEL,
    apiKey:process.env.OPENAI_API_KEY,
    temprature:1,
    configuration:{
        baseURL:process.env.CHAT_MODEL_BASEURL,
    },
});
// stt - (groq)

// tts
const tts = new SarvamAIClient({
  apiSubscriptionKey: process.env.SARVAM_API_KEY
});

// ---------------------------------------------------------
//                       iffi test
// ---------------------------------------------------------
// (async()=>{
//     const a= await llm_chat.invoke("generate a sample structured json response for set of data on climate vs rain provide only json no other text or any wasteful character");
//     console.log(a);
// })()

// (async()=>{
//     const a= await tts.textToSpeech;
//     console.log(a);
// })()