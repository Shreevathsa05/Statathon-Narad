# NARAD — Master Project Context

> **This file is the single source of truth for any agent, engineer, or LLM working on this project.**
> Read this before touching any code.

---

## 1. Problem Statement

**Organisation:** Ministry of Statistics and Programme Implementation (MoSPI), Government of India
**Competition:** Statathon (Hackathon)

MoSPI conducts hundreds of socio-economic and enterprise surveys across India every year through its field arm, the **National Statistical System (NSS)**. The core problems we are solving:

1. **Survey Generation** — No unified digital tool exists to create, version, and manage the diverse questionnaires used across all NSS surveys (household, enterprise, agriculture, labour force, price indices, etc.).
2. **Multi-modal Delivery** — Surveys must reach respondents via multiple channels: web app, Telegram bot, IVR phone calls, and in-field apps. India's rural respondents are often only reachable by voice/phone.
3. **Response Collection & Processing** — Raw responses (text, audio, IVR DTMF tones) must be collected, validated, and encoded using standard government classification codes (NIC — National Industrial Classification, NCC — National Classification of Commodities, LGD codes for geographic units, etc.) before being stored.
4. **Multi-lingual Support** — All surveys and interfaces must support 12+ Indian regional languages.

---

## 2. Our Solution: The NARAD Platform

**NARAD** (National Automated Response and Data system) mirrors the **NSS Division Model** digitally, creating a clean separation of responsibilities mapped to existing government infrastructure:

| NSS Division | What It Does (IRL) | NARAD Digital Equivalent |
|---|---|---|
| **SDRD** – Survey Design & Research Division | Plans survey structure, questionnaire design | `backend/ai` — AI agent pipeline that generates survey structure and questions |
| **DPD** – Data Processing Division | Processes, scrutinises, codes raw data | `backend/main2` — CRUD API for surveys & structured response ingestion |
| **FOD** – Field Operations Division | Primary data collection (two modes — see below) | `backend/delivery_bot` & `backend/exotel` (online) + Field Agent panel login (CAPI) |
| **CQCD** – Coordination, Quality Control & Data Division | Coordination, QC, report releases | Frontend Admin Panel (to be rebuilt) — Survey approval, agent management, analytics, publication |

### FOD: Two-Mode Data Collection

FOD operates two parallel collection pipelines:

| Mode | Mechanism | Who Manages | Technology |
|---|---|---|---|
| **Online Multichannel** | Telegram, WhatsApp, IVR phone call, Web | FOD division head | `delivery_bot`, `exotel`, future WhatsApp/Web |
| **On-Ground (CAPI)** | Door-to-door field visits | Field Managers → Field Agents | Admin panel CAPI view + `main2` response API |

On-ground CAPI is preserved because many regions have unstable/no internet, low smartphone literacy, or no access to digital channels. Field Agents physically visit households and record responses via the Admin Panel on a device.

### High-Level Data Flow

```
[SDRD / AI] ──► Generate Survey (English) ──► Translate to Regional Languages
                        │
                        ▼
[DPD / main2] ──► Store Survey (status: pending) ──► Approve (status: active)
                        │
     ┌──────────────────┼───────────────────────────┐
     │                  │                           │
     ▼                  ▼                           ▼
[Telegram Bot]    [IVR / Exotel]           [WhatsApp / Web]
delivery_bot      exotel (Twilio)           (Planned)
     │                  │                           │
     └──────────────────┴───────────────────────────┘
                        │
                        ▼
           [DPD / main2] ──► POST /api/response/:survey_id
           Validate + Store Response (with NIC/LGD codes in paraInfo)
                        │
                        ▼
           [CQCD / Admin Panel] ──► View data, export (CSV/XLSX), publish reports
```

---

## 3. Survey Lifecycle & Status Machine

A survey moves through these states:

```
pending ──► approved ──► active ──► complete
  │                          │
  ├──► updating (while AI is editing a section)
  ├──► translating (while AI is doing multilang translation)
  └──► generating_audio (while AI is generating TTS audio)
```

- **pending**: Created by AI, awaiting admin approval
- **approved**: Admin reviewed, not yet deployed
- **active**: Accepting responses from field/delivery channels
- **complete**: Closed, no new responses
- **updating**: Temporarily locked during AI section improvement
- **translating**: Temporarily locked during multilingual translation
- **generating_audio**: Temporarily locked during Text-To-Speech (TTS) audio generation

> ⚠️ **Active and complete surveys cannot be edited.**

---

## 4. Backend Services Directory

```
backend/
├── ai/               ← SDRD: AI Survey Generation Engine (Port 3001)
├── main2/            ← DPD: Survey & Response CRUD API (Port 3000)
├── exotel/           ← FOD: IVR Delivery via Twilio/Exotel (Port 3002)
├── delivery_bot/     ← FOD: Telegram Survey Delivery Bot (Port 5000)
└── nginx.conf        ← Reverse proxy routing all services
```

