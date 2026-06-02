import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { surveyClient } from '../../api/survey';
import { aiClient } from '../../api/aiClient';
import { ArrowLeft, Sparkles, CheckCircle2, AlertCircle, Save, X, Loader2, Globe, Check, Edit2, Trash2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext.jsx';

const TypewriterMessage = ({ content, isList = false }) => {
  const [visibleCount, setVisibleCount] = useState(0);
  const [visibleListCounts, setVisibleListCounts] = useState([]);

  useEffect(() => {
    let timer;
    let isMounted = true;

    if (isList && Array.isArray(content)) {
      const itemsWords = content.map(item => item.split(' '));
      setVisibleListCounts(new Array(content.length).fill(0));
      let currentItemIdx = 0;
      let currentWordIdx = 0;

      const typeNextWord = () => {
        if (!isMounted) return;
        if (currentItemIdx < itemsWords.length) {
          setVisibleListCounts(prev => {
            const next = [...prev];
            next[currentItemIdx] = currentWordIdx + 1;
            return next;
          });
          currentWordIdx++;
          if (currentWordIdx >= itemsWords[currentItemIdx].length) {
            currentWordIdx = 0;
            currentItemIdx++;
          }
          timer = setTimeout(typeNextWord, 80);
        }
      };
      typeNextWord();
    } else if (typeof content === 'string') {
      const words = content.split(' ');
      let currentCount = 0;
      setVisibleCount(0);
      const typeNextWord = () => {
        if (!isMounted) return;
        if (currentCount < words.length) {
          currentCount++;
          setVisibleCount(currentCount);
          timer = setTimeout(typeNextWord, 80);
        }
      };
      typeNextWord();
    }
    
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [content, isList]);

  if (isList) {
    return (
      <ul className="list-disc pl-4 m-0 space-y-1 text-text-secondary">
        {content.map((item, i) => {
          const words = item.split(' ');
          const count = visibleListCounts[i] || 0;
          if (count === 0) return null;
          return (
            <li key={i}>
              {words.slice(0, count).map((word, wIdx) => (
                <span key={wIdx} className="inline-block animate-word">{word}&nbsp;</span>
              ))}
            </li>
          );
        })}
      </ul>
    );
  }

  const words = typeof content === 'string' ? content.split(' ') : [];
  return (
    <span>
      {words.slice(0, visibleCount).map((word, i) => (
        <span key={i} className="inline-block animate-word">{word}&nbsp;</span>
      ))}
    </span>
  );
};

export default function SurveyEditor({ surveyId: propSurveyId }) {
  const { surveyId: paramSurveyId } = useParams();
  const surveyId = propSurveyId || paramSurveyId;
  const navigate = useNavigate();
  const toast = useToast();

  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);

  // Editable local state
  const [localTitle, setLocalTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [localSections, setLocalSections] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [editingSections, setEditingSections] = useState({}); // Track edit mode per section

  // AI Improve state
  const [activeImproveSection, setActiveImproveSection] = useState(null); // name of section
  const [improveInstructions, setImproveInstructions] = useState('');
  const [improvingStatus, setImprovingStatus] = useState('idle');

  // Multi-lang state
  const [showLangPanel, setShowLangPanel] = useState(false);
  const [selectedLangs, setSelectedLangs] = useState([]);
  const [translateStatus, setTranslateStatus] = useState('idle');
  const [translateLogs, setTranslateLogs] = useState([]);
  const [viewLang, setViewLang] = useState('english');

  // Approval modal state
  const [showApproveModal, setShowApproveModal] = useState(false);
  
  // Delete modal state
  const [deleteModal, setDeleteModal] = useState({ show: false, type: null, secIdx: null, qIdx: null, optIdx: null, message: '' });

  // Generic error modal state
  const [showErrorModal, setShowErrorModal] = useState(null);

  const logContainerRef = React.useRef(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [translateLogs]);

  const confirmDelete = () => {
    const { type, secIdx, qIdx, optIdx } = deleteModal;
    const updated = [...localSections];
    if (type === 'section') {
      updated.splice(secIdx, 1);
    } else if (type === 'question') {
      updated[secIdx].questions.splice(qIdx, 1);
    } else if (type === 'option') {
      updated[secIdx].questions[qIdx].options.splice(optIdx, 1);
    }
    setLocalSections(updated);
    setHasChanges(true);
    setDeleteModal({ show: false });
  };

  const AVAILABLE_LANGUAGES = [
    "hindi", "bengali", "telugu", "tamil", "marathi", "gujarati", 
    "kannada", "malayalam", "odia", "punjabi", "urdu"
  ];

  useEffect(() => {
    fetchSurvey();
  }, [surveyId]);

  const fetchSurvey = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const res = await surveyClient.getSurveyById(surveyId);
      const surveyData = res.data.data;
      setSurvey(surveyData);
      setLocalTitle(surveyData.name || '');
      setLocalSections(surveyData.questionSections || []);
      // Reset selected langs when fetching fresh survey
      setSelectedLangs([]);
    } catch (err) {
      console.error(err);
      setError('Failed to load survey.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    let interval;
    if (translateStatus === 'processing') {
      interval = setInterval(async () => {
        try {
          const res = await aiClient.pollQuestionsMultilang(surveyId);
          if (res.logs) {
            let filteredLogs = [];
            let isInsideRawBlock = false;
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
                filteredLogs.push(log);
              }
            }
            setTranslateLogs(filteredLogs);
          }
          if (res.status === 'completed') {
            clearInterval(interval);
            setTranslateStatus('idle');
            setShowLangPanel(false);
            setTranslateLogs([]);
            await fetchSurvey();
            toast.success("Survey translated successfully");
          }
        } catch (err) {
          console.error("Polling error", err);
        }
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [translateStatus, surveyId]);

  const validateSurvey = () => {
    if (!localSections || localSections.length === 0) {
      return "Survey must have at least one section.";
    }
    
    for (let sIdx = 0; sIdx < localSections.length; sIdx++) {
      const section = localSections[sIdx];
      if (!section.sectionName || !section.sectionName.trim()) {
        return `Section ${sIdx + 1} has no name.`;
      }
      if (!section.questions || section.questions.length === 0) {
        return `Section "${section.sectionName}" must have at least one question.`;
      }

      for (let qIdx = 0; qIdx < section.questions.length; qIdx++) {
        const q = section.questions[qIdx];
        if (!q.text?.english || !q.text.english.trim()) {
          return `Question ${qIdx + 1} in section "${section.sectionName}" is empty. Please provide question text.`;
        }

        if (q.type === 'mcq' || q.type === 'checkbox') {
          if (!q.options || q.options.length < 2) {
            return `Question ${qIdx + 1} in section "${section.sectionName}" must have at least 2 options.`;
          }
          for (let optIdx = 0; optIdx < q.options.length; optIdx++) {
            const opt = q.options[optIdx];
            if (!opt.label?.english || !opt.label.english.trim()) {
              return `Option ${optIdx + 1} of question ${qIdx + 1} in section "${section.sectionName}" is empty.`;
            }
          }
        }
      }
    }
    return null; // valid
  };

  const handleApprove = async () => {
    const errorMsg = validateSurvey();
    if (errorMsg) {
      setShowApproveModal(false);
      setShowErrorModal(errorMsg);
      return;
    }

    setShowApproveModal(false);
    try {
      setApproving(true);
      await surveyClient.approveSurvey(surveyId);
      navigate('/sdrd');
    } catch (err) {
      setShowErrorModal("Failed to approve survey.");
    } finally {
      setApproving(false);
    }
  };

  const handleManualSave = async () => {
    const errorMsg = validateSurvey();
    if (errorMsg) {
      setShowErrorModal(errorMsg);
      return;
    }
    
    try {
      setSaving(true);
      await surveyClient.updateSurvey(surveyId, { name: localTitle, questionSections: localSections });
      setSurvey(prev => ({ ...prev, name: localTitle, questionSections: localSections }));
      setHasChanges(false);
      toast.success("Changes saved as draft");
    } catch (err) {
      setShowErrorModal("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleImproveSectionSubmit = async (e, sectionName) => {
    e.preventDefault();
    if (!improveInstructions.trim()) return;

    setImprovingStatus('processing');
    try {
      const res = await aiClient.improveSectionEnglish(surveyId, sectionName, improveInstructions);
      if (res.status === 'completed') {
        await fetchSurvey(false);
        setActiveImproveSection(null);
        setImproveInstructions('');
        toast.success(`Section "${sectionName}" improved successfully`);
      }
    } catch (err) {
      setShowErrorModal("AI Improvement failed: " + err.message);
    } finally {
      setImprovingStatus('idle');
    }
  };

  const handleTranslateSubmit = async () => {
    if (selectedLangs.length === 0) {
      setShowErrorModal("Please select at least one regional language before translating.");
      return;
    }
    setTranslateStatus('processing');
    try {
      await aiClient.generateQuestionsMultilang(surveyId, selectedLangs);
    } catch (err) {
      setShowErrorModal("Translation initiation failed: " + err.message);
      setTranslateStatus('idle');
    }
  };

  const toggleLanguage = (lang) => {
    if (selectedLangs.includes(lang)) {
      setSelectedLangs(selectedLangs.filter(l => l !== lang));
    } else {
      setSelectedLangs([...selectedLangs, lang]);
    }
  };

  const updateQuestionText = (sectionIndex, qIndex, newText) => {
    const updated = [...localSections];
    if (!updated[sectionIndex].questions[qIndex].text) {
      updated[sectionIndex].questions[qIndex].text = {};
    }
    updated[sectionIndex].questions[qIndex].text.english = newText;
    setLocalSections(updated);
    setHasChanges(true);
  };

  const updateOptionText = (sectionIndex, qIndex, optIndex, newLabel) => {
    const updated = [...localSections];
    if (!updated[sectionIndex].questions[qIndex].options[optIndex].label) {
      updated[sectionIndex].questions[qIndex].options[optIndex].label = {};
    }
    updated[sectionIndex].questions[qIndex].options[optIndex].label.english = newLabel;
    setLocalSections(updated);
    setHasChanges(true);
  };

  const addSection = () => {
    setLocalSections([...localSections, { sectionName: 'New Section', questions: [] }]);
    setEditingSections(prev => ({ ...prev, [localSections.length]: true }));
    setHasChanges(true);
  };

  const deleteSection = (secIdx) => {
    setDeleteModal({
      show: true,
      type: 'section',
      secIdx,
      message: "Are you sure you want to delete this entire section and all of its questions? This action cannot be undone."
    });
  };

  const addQuestion = (secIdx) => {
    const updated = [...localSections];
    const newQid = window.crypto.randomUUID ? window.crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
    updated[secIdx].questions.push({
      qid: newQid,
      type: "text",
      text: { english: "New Question" },
      audio: { english: "" }
    });
    setLocalSections(updated);
    setHasChanges(true);
  };

  const deleteQuestion = (secIdx, qIdx) => {
    setDeleteModal({
      show: true,
      type: 'question',
      secIdx,
      qIdx,
      message: "Are you sure you want to delete this question? This action cannot be undone."
    });
  };

  const changeQuestionType = (secIdx, qIdx, newType) => {
    const updated = [...localSections];
    const q = updated[secIdx].questions[qIdx];
    q.type = newType;
    if ((newType === 'mcq' || newType === 'checkbox') && (!q.options || q.options.length === 0)) {
      q.options = [
        { id: "opt1", label: { english: "Option 1" } },
        { id: "opt2", label: { english: "Option 2" } }
      ];
    }
    setLocalSections(updated);
    setHasChanges(true);
  };

  const addOption = (secIdx, qIdx) => {
    const updated = [...localSections];
    const q = updated[secIdx].questions[qIdx];
    if (!q.options) q.options = [];
    const optId = window.crypto.randomUUID ? window.crypto.randomUUID().slice(0, 8) : Math.random().toString(36).substring(2, 10);
    q.options.push({ id: optId, label: { english: "New Option" } });
    setLocalSections(updated);
    setHasChanges(true);
  };

  const deleteOption = (secIdx, qIdx, optIdx) => {
    setDeleteModal({
      show: true,
      type: 'option',
      secIdx,
      qIdx,
      optIdx,
      message: "Are you sure you want to delete this option? This action cannot be undone."
    });
  };

  if (loading) return (
    <div className="flex flex-col flex-1 min-w-0 bg-bg px-6 py-6 max-w-[1200px] mx-auto w-full animate-pulse">
      {/* Header Skeleton */}
      <div className="pb-6 mb-6 border-b border-border flex justify-between">
        <div className="flex flex-col gap-3 w-full max-w-[400px]">
          <div className="h-4 bg-border/40 rounded w-24"></div>
          <div className="h-8 bg-border/40 rounded w-full mt-2"></div>
          <div className="h-4 bg-border/20 rounded w-48 mt-1"></div>
        </div>
        <div className="flex gap-3 pt-7 hidden md:flex">
          <div className="h-9 bg-border/40 rounded w-28"></div>
          <div className="h-9 bg-border/40 rounded w-32"></div>
        </div>
      </div>
      {/* Sections Skeleton */}
      <div className="flex flex-col gap-8">
        {[1, 2].map(i => (
          <div key={i} className="bg-bg border border-border rounded-md shadow-sm h-64 flex flex-col">
             <div className="h-14 bg-surface border-b border-border rounded-t-md flex items-center px-6">
               <div className="h-5 bg-border/40 rounded w-48"></div>
             </div>
             <div className="flex-1 p-6 flex flex-col gap-5">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-6 bg-border/40 rounded"></div>
                  <div className="h-4 w-12 bg-border/40 rounded-full"></div>
                </div>
                <div className="h-4 bg-border/40 rounded w-3/4 ml-8"></div>
                <div className="flex flex-col gap-2 ml-8 mt-1">
                  <div className="h-3.5 bg-border/20 rounded w-1/3"></div>
                  <div className="h-3.5 bg-border/20 rounded w-1/4"></div>
                </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
  if (error) return <div className="text-error" style={{ padding: 'var(--sp-8)' }}>{error}</div>;
  if (!survey) return null;

  const isPending = survey.status === 'pending';
  const hasTranslations = survey.supportedLanguages && survey.supportedLanguages.length > 1;
  const isTranslationLocked = translateStatus === 'processing' || hasTranslations;

  return (
    <div className="flex flex-col flex-1 min-w-0 bg-bg">
      <div className="flex flex-col flex-1 w-full max-w-[1200px] mx-auto px-6 pb-16">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between py-6 mb-6 border-b border-border bg-bg sticky top-0 z-10 gap-6">
        <div className="flex-1 min-w-0">
          <button 
            className="inline-flex items-center gap-2 text-sm font-medium text-text-muted hover:text-text-primary mb-2 transition-colors"
            onClick={() => navigate('/sdrd')}
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
          {isEditingTitle ? (
            <div className="flex items-center gap-3 mb-2 w-full max-w-[800px]">
              <input 
                type="text"
                className="text-2xl font-bold tracking-tight text-text-primary flex-1 bg-transparent border-b border-dashed border-border hover:border-text-primary focus:border-geist-blue outline-none transition-colors px-1 py-1"
                value={localTitle}
                onChange={(e) => {
                  setLocalTitle(e.target.value);
                  setHasChanges(true);
                }}
                placeholder="Survey Title"
                autoFocus
              />
              <button 
                className="inline-flex items-center justify-center gap-1.5 px-3 h-8 text-xs font-medium rounded bg-black text-white hover:bg-neutral-800 transition-colors shrink-0"
                onClick={() => setIsEditingTitle(false)}
              >
                Done
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 mb-2 group flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight text-text-primary break-words m-0">{localTitle}</h1>
              {isPending && (
                <button
                  className="inline-flex items-center justify-center gap-1.5 px-2.5 h-7 text-xs font-medium rounded bg-surface border border-border text-text-muted hover:bg-surface-alt hover:text-text-primary transition-colors shrink-0"
                  onClick={() => setIsEditingTitle(true)}
                  disabled={isTranslationLocked || saving || approving}
                >
                  <Edit2 size={14} /> Edit Title
                </button>
              )}
            </div>
          )}
          <div className="flex items-center gap-4 mt-2">
            <span className="text-xs text-text-muted font-mono shrink-0">ID: {survey.surveyId}</span>
            <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full border uppercase tracking-wider shrink-0 ${
                  survey.status === 'active' ? 'bg-geist-blue/10 text-geist-blue border-geist-blue/20' : 
                  survey.status === 'pending' ? 'bg-amber-500/10 text-amber-700 border-amber-500/20' : 
                  'bg-geist-error/10 text-geist-error border-geist-error/20'
                }`}>{survey.status}</span>
          </div>
        </div>

        {isPending && (
          <div className="flex items-center gap-3 shrink-0 lg:pt-7">
            {hasChanges && (
              <button className="inline-flex items-center justify-center gap-2 px-4 h-9 text-sm font-medium rounded-md bg-white border border-border text-text-primary hover:bg-surface-alt transition-colors disabled:opacity-50 shrink-0 whitespace-nowrap" onClick={handleManualSave} disabled={saving || translateStatus === 'processing'}>
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save Draft
              </button>
            )}
            <button className="inline-flex items-center justify-center gap-2 px-4 h-9 text-sm font-medium rounded-md bg-white border border-border text-text-primary hover:bg-surface-alt transition-colors disabled:opacity-50 shrink-0 whitespace-nowrap" onClick={() => setShowLangPanel(!showLangPanel)} disabled={translateStatus === 'processing'}>
              <Globe size={16} /> Translate
            </button>
            <button className="inline-flex items-center justify-center gap-2 px-4 h-9 text-sm font-medium rounded-md bg-black text-white hover:bg-neutral-800 transition-colors disabled:opacity-50 shrink-0 whitespace-nowrap" onClick={() => setShowApproveModal(true)} disabled={approving || translateStatus === 'processing'}>
              {approving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              Approve Survey
            </button>
          </div>
        )}
      </div>

      {/* Translation Panel */}
      {showLangPanel && (
        <div className="bg-surface-alt border border-border rounded-md p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold tracking-tight m-0">Translate Survey</h3>
            <button className="inline-flex items-center justify-center w-8 h-8 rounded text-text-muted hover:bg-black/5 hover:text-text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed" onClick={() => setShowLangPanel(false)} disabled={translateStatus === 'processing'}>
              <X size={16} />
            </button>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-text-primary mb-2">Select Regional Languages</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {AVAILABLE_LANGUAGES.map(lang => {
                const isExisting = survey?.supportedLanguages?.includes(lang);
                return (
                  <button
                    type="button"
                    key={lang}
                    onClick={() => !isExisting && toggleLanguage(lang)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full border transition-colors capitalize ${selectedLangs.includes(lang) ? 'bg-black text-white border-black' : 'bg-white text-text-primary border-border hover:border-black'} ${isExisting ? 'opacity-50 cursor-not-allowed bg-surface border-border hover:border-border text-text-muted' : 'cursor-pointer'}`}
                    disabled={isExisting}
                    title={isExisting ? "Already translated" : ""}
                  >
                    {selectedLangs.includes(lang) && <Check size={14} />}
                    {lang}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button className="inline-flex items-center justify-center gap-2 px-4 h-9 text-sm font-medium rounded-md bg-black text-white hover:bg-neutral-800 transition-colors disabled:opacity-50" onClick={handleTranslateSubmit} disabled={translateStatus === 'processing'}>
              {translateStatus === 'processing' ? (
                <><Loader2 size={16} className="animate-spin" /> Translating... this may take a minute</>
              ) : (
                <><Globe size={16} /> Start Translation</>
              )}
            </button>
          </div>
          
          {translateStatus === 'processing' && translateLogs.length > 0 && (
            <div className="mt-6 w-full bg-white border border-border/60 rounded-md p-3 max-h-28 overflow-y-auto text-[11px] font-mono text-text-muted flex flex-col gap-1 shadow-inner scrollbar-thin" ref={logContainerRef}>
              {translateLogs.map((log, i) => {
                const dist = translateLogs.length - 1 - i;
                const opacity = Math.max(0.3, 1 - dist * 0.25);
                return (
                  <div key={i} className="whitespace-pre-wrap transition-opacity duration-500" style={{ opacity }}>
                    <TypewriterMessage content={log} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Language Selector */}
      {survey?.supportedLanguages && survey.supportedLanguages.length > 1 && (
        <div className="flex items-center gap-4 mb-6 p-4 bg-surface border border-border rounded-md">
          <span className="text-sm font-medium text-text-muted">Viewing Language:</span>
          <select 
            className="w-auto h-9 px-3 bg-white border border-border rounded-md text-sm text-text-primary focus:outline-none focus:border-geist-blue transition-colors capitalize" 
            value={viewLang}
            onChange={(e) => setViewLang(e.target.value)}
          >
            <option value="english">English</option>
            {survey.supportedLanguages.filter(l => l !== 'english').map(l => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
      )}

      {/* Sections List */}
      <div className="flex flex-col gap-8">
        {localSections.map((sec, secIdx) => (
          <div key={secIdx} className="bg-bg border border-border rounded-md overflow-hidden shadow-sm">
            
            {/* Section Header */}
            <div className="flex justify-between items-center bg-surface border-b border-border px-6 py-4">
              {isPending && editingSections[secIdx] ? (
                <input 
                  type="text" 
                  value={sec.sectionName}
                  onChange={(e) => {
                    const updated = [...localSections];
                    updated[secIdx].sectionName = e.target.value;
                    setLocalSections(updated);
                    setHasChanges(true);
                  }}
                  className="w-full max-w-[400px] text-lg font-semibold tracking-tight m-0 bg-transparent border-b border-dashed border-border focus:border-geist-blue outline-none py-0.5"
                  placeholder="Section Name"
                />
              ) : (
                <h2 className="text-lg font-semibold tracking-tight m-0">{sec.sectionName}</h2>
              )}
              
              {isPending && (
                <div className="flex gap-2">
                  {sec.sectionName === survey?.questionSections?.[secIdx]?.sectionName && sec.sectionName?.toLowerCase() !== 'user demographics' && (
                    <button
                      className="inline-flex items-center gap-1.5 px-2.5 h-7 text-xs font-medium rounded text-geist-blue bg-geist-blue/10 border border-geist-blue/20 hover:bg-geist-blue/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => {
                        setActiveImproveSection(sec.sectionName);
                        setImproveInstructions('');
                      }}
                      disabled={isTranslationLocked || improvingStatus === 'processing'}
                    >
                      <Sparkles size={14} /> AI Improve
                    </button>
                  )}
                  
                  {editingSections[secIdx] ? (
                    <>
                      <button
                        className="inline-flex items-center gap-1.5 px-2.5 h-7 text-xs font-medium rounded text-geist-error bg-geist-error/10 border border-geist-error/20 hover:bg-geist-error/20 transition-colors"
                        onClick={() => deleteSection(secIdx)}
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                      <button
                        className="inline-flex items-center gap-1.5 px-2.5 h-7 text-xs font-medium rounded bg-black text-white hover:bg-neutral-800 transition-colors"
                        onClick={() => setEditingSections(prev => ({ ...prev, [secIdx]: false }))}
                      >
                        <Save size={14} /> Save
                      </button>
                    </>
                  ) : sec.sectionName?.toLowerCase() !== 'user demographics' && (
                    <button
                      className="inline-flex items-center gap-1.5 px-2.5 h-7 text-xs font-medium rounded bg-white border border-border text-text-primary hover:bg-surface-alt transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => setEditingSections(prev => ({ ...prev, [secIdx]: true }))}
                      disabled={isTranslationLocked || improvingStatus === 'processing'}
                    >
                      <Edit2 size={14} /> Edit
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* AI Improve Inline Panel */}
            {activeImproveSection === sec.sectionName && (
              <div className="px-6 py-4 bg-bg border-b border-border">
                <form onSubmit={(e) => handleImproveSectionSubmit(e, sec.sectionName)} className="flex items-center gap-3">
                  <input 
                    className="flex-1 h-9 px-3 bg-white border border-border rounded-md text-sm text-text-primary focus:outline-none focus:border-geist-blue transition-colors"
                    type="text" 
                    value={improveInstructions}
                    onChange={e => setImproveInstructions(e.target.value)}
                    placeholder="e.g. Add a question about household income, make options simpler..."
                    autoFocus
                  />
                  <button type="submit" disabled={improvingStatus === 'processing' || !improveInstructions.trim()} className="inline-flex items-center justify-center gap-2 px-4 h-9 text-sm font-medium rounded-md bg-black text-white hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    {improvingStatus === 'processing' ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} 
                    Regenerate
                  </button>
                  <button type="button" className="inline-flex items-center justify-center w-9 h-9 rounded text-text-muted hover:bg-surface hover:text-text-primary transition-colors" onClick={() => {
                    setActiveImproveSection(null);
                    setImproveInstructions('');
                  }}>
                    <X size={20} />
                  </button>
                </form>
              </div>
            )}

            {/* Questions */}
            {improvingStatus === 'processing' && activeImproveSection === sec.sectionName ? (
              <div className="px-6 py-8 flex flex-col gap-8 animate-pulse">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex flex-col gap-3">
                    <div className="flex gap-2 items-center">
                      <div className="w-6 h-4 bg-border/40 rounded"></div>
                      <div className="w-12 h-4 bg-border/40 rounded-full"></div>
                    </div>
                    <div className="w-3/4 h-4 bg-border/40 rounded ml-8 mt-1"></div>
                    <div className="flex flex-col gap-2.5 ml-8 mt-3">
                      <div className="w-1/2 h-3.5 bg-border/20 rounded"></div>
                      <div className="w-2/3 h-3.5 bg-border/20 rounded"></div>
                      <div className="w-1/3 h-3.5 bg-border/20 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-6 py-2">
                {sec.questions.map((q, qIdx) => (
                <div key={q.qid} className={`py-4 ${qIdx === sec.questions.length - 1 ? '' : 'border-b border-border/50'}`}>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-text-muted text-xs font-bold w-8">Q{qIdx+1}.</span>
                    {isPending && editingSections[secIdx] ? (
                      <select 
                        value={q.type}
                        onChange={(e) => changeQuestionType(secIdx, qIdx, e.target.value)}
                        className="h-6 px-1.5 text-[10px] font-medium rounded-sm border border-border bg-surface text-text-primary uppercase tracking-wider outline-none focus:border-geist-blue cursor-pointer"
                      >
                        <option value="text">TEXT</option>
                        <option value="mcq">MCQ</option>
                        <option value="checkbox">CHECKBOX</option>
                      </select>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full border border-border bg-surface text-text-muted uppercase tracking-wider">
                        {q.type}
                      </span>
                    )}
                    {q.showIf && (
                      <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full border border-amber-500/20 bg-amber-500/10 text-amber-700 uppercase tracking-wider">
                        Logic: if {q.showIf.questionId} == {q.showIf.equals}
                      </span>
                    )}
                    {isPending && editingSections[secIdx] && (
                      <button 
                        className="ml-auto text-text-muted hover:text-geist-error transition-colors"
                        onClick={() => deleteQuestion(secIdx, qIdx)}
                        title="Delete Question"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  
                  {isPending && editingSections[secIdx] ? (
                    <input 
                      type="text"
                      value={q.text?.english || ''}
                      onChange={(e) => updateQuestionText(secIdx, qIdx, e.target.value)}
                      className="w-full bg-transparent border border-dashed border-transparent focus:border-border hover:border-border text-text-primary text-base font-medium p-1 ml-9 outline-none transition-colors rounded-sm"
                    />
                  ) : (
                    <div className="ml-10 text-base font-medium text-text-primary py-1">
                      {q.text?.[viewLang] || q.text?.english}
                    </div>
                  )}

                  {/* Options */}
                  {(q.type === 'mcq' || q.type === 'checkbox') && q.options && (
                    <div className="flex flex-col gap-2 ml-10 mt-3">
                      {q.options.map((opt, optIdx) => (
                        <div key={opt.id} className="flex items-center gap-2">
                          <div className={`w-4 h-4 border border-border shrink-0 ${q.type === 'mcq' ? 'rounded-full' : 'rounded-sm'}`} />
                          {isPending && editingSections[secIdx] ? (
                            <div className="flex flex-1 items-center gap-2">
                              <input 
                                type="text"
                                value={opt.label?.english || ''}
                                onChange={(e) => updateOptionText(secIdx, qIdx, optIdx, e.target.value)}
                                className="flex-1 bg-transparent border border-dashed border-border/50 focus:border-geist-blue hover:border-border text-text-muted text-sm px-1 py-0.5 outline-none transition-colors rounded-sm"
                              />
                              <button onClick={() => deleteOption(secIdx, qIdx, optIdx)} className="text-text-muted hover:text-geist-error p-1 transition-colors">
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <span className="text-text-muted text-sm">{opt.label?.[viewLang] || opt.label?.english}</span>
                          )}
                        </div>
                      ))}
                      {isPending && editingSections[secIdx] && (
                        <button 
                          onClick={() => addOption(secIdx, qIdx)}
                          className="ml-6 mt-2 text-xs font-medium text-geist-blue hover:text-blue-600 transition-colors w-fit flex items-center gap-1"
                        >
                          + Add Option
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
              
              {isPending && editingSections[secIdx] && (
                <div className="py-4 mt-2 border-t border-border/50">
                  <button 
                    onClick={() => addQuestion(secIdx)}
                    className="text-sm font-medium text-geist-blue hover:text-blue-600 transition-colors w-fit flex items-center gap-1"
                  >
                    + Add Question
                  </button>
                </div>
              )}
            </div>
            )}

          </div>
        ))}

        {localSections.length === 0 && (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-surface border border-dashed border-border rounded-md text-text-muted">
            No sections found in this survey.
          </div>
        )}

        {isPending && (
          <button 
            onClick={addSection}
            className="w-full h-14 rounded-md border-2 border-dashed border-border text-text-muted hover:border-text-primary hover:text-text-primary transition-colors flex items-center justify-center gap-2 font-medium bg-bg disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isTranslationLocked || improvingStatus === 'processing' || translateStatus === 'processing'}
          >
            + Add New Section
          </button>
        )}
      </div>
      </div>

      {/* Approve Survey Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 w-screen h-screen bg-black/40 backdrop-blur-sm flex items-center justify-center z-[1000]" onClick={() => setShowApproveModal(false)}>
          <div className="bg-bg border border-border rounded-md shadow-lg w-full max-w-[480px] flex flex-col animate-[modalIn_0.2s_ease-out]" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-semibold m-0 text-text-primary">Approve Survey</h2>
              <button className="inline-flex items-center justify-center w-8 h-8 rounded text-text-muted hover:bg-surface hover:text-text-primary transition-colors" onClick={() => setShowApproveModal(false)}><X size={16} /></button>
            </div>
            <div className="p-5 max-h-[70vh] overflow-y-auto">
              <p className="m-0 text-sm text-text-secondary">
                Are you sure you want to approve this survey? It will become active and locked for SDRD edits.
              </p>
            </div>
            <div className="px-5 py-3 border-t border-border bg-surface-alt rounded-b-md flex items-center justify-end gap-3">
              <button className="inline-flex items-center justify-center px-4 h-9 text-sm font-medium rounded-md bg-white border border-border text-text-primary hover:bg-surface transition-colors" onClick={() => setShowApproveModal(false)}>Cancel</button>
              <button className="inline-flex items-center justify-center px-4 h-9 text-sm font-medium rounded-md bg-black text-white hover:bg-neutral-800 transition-colors" onClick={handleApprove}>Approve</button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 w-screen h-screen bg-black/40 backdrop-blur-sm flex items-center justify-center z-[1000]" onClick={() => setShowErrorModal(null)}>
          <div className="bg-bg border border-border rounded-md shadow-lg w-full max-w-[400px] flex flex-col animate-[modalIn_0.2s_ease-out]" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-border flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-geist-error/10 flex items-center justify-center text-geist-error shrink-0">
                <AlertCircle size={18} />
              </div>
              <h2 className="text-lg font-semibold m-0 text-text-primary">Error</h2>
            </div>
            <div className="p-5">
              <p className="m-0 text-sm text-text-secondary">
                {showErrorModal}
              </p>
            </div>
            <div className="px-5 py-3 border-t border-border bg-surface-alt rounded-b-md flex items-center justify-end">
              <button className="inline-flex items-center justify-center px-4 h-9 text-sm font-medium rounded-md bg-black text-white hover:bg-neutral-800 transition-colors" onClick={() => setShowErrorModal(null)}>OK</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 w-screen h-screen bg-black/40 backdrop-blur-sm flex items-center justify-center z-[1000]" onClick={() => setDeleteModal({ show: false })}>
          <div className="bg-bg border border-border rounded-md shadow-lg w-full max-w-[400px] flex flex-col animate-[modalIn_0.2s_ease-out]" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-semibold m-0 text-text-primary">Confirm Deletion</h2>
              <button className="inline-flex items-center justify-center w-8 h-8 rounded text-text-muted hover:bg-surface hover:text-text-primary transition-colors" onClick={() => setDeleteModal({ show: false })}><X size={16} /></button>
            </div>
            <div className="p-5">
              <p className="m-0 text-sm text-text-secondary">
                {deleteModal.message}
              </p>
            </div>
            <div className="px-5 py-3 border-t border-border bg-surface-alt rounded-b-md flex items-center justify-end gap-3">
              <button className="inline-flex items-center justify-center px-4 h-9 text-sm font-medium rounded-md bg-white border border-border text-text-primary hover:bg-surface transition-colors" onClick={() => setDeleteModal({ show: false })}>Cancel</button>
              <button className="inline-flex items-center justify-center px-4 h-9 text-sm font-medium rounded-md bg-geist-error text-white hover:bg-red-600 transition-colors" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
