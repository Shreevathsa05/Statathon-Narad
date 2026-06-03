import minioClient from "./client.js";
import crypto from "crypto";
import fs from "fs";
import "dotenv/config"

export async function uploadAudio(surveyId, mp3AudioLocation) {
    const sourceFile = "audio/" + mp3AudioLocation;
    const bucket = process.env.MINIO_BUCKET_NAME;

    const destObjName = surveyId + "/" + mp3AudioLocation;

    const exists = await minioClient.bucketExists(bucket)
    if (exists) {
        console.log('Bucket ' + bucket + ' exists.')
    } else {
        await minioClient.makeBucket(bucket, 'us-east-1')
        console.log('Bucket ' + bucket + ' created in "us-east-1".')
    }

    var metaData = {
        'Content-Type': 'audio/mpeg',
        'X-Amz-Meta-SurveyId': surveyId,
        'X-Amz-Meta-UploadedBy': 'system',
        'X-Amz-Meta-Timestamp': new Date().toISOString()
    };
    await minioClient.fPutObject(bucket, destObjName, sourceFile, metaData);

    console.log('File', sourceFile, 'uploaded to bucket', bucket, 'at', destObjName)
    fs.unlinkSync(sourceFile);
}

// uploadAudio("1", "a1.mp3");