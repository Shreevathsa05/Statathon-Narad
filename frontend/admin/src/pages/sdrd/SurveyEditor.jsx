import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { surveyClient } from '../../api/survey';
import { aiClient } from '../../api/aiClient';
import { ArrowLeft, Sparkles, CheckCircle2, AlertCircle, Save, X, Loader2, Globe, Check, Edit2, Trash2, Volume2, AudioLines, Bell, GitBranch, Plus, MoreVertical, GripVertical } from 'lucide-react';
import { useToast } from '../../context/ToastContext.jsx';
import { useNotification } from '../../context/NotificationContext.jsx';
import NotificationSidebar from '../../components/NotificationSidebar.jsx';


const RichQuestionInput = React.forwardRef(({ value, onChange, previousQuestions, placeholder }, ref) => {
  const editorRef = React.useRef(null);

  React.useImperativeHandle(ref, () => ({
    insertVariable
  }));

  const rawToHtml = (text) => {
    if (!text) return '';
    let html = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const matches = [...html.matchAll(/\{\{(.*?)\}\}/g)];
    for (const match of matches) {
      const qid = match[1];
      const targetQ = previousQuestions.find(pq => pq.qid === qid);
      const label = targetQ?.text?.english || 'Variable';
      const spanHtml = `&#8203;<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-geist-blue/10 text-geist-blue border border-geist-blue/20 mx-1 align-baseline select-none group" contenteditable="false" data-qid="${qid}">@${label}<span class="ml-1 opacity-0 group-hover:opacity-100 cursor-pointer text-geist-blue/60 hover:text-red-500 transition-colors" data-delete-qid="${qid}">×</span></span>&#8203;`;
      html = html.replace(match[0], spanHtml);
    }
    return html;
  };

  const htmlToRaw = () => {
    if (!editorRef.current) return '';
    let raw = '';
    const traverse = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        raw += node.textContent;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.tagName === 'SPAN' && node.dataset.qid) {
          raw += `{{${node.dataset.qid}}}`;
        } else {
          if (node.tagName === 'DIV' || node.tagName === 'BR') {
            if (raw.length > 0) raw += ' ';
          }
          for (const child of node.childNodes) {
            traverse(child);
          }
        }
      }
    };
    for (const child of editorRef.current.childNodes) {
      traverse(child);
    }
    return raw.replace(/\u200B/g, '').trim().replace(/\s+/g, ' ');
  };

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML === '') {
      editorRef.current.innerHTML = rawToHtml(value);
    }

    const handleEditorClick = (e) => {
      const deleteBtn = e.target.closest('[data-delete-qid]');
      if (deleteBtn) {
        const badgeSpan = deleteBtn.closest('span[data-qid]');
        if (badgeSpan) {
          // Remove the leading and trailing zero-width spaces if possible
          if (badgeSpan.previousSibling && badgeSpan.previousSibling.nodeType === Node.TEXT_NODE && badgeSpan.previousSibling.textContent.endsWith('\u200B')) {
            badgeSpan.previousSibling.textContent = badgeSpan.previousSibling.textContent.slice(0, -1);
          }
          if (badgeSpan.nextSibling && badgeSpan.nextSibling.nodeType === Node.TEXT_NODE && badgeSpan.nextSibling.textContent.startsWith('\u200B')) {
            badgeSpan.nextSibling.textContent = badgeSpan.nextSibling.textContent.substring(1);
          }
          badgeSpan.remove();
          handleInput();
        }
      }
    };

    if (editorRef.current) {
      editorRef.current.addEventListener('click', handleEditorClick);
    }
    return () => {
      if (editorRef.current) {
        editorRef.current.removeEventListener('click', handleEditorClick);
      }
    };
  }, []);

  const handleInput = () => {
    onChange(htmlToRaw());
  };

  const insertVariable = (qid) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    
    if (!editorRef.current.contains(range.commonAncestorContainer)) {
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
    }

    const targetQ = previousQuestions.find(pq => pq.qid === qid);
    const label = targetQ?.text?.english || 'Variable';
    
    const span = document.createElement('span');
    span.className = 'inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-geist-blue/10 text-geist-blue border border-geist-blue/20 mx-1 align-baseline select-none group';
    span.contentEditable = 'false';
    span.dataset.qid = qid;
    span.innerHTML = `@${label}<span class="ml-1 opacity-0 group-hover:opacity-100 cursor-pointer text-geist-blue/60 hover:text-red-500 transition-colors" data-delete-qid="${qid}">×</span>`;
    
    const zws1 = document.createTextNode('\u200B'); // zero width space
    const space = document.createTextNode(' '); // normal space
    const zws2 = document.createTextNode('\u200B');
    
    // Insert: ZWS -> Badge -> ZWS -> Space
    range.insertNode(space);
    range.insertNode(zws2);
    range.insertNode(span);
    range.insertNode(zws1);
    
    // Move cursor exactly after the second ZWS, before the real space
    range.setStartAfter(zws2);
    range.setEndAfter(zws2);
    selection.removeAllRanges();
    selection.addRange(range);
    
    handleInput();
  };

  return (
    <div className="relative flex-1 flex items-start group">
      <div 
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onBlur={handleInput}
        className="flex-1 min-h-[32px] bg-transparent border border-dashed border-gray-300 focus:border-geist-blue hover:border-gray-400 text-text-primary text-base font-medium p-1 outline-none transition-colors rounded-sm empty:before:content-[attr(data-placeholder)] empty:before:text-text-muted"
        data-placeholder={placeholder}
      />
    </div>
  );
});

