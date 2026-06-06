import { generate_audio, b64toMp3 } from "./audio_helpers.js";
import { uploadAudio } from "./minio/file_uploads.js";
import { logger } from "./logger.js";
import fs from "fs/promises";

// Ensure 'avatar-statics' folder logic is handled. 
// We will upload it using a special surveyId to group them in MinIO.
const AVATAR_STATIC_BUCKET_ID = "avatar-statics";

const STATIC_SCRIPTS = {
    english: {
        greeting: "Hello! I am your virtual surveyor. Let's begin the survey.",
        outro: "Thank you for completing the survey. Your responses have been recorded.",
        mcq: "Please select an option from the screen below.",
        checkbox: "Please select one or more options from the screen below, then click submit.",
        text: "Click on the microphone button to start speaking your answer. Once you are done, click stop."
    },
    hindi: {
        greeting: "नमस्ते! मैं आपका वर्चुअल सर्वेक्षक हूँ। आइए सर्वेक्षण शुरू करें।",
        outro: "सर्वेक्षण पूरा करने के लिए धन्यवाद। आपकी प्रतिक्रियाएँ दर्ज कर ली गई हैं।",
        mcq: "कृपया नीचे दी गई स्क्रीन से एक विकल्प चुनें।",
        checkbox: "कृपया नीचे दी गई स्क्रीन से एक या अधिक विकल्प चुनें, फिर सबमिट पर क्लिक करें।",
        text: "अपना उत्तर बोलने के लिए माइक्रोफ़ोन बटन पर क्लिक करें। जब आप पूरा कर लें, तो स्टॉप पर क्लिक करें।"
    }
    // Add other languages as needed.
};

export async function generateAvatarStatics() {
    logger.info("Starting Avatar Static Audio Generation...");

    for (const [language, scripts] of Object.entries(STATIC_SCRIPTS)) {
        for (const [type, text] of Object.entries(scripts)) {
            const staticId = `static_${type}_${language}`;
            const fileName = `${staticId}.mp3`;

            try {
                logger.info(`Generating [${staticId}]...`);
                const audio_base64 = await generate_audio(text, language);
                
                // Convert to mp3
                await b64toMp3(audio_base64, "audio", fileName);
                
                // Upload to MinIO under 'avatar-statics'
                await uploadAudio(AVATAR_STATIC_BUCKET_ID, fileName);

                logger.info(`Successfully generated and uploaded [${staticId}]`);
            } catch (err) {
                logger.error(`Failed to generate [${staticId}]:`, err);
            }
        }
    }

    logger.info("Avatar Static Audio Generation Complete!");
}

// Run standalone
generateAvatarStatics().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
