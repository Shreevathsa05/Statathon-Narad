import dotenv from "dotenv";
import fs from "fs";
import { stt, tts } from "../models/llms.js";

dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

async function downloadRecording(recordingSid) {

    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Recordings/${recordingSid}.mp3`;

    const response = await fetch(url, {
        headers: {
            "Authorization": "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64")
        }
    });

    if (!response.ok) {
        throw new Error(`Failed: ${response.status} ${response.statusText}`);
    }

    const rand = Math.floor(Math.random() * 1000000);
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(`recording${rand}.mp3`, buffer);
    return `recording${rand}.mp3`;
}

export default async function stt_from_twilio_whisper(url) {
    let transcription;
    let filename;

    try {
        const match = url.match(/Recordings\/(RE[a-zA-Z0-9]+)/);
        if (!match) throw new Error("No Recording SID found in link");

        const recordingSid = match[1];
        filename = await downloadRecording(recordingSid);

        transcription = await stt(filename);
        fs.unlinkSync(filename);
    } catch (error) {
        fs.unlinkSync(filename);
    }
    // console.log("transcription", transcription);
    return transcription;
}

export async function stt_from_twilio_sarvam(url) {
    let transcription;
    let filename;

    try {
        const match = url.match(/Recordings\/(RE[a-zA-Z0-9]+)/);
        if (!match) throw new Error("No Recording SID found in link");

        const recordingSid = match[1];
        filename = await downloadRecording(recordingSid);

        transcription = await tts.speechToText.transcribe({
            file: fs.createReadStream(filename),
            model: "saaras:v3",
            mode: "transcribe"
        });
        fs.unlinkSync(filename);
    } catch (error) {
        fs.unlinkSync(filename);
    }
    // console.log("transcription", transcription);
    return transcription;
}

// stt_from_twilio("https://api.twilio.com/2010-04-01/Accounts/AC17f953871067960b071d0468041b81d9/Recordings/REce7e4e5e8bb053c39d9c56a1453e4eb8");
