import axios from "axios";

/* ------------------------------------------------------------------ */
/* API BASE CONFIG                                                     */
/* ------------------------------------------------------------------ */

const API_BASE = import.meta.env.VITE_API_BASE_URL;

/* ------------------------------------------------------------------ */
/* SUPPORTED LANGUAGES                                                 */
/* GET /questions/languages_supported                                 */
/* ------------------------------------------------------------------ */

export async function getSupportedLanguages() {
  const res = await axios.get(
    `${API_BASE}/questions/languages_supported`
  );
  return res.data;
}

/* ------------------------------------------------------------------ */
/* GENERATE QUESTIONS (TYPE 1–4)                                       */
/* POST /questions/typeX                                               */
/* ------------------------------------------------------------------ */

export async function generateSurveyQuestions(type, payload) {
  let url = "";

  switch (type) {
    case "type1":
      url = "/questions/type1";
      break;
    case "type2":
      url = "/questions/type2";
      break;
    case "type3":
      url = "/questions/type3";
      break;
    case "type4":
      url = "/questions/type4";
      break;
    default:
      throw new Error("Invalid survey type");
  }

  const res = await axios.post(`${API_BASE}${url}`, payload);

  /**
   * IMPORTANT:
   * Backend returns STRINGIFIED JSON
   * We return it as-is, parsing is done in the page
   */
  return res.data;
}

/* ------------------------------------------------------------------ */
/* CREATE SURVEY (AFTER APPROVAL)                                      */
/* POST /api/survey                                                    */
/* ------------------------------------------------------------------ */

export async function createSurvey(payload) {
  const res = await axios.post(
    `${API_BASE}/api/survey`,
    payload
  );
  return res.data;
}
