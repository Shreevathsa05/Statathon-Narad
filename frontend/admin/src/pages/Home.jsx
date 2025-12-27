import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const statusStyles = {
  active: "bg-green-100 text-green-700",
  approved: "bg-blue-100 text-blue-700",
  complete: "bg-gray-200 text-gray-700",
};

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

  if (loading) {
    return (
      <p className="text-center text-gray-500 mt-10">
        Loading surveys...
      </p>
    );
  }

  return (
    <>
      <h1 className="text-3xl font-bold mb-8 text-center">
        Available Surveys
      </h1>

      {surveys.length === 0 && (
        <p className="text-gray-500 text-center">
          No surveys created yet.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {surveys.map((s) => (
          <div
            key={s.surveyId}
            onClick={() => navigate(`/survey/${s.surveyId}`)}
            className="border rounded-xl p-5 bg-white hover:shadow-md transition cursor-pointer"
          >
            {/* Survey Name */}
            <h3 className="text-lg font-semibold mb-2">
              {s.name}
            </h3>

            {/* Survey ID */}
            <p className="text-sm text-gray-500 mb-4 break-all">
              Survey ID: {s.surveyId}
            </p>

            {/* Status */}
            <span
              className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
                statusStyles[s.status] || "bg-gray-100 text-gray-600"
              }`}
            >
              {s.status}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
