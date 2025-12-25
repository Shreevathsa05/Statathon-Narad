import React, { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import LoadingBar from "../components/layout/LoadingBar";

import Page from "../components/layout/Page";
import SurveyTypeSelector from "../components/survey/SurveyTypeSelector";
import LanguageSelector from "../components/survey/LanguageSelector";
import Type1Form from "../components/survey/Type1Form";
import Type2Form from "../components/survey/Type2Form";
import Type3Form from "../components/survey/Type3Form";
import Type4Form from "../components/survey/Type4Form";

import {
  getSupportedLanguages,
  generateSurveyQuestions,
  createSurvey,
} from "../services/questionApi";

export default function GeneratorValidator() {
  /* ---------------- CONFIG ---------------- */
  const [surveyType, setSurveyType] = useState("");
  const [formData, setFormData] = useState({});
  const [languages, setLanguages] = useState([]);
  const [supportedLanguages, setSupportedLanguages] = useState([]);

  /* ---------------- GENERATED ---------------- */
  const [generatedSurvey, setGeneratedSurvey] = useState(null);
  const [selectedQids, setSelectedQids] = useState(new Set());
  const [previewLanguage, setPreviewLanguage] = useState("");

  /* ---------------- UI ---------------- */
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* -------- Load supported languages -------- */
  useEffect(() => {
    getSupportedLanguages()
      .then(setSupportedLanguages)
      .catch(() => setError("Failed to load languages"));
  }, []);

  /* -------- Generate questions -------- */
  async function handleGenerate() {
    setError("");

    if (!surveyType) {
      setError("Survey type is required");
      return;
    }

    if (languages.length === 0) {
      setError("Select at least one language");
      return;
    }

    setLoading(true);
    try {
      const raw = await generateSurveyQuestions(surveyType, {
        ...formData,
        languages,
      });

      const parsed = raw;

      setGeneratedSurvey(parsed);
      setPreviewLanguage(parsed.supportedLanguages[0]);
      setSelectedQids(new Set(parsed.questions.map((q) => q.qid)));
    } catch (err) {
      setError("Question generation failed");
    } finally {
      setLoading(false);
    }
  }

  /* -------- Toggle question selection -------- */
  function toggleQuestion(qid) {
    setSelectedQids((prev) => {
      const next = new Set(prev);
      next.has(qid) ? next.delete(qid) : next.add(qid);
      return next;
    });
  }

  /* -------- Approve survey -------- */
  async function handleApprove() {
    if (selectedQids.size < 1) {
      alert("At least one question must be selected");
      return;
    }

    const payload = {
      surveyId: uuidv4(),
      name: `Survey - ${surveyType}`,
      status: "approved",
      supportedLanguages: generatedSurvey.supportedLanguages,
      questions: generatedSurvey.questions.filter((q) =>
        selectedQids.has(q.qid)
      ),
      categories: [surveyType],
      createdBy: "admin",
    };

    try {
      await createSurvey(payload);
      alert("Survey created successfully");
      resetAll();
    } catch {
      setError("Failed to create survey");
    }
  }

  /* -------- Reset everything -------- */
  function resetAll() {
    setSurveyType("");
    setFormData({});
    setLanguages([]);
    setGeneratedSurvey(null);
    setSelectedQids(new Set());
    setPreviewLanguage("");
    setError("");
  }

  return (
    <Page title="Survey Generator & Validator">
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {loading && (
        <div className="mb-4">
          <LoadingBar />
          <p className="text-sm text-gray-500 mt-2">
            Generating survey questions. This may take a few seconds…
          </p>
        </div>
      )}

      {/* ================= CONFIGURATION ================= */}
      <div className={loading ? "opacity-60 pointer-events-none" : ""}>
        {!generatedSurvey && (
        <>
          <SurveyTypeSelector value={surveyType} onChange={setSurveyType} />

          {surveyType === "type1" && (
            <Type1Form data={formData} setData={setFormData} />
          )}
          {surveyType === "type2" && (
            <Type2Form data={formData} setData={setFormData} />
          )}
          {surveyType === "type3" && (
            <Type3Form data={formData} setData={setFormData} />
          )}
          {surveyType === "type4" && (
            <Type4Form data={formData} setData={setFormData} />
          )}

          <LanguageSelector
            languages={supportedLanguages}
            selected={languages}
            onChange={setLanguages}
          />

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="mt-4 px-4 py-2 bg-black text-white rounded"
          >
            {loading ? "Generating..." : "Generate Questions"}
          </button>
        </>
        )}
      </div>
      {/* ================= REVIEW ================= */}
      {generatedSurvey && (
        <>
          <div className="flex justify-between items-center mt-6">
            <h3 className="font-semibold">
              Questions Selected ({selectedQids.size}/
              {generatedSurvey.questions.length})
            </h3>

            <select
              className="border px-2 py-1"
              value={previewLanguage}
              onChange={(e) => setPreviewLanguage(e.target.value)}
            >
              {generatedSurvey.supportedLanguages.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 space-y-3">
            {generatedSurvey.questions.map((q) => (
              <div
                key={q.qid}
                className={`border rounded p-3 ${
                  selectedQids.has(q.qid)
                    ? "bg-green-50 border-green-400"
                    : "opacity-60"
                }`}
              >
                <label className="font-medium">
                  <input
                    type="checkbox"
                    checked={selectedQids.has(q.qid)}
                    onChange={() => toggleQuestion(q.qid)}
                    className="mr-2"
                  />
                  {q.text[previewLanguage]}
                </label>

                <ul className="ml-6 list-disc">
                  {q.options.map((o) => (
                    <li key={o.id}>{o.label[previewLanguage]}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleApprove}
              className="px-4 py-2 bg-green-600 text-white rounded"
            >
              Approve & Create Survey
            </button>

            <button
              onClick={resetAll}
              className="px-4 py-2 border rounded"
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </Page>
  );
}
