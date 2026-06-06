# Twilio IVR Survey System Documentation

This document explains the steps to configure, run, and test the dynamic Twilio-based Interactive Voice Response (IVR) survey system implemented in the NARAD platform.

---

## 🛠 Prerequisites

Before starting the applications, ensure the following tools and services are set up:
1. **Docker / MinIO:** Ensure your local MinIO container is running (typically on port `9000` with the console on `9001`).
2. **ngrok:** You must have `ngrok` installed to expose your local `exotel` server to Twilio.
3. **Twilio Account:** A Twilio Account SID, Auth Token, and Twilio-verified Phone Number.

---

## 🚀 Step-by-Step Setup and Execution Guide

### Step 1: Expose Exotel Port via ngrok
Open a terminal and start an `ngrok` tunnel on port `4000` (the port the `exotel` service runs on):
```bash
ngrok http 4000
```
Copy the forwarding HTTPS URL (e.g. `https://1234-56-78.ngrok-free.app`). You will need this for the next step.

### Step 2: Configure Environment Variables
Verify that the following variables are defined in your `.env` files, making sure to paste the HTTPS ngrok URL as the `NGROK_URL`:

**`backend/exotel/.env`**
```env
PORT=4000
NGROK_URL=https://<your-ngrok-subdomain>.ngrok-free.app
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
MAIN2_API_URL=http://localhost:3000
AI_API_URL=http://localhost:3001
```

**`backend/ai/.env`**
```env
PORT=3001
SARVAM_API_KEY="your_sarvam_api_key"
MINIO_ENDPOINT="localhost"
MINIO_PORT=9000
MINIO_BUCKET_NAME="surveyaudios"
```

### Step 3: Run the Services
Start all three backend services. Ensure you use `node src/index.js` for the `exotel` service:
```bash
# In backend/main2/
npm run dev

# In backend/ai/
npm run dev

# In backend/exotel/
node src/index.js
```

### Step 4: Generate Audio and Activate Survey
Before triggering a call, the survey must have generated audio and be set to active:
1. **Generate TTS Audio:**
   ```bash
   curl http://localhost:3001/speech/generate_audio/<surveyId>
   ```
2. **Activate the Survey:**
   Open MongoDB (e.g., MongoDB Compass) and update your survey's `status` field to `"active"`.

### Step 5: Trigger the Outbound Call
Run the trigger curl command to start the call flow:
```bash
curl -X POST http://localhost:4000/api/survey/trigger-ivr-survey \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+91XXXXXXXXXX",
    "surveyId": "<surveyId>",
    "language": "english"
  }'
```

---

## 📑 API Endpoints Reference Table

All endpoints are mounted under the base path `/api/survey` on the `exotel` service (Port `4000`).

| HTTP Method | Route | Called By | Description | Payload / Query Parameters |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/trigger-ivr-survey` | Frontend / Main2 | Triggers an outbound Twilio call to a phone number for a specific survey. | **Body:** `{ "phoneNumber": "+91...", "surveyId": "uuid", "language": "english" }` |
| **POST** | `/webhook/start` | Twilio | Webhook hit when the citizen answers the call. Resolves the first valid question and returns TwiML. | **Body:** Twilio standard call connection payload (`CallSid`, `To`, etc.) |
| **POST** | `/webhook/answer` | Twilio | Webhook hit after a user completes a recording. Submits audio to STT and updates the live call with the next question. | **Body:** Twilio recording payload (`RecordingUrl`, `CallSid`) |
| **POST** | `/webhook/status` | Twilio | StatusCallback webhook triggered when the call is hung up. Compiles and submits collected responses to `main2`. | **Body:** Twilio call status payload (`CallStatus`) |
| **GET** | `/proxy-audio` | Twilio | Proxy endpoint that streams WAV audio files from MinIO to Twilio with the correct `audio/x-wav` headers. | **Query Params:** `?surveyId=<id>&audioId=<id>&cb=<timestamp>` |
