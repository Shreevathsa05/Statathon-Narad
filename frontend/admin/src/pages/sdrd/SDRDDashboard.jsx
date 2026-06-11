import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { surveyClient } from '../../api/survey';
import { aiClient } from '../../api/aiClient';
import { useToast } from '../../context/ToastContext.jsx';
import { Plus, Sparkles, Clock, Globe, Volume2, AudioLines } from 'lucide-react';
import TopBar from '../../components/TopBar.jsx';

const SpinningGlobe = ({ size = 12, className = "" }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.25" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20" />
    
    <path fill="none">
      <animate attributeName="d" values="M 12 2 Q -8 12 12 22; M 12 2 Q 12 12 12 22; M 12 2 Q 32 12 12 22" dur="2s" repeatCount="indefinite" begin="0s" />
      <animate attributeName="opacity" values="0; 1; 1; 0" keyTimes="0; 0.2; 0.8; 1" dur="2s" repeatCount="indefinite" begin="0s" />
    </path>
    <path fill="none">
      <animate attributeName="d" values="M 12 2 Q -8 12 12 22; M 12 2 Q 12 12 12 22; M 12 2 Q 32 12 12 22" dur="2s" repeatCount="indefinite" begin="-0.5s" />
      <animate attributeName="opacity" values="0; 1; 1; 0" keyTimes="0; 0.2; 0.8; 1" dur="2s" repeatCount="indefinite" begin="-0.5s" />
    </path>
    <path fill="none">
      <animate attributeName="d" values="M 12 2 Q -8 12 12 22; M 12 2 Q 12 12 12 22; M 12 2 Q 32 12 12 22" dur="2s" repeatCount="indefinite" begin="-1s" />
      <animate attributeName="opacity" values="0; 1; 1; 0" keyTimes="0; 0.2; 0.8; 1" dur="2s" repeatCount="indefinite" begin="-1s" />
    </path>
    <path fill="none">
      <animate attributeName="d" values="M 12 2 Q -8 12 12 22; M 12 2 Q 12 12 12 22; M 12 2 Q 32 12 12 22" dur="2s" repeatCount="indefinite" begin="-1.5s" />
      <animate attributeName="opacity" values="0; 1; 1; 0" keyTimes="0; 0.2; 0.8; 1" dur="2s" repeatCount="indefinite" begin="-1.5s" />
    </path>
  </svg>
);

