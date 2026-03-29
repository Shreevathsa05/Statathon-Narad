import { llm_chat, stt, sarvam_voice } from '../models/llms.js'

export async function sarvam_voice_generate(text, lang_code) {
    const res = await sarvam_voice.textToSpeech.convert({
        text: text,
        model: "bulbul:v3",
        speaker: "shubh",
        target_language_code: lang_code
    })

    return res.audios;
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