All services are containerised and routed by Nginx:

| Nginx Path | Service | Internal Port |
|---|---|---|
| `/backend` | `main2` (core API) | `3000` |
| `/delivery` | `exotel` (IVR) | `4000` |
| `/bot` | `delivery_bot` (Telegram) | `5000` |

---

## 5. Service: `backend/ai` — AI Survey Generation Engine

### Purpose (SDRD Role)
Generates complete, multi-lingual, MoSPI-grounded survey questionnaires using a sequential multi-agent pipeline powered by LangChain, LangGraph, and MoSPI's MCP server.

### Agent Pipeline
```
User Query
  └─► [1] Context Collector Agent  — Queries MoSPI MCP API (list_datasets → get_indicators → get_metadata → get_data)
  └─► [2] Section Planner Agent    — Plans logical sections (Demographics, Employment, Income, etc.) as a JSON array
  └─► [3] Question Generator Agent — Generates questions per-section (prepends standard Demographics, uses previous questions for deduplication), grounded in MoSPI data, outputs strict JSON
  └─► [4] Improver Agent           — Edits a specific section based on natural-language instructions
  └─► [5] Multilingual Translator  — Translates all text/options into target regional languages
  └─► [6] Audio Generation Agent   — Converts translated text/options into speech via Sarvam TTS and uploads to MinIO
```

### Key API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/question-generation/generate_questions_english` | Kicks off async survey generation; accepts optional `improved_answers` for prompt clarification; returns `surveyId` + `status: processing` |
| `GET`  | `/question-generation/poll_questions_english/:surveyId` | Poll every 5–10 s until status = `completed` |
| `POST` | `/question-generation/improve_section_english` | Refine a specific section with free-text instructions |
| `POST` | `/question-generation/generate_questions_multilang` | Translate a completed English survey to target languages |
| `GET`  | `/question-generation/poll_questions_multilang/:surveyId` | Poll translation progress |
| `GET`  | `/speech/generate_audio/:surveyId` | Kicks off background Sarvam TTS audio generation for all survey questions |
| `GET`  | `/speech/audio/:surveyId/:audioId` | Proxy route that serves generated `.mp3` files directly from MinIO storage |
| `POST` | `/speech/stt-twilio` | Whisper (Groq) STT on a Twilio recording URL |
| `POST` | `/speech/stt-twilio-sarvam` | Sarvam AI STT for Indian-accented/regional speech |

### MongoDB Collections (ai service)

**`Survey`** — Primary questionnaire store (shared schema with `main2`)
```js
{
  surveyId: String (unique, UUID),
  name: String,
  status: "pending" | "approved" | "active" | "complete" | "updating" | "translating" | "generating_audio",
  accessType: "general" | "targeted",
  supportedLanguages: [String],  // subset of LANGUAGES enum
  questionSections: [{
    sectionName: String,
    questions: [{
      qid: String,
      type: "mcq" | "text" | "checkbox",
      text: Map<lang, String>,       // { english: "...", hindi: "..." }
      audio: Map<lang, String>,      // TTS audio URL per language
      options: [{                    // required for mcq/checkbox (2-5 options)
        id: String,
        label: Map<lang, String>
      }],
      prefill: String,               // optional default value
      showIf: { questionId, equals } // branching/skip logic
    }]
  }],
  categories: [String],
  allowedChannels: [String],     // subset of CHANNELS enum ("web", "ivr", "whatsapp")
  createdBy: String,
  timestamps: true
}
```

**`SurveyPlan`** — AI reasoning cache (intermediate context)
```js
{
  surveyId: String,
  mcp_context: String,    // raw MoSPI statistical data extracted
  sectionPlan: [{
    sectionName: String,
    description: String,
    questionCount: Number
  }],
  timestamps: true
}
```

### Supported Languages (LANGUAGES enum)
`hindi`, `english`, `bengali`, `telugu`, `tamil`, `marathi`, `gujarati`, `kannada`, `malayalam`, `odia`, `punjabi`, `urdu`

