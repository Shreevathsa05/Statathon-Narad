import { triggerOutboundCall } from "../services/exotelService.js";
import dotenv from "dotenv";

dotenv.config();

/**
 * Step 1: You hit this endpoint to start the survey process.
 */
export const initiateCall = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res
        .status(400)
        .json({ error: "Phone number is required in the request body." });
    }

    // The URL Exotel will hit exactly when the citizen answers the phone
    const webhookUrl = `${process.env.NGROK_URL}/api/survey/webhook/start`;

    const callData = await triggerOutboundCall(phoneNumber, webhookUrl);

    res.status(200).json({
      message: "Call initiated successfully to Exotel.",
      data: callData,
    });
  } catch (error) {
    console.error("Initiate Call Error:", error.message);
    res
      .status(500)
      .json({ error: "Internal Server Error while triggering call." });
  }
};

/**
 * Step 2: Exotel hits this webhook when the citizen picks up. We return ExML.
 */
export const handleCallConnect = (req, res) => {
  // Exotel sends data like 'From', 'To', 'CallSid' in req.body
  const { CallSid, To } = req.body;
  console.log(`📞 Call connected! CallSid: ${CallSid}, Citizen: ${To}`);

  // Point to your locally hosted audio file exposed via ngrok
  const audioUrl = `${process.env.NGROK_URL}/audio/question1.mp3`;

  // The URL Exotel will hit AFTER the user finishes speaking
  const recordingActionUrl = `${process.env.NGROK_URL}/api/survey/webhook/save-recording`;

  // Construct the Exotel Markup Language (ExML)
  const exml = `<?xml version="1.0" encoding="UTF-8"?>
    <Response>
        <Play>${audioUrl}</Play>
        <Record action="${recordingActionUrl}" maxLength="60" />
    </Response>`;

  // Must return proper XML content type so Exotel parses it correctly
  res.set("Content-Type", "text/xml");
  res.status(200).send(exml);
};

/**
 * Step 3: Exotel hits this webhook to hand over the recorded MP3.
 */
export const handleRecording = (req, res) => {
  // Exotel passes the RecordingUrl in the URL-encoded form body
  const { RecordingUrl, From, CallSid } = req.body;

  console.log(`🎤 Recording received for Call ${CallSid} from ${From}`);

  if (RecordingUrl) {
    console.log(`🔗 Audio Link: ${RecordingUrl}`);
    // TODO: Import your Mongoose model here and save the RecordingUrl to MongoDB
    // e.g., await ResponseModel.create({ callSid: CallSid, citizenNumber: From, answerAudio: RecordingUrl });
  } else {
    console.log("⚠️ No recording URL found. User might have hung up early.");
  }

  // Exotel expects a 200 OK plain text or empty XML response to close the loop
  res.set("Content-Type", "text/plain");
  res.status(200).send("Recording saved successfully");
};
