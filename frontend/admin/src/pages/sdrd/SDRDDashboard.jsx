import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { surveyClient } from '../../api/survey';
import { Plus, Sparkles, Clock, Globe } from 'lucide-react';

function SurveyCard({ survey, onClick }) {
  const questionCount = survey.questionSections?.reduce((acc, section) => acc + (section.questions?.length || 0), 0) || 0;
  const sectionCount = survey.questionSections?.length || 0;
  const languages = survey.supportedLanguages?.join(', ') || 'English';
  
  // Clean up repetitive titles from AI generation
  let displayName = survey.name || 'Untitled Survey';
  if (displayName.startsWith("Survey on Survey on")) {
      displayName = displayName.replace("Survey on Survey on", "Survey on");
  }

  return (
    <div className="bg-bg border border-border rounded-md shadow-sm p-4 flex flex-col gap-4 cursor-pointer hover:border-black hover:shadow-md transition-all h-full" onClick={onClick}>
      <div className="flex justify-between items-start gap-3">
        <h3 className="text-base font-medium text-text-primary m-0 leading-tight line-clamp-2 overflow-hidden">
          {displayName}
        </h3>
        <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full border uppercase tracking-wider shrink-0 ${
              survey.status === 'active' ? 'bg-geist-blue/10 text-geist-blue border-geist-blue/20' : 
              survey.status === 'pending' ? 'bg-amber-500/10 text-amber-700 border-amber-500/20' : 
              'bg-geist-error/10 text-geist-error border-geist-error/20'
            }`}>
          {survey.status}
        </span>
      </div>

      <div className="mt-auto pt-4 flex flex-col gap-2">
        <div className="flex items-center justify-between text-[13px] text-text-muted">
          <span>{sectionCount} Sections • {questionCount} Questions</span>
          <span className="font-mono text-[12px]">
            #{survey.surveyId?.substring(0, 8)}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <Globe size={12} />
          <span className="capitalize whitespace-nowrap overflow-hidden text-ellipsis">
            {languages}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function SDRDDashboard() {
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
      const res = await surveyClient.getSurveys();
      const surveyList = Array.isArray(res.data.data) ? res.data.data : [];
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
      <div className="flex flex-col p-6 w-full max-w-[1200px] mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary mb-1">Survey Design (SDRD)</h1>
          <p className="text-sm text-text-muted">Build, edit, and approve National Statistical Surveys before active fielding.</p>
        </div>

        <div className="flex items-center gap-3">
          <button className="inline-flex items-center justify-center gap-2 px-4 h-9 text-sm font-medium rounded-md bg-white border border-border text-text-primary hover:bg-surface-alt transition-colors" onClick={() => navigate('/sdrd/manual-builder')}>
            <Plus size={16} /> Manual Builder
          </button>
          <button className="inline-flex items-center justify-center gap-2 px-4 h-9 text-sm font-medium rounded-md bg-black text-white hover:bg-neutral-800 transition-colors" onClick={() => navigate('/sdrd/ai-builder')}>
            <Sparkles size={16} /> AI Builder
          </button>
        </div>
      </div>

      {/* Content */}
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
          {Array.from({ length: surveys.length > 0 ? surveys.length : 4 }).map((_, i) => (
            <div key={i} className="bg-bg border border-border rounded-md shadow-sm p-4 flex flex-col gap-4 h-[120px] animate-pulse">
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
        <div className="flex flex-col items-center justify-center p-12 text-center bg-surface border border-dashed border-border rounded-md text-text-muted">
          <h3 className="text-base font-medium text-text-primary mb-1">No surveys found</h3>
          <p className="text-sm">Get started by creating a new survey either manually or with AI generation.</p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
          {surveys.map(survey => (
            <SurveyCard key={survey.surveyId} survey={survey} onClick={() => navigate(`/sdrd/editor/${survey.surveyId}`)} />
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
