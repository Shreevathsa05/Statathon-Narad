# FOD Division & Citizen Flow: Final Implementation Plan

---

## 1. Goal Overview

To implement a **scalable and controlled survey system** with:

- Campaign-based targeting for restricted surveys
- Open access for general surveys
- Aadhaar/Phone-based verification
- Pre-population using Mock DB
- Multi-channel delivery (Web, WhatsApp, IVR)

---

## 2. Core Design Decisions

### 2.1 Survey Access Types

Each survey defines who can access it:

```js
accessType: "general" | "targeted";
```

- **general** → Open to all users (no targeting)
- **targeted** → Only users present in CampaignTarget

---

### 2.2 Eligibility Logic

```text
IF survey.accessType === "general"
    → allow user

ELSE (targeted)
    → check CampaignTarget
    → if exists → allow
    → else → reject
```

---

### 2.3 Identity Handling

- Aadhaar / Phone → converted to `userKey` (hashed)
- Used for:
  - eligibility check
  - response linking

- Raw Aadhaar is never stored (privacy)

---

## 3. Database Schemas

---

### 3.1 Survey Schema (Updated)

```js
const SurveySchema = new mongoose.Schema(
  {
    surveyId: String,
    name: String,

    status: {
      type: String,
      enum: [
        "pending",
        "approved",
        "active",
        "complete",
        "updating",
        "translating",
      ],
    },

    accessType: {
      type: String,
      enum: ["general", "targeted"],
      required: true,
    },

    supportedLanguages: [String],
    questionSections: [questionSectionSchema],
    allowedChannels: [String],
    categories: [String],

    createdBy: String,
  },
  { timestamps: true },
);
```

---

### 3.2 CampaignTarget Schema (Final)

```js
const CampaignTargetSchema = new mongoose.Schema(
  {
    surveyId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    // aadhar
    userKey: {
      type: String,
      required: true,
      index: true,
    },

    // not needed if we can get the aadhar id using phone from mockDB
    phone: {
      type: String,
    },

    status: {
      type: String,
      enum: ["pending", "sent", "failed", "responded"],
      default: "pending",
    },
  },
  { timestamps: true },
);
```

---

### 3.3 Indexes

```js
// eligibility check
{ surveyId: 1, userKey: 1 }

// prevent duplicates
{ surveyId: 1, userKey: 1 } (unique)
```

---

### 3.4 MockCitizen Schema

```js
const MockCitizenSchema = new mongoose.Schema({
  userKey: {
    // aadhar
    type: String,
    index: true,
  },
  phone: String,
  fullName: String,
  age: Number,
  gender: String,
  primaryLanguage: String,
  pincode: String,
  area: String,
});
```

---

## 4. System Flows

---

### 4.1 Admin Flow

#### Step 1: Create Survey

#### Step 2: Target Users (only if targeted)

- Upload Excel OR define demographics
- Resolve users from Mock DB
- Insert into `CampaignTarget`

#### Step 3: Dispatch

- Send via WhatsApp / IVR / Web link

---

### 4.2 Citizen Flow (Web)

#### Step 1: Open Survey

- User selects survey

#### Step 2: Identity Verification

- Enter Aadhaar / Phone
- Generate `userKey`(hashed)

#### Step 3: Eligibility Check

```js
if (survey.accessType === "general") {
  allow
} else {
  check CampaignTarget
}
```

---

#### Step 4: Prefill

- Lookup MockCitizen using `userKey`
- If found → prefill
- Else → user fills manually

---

#### Step 5: Submit

- Save response in `SurveyResponse`
- Update:

```js
status = "responded";
```

- UPSERT MockCitizen (if new user)

---

## 5. Key Design Principles

---

### 5.1 Separation of Concerns

- **Survey** → defines structure and access
- **CampaignTarget** → defines eligibility
- **MockCitizen** → improves UX (prefill only)
- **SurveyResponse** → stores actual data

---

### 5.2 No Over-Engineering

- No campaign grouping needed
- No distribution logs
- Single-attempt model

---

### 5.3 Scalability Optimization

- General surveys → no CampaignTarget entries
- Targeted surveys → only required users stored

---

## 6. Known Limitations

- No per-channel delivery tracking, through response we can get count of channel 
- No retry attempt history
- Single-attempt assumption per user

---

## 7. Final System Summary

- **General Survey** → open access
- **Targeted Survey** → CampaignTarget controlled
- **Eligibility** → existence-based
- **User Data** → enriched over time via Mock DB

---
