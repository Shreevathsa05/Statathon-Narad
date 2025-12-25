import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE = "https://narad-main.onrender.com";

export default function Home() {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get(`${API_BASE}/api/survey`)
      .then((res) => setSurveys(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading surveys...</p>;

  return (
    <>
      <h1 className="text-xl font-semibold mb-6">Available Surveys</h1>

      {surveys.length === 0 && (
        <p className="text-gray-500">No surveys created yet.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {surveys.map((s) => (
          <div
            key={s.surveyId}
            onClick={() => navigate(`/survey/${s.surveyId}`)}
            className="border rounded-lg p-4 hover:shadow cursor-pointer"
        >
            <h3 className="font-medium mb-1">{s.name}</h3>

            <p className="text-xs text-gray-500 mb-2">
                Status: {s.status}
            </p>

            {Array.isArray(s.supportedLanguages) && (
                <div className="flex flex-wrap gap-1">
                {s.supportedLanguages.map((l) => (
                    <span
                        key={l}
                        className="text-xs px-2 py-0.5 border rounded"
                    >
                        {l}
                    </span>
                ))}
                </div>
            )}
        </div>

        ))}
      </div>
    </>
  );
}
