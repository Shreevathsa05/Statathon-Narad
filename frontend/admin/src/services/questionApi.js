import axios from "axios";

const API_BASE = "http://localhost:3000/questions";

export async function getSupportedLanguages() {
  const res = await axios.get(`${API_BASE}/languages_supported`);
  return res.data;
}

export async function generateSurvey(type, payload) {
  const res = await axios.post(`${API_BASE}/${type}`, payload);
  return res.data;
}
