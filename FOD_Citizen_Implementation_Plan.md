# FOD Division & Citizen Flow: Critical Analysis & Implementation Plan

## 1. Goal Overview
To design and plan the implementation of the **Citizen Response Flow** (via Web Form with Aadhaar/Phone verification and data pre-population) and the **FOD Admin Flow** (managing mock citizen data uploads and dispatching multi-channel survey campaigns).

## 2. Critical Analysis

### 2.1 Citizen Flow Analysis
**The Plan:** Citizens input Phone/Aadhaar → OTP Verify → Lookup Mock DB → Pre-populate Section 1 (Demographics) → Use Pincode API → Lookup LGD Code → Save Response.
- **Strengths:** Excellent UX. Reduces survey fatigue by skipping constant demographic questions. Ensures high data quality through standardized LGD geographic coding.
- **Faults / Practical Challenges:**
  1. **Pincode to District Mismatch:** The Postal PIN API (`api.postalpincode.in`) returns string district names (e.g., "Gautam Buddha Nagar"). Government LGD directories might spell this as "Gautam Buddh Nagar". A direct string comparison will frequently fail. 
     * **Solution:** We must implement a fuzzy text search (e.g., Levenshtein distance) or a standardized alias map when cross-referencing the Postal API result with the LGD JSON.
  2. **Aadhaar Privacy (Even for Mocks):** Storing plain-text Aadhaar numbers, even in a prototype, is bad practice.
     * **Solution:** The Mock DB should store hashed Aadhaar numbers or use masked strings (e.g., `XXXX-XXXX-1234`) for display, only matching against the exact input.
  3. **Handling "Not Found" Citizens:** If a citizen is not in the Mock DB, they fill out Section 1 manually.
     * **Solution:** When they submit the survey, the backend must dynamically UPSERT their demographic data back into the `MockCitizen` database to enrich the dataset for future surveys.

### 2.2 FOD Admin Flow Analysis
**The Plan:** FOD Admin uploads Excel (Mock DB) → Selects channels (Web, WhatsApp, Telegram, IVR) → Dispatches survey to selected numbers → Monitors real-time status.
- **Strengths:** Centralized control over all outbound collection. Excels are the perfect UX for government operators.
- **Faults / Practical Challenges:**
  1. **Excel Parsing Fragility:** Admins will inevitably upload poorly formatted Excels (missing columns, text in phone number fields).
     * **Solution:** The upload API must validate the Excel strictly against a schema and return a detailed error array (e.g., "Row 12: Invalid Phone Number") rather than crashing.
  2. **Multi-Channel Race Conditions:** If you dispatch a survey to a citizen via WhatsApp AND an IVR call, they might answer both simultaneously, creating duplicate records.
     * **Solution:** Introduce a `DispatchTask` schema. When a citizen starts a survey on ANY channel, the system marks the task as `in_progress` and locks out other channels temporarily.
  3. **Status Tracking:** The current `main2` schema only tracks `Responses`. It does not track *who hasn't responded*.
     * **Solution:** A `Campaign` collection is needed to track the total target audience, allowing the dashboard to show metrics like "Sent: 1000", "Attempted: 400", "Completed: 350", "Failed: 50".

---

## 3. Proposed Changes

### Database Additions (`backend/main2/src/models/`)

#### [NEW] `mockCitizenSchema.js`
Stores the pre-population data uploaded by FOD.
- `aadhaar` (String, indexed)
- `phone` (String, indexed)
- `demographics`: Object matching Survey Section 1 (Name, Age, Gender, etc.)

#### [NEW] `campaignSchema.js`
Tracks outbound survey dispatches from the FOD Admin.
- `surveyId` (Ref)
- `campaignName` (String)
- `channels` (Array: `['whatsapp', 'ivr', 'telegram', 'web']`)
- `targets`: Array of objects tracking individual phone numbers and their delivery status (`pending`, `delivered`, `attempted`, `completed`, `failed`).

### Backend API Updates (`backend/main2`)

#### [NEW] `routes/fodRoute.js`
- `POST /api/fod/upload-citizens`: Accepts `multipart/form-data` (Excel/CSV), parses using `xlsx` library, validates, and upserts into `MockCitizen` DB.
- `POST /api/fod/campaigns`: Creates a new campaign and triggers outbound webhooks to `delivery_bot` and `exotel` services based on selected channels.
- `GET /api/fod/campaigns/:id`: Returns analytics (Completed vs Failed).

#### [NEW] `routes/citizenRoute.js`
- `POST /api/citizen/verify`: Accepts Phone/Aadhaar, validates OTP (mocked).
- `GET /api/citizen/lookup`: Fetches pre-population data from `MockCitizen` using verified identity.
- `GET /api/citizen/lgd-lookup`: Accepts a Pincode, hits Postal API, fuzzy-matches the District against a local `lgd_directory.json`, and returns the State/District LGD and Census 2011 codes.

### Frontend Updates (`frontend/admin` and `frontend/citizen`)

#### Admin Panel (FOD Dashboard)
- **Data Upload UI:** Dropzone for Excel files with a template download link.
- **Campaign Dispatcher:** Table of Mock Citizens with multi-select checkboxes. Action bar to select channels (WhatsApp/IVR/Web) and click "Dispatch".
- **Analytics View:** Progress bars showing Attempted vs Completed vs Failed per campaign.

#### Citizen Panel (Web Form)
- **Auth Gate:** Screen prompting for Phone/Aadhaar + OTP.
- **Form Loader:** If Mock DB data is found, Section 1 is pre-filled and locked (or editable to update).
- **LGD Integration:** On blur of the Pincode field, UI shows a loading spinner, fetches LGD data, and silently populates the `paraInfo.lgdInfo` payload in the background for submission.
