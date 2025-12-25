import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const API_BASE = "https://narad-main.onrender.com";

export default function SurveyViewer() {
  const { surveyId } = useParams();
  const [survey, setSurvey] = useState(null);
  const [lang, setLang] = useState("");

  useEffect(() => {
    axios
      .get(`${API_BASE}/api/survey/${surveyId}`)
      .then((res) => {
        setSurvey(res.data.data);
        setLang(res.data.data.supportedLanguages[0]);
      });
  }, [surveyId]);

  if (!survey) return <p>Loading survey...</p>;

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold">{survey.name}</h1>

        <select
          className="border px-2 py-1"
          value={lang}
          onChange={(e) => setLang(e.target.value)}
        >
          {survey.supportedLanguages.map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>
      </div>

      <div className="space-y-4">
        {survey.questions.map((q) => (
          <div key={q.qid} className="border rounded p-4">
            <p className="font-medium mb-2">
              {q.text.get ? q.text.get(lang) : q.text[lang]}
            </p>

            <ul className="list-disc ml-5 text-sm">
              {q.options.map((o) => (
                <li key={o.id}>
                  {o.label.get ? o.label.get(lang) : o.label[lang]}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </>
  );
}
