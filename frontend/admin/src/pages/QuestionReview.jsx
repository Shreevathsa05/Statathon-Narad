import { useLocation, useNavigate } from "react-router";
import { useState } from "react";

export default function QuestionReview() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const questions = state.result.questions;
  const [selected, setSelected] = useState([]);

  const toggle = (qid) => {
    setSelected(
      selected.includes(qid)
        ? selected.filter((q) => q !== qid)
        : [...selected, qid]
    );
  };

  function approve() {
    const approved = questions.filter((q) =>
      selected.includes(q.qid)
    );

    navigate("/final-survey", {
      state: {
        surveyId: state.surveyId,
        questions: approved,
      },
    });
  }

  return (
    <div>
      <h2>Review Generated Questions</h2>

      {questions.map((q) => (
        <div key={q.qid}>
          <input
            type="checkbox"
            onChange={() => toggle(q.qid)}
          />
          <pre>{JSON.stringify(q.text, null, 2)}</pre>
        </div>
      ))}

      <button onClick={approve}>Approve Selected</button>
    </div>
  );
}
