"use client";

import { useState } from "react";
import DynamicField from "@/components/survey/DynamicField";
import { shouldShowField } from "@/components/survey/ConditionEvaluator";
import { BASE_URL } from "@/constants";
import { useRouter } from "next/navigation";
import { speak } from "@/lib/textToSpeech";

export default function SurveyRenderer({ questions, supportedLanguages, surveyId }) {
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);

  const [userInfo, setUserInfo] = useState({
    fullname: "",
    phone_no: "",
  });
  const [language, setLanguage] = useState("english");
  const router = useRouter();
  const [currentSpeak, setCurrentSpeak] = useState(null);

  const handleChange = (qid, value) => {
    setAnswers((prev) => ({ ...prev, [qid]: value }));
  };

  const handleUserChange = (field, value) => {
    setUserInfo((prev) => ({ ...prev, [field]: value }));
  };

  const handleSpeakQuestion = async (field) => {
    if (!field.text?.[language]) return;
    setCurrentSpeak(field.qid);
    window.speechSynthesis.cancel();

    await speak(field.text[language], language);

    if (Array.isArray(field.options)) {
      for (const opt of field.options) {
        if (opt.label?.[language]) {
          await speak(opt.label[language], language);
        }
      }
    }
  };

  const handleSubmit = async () => {
    if (loading) return
    if (!userInfo.fullname || !userInfo.phone_no) {
      alert("Please enter your name and phone number");
      return;
    }

    const response = questions
      .filter((question) => shouldShowField(question, answers))
      .map((question) => {
        const answer = answers[question.qid];

        if (answer === undefined || answer === "") return null;

        if (question.type === "mcq") {
          return {
            qid: question.qid,
            optionId: answer,
          };
        }

        if (question.type === "text" || question.type === "number") {
          return {
            qid: question.qid,
            value: answer,
          };
        }

        return null;
      })
      .filter(Boolean);

    if (response.length === 0) {
      alert("No responses to submit");
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `${BASE_URL}/response/${surveyId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            response,
            user: userInfo,
          }),
        }
      );

      const json = await res.json();

      if (!res.ok) {
        alert(json.message || "Submission failed");
        return;
      }

      alert("Survey submitted successfully");
      router.push("/")
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      {/* User Info */}
      <section className="bg-white rounded-xl shadow p-6 space-y-4">
        <h2 className="text-xl font-semibold">Respondent Details</h2>

        <div className="space-y-3">
          <input
            type="text"
            placeholder="Full Name"
            className="w-full border rounded-md px-3 py-2"
            value={userInfo.fullname}
            onChange={(e) =>
              handleUserChange("fullname", e.target.value)
            }
          />

          <input
            type="tel"
            placeholder="Phone Number"
            className="w-full border rounded-md px-3 py-2"
            value={userInfo.phone_no}
            onChange={(e) =>
              handleUserChange("phone_no", e.target.value)
            }
          />
        </div>
      </section>

      {/* Language Selector */}
      {/* Top Bar */}
      <div className="sticky top-0 z-10 bg-white border-b">
        <div className="max-w-3xl mx-auto px-6 py-3 flex justify-between items-center">
          <h1 className="text-lg font-semibold text-gray-700">
            Survey Form
          </h1>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              Language:
            </span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {supportedLanguages.map((l) => (
                <option key={l} value={l}>
                  {l.charAt(0).toUpperCase() + l.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Survey Questions */}
      <section className="space-y-6">
        {questions.map((field) => {
          const visible = shouldShowField(field, answers);

          if (!visible) {
            return null;
          }
          
          return (
            <div
              key={field.qid}
              className={`
                  transition-all duration-300 ease-in-out overflow-hidden
                  ${visible ? "max-h-1/6 opacity-100 translate-y-0" : "max-h-0 opacity-0 -translate-y-2"}
                `}
            >
              <div className="bg-white rounded-xl shadow p-0">
                <DynamicField
                  field={field}
                  value={answers[field.qid]}
                  language={language}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => handleSpeakQuestion(field)}
                  className="p-2 rounded-full hover:bg-gray-100 transition"
                  title="Read question"
                >
                  🔊
                </button>
              </div>
            </div>
          );
        })}
      </section>

      {/* Submit */}
      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`px-6 py-3 rounded-lg font-medium text-white transition
            ${loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}
          `}
        >
          {loading ? "Submitting..." : "Submit Survey"}
        </button>
      </div>
    </div>
  );
}
