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
      <div className="flex items-center justify-center min-h-screen">
        <div className="relative flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-gray-600 mt-4 text-center animate-pulse">
            Loading surveys...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-blue-50/30 to-white">
      {/* Hero Section */}
      

      {/* Surveys Section */}
      <section className="max-w-7xl mx-auto px-6 pt-[1rem]">
        <div className="mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            Surveys
          </h2>
          
        </div>

        {surveys.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl text-gray-600">No surveys available yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {surveys.map((s, index) => (
              <div
                key={s.surveyId}
                onClick={() => navigate(`/survey/${s.surveyId}`)}
                className="group cursor-pointer bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-300 hover:-translate-y-1"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Icon */}
                <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mb-4">
                  <svg
                    className="w-7 h-7 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition">
                  {s.name}
                </h3>

                <p className="text-sm text-gray-600 mb-4">
                  Survey ID: <span className="font-mono">{s.surveyId}</span>
                </p>

                <div className="flex items-center justify-between">
                  <span
                    className={`px-3 py-1.5 text-xs font-medium rounded-full ${
                      statusStyles[s.status] ||
                      "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {s.status}
                  </span>

                  <svg
                    className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}