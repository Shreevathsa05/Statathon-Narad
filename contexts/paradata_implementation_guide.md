# Cross-Channel Paradata Implementation Guide

This guide outlines the backend schema updates required for the WhatsApp and Telegram delivery bots to support the new unified paradata analytics framework.

## 1. Schema Update Required

You need to update your respective `SurveyResponse` schemas to capture question-level timings. The macro (survey-level) timestamps are already handled, but we need the micro-level `timeTaken` for each specific answer.

### WhatsApp Bot (`backend/whatsapp_delivery_bot/models/SurveyResponse.js`)
Update the `ResponseSchema` inside the file:

```javascript
const ResponseSchema = new mongoose.Schema(
  {
    qid: { type: String, required: true },
    answer: { type: mongoose.Schema.Types.Mixed },
    
    // NEW FIELDS
    timeTaken: { type: Number }, // In seconds. Represents "active interaction time"
    timestamp: { type: Date, default: Date.now } // Absolute time the answer was recorded
  },
  { _id: false }
);
```

### Telegram Bot (`backend/delivery_bot/models/SurveyResponse.js`)
Update the `response` array definition inside the `SurveyResponse` schema:

```javascript
      response: [
        {
          qid: String,
          optionId: String,
          
          // NEW FIELDS
          timeTaken: Number, // In seconds. Represents "active interaction time"
          timestamp: { type: Date, default: Date.now } // Absolute time the answer was recorded
        }
      ],
```

## 2. Logic Implementation (How to calculate `timeTaken`)

When your bot sends a question to the user, you must track the time that message was **delivered** (or sent). When the user replies with an answer, you calculate the time difference in seconds.

### Example Flow:
1. **Bot Sends Q1:** Record `questionSentAt = Date.now()`
2. **User Replies to Q1:** Record `replyReceivedAt = Date.now()`
3. **Calculate:** `timeTaken = (replyReceivedAt - questionSentAt) / 1000`
4. **Save to DB:** Push `{ qid: "q1", answer: "A", timeTaken: 12.5, timestamp: new Date() }` to the `response` array.

### Why this approach?
This unified standard (`timeTaken` per question + overall survey `startTime`/`endTime`) allows the central analytics dashboard to automatically flag "Speeders" (e.g. `timeTaken < 1.5s`) and detect "High Friction Questions" across Web, Avatar, Telegram, and WhatsApp using the exact same logic.
