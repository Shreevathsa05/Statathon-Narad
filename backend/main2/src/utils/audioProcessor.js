import fs from 'fs';
import { SurveyResponse } from '../models/responsesSchema.js';
import { SarvamAIClient } from 'sarvamai';

const sarvam_voice = new SarvamAIClient({
  apiSubscriptionKey: process.env.SARVAM_API_KEY
});

export async function processAudioResponses(surveyResponseId, files) {
    try {
        console.log(`[AudioProcessor] Starting STT for response: ${surveyResponseId}`);
        const surveyResponse = await SurveyResponse.findById(surveyResponseId);
        
        if (!surveyResponse) {
            console.error(`[AudioProcessor] SurveyResponse not found: ${surveyResponseId}`);
            return;
        }

        let isUpdated = false;

        // Iterate through all uploaded files
        for (const file of files) {
            // Expected fieldname from frontend: "audio_{qid}"
            const match = file.fieldname.match(/^audio_(.+)$/);
            if (!match) continue;
            
            const qid = match[1];
            
            // Perform STT using Sarvam SDK
            try {
                const transcription = await sarvam_voice.speechToText.transcribe({
                    file: fs.createReadStream(file.path),
                    model: "saaras:v3",
                    mode: "transcribe"
                });

                const transcribedText = transcription.transcript || transcription.text || "Transcription failed";

                // Update the specific answer in the surveyResponse
                const answerIndex = surveyResponse.response.findIndex(r => r.qid === qid);
                if (answerIndex !== -1) {
                    surveyResponse.response[answerIndex].answer = transcribedText;
                    isUpdated = true;
                    console.log(`[AudioProcessor] Transcribed qid ${qid}: ${transcribedText}`);
                }

            } catch (err) {
                console.error(`[AudioProcessor] Failed STT for qid ${qid}:`, err);
                
                // Fallback mark
                const answerIndex = surveyResponse.response.findIndex(r => r.qid === qid);
                if (answerIndex !== -1) {
                    surveyResponse.response[answerIndex].answer = "[STT Error]";
                    isUpdated = true;
                }
            } finally {
                // Cleanup temp file
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
            }
        }

        if (isUpdated) {
            await surveyResponse.save();
            console.log(`[AudioProcessor] Successfully updated SurveyResponse: ${surveyResponseId}`);
        }

    } catch (error) {
        console.error(`[AudioProcessor] Fatal error processing response ${surveyResponseId}:`, error);
    }
}