function SurveyCard({ survey, onClick, index = 0 }) {
  const [localSurvey, setLocalSurvey] = useState(survey);
  const [translateLogs, setTranslateLogs] = useState([]);
  const toast = useToast();

  useEffect(() => {
    let interval;
    const isProcessing = localSurvey.status === 'translating' || localSurvey.status === 'generating_audio';
    
    if (isProcessing) {
      interval = setInterval(async () => {
        try {
          const res = await aiClient.pollQuestionsMultilang(localSurvey.surveyId);
          if (res.logs) {
            let filteredLogs = [];
            let isInsideRawBlock = false;
            let agentStartedSeen = false;
            for (const log of res.logs) {
              if (log.includes('=== RAW MULTILANG TRANSLATOR RESPONSE ===')) {
                isInsideRawBlock = true;
                continue;
              }
              if (isInsideRawBlock && log.includes('=========================================')) {
                isInsideRawBlock = false;
                continue;
              }
              if (!isInsideRawBlock) {
                if (log.startsWith('Multilang Translator Agent Started') || log.startsWith('Audio Generation Agent Started')) {
                  if (!agentStartedSeen) {
                    agentStartedSeen = true;
                    filteredLogs.push(log);
                  }
                } else if (log.startsWith('Multilang Translator Agent Completed') || log.startsWith('Audio Generation Agent Completed')) {
                  continue; // Skip all 'Completed' messages as they are just noise
                } else {
                  filteredLogs.push(log);
                }
              }
            }
            setTranslateLogs(filteredLogs);
          }
          if (res.status !== 'translating' && res.status !== 'generating_audio') {
            clearInterval(interval);
            setLocalSurvey(prev => ({ ...prev, ...(res.data || {}), status: res.status }));
            setTranslateLogs([]);
            if (localSurvey.status === 'translating') {
                toast.success('Translation completed successfully!');
            } else if (localSurvey.status === 'generating_audio') {
                toast.success('Audio generation completed successfully!');
            }
          }
        } catch (err) {
          console.error("Polling error", err);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [localSurvey.status, localSurvey.surveyId]);

  const audioMap = localSurvey.questionSections?.[0]?.questions?.[0]?.audio;
  const hasAudio = audioMap && Object.values(audioMap).some(val => val && val.trim() !== "");
  const isProcessing = localSurvey.status === 'translating' || localSurvey.status === 'generating_audio';
  const [tooltipState, setTooltipState] = useState({ show: false, x: 0, y: 0 });

  const questionCount = localSurvey.questionSections?.reduce((acc, section) => acc + (section.questions?.length || 0), 0) || 0;
  const sectionCount = localSurvey.questionSections?.length || 0;
  const supportedLangs = localSurvey.supportedLanguages?.length > 0 ? localSurvey.supportedLanguages : ['English'];
  const languages = supportedLangs.length > 2 
    ? `${supportedLangs.slice(0, 2).join(', ')} +${supportedLangs.length - 2}`
    : supportedLangs.join(', ');
  
  // Clean up repetitive titles from AI generation
  let displayName = localSurvey.name || 'Untitled Survey';
  if (displayName.startsWith("Survey on Survey on")) {
      displayName = displayName.replace("Survey on Survey on", "Survey on");
  }

  const handleClick = (e) => {
    if (isProcessing) {
      e.preventDefault();
      e.stopPropagation();
      toast.info(localSurvey.status === 'translating' ? "Hold on we are translating this survey for you" : "Hold on we are generating audio for this survey");
    } else {
      onClick();
    }
  };

  return (
      <div className={`bg-bg border border-border rounded-md shadow-sm p-4 flex flex-col gap-4 transition-all h-full opacity-0 animate-fade-in-card ${isProcessing ? 'cursor-not-allowed opacity-80' : 'cursor-pointer hover:border-black hover:shadow-md'}`} 
      onClick={handleClick}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex justify-between items-start gap-3">
        <h3 className="text-base font-medium text-text-primary m-0 leading-tight line-clamp-2 overflow-hidden">
          {displayName}
        </h3>
        <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full border uppercase tracking-wider shrink-0 ${
              localSurvey.status === 'active' ? 'bg-geist-blue/10 text-geist-blue border-geist-blue/20' : 
              localSurvey.status === 'translating' ? 'bg-purple-500/10 text-purple-700 border-purple-500/20' :
              localSurvey.status === 'generating_audio' ? 'bg-indigo-500/10 text-indigo-700 border-indigo-500/20' :
              localSurvey.status === 'pending' ? 'bg-amber-500/10 text-amber-700 border-amber-500/20' : 
              'bg-geist-error/10 text-geist-error border-geist-error/20'
            }`}>
          {localSurvey.status === 'generating_audio' ? 'Generating Audio' : localSurvey.status}
        </span>
      </div>

      <div className="mt-auto pt-4 flex flex-col gap-2">
        <div className="flex items-center justify-between text-[13px] text-text-muted">
          <span>{sectionCount} Sections • {questionCount} Questions</span>
          <span 
            className="font-mono text-[12px] cursor-help"
            onMouseMove={(e) => {
              e.stopPropagation();
              setTooltipState({ show: true, x: e.clientX, y: e.clientY });
            }}
            onMouseLeave={() => setTooltipState({ show: false, x: 0, y: 0 })}
          >
            #{localSurvey.surveyId?.substring(0, 8)}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-text-muted h-[18px]">
          {isProcessing ? (
            localSurvey.status === 'generating_audio' ? (
              <AudioLines size={12} className="shrink-0 text-indigo-500 animate-pulse" />
            ) : (
              <SpinningGlobe size={12} className="shrink-0" />
            )
          ) : (
            <div className="flex items-center gap-1.5 shrink-0">
              <Globe size={12} />
              {hasAudio && <Volume2 size={12} className="text-text-muted" />}
            </div>
          )}
          {isProcessing ? (
            <div className="relative overflow-hidden h-[18px] w-full">
              <div 
                className="absolute top-0 left-0 flex flex-col w-full transition-transform duration-700 ease-in-out"
                style={{ transform: `translateY(-${Math.max(0, translateLogs.length - 1) * 18}px)` }}
              >
                {translateLogs.length === 0 ? (
                  <span className={`h-[18px] flex items-center whitespace-nowrap overflow-hidden text-ellipsis font-mono text-[10px] ${localSurvey.status === 'generating_audio' ? 'text-indigo-600' : 'text-purple-600'}`}>
                    {localSurvey.status === 'generating_audio' ? 'Initializing audio generation...' : 'Initializing translation...'}
                  </span>
                ) : (
                  translateLogs.map((log, i) => (
                    <span 
                      key={i} 
                      className={`h-[18px] flex items-center whitespace-nowrap overflow-hidden text-ellipsis font-mono text-[10px] ${localSurvey.status === 'generating_audio' ? 'text-indigo-600' : 'text-purple-600'} transition-opacity duration-700 ${i === translateLogs.length - 1 ? 'opacity-100' : 'opacity-40'}`}
                    >
                      {log}
                    </span>
                  ))
                )}
              </div>
            </div>
          ) : (
            <span className="capitalize whitespace-nowrap overflow-hidden text-ellipsis">
              {languages}
            </span>
          )}
        </div>
      </div>

      {tooltipState.show && createPortal(
        <div 
          className="fixed z-50 bg-neutral-900 text-white text-xs px-2 py-1 rounded shadow-lg pointer-events-none whitespace-nowrap animate-in fade-in zoom-in duration-150"
          style={{ top: tooltipState.y + 15, left: tooltipState.x + 10 }}
        >
          {localSurvey.surveyId}
        </div>,
        document.body
      )}
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
      <TopBar title="SDRD Dashboard" />
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
          {surveys.map((survey, index) => (
            <SurveyCard key={survey.surveyId} survey={survey} onClick={() => navigate(`/sdrd/editor/${survey.surveyId}`)} index={index} />
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
