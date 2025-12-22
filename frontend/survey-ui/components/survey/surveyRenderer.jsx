"use client";

import { useState } from "react";
import DynamicField from "@/components/survey/DynamicField";
import { shouldShowField } from "@/components/survey/ConditionEvaluator";

export default function SurveyRenderer({ schema, surveyId }) {
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);

  const [userInfo, setUserInfo] = useState({
    fullname: "",
    phone_no: "",
  });

  const handleChange = (qid, value) => {
    setAnswers((prev) => ({ ...prev, [qid]: value }));
  };

  const handleUserChange = (field, value) => {
    setUserInfo((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!userInfo.fullname || !userInfo.phone_no) {
      alert("Please enter your name and phone number");
      return;
    }

    setLoading(true);

    const response = schema
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

    try {
      const res = await fetch(
        `http://localhost:3000/api/response/${surveyId}`,
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

      {/* Survey Questions */}
      <section className="space-y-6">
        {schema.map((field) =>
          shouldShowField(field, answers) ? (
            <div
              key={field.qid}
              className="bg-white rounded-xl shadow p-6"
            >
              <DynamicField
                field={field}
                value={answers[field.qid]}
                onChange={handleChange}
              />
            </div>
          ) : null
        )}
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