export default function SurveyEditor({ surveyId: propSurveyId }) {
  const renderTemplatedText = (text, allPreviousQuestions, onRemoveVariable) => {
    if (!text) return null;
    const parts = text.split(/(\{\{.*?\}\})/g);
    return parts.map((part, i) => {
      if (part.startsWith('{{') && part.endsWith('}}')) {
        const qid = part.slice(2, -2);
        const refQ = allPreviousQuestions.find(q => q.qid === qid);
        const label = refQ ? (refQ.text?.english || qid).substring(0, 20) + (refQ.text?.english?.length > 20 ? '...' : '') : qid;
        return (
          <span key={i} className="inline-flex items-center px-1.5 py-0.5 mx-1 text-[11px] font-medium rounded border border-geist-blue/20 bg-geist-blue/10 text-geist-blue select-none group">
            @{label}
            {onRemoveVariable && (
              <button 
                onClick={() => onRemoveVariable(qid)}
                className="ml-1 opacity-0 group-hover:opacity-100 hover:text-red-600 transition-opacity"
              >
                <X size={10} />
              </button>
            )}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };
  const { surveyId: paramSurveyId } = useParams();
  const surveyId = propSurveyId || paramSurveyId;
  const navigate = useNavigate();
  const toast = useToast();
  const { fetchInitialNotifications, unreadCount, toggleSidebar } = useNotification();

  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);

  const [isLogicMode, setIsLogicMode] = useState(false);
  const [draggedSectionIdx, setDraggedSectionIdx] = useState(null);
  const [activeDragHandle, setActiveDragHandle] = useState(null);
  const [dropTargetIdx, setDropTargetIdx] = useState(null);
  const [reorderConflictModal, setReorderConflictModal] = useState({ show: false, fromIdx: null, toIdx: null, conflicts: [], proposedSections: [] });
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [localTitle, setLocalTitle] = useState('');
  const [localDescription, setLocalDescription] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [showDescPanel, setShowDescPanel] = useState(false);
  const [localSections, setLocalSections] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [editingSections, setEditingSections] = useState({}); // Track edit mode per section
  const [highlightLogic, setHighlightLogic] = useState({ qid: null, equals: null });
  const questionInputRefs = React.useRef({});

  // AI Improve state
  const [activeImproveSection, setActiveImproveSection] = useState(null); // name of section
  const [improveInstructions, setImproveInstructions] = useState('');
  const [improvingStatus, setImprovingStatus] = useState('idle');

  // Audio Generation & Visualizer state
  const [audioGenerationStatus, setAudioGenerationStatus] = useState('idle');
  const [showAudioModal, setShowAudioModal] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState(null);
  
  const audioCtxRef = React.useRef(null);
  const analyserRef = React.useRef(null);
  const sourceNodeRef = React.useRef(null);
  const audioObjRef = React.useRef(null);
  const reqAnimRef = React.useRef(null);
  const activeQuestionRef = React.useRef(null);

  // Multi-lang state
  const [showTranslateModal, setShowTranslateModal] = useState(false);
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

  const confirmDelete = async () => {
    const { type, secIdx, qIdx, optIdx } = deleteModal;
    
    if (type === 'survey') {
      setDeleteModal({ show: false });
      try {
        await surveyClient.deleteSurvey(surveyId);
        toast.success("Survey deleted successfully");
        fetchInitialNotifications();
        navigate('/sdrd');
      } catch (err) {
        setShowErrorModal("Failed to delete survey: " + err.message);
      }
      return;
    }

    const updated = structuredClone(localSections);
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

  const cleanupAudio = () => {
    if (reqAnimRef.current) cancelAnimationFrame(reqAnimRef.current);
    if (audioObjRef.current) {
      audioObjRef.current.pause();
      audioObjRef.current.src = "";
    }
    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.disconnect(); } catch (e) {}
      sourceNodeRef.current = null;
    }
    setPlayingAudioId(null);
    if (activeQuestionRef.current) {
      activeQuestionRef.current.style.setProperty('--audio-intensity', '0');
    }
  };

  useEffect(() => {
    return cleanupAudio;
  }, []);

  const fetchSurvey = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const res = await surveyClient.getSurveyById(surveyId);
      const surveyData = res.data.data;
      setSurvey(surveyData);
      setLocalTitle(surveyData.name || '');
      setLocalDescription(surveyData.description || '');
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

  const handleDragStart = (e, idx) => {
    if (idx === 0) return; // Prevent dragging demographics
    setDraggedSectionIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
    
    // Set a custom drag image (just the header) so we don't drag a massive transparent ghost of the uncollapsed section
    const headerEl = e.currentTarget.querySelector('.bg-surface');
    if (headerEl) {
      e.dataTransfer.setDragImage(headerEl, 20, 20);
    }

    setTimeout(() => {
      e.target.classList.add('opacity-40');
    }, 0);
  };

  const handleDragEnd = (e) => {
    setDraggedSectionIdx(null);
    setDropTargetIdx(null);
    e.target.classList.remove('opacity-40');
  };

  const handleDragOver = (e, idx) => {
    e.preventDefault();
    if (idx === 0) return;
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e, idx) => {
    if (idx === 0) return;
    setDropTargetIdx(idx);
  };

  const checkReorderConflicts = (fromIdx, toIdx) => {
    const conflicts = [];
    if (fromIdx === toIdx) return { conflicts, simulated: localSections };
    
    const simulated = structuredClone(localSections);
    const [movedSection] = simulated.splice(fromIdx, 1);
    simulated.splice(toIdx, 0, movedSection);

    const qidToNewSecIdx = {};
    simulated.forEach((sec, sIdx) => {
      sec.questions.forEach(q => {
        qidToNewSecIdx[q.qid] = sIdx;
      });
    });

    simulated.forEach((sec, sIdx) => {
      if (sec.showIf?.questionId) {
        const refIdx = qidToNewSecIdx[sec.showIf.questionId];
        if (refIdx !== undefined && refIdx >= sIdx) {
          conflicts.push(`Section "${sec.sectionName}" relies on a question that now appears after it.`);
        }
      }

      sec.questions.forEach((q, qIdx) => {
        if (q.showIf?.questionId) {
          const refIdx = qidToNewSecIdx[q.showIf.questionId];
          if (refIdx !== undefined && refIdx >= sIdx) {
            conflicts.push(`Question "Q${qIdx + 1}" in "${sec.sectionName}" relies on a question that now appears after it.`);
          }
        }
        
        const text = q.text?.english || "";
        const matches = [...text.matchAll(/\{\{(.*?)\}\}/g)];
        matches.forEach(match => {
          const varQid = match[1];
          const refIdx = qidToNewSecIdx[varQid];
          if (refIdx !== undefined && refIdx >= sIdx) {
            conflicts.push(`Question "Q${qIdx + 1}" in "${sec.sectionName}" uses a variable {{${varQid}}} from a question that now appears after it.`);
          }
        });
      });
    });

    return { conflicts, simulated };
  };

  const handleDrop = (e, toIdx) => {
    e.preventDefault();
    if (draggedSectionIdx === null || draggedSectionIdx === toIdx || toIdx === 0) {
      setDraggedSectionIdx(null);
      setDropTargetIdx(null);
      return;
    }

    const { conflicts, simulated } = checkReorderConflicts(draggedSectionIdx, toIdx);

    if (conflicts.length > 0) {
      setReorderConflictModal({
        show: true,
        fromIdx: draggedSectionIdx,
        toIdx,
        conflicts,
        proposedSections: simulated
      });
    } else {
      setLocalSections(simulated);
      setHasChanges(true);
    }

    setDraggedSectionIdx(null);
    setDropTargetIdx(null);
  };

  const handleAcknowledgeReorder = () => {
    let strippedSections = structuredClone(reorderConflictModal.proposedSections);
    
    const qidToNewSecIdx = {};
    strippedSections.forEach((sec, sIdx) => {
      sec.questions.forEach(q => {
        qidToNewSecIdx[q.qid] = sIdx;
      });
    });

    strippedSections.forEach((sec, sIdx) => {
      if (sec.showIf?.questionId) {
        const refIdx = qidToNewSecIdx[sec.showIf.questionId];
        if (refIdx !== undefined && refIdx >= sIdx) {
          delete sec.showIf;
        }
      }

      sec.questions.forEach((q) => {
        if (q.showIf?.questionId) {
          const refIdx = qidToNewSecIdx[q.showIf.questionId];
          if (refIdx !== undefined && refIdx >= sIdx) {
            delete q.showIf;
          }
        }
        
        if (q.text) {
          Object.keys(q.text).forEach(lang => {
            let txt = q.text[lang] || "";
            const matches = [...txt.matchAll(/\{\{(.*?)\}\}/g)];
            matches.forEach(match => {
              const varQid = match[1];
              const refIdx = qidToNewSecIdx[varQid];
              if (refIdx !== undefined && refIdx >= sIdx) {
                txt = txt.replace(new RegExp(`\\{\\{${varQid}\\}\\}`, 'g'), '');
              }
            });
            q.text[lang] = txt.replace(/\s+/g, ' ').trim();
          });
        }
      });
    });

    setLocalSections(strippedSections);
    setHasChanges(true);
    setReorderConflictModal({ show: false, fromIdx: null, toIdx: null, conflicts: [], proposedSections: [] });
  };

  useEffect(() => {
    let interval;
    if (audioGenerationStatus === 'processing') {
      interval = setInterval(async () => {
        try {
          const res = await surveyClient.getSurveyById(surveyId);
          const surveyData = res.data.data;
          const firstLang = surveyData.supportedLanguages?.[0] || 'english';
          const firstQ = surveyData.questionSections?.[0]?.questions?.[0];
          
          if (firstQ?.audio && firstQ.audio[firstLang]) {
            clearInterval(interval);
            setAudioGenerationStatus('idle');
            setSurvey(surveyData);
            setLocalSections(surveyData.questionSections || []);
            toast.success("Audio generated successfully");
          }
        } catch (err) {
          console.error("Polling error for audio generation", err);
        }
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [audioGenerationStatus, surveyId]);

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
        
        if (q.showIf) {
          if (!q.showIf.questionId) {
            return `Question ${qIdx + 1} in section "${section.sectionName}" has incomplete logic (missing target question). Please complete or remove it.`;
          }
          if (!q.showIf.equals || q.showIf.equals.trim() === '') {
            return `Question ${qIdx + 1} in section "${section.sectionName}" has incomplete logic (missing comparison value). Please complete or remove it.`;
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
      toast.success("Survey approved successfully");
      fetchInitialNotifications();
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
      await surveyClient.updateSurvey(surveyId, { name: localTitle, description: localDescription, questionSections: localSections });
      setSurvey(prev => ({ ...prev, name: localTitle, description: localDescription, questionSections: localSections }));
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
      toast.info("Hold on we are translating this survey for you");
      navigate('/sdrd');
    } catch (err) {
      setShowErrorModal("Translation initiation failed: " + err.message);
      setTranslateStatus('idle');
    }
  };

  const handleGenerateAudio = async () => {
    setAudioGenerationStatus('processing');
    setShowAudioModal(false);
    try {
      await aiClient.generateAudio(surveyId);
      toast.info("Hold on we are generating audio for this survey");
      navigate('/sdrd');
    } catch (err) {
      setShowErrorModal("Failed to initiate audio generation: " + err.message);
      setAudioGenerationStatus('idle');
    }
  };

  const playAudio = async (audioId) => {
    if (!audioId) return;

    if (audioId === 'stitched') {
      toast.info("Dynamic audio with variables can only be played in the live survey.");
      return;
    }

    if (playingAudioId === audioId && audioObjRef.current) {
      if (!audioObjRef.current.paused) {
        audioObjRef.current.pause();
        if (reqAnimRef.current) cancelAnimationFrame(reqAnimRef.current);
        if (activeQuestionRef.current) {
          activeQuestionRef.current.style.setProperty('--audio-intensity', '0');
        }
        setPlayingAudioId(null);
      }
      return;
    }

    cleanupAudio();
    setPlayingAudioId(audioId);

    try {
      const url = `/speech/audio/${surveyId}/${audioId}`;
      const audio = new Audio(url);
      audio.crossOrigin = "anonymous";
      audioObjRef.current = audio;

      audio.onended = () => {
        setPlayingAudioId(null);
        if (reqAnimRef.current) cancelAnimationFrame(reqAnimRef.current);
        if (activeQuestionRef.current) {
          activeQuestionRef.current.style.setProperty('--audio-intensity', '0');
        }
      };

      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        analyserRef.current = audioCtxRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
      }
      
      if (audioCtxRef.current.state === 'suspended') {
        await audioCtxRef.current.resume();
      }

      sourceNodeRef.current = audioCtxRef.current.createMediaElementSource(audio);
      sourceNodeRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioCtxRef.current.destination);

      await audio.play();

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      const update = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        const intensity = (average / 255).toFixed(3);

        if (activeQuestionRef.current) {
          activeQuestionRef.current.style.setProperty('--audio-intensity', intensity);
        }
        
        reqAnimRef.current = requestAnimationFrame(update);
      };
      update();
    } catch (err) {
      console.error(err);
      toast.error("Failed to play audio");
      cleanupAudio();
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
    const updated = structuredClone(localSections);
    if (!updated[sectionIndex].questions[qIndex].text) {
      updated[sectionIndex].questions[qIndex].text = {};
    }
    updated[sectionIndex].questions[qIndex].text.english = newText;
    setLocalSections(updated);
    setHasChanges(true);
  };

  const updateOptionText = (sectionIndex, qIndex, optIndex, newLabel) => {
    const updated = structuredClone(localSections);
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
    const updated = structuredClone(localSections);
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
    const updated = structuredClone(localSections);
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
    const updated = structuredClone(localSections);
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
  const allQuestions = survey?.questionSections?.flatMap(s => s.questions) || [];
  const hasAudioGenerated = allQuestions.some(q => q.audio && Object.values(q.audio).some(audioStr => audioStr && audioStr.trim() !== ""));
  const hasLogicConfigured = allQuestions.some(q => q.showIf && q.showIf.questionId);
  const isTranslationLocked = translateStatus === 'processing' || audioGenerationStatus === 'processing' || hasTranslations || hasAudioGenerated;

  return (
    <div className="absolute inset-0 flex flex-col bg-bg">
      {/* Pinned Header — never scrolls */}
      <div className="shrink-0 z-[40] flex flex-col w-full shadow-sm bg-bg">
        {/* Top Navigation Bar (Back Button & Notifications) */}
        <div className="bg-bg border-b border-border">
        {/* Full-width container */}
        <div className="w-full px-8 py-4 flex items-center justify-between">
          <button 
            className="inline-flex items-center gap-2 text-sm font-medium text-text-muted hover:text-text-primary transition-colors"
            onClick={() => navigate('/sdrd')}
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>

          {/* Notification Bell */}
          <button 
            onClick={toggleSidebar}
            className="relative p-1.5 text-text-secondary hover:text-text-primary hover:bg-black/5 rounded-md transition-colors"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 flex items-center justify-center min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full border border-bg shadow-sm">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>
        
      {/* Title and Actions Bar */}
      <div className="w-full bg-surface border-b border-border pt-6 pb-6">
        {/* Constrained container for Title and Actions */}
        <div className="w-full max-w-[1200px] mx-auto px-6 flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="flex-1 min-w-0">
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
            <div className="flex flex-col gap-1 mb-2">
              <div className="flex items-center gap-3 group flex-wrap">
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
          <div className="flex items-center gap-3 shrink-0 relative">
            {hasChanges && (
              <button className="inline-flex items-center justify-center gap-2 px-4 h-9 text-sm font-medium rounded-md bg-white border border-border text-text-primary hover:bg-surface-alt transition-colors disabled:opacity-50 shrink-0 whitespace-nowrap" onClick={handleManualSave} disabled={saving || translateStatus === 'processing' || hasAudioGenerated} title={hasAudioGenerated ? "Survey is locked after audio generation" : ""}>
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save Draft
              </button>
            )}

            <button className="inline-flex items-center justify-center gap-2 px-4 h-9 text-sm font-medium rounded-md bg-black text-white hover:bg-neutral-800 transition-colors disabled:opacity-50 shrink-0 whitespace-nowrap" onClick={() => setShowApproveModal(true)} disabled={approving || translateStatus === 'processing'}>
              {approving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              Approve
            </button>
            
            <div className="relative">
              <button 
                className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-white border border-border text-text-primary hover:bg-surface-alt transition-colors disabled:opacity-50 shrink-0" 
                onClick={() => setShowActionMenu(!showActionMenu)}
              >
                <MoreVertical size={16} />
              </button>
              
              {showActionMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowActionMenu(false)} />
                  <div className="absolute right-0 top-[calc(100%+8px)] w-56 bg-white border border-border rounded-md shadow-[0_4px_6px_rgba(0,0,0,0.07),0_2px_4px_rgba(0,0,0,0.06)] py-1 z-50 flex flex-col">
                    <div className="h-px bg-border my-1 mx-2"></div>
                    <button 
                      className="w-full text-left px-4 py-2.5 text-sm font-medium text-geist-error hover:bg-geist-error/10 flex items-center gap-2.5 disabled:opacity-50 transition-colors"
                      onClick={() => { setShowActionMenu(false); setDeleteModal({ show: true, type: 'survey', message: 'Are you sure you want to delete this entire survey? This action cannot be undone.' }); }}
                      disabled={translateStatus === 'processing' || audioGenerationStatus === 'processing'}
                    >
                      <Trash2 size={15} /> Delete Survey
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
      </div>

      {/* Scrollable Content — only this area scrolls */}
      <div className="flex-1 overflow-y-auto min-h-0">
      <div className="flex flex-col w-full max-w-[1200px] mx-auto px-6 pb-24 pt-6">
      
      {/* Description Panel */}
      {showDescPanel ? (
        <div className="bg-surface-alt border border-border rounded-md p-6 mb-8 w-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold tracking-tight m-0">Survey Description</h3>
            <button className="inline-flex items-center justify-center w-8 h-8 rounded text-text-muted hover:bg-black/5 hover:text-text-primary transition-colors" onClick={() => setShowDescPanel(false)}>
              <X size={16} />
            </button>
          </div>
          <div className="flex flex-col gap-4">
            <textarea 
              className="w-full px-4 py-3 bg-white border border-border rounded-md text-sm text-text-primary focus:outline-none focus:border-geist-blue transition-colors min-h-[120px] resize-y"
              value={localDescription}
              onChange={(e) => {
                setLocalDescription(e.target.value);
                setHasChanges(true);
              }}
              placeholder="Enter an optional description for this survey..."
              autoFocus
            />
            <div className="flex justify-end">
              <button 
                className="inline-flex items-center justify-center gap-1.5 px-5 h-9 text-sm font-medium rounded-md bg-black text-white hover:bg-neutral-800 transition-colors"
                onClick={() => setShowDescPanel(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-md p-6 mb-8 w-full">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-lg font-semibold tracking-tight m-0">Survey Description</h3>
            {isPending && (
              <button
                className="inline-flex items-center justify-center gap-1.5 px-3 h-8 text-xs font-medium rounded bg-surface border border-border text-text-muted hover:bg-surface-alt hover:text-text-primary transition-colors shrink-0"
                onClick={() => setShowDescPanel(true)}
                disabled={isTranslationLocked || saving || approving}
              >
                <Edit2 size={14} /> {localDescription ? 'Edit Description' : 'Add Description'}
              </button>
            )}
          </div>
          {localDescription ? (
            <p className="text-[15px] text-text-primary leading-relaxed m-0 whitespace-pre-wrap">
              {localDescription}
            </p>
          ) : (
            <p className="text-sm text-text-muted italic m-0">
              No description provided. Add one to give respondents more context.
            </p>
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
      <div className="flex flex-col">
        {localSections.map((sec, secIdx) => {
          const isDraggable = secIdx !== 0 && !editingSections[secIdx]; // Don't drag Demographics or editing sections
          const isThisSectionDragging = draggedSectionIdx === secIdx;
          const isAnySectionDragging = draggedSectionIdx !== null;
          const isDropTarget = dropTargetIdx === secIdx;

          return (
          <div 
            key={sec.sectionName + secIdx} 
            className="py-4"
            draggable={isDraggable && activeDragHandle === secIdx}
            onDragStart={(e) => handleDragStart(e, secIdx)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, secIdx)}
            onDragEnter={(e) => handleDragEnter(e, secIdx)}
            onDrop={(e) => handleDrop(e, secIdx)}
          >
            <div className={`bg-bg border rounded-md overflow-hidden shadow-sm transition-all duration-200 ${isThisSectionDragging ? 'opacity-40 border-dashed border-border scale-[0.98]' : 'border-border'} ${isDropTarget ? 'border-t-4 border-t-geist-blue' : ''}`}>
            
            {/* Section Header */}
            <div className={`flex justify-between items-center bg-surface px-6 py-4 border-b ${isThisSectionDragging ? 'border-transparent' : 'border-border'}`}>
              {isPending && editingSections[secIdx] ? (
                <input 
                  type="text" 
                  value={sec.sectionName}
                  onChange={(e) => {
                    const updated = structuredClone(localSections);
                    updated[secIdx].sectionName = e.target.value;
                    setLocalSections(updated);
                    setHasChanges(true);
                  }}
                  className="w-full max-w-[400px] text-lg font-semibold tracking-tight m-0 bg-transparent border-b border-dashed border-border focus:border-geist-blue outline-none py-0.5"
                  placeholder="Section Name"
                />
              ) : (
                <div className="flex items-center gap-3">
                  {isDraggable && (
                    <div 
                      className="text-border hover:text-text-muted transition-colors mr-1 flex items-center justify-center cursor-grab active:cursor-grabbing"
                      onMouseEnter={() => setActiveDragHandle(secIdx)}
                      onMouseLeave={() => setActiveDragHandle(null)}
                    >
                      <GripVertical size={20} />
                    </div>
                  )}
                  <h2 className="text-lg font-semibold tracking-tight m-0">{sec.sectionName}</h2>
                  {sec.showIf && (() => {
                    const refQ = localSections.flatMap(s => s.questions || []).find(rq => rq.qid === sec.showIf.questionId);
                    const refOpt = refQ?.options?.find(opt => opt.id === sec.showIf.equals);
                    const qText = refQ?.text?.english || sec.showIf.questionId;
                    const optText = refOpt?.label?.english || sec.showIf.equals;
                    const displayQ = qText.length > 25 ? qText.substring(0, 25) + '...' : qText;
                    const displayOpt = optText.length > 15 ? optText.substring(0, 15) + '...' : optText;
                    return (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setHighlightLogic({ qid: sec.showIf.questionId, equals: sec.showIf.equals });
                          setTimeout(() => {
                            document.getElementById(`question-${sec.showIf.questionId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            setTimeout(() => setHighlightLogic({ qid: null, equals: null }), 3000);
                          }, 100);
                        }}
                        className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full border border-amber-500/20 bg-amber-500/10 text-amber-700 uppercase tracking-wider transition-colors hover:bg-amber-500/20 cursor-pointer`}
                        title={`Logic: if "${qText}" == "${optText}". Click to view.`}
                      >
                        Logic: if "{displayQ}" == "{displayOpt}"
                      </button>
                    );
                  })()}
                </div>
              )}
              
              {isPending && (
                <div className="flex gap-2">
                  {!isTranslationLocked && survey?.questionSections?.some(s => s.sectionName === sec.sectionName) && sec.sectionName?.toLowerCase() !== 'demographics' && (
                    <button
                      className="inline-flex items-center gap-1.5 px-2.5 h-7 text-xs font-medium rounded text-geist-blue bg-geist-blue/10 border border-geist-blue/20 hover:bg-geist-blue/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => {
                        setActiveImproveSection(sec.sectionName);
                        setImproveInstructions('');
                      }}
                      disabled={improvingStatus === 'processing'}
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
                  ) : sec.sectionName?.toLowerCase() !== 'demographics' && !isLogicMode && (
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

            {/* Section Logic Builder UI */}
            {isLogicMode && secIdx > 0 && (
              <div className="px-6 py-4 bg-surface-alt border-b border-border">
                {!sec.showIf ? (
                  <button 
                    onClick={() => {
                      const updated = structuredClone(localSections);
                      updated[secIdx].showIf = { questionId: '', equals: '' };
                      setLocalSections(updated);
                      setHasChanges(true);
                    }}
                    className="text-sm font-medium text-geist-blue hover:text-blue-600 transition-colors flex items-center gap-1"
                  >
                    <Plus size={14} /> Add Section Skip Logic
                  </button>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-text-primary flex items-center gap-2">
                        <GitBranch size={14} className="text-geist-blue" />
                        Section Display Logic
                      </span>
                      <button 
                        onClick={() => {
                          const updated = structuredClone(localSections);
                          delete updated[secIdx].showIf;
                          setLocalSections(updated);
                          setHasChanges(true);
                        }}
                        className="text-text-muted hover:text-geist-error transition-colors"
                        title="Remove Logic"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    
                    {(() => {
                      const previousQuestions = [];
                      for (let i = 0; i < secIdx; i++) {
                        const sectionQuestions = localSections[i].questions;
                        for (let j = 0; j < sectionQuestions.length; j++) {
                          if (sectionQuestions[j].type === 'mcq' || sectionQuestions[j].type === 'checkbox') {
                             previousQuestions.push(sectionQuestions[j]);
                          }
                        }
                      }
                      return (
                        <div className="flex flex-wrap items-center gap-3 text-sm text-text-primary">
                          <span>Show this entire section if</span>
                          <select 
                            className="h-8 px-2 bg-white border border-border rounded-md text-sm focus:outline-none focus:border-geist-blue max-w-[200px] truncate"
                            value={sec.showIf.questionId || ''}
                            onChange={(e) => {
                              const updated = structuredClone(localSections);
                              updated[secIdx].showIf.questionId = e.target.value;
                              updated[secIdx].showIf.equals = ''; 
                              setLocalSections(updated);
                              setHasChanges(true);
                            }}
                          >
                            <option value="" disabled>Select Previous Question</option>
                            {previousQuestions.map(pq => (
                              <option key={pq.qid} value={pq.qid}>
                                {pq.text?.english?.substring(0, 40)}{pq.text?.english?.length > 40 ? '...' : ''}
                              </option>
                            ))}
                          </select>
                          
                          <span>is</span>
                          
                          <select 
                            className="h-8 px-2 bg-white border border-border rounded-md text-sm focus:outline-none focus:border-geist-blue max-w-[200px] truncate"
                            value={sec.showIf.equals || ''}
                            onChange={(e) => {
                              const updated = structuredClone(localSections);
                              updated[secIdx].showIf.equals = e.target.value;
                              setLocalSections(updated);
                              setHasChanges(true);
                            }}
                            disabled={!sec.showIf.questionId}
                          >
                            <option value="" disabled>Select Option</option>
                            {sec.showIf.questionId && previousQuestions.find(pq => pq.qid === sec.showIf.questionId)?.options?.map(opt => (
                              <option key={opt.id} value={opt.id}>
                                {opt.label?.english}
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

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
              <div className={`px-6 transition-all duration-300 ease-in-out overflow-hidden ${isAnySectionDragging ? 'max-h-0 opacity-0 py-0' : 'max-h-[10000px] opacity-100 py-2'}`}>
                {sec.questions.map((q, qIdx) => {
                  const isActiveAudio = playingAudioId && playingAudioId === q.audio?.[viewLang];
                  const previousQuestions = [];
                  const allPreviousQuestions = [];
                  for (let i = 0; i <= secIdx; i++) {
                    const sectionQuestions = localSections[i].questions;
                    for (let j = 0; j < sectionQuestions.length; j++) {
                      if (i === secIdx && j >= qIdx) break;
                      allPreviousQuestions.push(sectionQuestions[j]);
                      if (['mcq', 'checkbox', 'text'].includes(sectionQuestions[j].type)) {
                         previousQuestions.push(sectionQuestions[j]);
                      }
                    }
                  }
                  return (
                <div key={q.qid} id={`question-${q.qid}`} ref={isActiveAudio ? activeQuestionRef : null} className={`transition-all duration-300 ${isActiveAudio ? 'audio-glow-wrapper bg-bg shadow-sm rounded-md p-4 -mx-4 my-2 border border-transparent' : highlightLogic.qid === q.qid ? 'bg-amber-50 shadow-sm rounded-md p-4 -mx-4 my-2 border border-amber-200' : `py-4 ${qIdx === sec.questions.length - 1 ? '' : 'border-b border-border/50'}`}`}>
                  
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
                    {q.showIf && (() => {
                      const refQ = localSections.flatMap(s => s.questions).find(rq => rq.qid === q.showIf.questionId);
                      const refOpt = refQ?.options?.find(opt => opt.id === q.showIf.equals);
                      const qText = refQ?.text?.english || q.showIf.questionId;
                      const optText = refOpt?.label?.english || q.showIf.equals;
                      const displayQ = qText.length > 25 ? qText.substring(0, 25) + '...' : qText;
                      const displayOpt = optText.length > 15 ? optText.substring(0, 15) + '...' : optText;
                      const op = q.showIf.operator || '==';
                      return (
                        <button 
                          onClick={() => {
                            setHighlightLogic({ qid: q.showIf.questionId, equals: q.showIf.equals });
                            setTimeout(() => {
                              document.getElementById(`question-${q.showIf.questionId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              setTimeout(() => setHighlightLogic({ qid: null, equals: null }), 3000);
                            }, 100);
                          }}
                          className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full border border-amber-500/20 bg-amber-500/10 text-amber-700 uppercase tracking-wider hover:bg-amber-500/20 transition-colors cursor-pointer"
                          title={`Logic: if "${qText}" ${op} "${optText}". Click to view.`}
                        >
                          Logic: if "{displayQ}" {op} "{displayOpt}"
                        </button>
                      );
                    })()}
                    <div className="ml-auto flex items-center gap-3">
                      {isPending && editingSections[secIdx] && secIdx !== 0 && allPreviousQuestions.length > 0 && (
                        <div className="relative inline-block shrink-0">
                          <select 
                            className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                            title="Insert Variable"
                            value=""
                            onChange={(e) => {
                              if(e.target.value) {
                                questionInputRefs.current[`${secIdx}-${qIdx}`]?.insertVariable(e.target.value);
                              }
                            }}
                          >
                            <option value="">+ Insert Variable</option>
                            {allPreviousQuestions.map(pq => (
                              <option key={pq.qid} value={pq.qid}>
                                {pq.text?.english?.substring(0, 30)}{pq.text?.english?.length > 30 ? '...' : ''}
                              </option>
                            ))}
                          </select>
                          <button className="inline-flex items-center justify-center h-7 px-2 rounded border border-border bg-surface hover:bg-surface-alt text-text-muted hover:text-geist-blue transition-colors text-[11px] font-medium pointer-events-none shadow-sm">
                            {"{ }"} Variable
                          </button>
                        </div>
                      )}
                      {isPending && editingSections[secIdx] && (
                        <button 
                          className="text-text-muted hover:text-geist-error transition-colors"
                          onClick={() => deleteQuestion(secIdx, qIdx)}
                          title="Delete Question"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {isPending && editingSections[secIdx] ? (
                    <div className="ml-9 flex items-center gap-2 w-full pr-4">
                      <RichQuestionInput
                        ref={(el) => { if (el) questionInputRefs.current[`${secIdx}-${qIdx}`] = el; }}
                        value={q.text?.english || ''}
                        onChange={(val) => updateQuestionText(secIdx, qIdx, val)}
                        previousQuestions={secIdx !== 0 ? allPreviousQuestions : []}
                        placeholder="Type your question..."
                      />
                    </div>
                  ) : (
                    <div className="ml-10 flex items-center gap-3 py-1">
                      <span className="text-base font-medium text-text-primary">
                        {renderTemplatedText(q.text?.[viewLang] || q.text?.english, allPreviousQuestions, null)}
                      </span>
                      {q.audio && q.audio[viewLang] && q.audio[viewLang].trim() !== "" && (
                        <button onClick={() => playAudio(q.audio[viewLang])} className={`transition-colors ${playingAudioId === q.audio[viewLang] ? 'text-geist-blue hover:text-blue-600' : 'text-text-muted hover:text-text-primary'}`} title="Play audio">
                          <Volume2 size={18} />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Options */}
                  {(q.type === 'mcq' || q.type === 'checkbox') && q.options && (
                    <div className="flex flex-col gap-2 ml-10 mt-3">
                      {q.options.map((opt, optIdx) => {
                        const isHighlightedOpt = highlightLogic.qid === q.qid && highlightLogic.equals === opt.id;
                        return (
                        <div key={opt.id} className={`flex items-center gap-2 ${isHighlightedOpt ? 'bg-amber-100 px-2 py-1 -mx-2 rounded transition-colors duration-300' : ''}`}>
                          <div className={`w-4 h-4 border border-border shrink-0 ${q.type === 'mcq' ? 'rounded-full' : 'rounded-sm'}`} />
                          {isPending && editingSections[secIdx] ? (
                            <div className="flex flex-1 items-center gap-2">
                              <input 
                                type="text"
                                value={opt.label?.english || ''}
                                onChange={(e) => updateOptionText(secIdx, qIdx, optIdx, e.target.value)}
                                className="flex-1 bg-transparent border border-dashed border-gray-300 focus:border-geist-blue hover:border-gray-400 text-text-muted text-sm px-1 py-0.5 outline-none transition-colors rounded-sm"
                              />
                              <button onClick={() => deleteOption(secIdx, qIdx, optIdx)} className="text-text-muted hover:text-geist-error p-1 transition-colors">
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <span className="text-text-muted text-sm">{opt.label?.[viewLang] || opt.label?.english}</span>
                          )}
                        </div>
                      )})}
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

                  {/* Logic Builder UI */}
                  {isLogicMode && secIdx !== 0 && (
                    <div className="mt-4 p-4 bg-surface-alt border border-border rounded-md shadow-sm ml-10">
                      {!q.showIf ? (
                        <button 
                          onClick={() => {
                            const updated = structuredClone(localSections);
                            updated[secIdx].questions[qIdx].showIf = { questionId: '', equals: '', operator: '==' };
                            setLocalSections(updated);
                            setHasChanges(true);
                          }}
                          className="text-sm font-medium text-geist-blue hover:text-blue-600 transition-colors flex items-center gap-1"
                        >
                          <Plus size={14} /> Add Skip Logic
                        </button>
                      ) : (
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-text-primary flex items-center gap-2">
                              <GitBranch size={14} className="text-geist-blue" />
                              Display Logic
                            </span>
                            <button 
                              onClick={() => {
                                const updated = structuredClone(localSections);
                                delete updated[secIdx].questions[qIdx].showIf;
                                setLocalSections(updated);
                                setHasChanges(true);
                              }}
                              className="text-text-muted hover:text-geist-error transition-colors"
                              title="Remove Logic"
                            >
                              <X size={14} />
                            </button>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-3 text-sm text-text-primary">
                            <span>Show this question if</span>
                            <select 
                              className="h-8 px-2 bg-white border border-border rounded-md text-sm focus:outline-none focus:border-geist-blue max-w-[200px] truncate"
                              value={q.showIf.questionId || ''}
                              onChange={(e) => {
                                const updated = structuredClone(localSections);
                                updated[secIdx].questions[qIdx].showIf.questionId = e.target.value;
                                updated[secIdx].questions[qIdx].showIf.equals = ''; // reset option
                                updated[secIdx].questions[qIdx].showIf.operator = '=='; // reset operator
                                setLocalSections(updated);
                                setHasChanges(true);
                              }}
                            >
                              <option value="" disabled>Select Previous Question</option>
                              {previousQuestions.map(pq => (
                                <option key={pq.qid} value={pq.qid}>
                                  {pq.text?.english?.substring(0, 40)}{pq.text?.english?.length > 40 ? '...' : ''}
                                </option>
                              ))}
                            </select>
                            
                            {(() => {
                              const targetQ = previousQuestions.find(pq => pq.qid === q.showIf.questionId);
                              const isTextTarget = targetQ && targetQ.type === 'text';
                              const operator = q.showIf.operator || '==';
                              const val = q.showIf.equals || '';
                              
                              return (
                                <>
                                  {isTextTarget ? (
                                    <select 
                                      className="h-8 px-2 bg-white border border-border rounded-md text-sm focus:outline-none focus:border-geist-blue"
                                      value={operator}
                                      onChange={(e) => {
                                        const updated = structuredClone(localSections);
                                        updated[secIdx].questions[qIdx].showIf.operator = e.target.value;
                                        setLocalSections(updated);
                                        setHasChanges(true);
                                      }}
                                    >
                                      <option value="==">Equals</option>
                                      <option value=">">Greater Than</option>
                                      <option value="<">Less Than</option>
                                    </select>
                                  ) : (
                                    <span>is</span>
                                  )}
                                  
                                  {isTextTarget ? (
                                    <input 
                                      type="text"
                                      className="h-8 px-2 bg-white border border-border rounded-md text-sm focus:outline-none focus:border-geist-blue max-w-[200px]"
                                      placeholder="Type value..."
                                      value={val}
                                      onChange={(e) => {
                                        const updated = structuredClone(localSections);
                                        updated[secIdx].questions[qIdx].showIf.equals = e.target.value;
                                        setLocalSections(updated);
                                        setHasChanges(true);
                                      }}
                                      disabled={!q.showIf.questionId}
                                    />
                                  ) : (
                                    <select 
                                      className="h-8 px-2 bg-white border border-border rounded-md text-sm focus:outline-none focus:border-geist-blue max-w-[200px] truncate"
                                      value={val}
                                      onChange={(e) => {
                                        const updated = structuredClone(localSections);
                                        updated[secIdx].questions[qIdx].showIf.equals = e.target.value;
                                        updated[secIdx].questions[qIdx].showIf.operator = '==';
                                        setLocalSections(updated);
                                        setHasChanges(true);
                                      }}
                                      disabled={!q.showIf.questionId}
                                    >
                                      <option value="" disabled>Select Option</option>
                                      {targetQ?.options?.map(opt => (
                                        <option key={opt.id} value={opt.id}>
                                          {opt.label?.english}
                                        </option>
                                      ))}
                                    </select>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                          
                          {previousQuestions.length === 0 && (
                            <p className="text-xs text-amber-600 mt-1">There are no previous questions to base logic on.</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )})}
              
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
          </div>
        )})}

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

      {/* Dynamic Island AI Toolbar */}
      {!loading && !error && survey && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center p-1.5 rounded-full bg-white/70 backdrop-blur-md border border-border shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300">
          <button 
            className={`flex items-center justify-center h-10 px-3 rounded-full transition-all duration-300 group/btn disabled:opacity-50 ${isLogicMode ? 'bg-geist-blue/10 text-geist-blue' : 'hover:bg-black/5 text-text-primary'}`}
            onClick={() => {
              setIsLogicMode(!isLogicMode);
              if (!isLogicMode) {
                setEditingSections({});
                toast.info("Entered Logic Mode. Structural editing is locked.");
              } else {
                toast.success("Exited Logic Mode");
              }
            }}
            disabled={translateStatus === 'processing' || audioGenerationStatus === 'processing' || hasAudioGenerated}
            title="Logic Mode"
          >
            <GitBranch size={18} className="shrink-0" />
            <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 group-hover/btn:max-w-[120px] group-hover/btn:opacity-100 group-hover/btn:ml-2 transition-all duration-300 text-sm font-medium">
              Logic Mode
            </span>
          </button>
          
          <div className="w-px h-5 bg-border mx-1"></div>

          <button 
            className="flex items-center justify-center h-10 px-3 rounded-full hover:bg-black/5 transition-all duration-300 group/btn disabled:opacity-50"
            onClick={() => setShowTranslateModal(true)}
            disabled={translateStatus === 'processing' || audioGenerationStatus === 'processing' || hasAudioGenerated}
            title={hasAudioGenerated ? "Survey locked after audio generation" : "Translate Survey"}
          >
            {translateStatus === 'processing' ? <Loader2 size={18} className="text-text-primary shrink-0 animate-spin" /> : <Globe size={18} className="text-text-primary shrink-0" />}
            <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 group-hover/btn:max-w-[120px] group-hover/btn:opacity-100 group-hover/btn:ml-2 transition-all duration-300 text-sm font-medium text-text-primary">
              Translate
            </span>
          </button>
          
          <div className="w-px h-5 bg-border mx-1"></div>
          
          <button 
            className="flex items-center justify-center h-10 px-3 rounded-full hover:bg-black/5 transition-all duration-300 group/btn disabled:opacity-50"
            onClick={() => setShowAudioModal(true)}
            disabled={audioGenerationStatus === 'processing' || translateStatus === 'processing' || hasAudioGenerated}
            title={hasAudioGenerated ? "Audio already generated" : "Generate Audio"}
          >
            {audioGenerationStatus === 'processing' ? <Loader2 size={18} className="text-text-primary shrink-0 animate-spin" /> : <AudioLines size={18} className="text-text-primary shrink-0" />}
            <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 group-hover/btn:max-w-[120px] group-hover/btn:opacity-100 group-hover/btn:ml-2 transition-all duration-300 text-sm font-medium text-text-primary">
              Generate Audio
            </span>
          </button>
        </div>
      )}

      {/* Translate Survey Modal */}
      {showTranslateModal && (
        <div className="fixed inset-0 w-screen h-screen bg-black/40 backdrop-blur-sm flex items-center justify-center z-[1000]" onClick={() => setShowTranslateModal(false)}>
          <div className="bg-bg border border-border rounded-md shadow-lg w-full max-w-[480px] flex flex-col animate-[modalIn_0.2s_ease-out]" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-semibold m-0 text-text-primary">Translate Survey</h2>
              <button className="inline-flex items-center justify-center w-8 h-8 rounded text-text-muted hover:bg-surface hover:text-text-primary transition-colors disabled:opacity-50" onClick={() => setShowTranslateModal(false)} disabled={translateStatus === 'processing'}><X size={16} /></button>
            </div>
            <div className="p-5">
              <p className="m-0 text-sm text-text-secondary mb-4">
                Select regional languages to translate the English survey into. This will run an AI translation across all sections, questions, and options.
              </p>
              <div className="flex flex-wrap gap-2">
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
            <div className="px-5 py-3 border-t border-border bg-surface-alt rounded-b-md flex items-center justify-end gap-3">
              <button className="inline-flex items-center justify-center px-4 h-9 text-sm font-medium rounded-md bg-white border border-border text-text-primary hover:bg-surface transition-colors disabled:opacity-50" onClick={() => setShowTranslateModal(false)} disabled={translateStatus === 'processing'}>Cancel</button>
              <button className="inline-flex items-center justify-center gap-2 px-4 h-9 text-sm font-medium rounded-md bg-black text-white hover:bg-neutral-800 transition-colors disabled:opacity-50" onClick={handleTranslateSubmit} disabled={translateStatus === 'processing'}>
                {translateStatus === 'processing' ? (
                  <><Loader2 size={16} className="animate-spin" /> Translating...</>
                ) : (
                  <><Globe size={16} /> Translate</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audio Generation Confirmation Modal */}
      {showAudioModal && (
        <div className="fixed inset-0 w-screen h-screen bg-black/40 backdrop-blur-sm flex items-center justify-center z-[1000]" onClick={() => setShowAudioModal(false)}>
          <div className="bg-bg border border-border rounded-md shadow-lg w-full max-w-[480px] flex flex-col animate-[modalIn_0.2s_ease-out]" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-semibold m-0 text-text-primary">Generate Audio</h2>
              <button className="inline-flex items-center justify-center w-8 h-8 rounded text-text-muted hover:bg-surface hover:text-text-primary transition-colors" onClick={() => setShowAudioModal(false)}><X size={16} /></button>
            </div>
            <div className="p-5">
              <p className="m-0 text-sm text-text-secondary">
                Are you sure you want to generate audio? The audio will be generated for these languages: <span className="font-medium text-text-primary capitalize">{survey?.supportedLanguages?.join(', ') || 'English'}</span>.
              </p>
            </div>
            <div className="px-5 py-3 border-t border-border bg-surface-alt rounded-b-md flex items-center justify-end gap-3">
              <button className="inline-flex items-center justify-center px-4 h-9 text-sm font-medium rounded-md bg-white border border-border text-text-primary hover:bg-surface transition-colors" onClick={() => setShowAudioModal(false)}>Cancel</button>
              <button className="inline-flex items-center justify-center px-4 h-9 text-sm font-medium rounded-md bg-black text-white hover:bg-neutral-800 transition-colors" onClick={handleGenerateAudio}>Generate</button>
            </div>
          </div>
        </div>
      )}

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

      {/* Reorder Conflict Modal */}
      {reorderConflictModal.show && (
        <div className="fixed inset-0 w-screen h-screen bg-black/40 backdrop-blur-sm flex items-center justify-center z-[1000]" onClick={() => setReorderConflictModal({ show: false, fromIdx: null, toIdx: null, conflicts: [], proposedSections: [] })}>
          <div className="bg-bg border border-border rounded-md shadow-lg w-full max-w-[500px] flex flex-col animate-[modalIn_0.2s_ease-out]" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-border flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
                <AlertCircle size={18} />
              </div>
              <h2 className="text-lg font-semibold m-0 text-text-primary">Logic Conflicts Detected</h2>
            </div>
            <div className="p-5 max-h-[60vh] overflow-y-auto">
              <p className="m-0 text-sm text-text-secondary mb-4">
                Moving this section will break the following skip logic rules and template variables because they reference questions that will now appear after them:
              </p>
              <ul className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-4 list-disc list-inside flex flex-col gap-2">
                {reorderConflictModal.conflicts.map((conflict, i) => (
                  <li key={i}>{conflict}</li>
                ))}
              </ul>
              <p className="m-0 text-sm text-text-secondary mt-4 font-medium">
                Do you want to proceed? Acknowledging will aggressively strip the conflicting logic and variables.
              </p>
            </div>
            <div className="px-5 py-3 border-t border-border bg-surface-alt rounded-b-md flex items-center justify-end gap-3">
              <button className="inline-flex items-center justify-center px-4 h-9 text-sm font-medium rounded-md bg-white border border-border text-text-primary hover:bg-surface transition-colors" onClick={() => setReorderConflictModal({ show: false, fromIdx: null, toIdx: null, conflicts: [], proposedSections: [] })}>Cancel (Revert Move)</button>
              <button className="inline-flex items-center justify-center px-4 h-9 text-sm font-medium rounded-md bg-amber-600 text-white hover:bg-amber-700 transition-colors" onClick={handleAcknowledgeReorder}>Acknowledge & Clear Logic</button>
            </div>
          </div>
        </div>
      )}
      </div>
      </div>
      
      <NotificationSidebar />
    </div>
  );
}
