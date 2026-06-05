import { llm_chat, stt, sarvam_voice } from '../models/llms.js'
import { logger } from './logger.js';

export async function sarvam_voice_generate(text, lang_code) {
    try {
        const res = await sarvam_voice.textToSpeech.convert({
            text: text,
            model: "bulbul:v3",
            speaker: "priya",
            target_language_code: lang_code
        })

        return res.audios;
    } catch (error) {
        logger.error("Error in sarvam_voice_generate:", error);
        throw error;
    }
}

export const lang_codes = {
    Hindi: "hi-IN",
    Bengali: "bn-IN",
    Kannada: "kn-IN",
    Malayalam: "ml-IN",
    Marathi: "mr-IN",
    Odia: "od-IN",
    Punjabi: "pa-IN",
    Tamil: "ta-IN",
    Telugu: "te-IN",
    English: "en-IN",
    Gujarati: "gu-IN",
    Dogri: "doi-IN",
    Assamese: "as-IN",
    Urdu: "ur-IN",
    Nepali: "ne-IN",
    Konkani: "kok-IN",
    Kashmiri: "ks-IN",
    Sindhi: "sd-IN",
    Sanskrit: "sa-IN",
    Santali: "sat-IN",
    Manipuri: "mni-IN",
    Bodo: "brx-IN",
    Maithili: "mai-IN"
};