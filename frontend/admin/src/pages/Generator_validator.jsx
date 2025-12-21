import React, { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useNavigate } from "react-router";

import Page from "../components/layout/Page";
import SurveyTypeSelector from "../components/survey/SurveyTypeSelector";
import LanguageSelector from "../components/survey/LanguageSelector";

import Type1Form from "../components/survey/Type1Form";
import Type2Form from "../components/survey/Type2Form";
import Type3Form from "../components/survey/Type3Form";
import Type4Form from "../components/survey/Type4Form";

import {
  generateSurvey,
  getSupportedLanguages,
} from "../services/questionApi";

export default function GeneratorValidator() {
  const navigate = useNavigate();

  const [surveyType, setSurveyType] = useState("");
  const [formData, setFormData] = useState({});
  const [languages, setLanguages] = useState([]);
  const [supportedLanguages, setSupportedLanguages] = useState([]);
  const [prompt, setPrompt] = useState("");

  useEffect(() => {
    getSupportedLanguages().then(setSupportedLanguages);
  }, []);

  useEffect(() => {
    setFormData({});
  }, [surveyType]);

  async function handleSubmit() {
    const result = await generateSurvey(surveyType, {
      ...formData,
      languages,
      prompt,
      surveyId: uuidv4(),
    });

    navigate("/question-review", { state: result });
  }

  return (
    <Page title="Survey Generator & Validator">
      <div className="grid gap-6">

        <SurveyTypeSelector
          value={surveyType}
          onChange={setSurveyType}
        />

        {surveyType === "type1" && <Type1Form data={formData} setData={setFormData} />}
        {surveyType === "type2" && <Type2Form data={formData} setData={setFormData} />}
        {surveyType === "type3" && <Type3Form data={formData} setData={setFormData} />}
        {surveyType === "type4" && <Type4Form data={formData} setData={setFormData} />}

        <LanguageSelector
          languages={supportedLanguages}
          selected={languages}
          onChange={setLanguages}
        />

        <div>
          <label className="block text-sm font-medium mb-1">
            Expected Outcome / Additional Guidance
          </label>
          <textarea
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter expected outcome"
          />
        </div>

        <button
          onClick={handleSubmit}
          className="bg-black text-white px-6 py-2 rounded-md w-fit"
        >
          Generate Questions
        </button>
      </div>
    </Page>
  );
}
