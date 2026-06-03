import { Survey } from "../mongodb/surveySchema.js";
import connectDB from "../mongodb/connect.js";
import { sarvam_voice_generate } from "./tts.js";

export async function audio_generation(surveyId) {
    console.log(`\n--- Starting Audio Generation for Survey: ${surveyId} ---`);

    let survey = await Survey.findOne({ surveyId: surveyId });
    if (!survey) {
        console.error("Survey not found!");
        return;
    }

    const supported_languages = survey.supportedLanguages;
    console.log(`Supported Languages: ${supported_languages.join(", ")}`);

    let updatesMade = false;

    for (const section of survey.questionSections) {
        console.log(`\n> Processing Section: ${section.sectionName}`);

        for (const question of section.questions) {
            for (const language of supported_languages) {
                // In Mongoose, 'audio' and 'text' are Maps. Use .get() to access values.
                const currentAudio = question.audio.get(language);

                // Check if audio is missing or just the placeholder " "
                if (!currentAudio || currentAudio.trim() === "") {

                    // 1. Build the translation script
                    let scriptText = question.text.get(language) || "";

                    // If MCQ/Checkbox, we probably want to read the options out loud too
                    if (question.type === "mcq" || question.type === "checkbox") {
                        const optionTexts = question.options
                            .map(opt => opt.label.get(language))
                            .filter(Boolean)
                            .join(". ");
                        if (optionTexts) {
                            scriptText += ".. " + optionTexts;
                        }
                    }

                    console.log(`\n[Audio Task] QID: ${question.qid} | Lang: ${language}`);
                    console.log(`[Script]: "${scriptText}"`);

                    // 2. Generate audio using external api
                    // const audio_base64 = await generate_audio(scriptText, language);

                    // 3. Save it back to the map using .set()
                    // question.audio.set(language, audioUrl);
                    // updatesMade = true;

                    // Mocking a generated URL for now
                    console.log(`[Status]: Pending API implementation...`);
                }
            }
        }
    }

    if (updatesMade) {
        console.log("\nSaving survey updates to MongoDB...");
        await survey.save();
        console.log("Save complete.");
    } else {
        console.log("\nNo new audio needed to be generated.");
    }
}



// Execute the standalone script
// await connectDB().then(() => {
//     audio_generation("d05ba87f-8631-4757-8433-4463d0916319")
//         .then(() => process.exit(0))
//         .catch(err => {
//             console.error(err);
//             process.exit(1);
//         });
// });