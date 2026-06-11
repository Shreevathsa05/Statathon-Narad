import fs from 'fs';
import { SurveyResponse } from '../models/responsesSchema.js';

const AI_SERVICE_URL = process.env.AI_SERVER_URL || 'http://localhost:3001';

export async function processAudioResponses(surveyResponseId, files) {
    try {
        console.log(`[AudioProcessor] Starting STT for response: ${surveyResponseId}`);
        const surveyResponse = await SurveyResponse.findById(surveyResponseId);
        
        if (!surveyResponse) {
            console.error(`[AudioProcessor] SurveyResponse not found: ${surveyResponseId}`);
            for (const file of files) {
                if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
            }
            return;
        }

        let isUpdated = false;

        // Iterate through all uploaded files
        for (const file of files) {
            // Expected fieldname from frontend: "audio_{qid}"
            const match = file.fieldname.match(/^audio_(.+)$/);
            if (!match) {
                if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
                continue;
            }
            
            const qid = match[1];
            
            // Forward to AI Microservice
            try {
                const formData = new FormData();
                const buffer = fs.readFileSync(file.path);
                const blob = new Blob([buffer], { type: file.mimetype });
                formData.append('file', blob, file.originalname);

                const response = await fetch(`${AI_SERVICE_URL}/speech/stt-avatar-sarvam`, {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) {
                    throw new Error(`AI STT Service failed with status: ${response.status}`);
                }

                const transcription = await response.json();
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
