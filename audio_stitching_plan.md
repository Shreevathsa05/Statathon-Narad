# Dynamic Audio Stitching for Template Variables

## Goal
The recent introduction of template variables (`{{qid}}`) in the Survey Editor breaks the existing text-to-speech (TTS) pipeline, as the backend literally reads out the variable syntax (e.g., "curly brace q one curly brace"). To resolve this, we will refactor the audio generation pipeline and frontend playback engine to dynamically stitch audio chunks with referenced user answers in real-time.

## Critical Analysis & Refinements
Your clarification perfectly streamlines the architecture. By ignoring free-text variables for now and exclusively relying on pre-generated option audio, we ensure a 100% premium, seamless playback experience without the robotic sound or sync issues of browser TTS.

Furthermore, optimizing the pipeline to **only** generate option audio for questions that are explicitly referenced by other questions will save significant generation costs, storage, and processing time.

---

## User Review Required

> [!WARNING]
> **Schema Changes:** We need to modify the MongoDB schema (`surveySchema.js`) to support audio IDs per option, and arrays of audio IDs for split question texts. Existing surveys in the "generating_audio" or "published" state will not have these new fields. They will require regenerating their audio to utilize dynamic variables.

## Open Questions

> [!IMPORTANT]
> To properly stitch the question, we need a robust data structure. I propose setting `question.audioParts` to an array of objects like `[{ type: "audio", id: "chunk1_id" }, { type: "var", qid: "q1" }, { type: "audio", id: "chunk2_id" }]`. Do you approve this schema structure for storing the split audio?

---

## Proposed Changes

### Database Schema Layer
#### [MODIFY] `backend/main2/src/models/surveySchema.js`
- **OptionSchema:** Add `audio: { type: Map, of: String }` to store TTS file IDs for individual options.
- **QuestionSchema:** Add `audioParts: { type: Map, of: [String] }` to store an ordered array of audio IDs for text split by variables (e.g., `["audioId_part1", "audioId_part2"]`).

---

### Backend Logic Layer
#### [MODIFY] `backend/ai/src/utils/audio_generation.js`
- **Pre-scan:** Before the generation loop, scan all `question.text` fields across the survey with regex `{{(.*?)}}` to build a `Set` of all referenced `qid`s.
- **Questions with variables:** Split the text around the `{{}}` tags. Generate separate audio files for each static chunk. Save the sequence as an array of objects (audio IDs and variable references) in `question.audioParts`.
- **Options Processing:** For questions whose `qid` is in the referenced `Set`, iterate over `question.options` and generate independent audio files for each option's label. Save IDs to `option.audio`. For all other unreferenced questions, generate options alongside the main question audio as before.

#### [MODIFY] `backend/ai/src/router/speech_conversion.js`
- Update the `/avatar/script/:surveyId/:language` endpoint to include `audioParts` and `options` (with their audio IDs) in the returned JSON script, rather than just a single `audioId`.

---

### Frontend Playback Engine
#### [MODIFY] `frontend/citizen/src/components/avatar/AvatarSurveyMode.jsx`
- Refactor the `playAudio` sequence to support iterating over an array of `audioParts`.
- When evaluating a question node with variables:
  1. Play `audioParts[0]` (Static text before variable)
  2. Resolve `{{qid}}` from local `answers` state.
  3. Find the selected MCQ option's pre-generated `audioId` from the schema and play it.
  4. Play `audioParts[2]` (Static text after variable), etc.

## Verification Plan

### Automated/Manual Verification
1. Create a survey with Q1 (Text: Name), Q2 (MCQ: Favorite Fruit), and Q3 (Text: "Hello {{q1}}, why do you like {{q2}}?").
2. Run audio generation and inspect MongoDB to verify `audioParts` and `Option.audio` are populated correctly.
3. Complete the survey as a citizen. Verify the Read Aloud and Avatar modes successfully stitch the high-quality chunks with the dynamic answers.