### External Integrations (ai service)
| Integration | Purpose | Env Var |
|---|---|---|
| MoSPI MCP Server | Live statistical dataset access | `MOSPI_MCP_URI` |
| OpenAI / Sarvam AI / Gemini | Chat LLM (configurable) | `OPENAI_API_KEY`, `CHAT_MODEL`, `CHAT_MODEL_BASEURL` |
| Groq Whisper | High-speed English STT | `GROQ_API_KEY` |
| Sarvam AI (`saaras:v3`) | Indian-language regional STT/TTS | `SARVAM_API_KEY` |
| Twilio | Fetch recorded audio from IVR calls | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` |
| MongoDB | Survey + SurveyPlan storage | `MONGODB_URI` |
| Redis | Background job state/caching | `REDIS_URL` |
| MinIO | S3-compatible audio file storage | `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_ENDPOINT`, `MINIO_BUCKET_NAME` |
| Tavily | Web search fallback for agents | `TAVILY_API_KEY`, `TAVILY_MCP_URI` |
| LangSmith | Agent reasoning tracing and debugging | `LANGSMITH_TRACING`, `LANGSMITH_API_KEY`, `LANGSMITH_PROJECT` |

---

## 6. Service: `backend/main2` — Core Survey & Response API (DPD)

### Purpose (DPD Role)
The canonical REST API for survey CRUD and structured response collection. This is the data ingestion and management layer.

### Key API Endpoints

**Survey & Response Routes** (`/api/survey`, `/api/response`)
- Core CRUD operations for surveys and response ingestion. See `backend/main2/Readme.md` for full payload structures.

**Auth & User Routes** (`/api/auth`, `/api/user`)
- JWT-based authentication, password setup, role-based access control, and user management endpoints.

**Campaign & Demographic Routes** (`/api/campaign`, `/api/demographic`)
- Endpoints for creating targeted outreach campaigns (Excel upload or generated) and fetching demographic data for segmentation.

### MongoDB Schemas (main2 service)

**`Survey` & `SurveyResponse`**
- The core schemas. Responses include geospatial, interview, and LGD/NSS sampling metadata.

**`User`**
- Handles RBAC, storing email, hashed password, roles (`admin`, `fod`, `sdrd`, `dpd`), and JWT tokens.

**`CampaignTarget` & `Demographics`**
- Stores target citizens for specific survey campaigns and tracks demographic metrics for segmentation.

### Response Validation Rules
- **MCQ**: `answer` must be a string matching a valid `option.id` in the survey question
- **Text**: `answer` must be a non-empty string
- **Checkbox**: `answer` must be a non-empty array of valid `option.id` strings
- Survey must have `status: "active"` to accept responses

### Auto-coding (Planned — Frontend for Now)
Response coding using standard government classification systems:
- **NIC** — National Industrial Classification (for enterprise/employment surveys)
- **NCC** — National Classification of Commodities (for consumption surveys)
- **LGD** — Local Government Directory (geographic unit codes stored in `paraInfo.lgdInfo`)
- **NSS Region Codes** — Sampling frame identifiers stored in `paraInfo.samplingInfo`

> 💡 For now, the frontend handles lookup and assignment of NIC/NCC codes from a local DB before submitting the response payload. The backend schema stores them as-received.

---

## 7. Service: `backend/delivery_bot` — Telegram Survey Bot (FOD)

### Purpose (FOD Role)
Delivers surveys to respondents over Telegram. Handles in-progress resume, OTP-based phone verification, multi-language question rendering, branching logic (`showIf`), and real-time response persistence.

### Bot Flow
```
/start
  └─► Check for active survey (hardcoded: "mospi-household-survey-2025-01")
  └─► Check for in_progress response (resume or fresh start)
  └─► Language Selection (English / Hindi)
  └─► Collect user.fullname → user.phone_no → OTP verification
  └─► Create SurveyResponse (status: in_progress)
  └─► Loop: ask questions with inline keyboard buttons, respect showIf branching
  └─► Submit: update SurveyResponse (status: completed)
```

### Key Implementation Notes
- Session state stored in-memory (`Map<chatId, session>`)
- Each answer immediately persists to MongoDB (upsert on `responseDocId`)
- `showIf` branching: skip questions whose condition is not met by current answers
- Currently hardcoded to a single surveyId — **this needs to be made dynamic**
- OTP currently sent via Telegram message (not SMS) — Twilio SMS integration is TODO

### MongoDB Collections (delivery_bot service)

Uses simplified schemas (loose — no strict validation like main2):

**`Survey`** — read-only from the bot's perspective
```js
{ surveyId, name, status, supportedLanguages, questions: [QuestionSchema], categories }
// Note: flat questions array (not questionSections), used for delivery
```

**`SurveyResponse`**
```js
{
  surveyId: String,
  telegramChatId: String,
  user: { fullname, phone_no },
  response: [{ qid, optionId }],
  currentIndex: Number,
  status: "in_progress" | "completed",
  timestamps: true
}
```

---

## 8. Service: `backend/exotel` — IVR Delivery via Twilio/Exotel (FOD)

### Purpose (FOD Role)
Delivers surveys over outbound phone calls using IVR (Interactive Voice Response). Currently integrated with both Exotel and Twilio (Twilio is the active implementation). Plays pre-recorded audio questions and captures spoken responses.

### IVR Call Flow (3-Step Webhook Model)
```
1. POST /api/survey/initiate-call   ← Admin triggers call to a citizen phone number
        ↓
   triggerOutboundCall() → Twilio/Exotel API → Dials citizen
        ↓
2. GET/POST /api/survey/webhook/start  ← Twilio webhooks here when citizen answers
   Returns ExML/TwiML:
     <Play> audio/question1.mp3 </Play>
     <Record action="/webhook/save-recording" maxLength="60" />
        ↓
