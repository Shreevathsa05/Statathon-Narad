"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BASE_URL } from "@/constants";

export default function Home() {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchSurveys() {
      try {
        const res = await fetch(`${BASE_URL}/survey`);
        const json = await res.json();
        setSurveys(json.data || []);
      } catch (error) {
        console.error("Failed to fetch surveys", error);
      } finally {
        setLoading(false);
      }
    }

    fetchSurveys();
  }, []);

  if (loading) {
    return (
      <div className="text-center text-xl mt-10">
        Loading surveys...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Ongoing Surveys
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {surveys.map((survey) => (
          <div
            key={survey._id}
            onClick={() => router.push(`/survey/${survey.surveyId}`)}
            className="cursor-pointer border rounded-xl p-5 shadow-sm hover:shadow-md transition"
          >
            <h2 className="text-xl font-semibold mb-2">
              {survey.name}
            </h2>

            <p className="text-sm text-gray-600 mb-3">
              Survey ID: {survey.surveyId}
            </p>

            <span
              className={`inline-block px-3 py-1 text-sm rounded-full ${
                survey.status === "active"
                  ? "bg-green-100 text-green-700"
                  : "bg-blue-100 text-blue-700"
              }`}
            >
              {survey.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
