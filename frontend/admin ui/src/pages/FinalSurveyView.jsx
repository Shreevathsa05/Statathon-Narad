import { useLocation } from "react-router-dom";

export default function FinalSurveyView() {
  const { state } = useLocation();

  return (
    <div>
      <h2>Final Survey (ID: {state.surveyId})</h2>

      {state.questions.map((q) => (
        <div key={q.qid}>
          <strong>{q.qid}</strong>
          <pre>{JSON.stringify(q, null, 2)}</pre>
        </div>
      ))}
    </div>
  );
}
