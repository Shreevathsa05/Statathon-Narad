"use client";

import DynamicField from "./DynamicField";
import { shouldShowField } from "./ConditionEvaluator";
import { useState } from "react";

export default function SurveyRenderer({ schema }) {
  const [answers, setAnswers] = useState({});

  const handleChange = (id, value) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  return (
    <>
      {schema.map((field) =>
        shouldShowField(field, answers) ? (
          <DynamicField
            key={field.id}
            field={field}
            value={answers[field.id]}
            onChange={handleChange}
          />
        ) : null
      )}
    </>
  );
}
