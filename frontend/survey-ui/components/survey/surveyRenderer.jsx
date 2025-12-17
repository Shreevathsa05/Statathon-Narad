"use client";

import { useState } from "react";
import DynamicField from "@/components/survey/DynamicField";
import { shouldShowField } from "@/components/survey/ConditionEvaluator";

export default function SurveyRenderer({ schema }) {
  const [answers, setAnswers] = useState({});

  const handleChange = (id, value) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  return (
    <div>
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

      <button onClick={() => console.log(answers)}>Submit</button>
    </div>
  );
}
