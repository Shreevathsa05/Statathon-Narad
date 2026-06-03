//
//  audio logic
//

// import fs from "fs";
import crypto from "crypto"
import audio_trial_base from "../../622d9442-ae59-431c-b26b-cb5aae459c3c.js";
import { base64 } from "zod";

export async function generate_audio(text, language) {
    const lang_codes = {
        "hindi": "hi-IN",
        "bengali": "bn-IN",
        "kannada": "kn-IN",
        "malayalam": "ml-IN",
        "marathi": "mr-IN",
        "odia": "od-IN",
        "punjabi": "pa-IN",
        "tamil": "ta-IN",
        "telugu": "te-IN",
        "english": "en-IN",
        "gujarati": "gu-IN",
        "dogri": "doi-IN",
        "assamese": "as-IN",
        "urdu": "ur-IN",
        "nepali": "ne-IN",
        "konkani": "kok-IN",
        "kashmiri": "ks-IN",
        "sindhi": "sd-IN",
        "sanskrit": "sa-IN",
        "santali": "sat-IN",
        "manipuri": "mni-IN",
        "bodo": "brx-IN",
        "maithili": "mai-IN"
    };
    // console.log(lang_codes[language])
    const lang = lang_codes[language.toLocaleLowerCase()];
    if (!lang) {
        console.error("Language not found!");
        return;
    }

    const res = await sarvam_voice_generate(text, lang);
    console.log(res);
    // fs.writeFileSync(crypto.randomUUID() + ".txt", JSON.stringify(res));

    return JSON.stringify(res[0]);
}

import fs from "fs/promises";
import path from "path";

export async function b64toMp3(b64string, folder, filename) {
    const cleanb64 = b64string
        .replace("'", "")
        .replace("'", "")
        .replace(/^data:audio\/mpeg;base64,/, "");

    await fs.mkdir(folder, { recursive: true });

    const filePath = path.join(folder, filename);

    const buffer = Buffer.from(cleanb64, "base64");

    await fs.writeFile(filePath, buffer);

    return filePath;
}

b64toMp3(audio_trial_base, "audio", crypto.randomUUID() + ".mp3");

const arr = [
    {
        script: "ನಿಮ್ಮ ಸರಾಸರಿ ಮಾಸಿಕ ಮನೆಯ ಆದಾಯ (ರೂಪಾಯಿಯಲ್ಲಿ) ಎಷ್ಟು?",
        language: "kannada"
    },
    {
        script: "ಹಿಂದೂ ಧರ್ಮದ ಬಗ್ಗೆ ನಿಮ್ಮ ತಿಳುವಳಿಕೆ ಏನು?",
        language: "hindi"
    },
    // {
    //     script: "What is the capital of India?",
    //     language: "english"
    // },
    // {
    //     script: "तुमच्या कुटुंबाच्या उत्पन्नाचा मुख्य स्रोत कोणता आहे?.. कृषी. मजदूरी/वेतन. व्यवसाय/स्व-रोजगार. इतर",
    //     language: "marathi"
    // }, {
    //     script: "നിങ്ങളുടെ കുടുംബത്തിന്റെ വരുമാനത്തിന്റെ പ്രധാന സ്രോതസ്സ് ഏതാണ്?.. കൃഷി. വേതനം/ശമ്പളം. ബിസിനസ്/സ്വയം തൊഴിൽ. മറ്റ്",
    //     language: "malayalam"
    // }
]

// for (let i = 0; i < arr.length; i++) {
//     const element = arr[i];
//     generate_audio(element.script, element.language)
// }