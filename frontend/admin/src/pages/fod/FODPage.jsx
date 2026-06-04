import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../../components/TopBar.jsx";
import { Globe, Users } from "lucide-react";
import { surveyClient } from "../../api/survey";
import SurveyCard from "../../components/fod/SurveyCard.jsx";

export default function FODPage() {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();

  const fetchSurveys = async () => {
    try {
      setLoading(true);
      const res = await surveyClient.getSurveys({ status: "active" });
      const surveyList = Array.isArray(res.data.data) ? res.data.data : [];
      // Show mostly active and approved surveys for FOD
      const fodSurveys = surveyList.filter((s) =>
        ["active", "approved", "complete"].includes(s.status),
      );
      const sorted = fodSurveys.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );
      setSurveys(sorted);
    } catch (err) {
      console.error(err);
      setError("Failed to load surveys.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSurveys();
  }, []);

  return (
    <div className="flex flex-col flex-1 min-w-0 bg-bg">
      <TopBar title="FOD Dashboard" />
      <div className="flex flex-col p-6 w-full max-w-[1200px] mx-auto">
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-border">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text-primary mb-1">
              Multichannel Delivery & Campaigns
            </h1>
            <p className="text-sm text-text-muted">
              Field Operations Division — Manage Delivery Channels and Targeted
              Audience
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-full bg-surface border border-border text-xs font-medium text-text-secondary flex items-center gap-2">
              <Users size={14} /> Total Surveys: {surveys.length}
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-start px-4 py-3 rounded-md text-sm border border-geist-error/20 bg-geist-error/10 text-geist-error mb-4">
            <div className="flex flex-col">
              <span className="font-semibold">Error</span>
              {error}
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-bg border border-border rounded-md shadow-sm p-4 flex flex-col gap-4 h-[120px] animate-pulse"
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex flex-col gap-2 w-full">
                    <div className="h-4 bg-border/40 rounded w-3/4"></div>
                    <div className="h-4 bg-border/40 rounded w-1/2"></div>
                  </div>
                  <div className="h-5 w-16 bg-border/20 rounded-full shrink-0"></div>
                </div>
                <div className="mt-auto flex justify-between items-center">
                  <div className="h-3 bg-border/20 rounded w-1/3"></div>
                  <div className="h-3 bg-border/20 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : surveys.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-surface border border-dashed border-border rounded-md text-text-muted opacity-0 animate-fade-in-card">
            <Globe size={48} className="opacity-20 mb-4" />
            <h3 className="text-base font-medium text-text-primary mb-1">
              No pending/active surveys found
            </h3>
            <p className="text-sm">
              Wait for SDRD to approve surveys before managing campaigns.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
            {surveys.map((survey, index) => (
              <SurveyCard
                key={survey.surveyId}
                survey={survey}
                onClick={() => navigate(`/fod/survey/${survey.surveyId}`)}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
