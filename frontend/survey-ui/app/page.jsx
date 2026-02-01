"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BASE_URL } from "@/constants";
import Image from "next/image";

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

  const getActiveSurveys = () => {
  return surveys.filter((survey) => survey.status === "active");
};


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="relative">
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
      <section className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div className="space-y-6 animate-fade-in-up">
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Empowering{" "}
              <span className="text-blue-600 inline-block hover:scale-105 transition-transform duration-300">
                Data-Driven
              </span>
              <br />
              Decisions
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed max-w-xl">
              Narad helps streamline socio-economic surveys by providing
              real-time visibility into survey status, approvals, and progress.
              Discover a comprehensive platform for managing and tracking
              surveys with ease.
            </p>
            <div className="flex flex-wrap gap-4 items-center pt-4">
              <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium flex items-center gap-2 hover:bg-blue-200 transition-colors duration-300">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Accurate
              </span>
              <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center gap-2 hover:bg-green-200 transition-colors duration-300">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Transparent
              </span>
              <span className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium flex items-center gap-2 hover:bg-purple-200 transition-colors duration-300">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Efficient
              </span>
            </div>
          </div>

          {/* Illustration */}
          <div className="relative w-full h-[400px] lg:h-[500px] animate-fade-in-right">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-200 via-blue-200 to-purple-200 rounded-full opacity-20 blur-3xl animate-pulse-slow"></div>
            <Image
              src="/Heroimg.svg"
              alt="Survey Management Illustration"
              fill
              className="object-contain relative z-10 hover:scale-105 transition-transform duration-500"
              priority
            />
          </div>
        </div>
      </section>

      {/* Surveys Section */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        {/* Section Header */}
        <div className="mb-12 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-4">
            <svg
              className="w-8 h-8 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
              New and Exciting
            </h2>
          </div>
          <p className="text-gray-600 text-lg">
            The latest events, big announcements, and high-priority surveys.
          </p>
        </div>

        {/* Survey Cards Grid */}
        {getActiveSurveys().length === 0 ? (

          <div className="text-center py-16">
            <div className="inline-block p-6 bg-gray-50 rounded-full mb-4">
              <svg
                className="w-16 h-16 text-gray-400"
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
            <p className="text-xl text-gray-600">No surveys available yet</p>
            <p className="text-gray-500 mt-2">Check back soon for updates!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {getActiveSurveys().map((survey, index) => (

              <div
                key={survey._id}
                onClick={() => router.push(`/survey/${survey.surveyId}`)}
                className="group cursor-pointer w-[25rem] bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-300 hover:-translate-y-1 animate-fade-in-up"
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                {/* Card Icon */}
                <div className="flex justify-center items-baseline gap-[5rem]">
                <div className="w-14 h-14  bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
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
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  Active Since: <span className="font-mono">{survey.createdAt?survey.createdAt:"time will be here"}</span>
                </p>
                </div>

                {/* Card Content */}
                <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-300 line-clamp-2">
                  {survey.name}
                </h3>

                {/* Survey Type Badge */}
                <div className="mb-3">
                  <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg">
                    Survey
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  Survey ID: <span className="font-mono">{survey.surveyId}</span>
                </p>

                {/* Status Badge */}
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-300 ${
                      survey.status === "active"
                        ? "bg-green-100 text-green-700 group-hover:bg-green-200"
                        : "bg-blue-100 text-blue-700 group-hover:bg-blue-200"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        survey.status === "active"
                          ? "bg-green-500 animate-pulse"
                          : "bg-blue-500"
                      }`}
                    ></span>
                    {survey.status}
                  </span>

                  {/* Arrow Icon */}
                  <svg
                    className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-300"
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

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in-right {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes pulse-slow {
          0%,
          100% {
            opacity: 0.2;
            transform: scale(1);
          }
          50% {
            opacity: 0.3;
            transform: scale(1.05);
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }

        .animate-fade-in-right {
          animation: fade-in-right 0.8s ease-out forwards;
        }

        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}