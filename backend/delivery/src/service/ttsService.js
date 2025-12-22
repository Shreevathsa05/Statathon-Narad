import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// GOAL: Go from src/service -> delivery/audio/tts
// 1. .. (up to src)
// 2. .. (up to delivery)
// 3. /audio/tts
const ttsDir = path.join(__dirname, "..", "..", "audio", "tts");

// Ensure directory exists
if (!fs.existsSync(ttsDir)) {
  fs.mkdirSync(ttsDir, { recursive: true });
}

const LANGUAGE_MAP = {
  english: "en-IN",
  hindi: "hi-IN",
  marathi: "mr-IN",
};

export const generateAudioFile = async (text, languageName) => {
  try {
    if (!text || !languageName) return null;

    // 1. Normalize language input (handle "English", "ENGLISH", etc.)
    const lowerLang = languageName.toLowerCase();
    const sarvamLang = LANGUAGE_MAP[lowerLang];

    if (!sarvamLang) {
      console.error(`Unsupported language requested: ${languageName}`);
      return null;
    }

    // 2. Call Sarvam API
    const response = await axios.post(
      "https://api.sarvam.ai/text-to-speech",
      {
        text: text.trim(),
        language: sarvamLang,
        voice: "female", // or 'male'
        format: "mp3",
      },
      {
        headers: {
          "api-subscription-key": process.env.SARVAM_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    // 3. Process Response (Sarvam returns Base64, not a URL)
    const base64Audio = response.data.audios?.[0];
    if (!base64Audio) throw new Error("No audio data received from Sarvam");

    const buffer = Buffer.from(base64Audio, "base64");

    // 4. Create unique filename
    const uniqueId = Date.now();
    const fileName = `${lowerLang}_${uniqueId}.mp3`;
    const filePath = path.join(ttsDir, fileName);

    // 5. Write file to disk
    fs.writeFileSync(filePath, buffer);

    console.log(`Audio saved at: ${filePath}`);

    // 6. Return the URL path that the frontend will use
    return `/audio/tts/${fileName}`;
  } catch (error) {
    console.error(`TTS Service Error:`, error.message);
    // Log full error for debugging if needed:
    // console.error(error.response?.data || error);
    return null;
  }
};
