import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ttsDir = path.join(__dirname, "..", "audio", "tts");

// Ensure directory exists once
if (!fs.existsSync(ttsDir)) {
  fs.mkdirSync(ttsDir, { recursive: true });
}

// Map Schema language names to Sarvam codes
const LANGUAGE_MAP = {
  english: "en-IN",
  hindi: "hi-IN",
  marathi: "mr-IN",
  // Add others: bengali: "bn-IN", telugu: "te-IN", etc.
};

export const generateAudioFile = async (text, languageName) => {
  try {
    if (!text || !languageName) return null;

    const sarvamLang = LANGUAGE_MAP[languageName];
    if (!sarvamLang) throw new Error(`Unsupported language: ${languageName}`);

    const response = await axios.post(
      "https://api.sarvam.ai/text-to-speech",
      {
        text: text.trim(),
        language: sarvamLang,
        voice: "female",
        format: "mp3",
      },
      {
        headers: {
          "api-subscription-key": process.env.SARVAM_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    const base64Audio = response.data.audios?.[0];
    if (!base64Audio) throw new Error("No audio data from Sarvam");

    const buffer = Buffer.from(base64Audio, "base64");
    // Create a unique filename based on content hash or random ID
    const fileName = `${languageName}_${Date.now()}_${Math.floor(
      Math.random() * 1000
    )}.mp3`;
    const filePath = path.join(ttsDir, fileName);

    fs.writeFileSync(filePath, buffer);

    return `/audio/tts/${fileName}`;
  } catch (error) {
    console.error(`TTS Gen Error [${languageName}]:`, error.message);
    return null; // Return null so the loop continues even if one fails
  }
};