3. POST /api/survey/webhook/save-recording  ← Twilio posts RecordingUrl here
   Saves recording URL to MongoDB (TODO: full implementation pending)
```

### Auth Flow
- `POST /api/auth/request-otp` — Sends 6-digit OTP via Twilio SMS
- `POST /api/auth/verify-otp` — Validates OTP from in-memory store (TODO: replace with Redis + JWT)

### Key Implementation Notes
- Audio files served statically from `src/public/audio/` via `/audio/*` route
- ExML/TwiML response generated dynamically per question
- Recording URL logging is placeholder (TODO: persist to MongoDB + send to STT pipeline)
- Twilio is the active telephony provider; Exotel credentials also supported via `exotelService.js`
- OTP storage is in-memory `Map` — not production-safe (TODO: Redis)

### External Integrations (exotel service)
| Integration | Purpose | Env Var |
|---|---|---|
| Twilio Voice API | Outbound call triggering | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` |
| Twilio SMS API | OTP delivery | Same as above |
| Exotel API | Alternative telephony (backup) | `EXOTEL_SID`, `EXOTEL_API_KEY`, `EXOTEL_API_TOKEN`, `EXOTEL_CALLER_ID` |
| ngrok | Local development webhook tunnelling | `NGROK_URL` |

---

## 9. Frontend (To Be Rebuilt — Ignore Current Code)

The current `frontend/` directory is being completely rebuilt. **No agent should modify or reference anything in `frontend/`.**

The new frontend is split into two distinct panels:

---

### 9A. Admin Panel (CQCD Role)

The Admin Panel is the control plane for the entire NARAD platform. It is accessible to authorised MoSPI staff and is organised around the 4 NSS divisions.

#### Admin Panel → SDRD View: Survey Builder
- **QB Integration** — connect to Question Bank of existing MoSPI surveys
- **Prompt-based generation** — trigger the AI pipeline (`backend/ai`) directly from the UI
- **Custom Question Addition** — manually add/edit individual questions
- **Multilingual** — manage translations per survey
- **Validation** — check survey integrity before publishing
- **Pass to FOD** — promote a survey from `approved` to `active` to push it to delivery channels

#### Admin Panel → FOD View: Multichannel Delivery & Agent Management
- View and manage all active delivery agents (Telegram, IVR, WhatsApp, Web)
- **Add agents with/without** capability to add new team members
- **Collection Agents** panel:
  - `PAPI` — Paper-Assisted Personal Interviewing (OCR)
  - `CAPI` — Computer-Assisted Personal Interviewing
  - `CATI` — Computer-Assisted Telephone Interviewing (IVR)
  - `CAPI-FORM fill with LGD` — auto-populate geographic codes from LGD
- **Agent Admin**: Add agents, monitor individual agent performance
- **Data Display** — view responses per agent/channel

#### Admin Panel → DPD View: Data Display & Export
- **View Question Bank** — browse all questions across all surveys
- **Data Display** — tabular view of collected responses
  - Per-Question Chart
  - Block-wise AI Insights
- **Export Options**:
  - Medium: CSV, XLSX
  - Masking fields (for PII protection)
  - Adding filters
- Mask columns, apply filters before export

#### Admin Panel → CQCD View: Publish Reports
- **Raw reports** (view only) — see unprocessed response data
- **Processed Report exports** — generate final publishable reports
- Access to all views above (SDRD + FOD + DPD) plus publication workflow
- **User & Permission Management** — add users, assign roles per division

---

### 9B. Citizen Panel (FOD Delivery — End-User Facing)

The Citizen Panel is the respondent-facing interface. It is delivered across **4 channels**, all backed by the same survey data from `main2`.

#### Delivery Channels
| Channel | Mode | Status | Notes |
|---|---|---|---|
| **WhatsApp** | Online | 🚧 Planned | WhatsApp Business API integration |
| **Telegram** | Online | ✅ Built | `delivery_bot` service |
| **IVR** (Call & SMS) | Online | ✅ Scaffolded | `exotel` service via Twilio |
| **Web** | Online | 🚧 Planned | Browser-based survey form |
| **CAPI (Field Agent)** | On-Ground | ⏳ To Be Decided | Lightweight citizen-facing page OR offline PWA — mechanism TBD; **not in current sprint scope** |

> **Current FOD focus is exclusively online multichannel delivery.** The on-ground CAPI delivery mechanism for Field Agents is deferred and will be decided separately.

#### Citizen Panel Web Structure (Online Channels)
```
Home (Promo) + Trending Suggestions
  └─► Form Based
        ├── Multiple answering modes (checkbox, text, radio, dropdown)
        └── PWD and Senior Citizen support (hearing and visual aids)
  └─► Avatar Select / Call (voice-first interaction)
  └─► About
```

#### Key Citizen Features
- **Multi-language interface** — survey delivered in chosen regional language
- **Branching logic** — `showIf` conditions evaluated in the browser before each question
- **PWD / Senior Citizen accessibility** — hearing and visual aid modes
- **Masking fields** — PII fields masked per survey config
- **Multiple answering nodes** — checkbox, text, radio, dropdown all supported
- **CAPI-FORM with LGD** — auto-fill geographic codes based on location
- **OTP authentication** — phone-based identity verification before survey access

#### Bonus Feature: Offline Design (Confirmed Target — Field Agents)
The problem statement's "offline design" bonus feature is **confirmed to target Field Agents**, not online channel users. Rationale:
- Online channels (Telegram/WhatsApp/IVR/Web) inherently require network — offline makes no sense for them
- Field Agents operate in regions with unstable/no internet — they are the *exact* users this feature was conceived for
- Implementation pattern: **Progressive Web App (PWA)** with IndexedDB local storage
  - Field Agent logs in while online → surveys cached to device
  - Fills responses offline at each household → stored in IndexedDB queue
  - Background Sync API pushes responses to `main2` when connectivity returns
- This is analogous to ODK Collect / KoBoCollect — the industry-standard offline survey tool for field data collection
- **Status: To Be Decided** — deferred until CAPI delivery mechanism is finalised

---

## 10. Critical Architectural Decisions & Conventions

### Schema Consistency
The `Survey` Mongoose schema is **identical** in `backend/ai/src/mongodb/surveySchema.js` and `backend/main2/src/models/surveySchema.js`. Both point to the **same MongoDB database and collection**. Any schema changes must be mirrored in both files.

### Survey ID Format
- AI-generated surveys use UUIDv4 as `surveyId`
- Manually created surveys (via main2 API) use a human-readable slug format: e.g., `"mospi-household-survey-2025-01"`

### Question Structure: Sections vs Flat
- The canonical schema (`main2` and `ai`) uses **`questionSections`** (array of sections, each with a `questions` array)
- The `delivery_bot` model uses a **flat `questions` array** — this is a known inconsistency that needs to be resolved when the bot is updated to support dynamic survey loading

### Language Keys
All language-keyed maps use full lowercase English names as keys (not ISO codes):
`english`, `hindi`, `bengali`, `telugu`, `tamil`, `marathi`, `gujarati`, `kannada`, `malayalam`, `odia`, `punjabi`, `urdu`

### Question Types
Three types currently supported:
- `mcq` — Single-select, 2–5 options, answer is a single `option.id` string
- `text` — Free text, no options required
- `checkbox` — Multi-select, 2–5 options, answer is an array of `option.id` strings

### Branching Logic (`showIf`)
```js
showIf: {
  questionId: "q3",   // The question whose answer controls this question's visibility
  equals: "opt2"      // Only show this question if q3's answer == "opt2"
}
```
Delivery channels (Telegram bot, future web) must evaluate this before rendering each question.

---

## 11. What Is Built vs What Is TODO

### ✅ Built
- AI multi-agent survey generation pipeline (Context Collector → Section Planner → Question Generator)
- AI section improvement (natural language edit instructions)
- AI multilingual translation (11 Indian languages)
- Survey CRUD API (`main2`)
- Structured response collection API (`main2`) with LGD/NSS metadata schema
- Telegram survey delivery bot with branching, resume, OTP
- Exotel/Twilio IVR outbound call triggering and webhook scaffolding
- Twilio SMS OTP authentication
- STT via Groq Whisper + Sarvam AI (Indian languages)
- TTS via Sarvam AI Bulbul model

### 🚧 TODO / Planned
- **Auth + RBAC system** — JWT + bcrypt in `main2` *(implementation plan ready)*
- **Admin Panel rebuild** — `frontend/Admin/` React + Vite, Vercel Geist dark design system *(implementation plan ready)*
- **Citizen Panel** — web-based survey delivery with accessibility features
- **WhatsApp delivery channel** — WhatsApp Business API integration
- **CAPI Field Agent delivery** *(To Be Decided)* — lightweight citizen-facing page OR offline PWA; mechanism not yet decided; on-ground CAPI not in current sprint
- **IVR full implementation** — Recording URL → STT → store response in `main2`
- **Dynamic survey loading in Telegram bot** — remove hardcoded `surveyId`
- **NIC/NCC auto-coding** — currently manual via frontend lookup DB
- **DTMF support in IVR** — capturing numeric keypad inputs instead of voice
- **Response analytics** — per-question charts, block-wise AI insights
- **Report publishing** — raw + processed report export (CSV/XLSX)
- **Agent performance monitoring** — per-agent data collection analytics
- **CAPI-FORM + LGD auto-fill** — auto-populate geographic codes for field agents
- **PWD accessibility mode** — hearing/visual aid support in Citizen Panel

---

## 12. Environment Variables Reference

### `backend/ai` `.env`
| Variable | Purpose |
|---|---|
| `OPENAI_API_KEY` | LLM provider API key |
| `CHAT_MODEL` | Model name (e.g. `sarvam-30b`, `gpt-4o`, `gemini-1.5-flash`) |
| `CHAT_MODEL_BASEURL` | LLM routing endpoint |
| `GOOGLE_API_KEY` | Direct Gemini access |
| `SARVAM_API_KEY` | Sarvam STT/TTS API |
| `GROQ_API_KEY` | Groq Whisper STT |
| `TWILIO_ACCOUNT_SID` | For fetching IVR recordings |
| `TWILIO_AUTH_TOKEN` | Twilio auth |
| `MOSPI_MCP_URI` | MoSPI Model Context Protocol server URL |
| `MONGODB_URI` | MongoDB connection string |
| `REDIS_URL` | Redis connection string |
| `PORT` | Server port (default 3000) |

### `backend/main2` `.env`
| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `DB_NAME` | Database name (must match `ai` service) |
| `PORT` | Server port |
| `CORS_ORIGIN` | Frontend origin (e.g. `http://localhost:5173`) |
| `JWT_SECRET` | Access token signing secret |
| `JWT_REFRESH_SECRET` | Refresh token signing secret |
| `ADMIN_INITIAL_PASSWORD` | Seed script only — change immediately after first run |

### `backend/exotel` `.env`
| Variable | Purpose |
|---|---|
| `TWILIO_ACCOUNT_SID` | Twilio SID |
| `TWILIO_AUTH_TOKEN` | Twilio auth |
| `TWILIO_PHONE_NUMBER` | Caller ID for outbound calls/SMS |
| `EXOTEL_SID` / `EXOTEL_API_KEY` / `EXOTEL_API_TOKEN` / `EXOTEL_CALLER_ID` | Exotel credentials (backup) |
| `NGROK_URL` | Webhook tunnel for local dev |

| `MAIN2_API_URL` | Base URL of main2 service |
| `PORT` | Server port (default 3000) |

### `backend/delivery_bot` `.env`
| Variable | Purpose |
|---|---|
| `BOT_TOKEN` | Telegram bot token |

| `MAIN2_API_URL` | Base URL of main2 service |

---

## 13. Repository Structure

```
Statathon-Narad/
├── context.md                  ← YOU ARE HERE (master context)
├── backend/
│   ├── nginx.conf              ← Reverse proxy for all backend services
│   ├── ai/                     ← SDRD: AI generation engine
│   │   ├── app.js
│   │   ├── index.js
│   │   └── src/
│   │       ├── constants.js
│   │       ├── models/
│   │       │   ├── agents.js   ← All 5 LangChain agents
│   │       │   └── llms.js     ← LLM + Groq + Sarvam client config
│   │       ├── mongodb/
│   │       │   ├── connect.js
│   │       │   ├── surveyPlan.js   ← AI reasoning cache schema
│   │       │   └── surveySchema.js ← Canonical survey schema
│   │       ├── prompts/question_generation/index.js  ← All 5 system prompts
│   │       ├── router/
│   │       │   ├── question_generation_route.js
│   │       │   └── speech_conversion.js
│   │       ├── schema/questionSchema.js  ← JSON Schema for LLM output validation
│   │       ├── tools/
│   │       │   ├── multi_mcp_client.js   ← MoSPI MCP adapter
│   │       │   └── searchtool.js         ← Tavily fallback search
│   │       └── utils/
│   │           ├── generate_questions.js ← Background survey generation worker
│   │           ├── improve_section.js
│   │           ├── translate_survey.js
│   │           ├── stt.js
│   │           └── tts.js
│   ├── main2/                  ← DPD: Core REST API
│   │   ├── Readme.md           ← API documentation
│   │   └── src/
│   │       ├── controllers/    ← Survey + Response controllers
│   │       ├── models/
│   │       │   ├── surveySchema.js     ← Canonical survey schema (mirror of ai)
│   │       │   └── responsesSchema.js  ← Structured response schema with LGD/NSS metadata
│   │       ├── routes/
│   │       │   ├── surveyRoute.js
│   │       │   └── responseRoute.js
│   │       ├── utils/          ← ApiResponse, ApiError helpers
│   │       └── db/             ← MongoDB connection
│   ├── delivery_bot/           ← FOD: Telegram bot
│   │   ├── index.js            ← All bot logic (Telegraf)
│   │   ├── db.js
│   │   └── models/
│   │       ├── Survey.js           ← Loose survey schema (flat questions)
│   │       └── SurveyResponse.js   ← Response with telegramChatId
│   └── exotel/                 ← FOD: IVR delivery
│       └── src/
│           ├── index.js        ← Express app
│           ├── controllers/
│           │   ├── authController.js   ← OTP request + verify
│           │   └── callController.js   ← IVR call initiate + webhooks
│           ├── services/
│           │   ├── exotelService.js    ← Exotel API client
│           │   └── twilioService.js    ← Twilio Voice + SMS client
│           ├── routes/
│           │   ├── surveyRoutes.js
│           │   └── authRoutes.js
│           └── public/audio/   ← Static MP3 files served to IVR
└── frontend/                   ← ⚠️ IGNORE — being fully rebuilt
```

---

## 14. Database Configuration (Current State)

### Current Setup: **Local MongoDB + Local Redis**

Both the `ai` and `main2` services currently connect to a locally-running MongoDB instance:

```
MONGODB_URI="mongodb://localhost:27017"
REDIS_URL="redis://localhost:6379"
```

> ⚠️ **This is a local development setup.** There is no remote/cloud database configured yet.

### Database Names
- `ai` service: database name defined in `src/constants.js` (check file for exact name)
- `main2` service: `DB_NAME` env var (currently blank in `.env.sample` — must be set before running)

### Shared Collections
The `Survey` collection is accessed by **both** `ai` and `main2` services. Both must point to the **same** `MONGODB_URI` and use the **same** database name, otherwise they will operate on different copies of the data.

### Production Target (from Deployment Diagram)
```
Private Subnet:
  - Services (containers)
  - Workers
  - Redis
  - Databases (MongoDB)

Public Subnet:
  - Edge LB (Load Balancer)
  - API Gateway
```
The production target is a cloud-hosted private subnet with MongoDB and Redis running inside a security boundary, not exposed to the public internet.

---

## 15. Deployment Architecture

### Local / Dev
```
Nginx (port 8080)
  ├── /backend  → main2:3000
  ├── /delivery → exotel:4000
  └── /bot      → delivery_bot:5000
```
All services run as Docker containers locally, reverse-proxied via `backend/nginx.conf`.

### Production System Architecture (from Deployment Diagram)
```
                    ┌─────────────────────────────────────────┐
                    │           PUBLIC SUBNET                  │
  Citizens/Admins   │  Edge Load Balancer → API Gateway       │
  ─────────────────►│                                          │
                    └──────────────┬──────────────────────────┘
                                   │
                    ┌──────────────▼──────────────────────────┐
                    │           PRIVATE SUBNET                 │
                    │  Reverse Proxy / API Gateway             │
                    │    ├── Nginx (Alpha/Alpha/Alpha)         │
                    │    │                                     │
                    │    ├── Main (main2) ←──────── MoSPI DB  │
                    │    │      └── Survey DB                  │
                    │    │                                     │
                    │    ├── Delivery_Web  ─►┐                │
                    │    ├── Delivery_Chat ─►│ Media Cluster  │
                    │    └── Delivery_Call ─►┘ (audio files)  │
                    │                                          │
                    │  AI (LLM) ◄────────── MoSPI DB          │
                    │  Media Server ─────── ○○○○○             │
                    └─────────────────────────────────────────┘
```

Orchestrator-based load balancing — **scale horizontally**.

### LLM Infrastructure Strategy

Three modes based on load:

| Mode | Mechanism | Use Case |
|---|---|---|
| **Manual Module** | Manually start/stop instances; Ollama or vLLM | Always-on: `spot_instances (A100-80gb)` |
| **Semi-Auto Module** | Trigger-based scaling; Kubernetes cluster | On-demand increase: scale to A100-80gb machines |
| **Fully Auto Module** | Kubernetes with auto-scaling | Full production, high-traffic |

- **General inference**: Ollama (simple, lightweight)
- **Efficient inference**: vLLM (high-throughput, batched)
- **GPU Target**: A100-80GB spot instances for cost efficiency; scale to on-demand on load increase
- **Tracing**: LangSmith (`LANGSMITH_PROJECT="narad"`) is active for all agent runs

---

## 16. Authentication & RBAC System

### Role Hierarchy
```
admin@mospi.gov  (root — can access every division's views)
  ├── SDRD  (sdrd.{name}@mospi.gov)
  ├── FOD   (fod.{name}@mospi.gov)  ← manages online multichannel delivery
  │     └── Field Manager  (fm.{name}@mospi.gov)  ← supervises on-ground agents
  │           └── Field Agent  (fa.{name}@mospi.gov)  ← door-to-door CAPI
  ├── DPD   (dpd.{name}@mospi.gov)
  └── CQCD  (cqcd.{name}@mospi.gov)
```

### User Registration Flow (Prototype — No SMTP)
1. Admin / FOD / Field Manager adds user via "Invite User" form in Admin Panel (name + role)
2. System auto-generates `@mospi.gov` email from role prefix + name slug
3. User record stored with `status: "pending_setup"`, no password
4. Admin communicates the generated email to the user out-of-band
5. User visits `/login`, enters email → system detects `pending_setup` → prompts password creation
6. After setup: `status: "active"`, JWT issued, redirected to role dashboard

### Token Strategy
- **Access token**: JWT, 1h expiry, stored in `httpOnly` cookie
- **Refresh token**: JWT, 7d expiry, stored in `httpOnly` cookie


### Password Security
- `bcryptjs` with salt rounds = 12
- Passwords never stored in plaintext; only bcrypt hash in DB

### Design Reference
The Admin Panel frontend follows the **Vercel Geist dark design system** documented in `frontend/design.md`:
- Dark theme: `#000000` background, `#0A0A0A` surface
- Font: Geist Sans (Inter fallback)
- Monochromatic palette; accent colour used only for role badges and functional states
- Data-dense, high-scanning-speed layout

---

## 13. Recent Architectural Updates (June 2026)

### Database Synchronization
The `backend/ai` and `backend/main2` microservices have been fully synchronized to share the `statathon` MongoDB database. Previously, the AI generation engine was siloing data into `narad_ai`, which resulted in cross-service 404 errors when the main API attempted to fetch newly generated surveys.

### Port Allocation & Vite Proxy
To support local monolithic development without Docker, backend ports have been strictly re-assigned:
- `backend/main2` → **Port 3000** (Core API/CRUD)
- `backend/ai` → **Port 3001** (AI Generation/Translation)
The frontend `admin` uses Vite's built-in proxy to dynamically route `/api` traffic to 3000 and `/question-generation` traffic to 3001. This completely abstracts port management from the client-side code, eliminating the need for a local `.env` on the frontend.

### Frontend API Unpacking
The `SurveyEditor` and `ManualBuilder` now properly unwrap `backend/main2`'s standardized `ApiResponse` objects (accessing `res.data.data` instead of just `res.data`), restoring UI functionality.

### UI & UX Fixes
- **Layout:** The Admin panel's scrolling mechanics were repaired by wrapping content within `.main-content` and `.page-body` layout tags, overriding the global `overflow: hidden` shell constraint. Furthermore, the `24px` global padding was removed from the top of the body container to fix a visual bug where content slid underneath the sticky header.
- **Section Editing:** Implemented a secure, granular section editing flow. Instead of the entire page switching to open input fields, users can now toggle a specific section into edit mode, edit English translations, and lock it back via a "Save" button to prevent accidental data corruption.
- **Multilingual Support & UI Safety:** Added a dynamic `viewLang` selector allowing SDRD users to view translations in real-time. Added strict UI locks: the "AI Improve" and "Edit" buttons are now permanently disabled if a survey is actively translating or already has regional translations, preventing desynchronization.

### Translation & Schema Stabilization
The `audio` fields inside both `backend/ai` and `backend/main2` schemas were unified and stripped of strict `minlength: 1` and `required: true` properties. This prevented a critical bug where the AI backend crashed during translation completion and left surveys permanently stuck in a `"translating"` state.
- **Multilingual Support:** The SDRD Admin Panel now fully supports manual initiation and background polling of the multilingual translation pipeline using modern UI pill buttons (adhering strictly to `index.css` Geist design principles).

### AI Prompt Validation (Langchain)
The AI backend was updated to correctly invoke the `prompt_validation_agent`. It now accurately intercepts vague survey prompts (e.g. "Generate a survey on consumption") and blocks generation, instead returning specific clarifying questions to the frontend. Natural language responses to these questions are intelligently appended to the context window and parsed by the Langchain agents.

### AI Pipeline & UI Synchronization Stabilization
- **Backend Stability:** Removed `--watch` flags from both `main2` and `ai` dev scripts to prevent server crashes (`ECONNRESET`) during background agent file writes.
- **Strict Architectural Prompts:** Overhauled the `section_planner_system_prompt` and `question_generator_system_prompt` with aggressive system-level constraints to permanently eliminate duplicate AI-generated "Demographics" sections.
- **Agent Reliability:** Refactored `prompt_validation_agent` to use direct LLM invocation (`llm_chat.invoke`), fixing random `JSON.parse` crashes when Langchain tools were omitted.
- **Frontend Synchronization & UX:** Fixed an invalid toast method bug (`toast.addToast`) that crashed the dashboard polling loop. Replaced the spinning globe with an animated `AudioLines` (sound wave) icon during audio generation. Ensured the "Generate Audio" button remains accessible even for single-language surveys. Polished the `AIPromptBuilder` text area to auto-resize after submission and auto-focus when the AI asks clarifying questions.

### Main Branch Integration (PR #65)
- **Campaign Targeting & Demographics Expansion:** Merged massive new campaign features including `campaignController.js`, `campaignRoute.js`, and `campaignTarget.js` to support targeted outreach. Expanded `demographics.js` model and controllers.
- **Firebase & Citizen Authentication:** Integrated Firebase config and implemented a robust `AuthModal.jsx` within the `citizen` frontend, backed by new `authController.js` and `authRoute.js` logic in the `main2` backend.

### Survey Schema Updates (Local Changes)
- **Channels & Access Types:** The `surveySchema.js` was expanded to include a strict `CHANNELS` enum (`"web"`, `"ivr"`, `"whatsapp"`) and an `accessType` field (`"general"`, `"targeted"`). Added `allowedChannels` validation to restrict survey distribution channels dynamically.

---

*Last updated: 2026-06-03 | Maintained by the NARAD development team*
