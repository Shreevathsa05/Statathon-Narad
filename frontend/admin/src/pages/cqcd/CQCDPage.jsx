import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../../components/TopBar.jsx';
import { surveyClient } from '../../api/survey.js';
import SurveyCard from '../../components/fod/SurveyCard.jsx';
import { Megaphone, AlertCircle } from 'lucide-react';

export default function CQCDPage() {
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSurveys();
  }, []);

  const fetchSurveys = async () => {
    try {
      setLoading(true);
      const res = await surveyClient.getSurveys({ status: ['active', 'complete'] });
      const surveyList = Array.isArray(res.data?.data) ? res.data.data : [];
      const sorted = surveyList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setSurveys(sorted);
    } catch (err) {
      console.error(err);
      setError('Failed to load surveys.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 min-w-0 bg-bg">
      <TopBar title="CQCD Dashboard" />
      <div className="flex flex-col p-6 w-full max-w-[1200px] mx-auto">
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-border">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text-primary mb-1">Quality Control & Analytics</h1>
            <p className="text-sm text-text-muted">Coordination, Quality Control & Data Division</p>
          </div>
        </div>
        
        {error && (
          <div className="flex items-start px-4 py-3 rounded-md text-sm border border-geist-error/20 bg-geist-error/10 text-geist-error mb-4">
            <AlertCircle size={16} className="mt-0.5 mr-2 shrink-0" />
            <div className="flex flex-col">
              <span className="font-semibold">Error</span>
              {error}
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-bg border border-border rounded-md shadow-sm p-4 flex flex-col gap-4 h-[120px] animate-pulse">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex flex-col gap-2 w-full">
                    <div className="h-4 bg-border/40 rounded w-3/4"></div>
                    <div className="h-4 bg-border/40 rounded w-1/2"></div>
                  </div>
                  <div className="h-5 w-16 bg-border/20 rounded-full shrink-0"></div>
                </div>
              </div>
            ))}
          </div>
        ) : surveys.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-surface border border-dashed border-border rounded-md text-text-muted opacity-0 animate-fade-in-card">
            <Megaphone size={48} className="opacity-20 mb-4" />
            <h3 className="font-semibold text-lg text-text-primary">No Active Surveys</h3>
            <p className="text-sm max-w-md">There are currently no active or completed surveys available for quality control analytics.</p>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
            {surveys.map((survey, index) => (
              <SurveyCard 
                key={survey.surveyId} 
                survey={survey} 
                onClick={() => navigate(`/analytics/${survey.surveyId}`)} 
                index={index} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
