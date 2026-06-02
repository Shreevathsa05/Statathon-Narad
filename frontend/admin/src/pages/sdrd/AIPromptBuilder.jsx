import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { aiClient } from '../../api/aiClient';
import { Sparkles, ArrowRight, ArrowLeft, Loader2, AlertCircle, Bot, CheckCircle2 } from 'lucide-react';
import { surveyClient } from '../../api/survey';

export default function AIPromptBuilder() {
  const navigate = useNavigate();
  
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState([]);
  // States: 'idle', 'processing', 'vague', 'needs_title', 'completed', 'error'
  const [status, setStatus] = useState('idle');
  const [surveyId, setSurveyId] = useState(null);
  const [error, setError] = useState(null);
  const [agentLogs, setAgentLogs] = useState([]);
  const [generatedSurvey, setGeneratedSurvey] = useState(null);
  
  const [initialQuery, setInitialQuery] = useState('');
  const [clarification, setClarification] = useState('');
  
  // Mock Agentic UI States
  const [agentStep, setAgentStep] = useState(0);

  const isInitial = messages.length === 0 && status === 'idle';

  const messagesEndRef = useRef(null);
  const logContainerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(() => scrollToBottom(), [messages, status, agentStep]);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [agentLogs]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || status === 'processing' || status === 'completed') return;
    
    const currentInput = inputValue.trim();
    
    setMessages(prev => [...prev, { role: 'user', content: currentInput }]);
    setInputValue('');
    setError(null);
    setAgentStep(0);
    
    const prevStatus = status;
    setStatus('processing');
    
    try {
      let res;
      if (prevStatus === 'idle') {
        setInitialQuery(currentInput);
        res = await aiClient.generateEnglishQuestions(currentInput);
      } else if (prevStatus === 'vague') {
        setClarification(currentInput);
        res = await aiClient.generateEnglishQuestions(initialQuery, currentInput);
      } else if (prevStatus === 'needs_title') {
        res = await aiClient.generateEnglishQuestions(initialQuery, clarification, currentInput);
      }
      
      if (res.status === 'vague') {
        setMessages(prev => [...prev, { role: 'assistant', type: 'clarification', questions: res.questions }]);
        setStatus('vague');
      } else if (res.status === 'needs_title') {
        setMessages(prev => [...prev, { role: 'assistant', content: "Great! Please provide a title for this survey." }]);
        setStatus('needs_title');
      } else if (res.status === 'processing' && res.surveyId) {
        setSurveyId(res.surveyId);
        setStatus('processing');
      } else {
        throw new Error('Unexpected API response');
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
      setStatus(prevStatus);
    }
  };

  useEffect(() => {
    let interval;
    let stepInterval;
    if (status === 'processing' && surveyId) {
      stepInterval = setInterval(() => {
        setAgentStep(prev => (prev < 3 ? prev + 1 : prev));
      }, 2000);

      interval = setInterval(async () => {
        try {
          const res = await aiClient.pollEnglishQuestions(surveyId);
          if (res.logs && res.logs.length > 0) {
            setAgentLogs(res.logs);
          }
          if (res.status === 'completed') {
            clearInterval(interval);
            clearInterval(stepInterval);
            setAgentStep(4);
            try {
              const sRes = await surveyClient.getSurveyById(surveyId);
              setGeneratedSurvey(sRes.data.data);
            } catch (e) {
              console.error("Failed to fetch generated survey inline", e);
            }
            setTimeout(() => {
                setStatus('completed');
            }, 1500); // Wait 1.5s to show shimmering skeleton before rendering SurveyEditor
          } else if (res.status === 'vague') {
            clearInterval(interval);
            clearInterval(stepInterval);
            setMessages(prev => [...prev, { role: 'assistant', type: 'clarification', questions: res.questions || res.clarifying_questions || res.refiningQuestions || [] }]);
            setStatus('vague');
          } else if (res.status === 'failed' || res.status === 'error') {
            clearInterval(interval);
            clearInterval(stepInterval);
            setError(res.error || res.message || 'Generation failed during processing.');
            setStatus('idle');
          }
        } catch (err) {
          console.error("Polling error", err);
        }
      }, 5000);
      
    }
    return () => {
      clearInterval(interval);
      clearInterval(stepInterval);
    };
  }, [status, surveyId]);

  return (
    <div className="flex flex-col flex-1 min-w-0 h-screen bg-bg relative overflow-hidden">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-6 z-10 bg-gradient-to-b from-bg via-bg to-transparent">
        <button 
          className="inline-flex items-center gap-2 text-sm font-medium text-text-muted hover:text-text-primary transition-colors"
          onClick={() => navigate('/sdrd')}
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto w-full max-w-[800px] mx-auto pt-24 pb-48 px-6 flex flex-col relative">
        
        {/* Initial Hero - Fades out in place quickly when chat starts */}
        <div className={`transition-opacity duration-300 absolute left-1/2 -translate-x-1/2 w-full max-w-[65ch] flex flex-col items-center justify-center top-1/2 -translate-y-[200px] ${!isInitial ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-[16px] bg-white border shadow-sm border-border text-text-primary mb-6">
            <Sparkles size={24} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary mb-3 text-center">
            What do you want to survey?
          </h1>
          <p className="text-base text-text-muted max-w-[500px] text-center leading-relaxed">
            Describe your research goal. Our AI will instantly draft a complete, structured national survey including standard demographics.
          </p>
        </div>

        {/* Chat History */}
        <div className={`flex flex-col gap-8 transition-opacity duration-700 delay-300 ${messages.length === 0 ? 'opacity-0 hidden' : 'opacity-100'}`}>
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-white border border-border flex items-center justify-center text-geist-blue shrink-0 mt-1 shadow-sm">
                  <Sparkles size={14} />
                </div>
              )}
              
              <div className={`max-w-[80%] px-5 py-3.5 text-[15px] leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-surface-alt border border-border text-text-primary rounded-2xl rounded-tr-sm' : 'bg-white border border-border text-text-primary rounded-2xl rounded-tl-sm'}`}>
                {msg.type === 'clarification' ? (
                  <div className="flex flex-col gap-3">
                    <p className="m-0 font-medium text-text-primary flex items-center gap-2">I need a bit more detail to finalize the schema:</p>
                    <ul className="list-disc pl-4 m-0 space-y-1 text-text-secondary">
                      {msg.questions.map((q, i) => <li key={i}>{q}</li>)}
                    </ul>
                  </div>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}

          {/* Agentic UI - ReAct Chain of Thought */}
          {(status === 'processing' || status === 'vague' || status === 'needs_title' || status === 'completed') && (
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-white border border-border flex items-center justify-center text-geist-blue shrink-0 mt-1 shadow-sm relative z-10 overflow-hidden">
                <Sparkles size={14} className="animate-pulse" />
              </div>
              <div className="flex flex-col gap-4 w-full max-w-[80%] pt-1 relative">
                <div className="absolute left-[7px] top-4 bottom-2 w-[2px] bg-neutral-300 z-0 rounded-full"></div>
                <div className="flex flex-col gap-5 font-mono text-[13px] relative z-10">
                  <div className={`flex items-start gap-3 transition-opacity duration-500 bg-bg ${agentStep >= 0 ? 'text-text-primary' : 'text-text-muted opacity-30'}`}>
                    <div className="bg-bg py-1">
                      {agentStep > 0 || status === 'vague' || status === 'needs_title' ? <CheckCircle2 size={16} className="text-geist-blue shrink-0" /> : <Loader2 size={16} className="animate-spin text-text-muted shrink-0" />}
                    </div>
                    <span className="py-1"><strong className="font-semibold text-text-secondary mr-2">[Analyze]</strong> Parsing context and establishing target demographics...</span>
                  </div>
                  {status === 'vague' && (
                    <div className={`flex items-start gap-3 transition-opacity duration-500 animate-[modalIn_0.3s_ease-out] bg-bg text-text-primary`}>
                      <div className="bg-bg py-1">
                        <Loader2 size={16} className="animate-spin text-geist-blue shrink-0" />
                      </div>
                      <span className="py-1"><strong className="font-semibold text-text-secondary mr-2">[Clarify]</strong> Awaiting your response to finalize schema parameters...</span>
                    </div>
                  )}
                  {status === 'needs_title' && (
                    <div className={`flex items-start gap-3 transition-opacity duration-500 animate-[modalIn_0.3s_ease-out] bg-bg text-text-primary`}>
                      <div className="bg-bg py-1">
                        <Loader2 size={16} className="animate-spin text-geist-blue shrink-0" />
                      </div>
                      <span className="py-1"><strong className="font-semibold text-text-secondary mr-2">[Name Survey]</strong> Waiting for user input to name the survey...</span>
                    </div>
                  )}
                  {agentStep >= 1 && status !== 'vague' && status !== 'needs_title' && (
                    <div className={`flex items-start gap-3 transition-opacity duration-500 animate-[modalIn_0.3s_ease-out] bg-bg ${agentStep >= 1 ? 'text-text-primary' : 'text-text-muted opacity-30'}`}>
                      <div className="bg-bg py-1">
                        {agentStep > 1 ? <CheckCircle2 size={16} className="text-geist-blue shrink-0" /> : <Loader2 size={16} className="animate-spin text-text-muted shrink-0" />}
                      </div>
                      <span className="py-1"><strong className="font-semibold text-text-secondary mr-2">[Deploy]</strong> Initiating 5 parallel subagents for sector-specific sections...</span>
                    </div>
                  )}
                  {agentStep >= 2 && (
                    <div className={`flex items-start gap-3 transition-opacity duration-500 animate-[modalIn_0.3s_ease-out] bg-bg ${agentStep >= 2 ? 'text-text-primary' : 'text-text-muted opacity-30'}`}>
                      <div className="bg-bg py-1">
                        {agentStep > 2 ? <CheckCircle2 size={16} className="text-geist-blue shrink-0" /> : <Loader2 size={16} className="animate-spin text-text-muted shrink-0" />}
                      </div>
                      <span className="py-1"><strong className="font-semibold text-text-secondary mr-2">[Validate]</strong> Cross-referencing against standard NSS frameworks...</span>
                    </div>
                  )}
                  {agentStep >= 3 && (
                    <div className={`flex items-start gap-3 transition-opacity duration-500 animate-[modalIn_0.3s_ease-out] bg-bg ${agentStep >= 3 ? 'text-text-primary' : 'text-text-muted opacity-30'}`}>
                      <div className="bg-bg py-1">
                        {agentStep > 3 ? <CheckCircle2 size={16} className="text-geist-blue shrink-0" /> : <Loader2 size={16} className="animate-spin text-text-muted shrink-0" />}
                      </div>
                      <div className="flex flex-col py-1 w-full">
                        <span><strong className="font-semibold text-text-secondary mr-2">[Compile]</strong> Assembling structural matrix for ID {surveyId || '...'}.</span>
                        {agentStep === 3 && (
                          <div className="mt-3 w-full">
                            <span className="text-[11px] text-text-muted animate-pulse block mb-2">This process involves multiple AI subagents and can take 60-90 seconds...</span>
                            {agentLogs.length > 0 && (
                              <div ref={logContainerRef} className="w-full bg-white border border-border/60 rounded-md p-3 max-h-28 overflow-y-auto text-[11px] font-mono text-text-muted flex flex-col gap-1 shadow-inner scrollbar-thin">
                                {agentLogs.map((log, i) => {
                                  const dist = agentLogs.length - 1 - i;
                                  const opacity = Math.max(0.3, 1 - dist * 0.25);
                                  return (
                                    <div key={i} className="whitespace-pre-wrap transition-opacity duration-500" style={{ opacity }}>{log}</div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {agentStep === 4 && !generatedSurvey && (
                  <div className="mt-2 p-5 border border-border rounded-2xl bg-white shadow-sm animate-[modalIn_0.5s_ease-out]">
                    <div className="flex flex-col gap-4">
                      <div className="h-5 bg-border/40 rounded-md w-1/3 animate-pulse"></div>
                      <div className="space-y-2">
                        <div className="h-3 bg-border/20 rounded-md w-full animate-pulse"></div>
                        <div className="h-3 bg-border/20 rounded-md w-5/6 animate-pulse"></div>
                        <div className="h-3 bg-border/20 rounded-md w-4/6 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {status === 'completed' && generatedSurvey && (
            <div className="flex flex-col gap-6 mt-6 ml-12 animate-[modalIn_0.6s_ease-out]">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 text-green-700 text-sm font-medium border border-green-200 self-start">
                <CheckCircle2 size={16} /> Generation Complete
              </div>
              {generatedSurvey.questionSections?.map((section, idx) => (
                <div key={idx} className="bg-white border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="text-lg font-semibold text-text-primary mb-2">{section.sectionName}</h3>
                  <p className="text-sm text-text-muted mb-6">{section.description}</p>
                  <div className="flex flex-col gap-4">
                    {section.questions?.map((q, qIdx) => (
                      <div key={qIdx} className="flex gap-4 p-4 rounded-xl bg-surface-alt border border-border/50">
                         <div className="text-xs font-semibold text-text-muted mt-0.5">Q{qIdx + 1}.</div>
                         <div className="flex flex-col gap-1.5 flex-1">
                           <div className="text-xs font-medium text-text-secondary px-2 py-0.5 bg-border/40 rounded w-fit">{q.type}</div>
                           <div className="text-[15px] text-text-primary font-medium mt-1">{q.text?.english || q.questionText || q.text}</div>
                           {q.options && q.options.length > 0 && (
                             <div className="flex flex-wrap gap-2 mt-2">
                               {q.options.map((opt, oIdx) => (
                                 <span key={oIdx} className="text-[13px] px-3 py-1.5 rounded-full border border-border bg-white text-text-secondary font-medium">
                                   {typeof opt === 'string' ? opt : (opt.label?.english || opt.text || opt.label)}
                                 </span>
                               ))}
                             </div>
                           )}
                         </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div ref={messagesEndRef} className="h-8" />
        </div>
      </div>

      {/* Fixed Bottom Input */}
      <div className={`absolute z-20 left-0 right-0 px-6 transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
        isInitial 
            ? 'bottom-1/2 translate-y-[100px]' 
            : 'bottom-0 translate-y-0 pt-10 pb-8 bg-gradient-to-t from-bg via-bg to-transparent'
      }`}>
        <div className="max-w-[800px] mx-auto">
          {error && (
            <div className="flex items-start px-4 py-3 rounded-xl text-sm border border-geist-error/20 bg-geist-error/10 text-geist-error mb-4">
              <AlertCircle size={16} className="shrink-0 mr-2 mt-0.5" />
              <div className="flex flex-col">
                <span className="font-semibold">Error</span>
                {error}
              </div>
            </div>
          )}

          {status === 'completed' && surveyId ? (
            <button
              onClick={() => navigate(`/sdrd/editor/${surveyId}`)}
              className="w-full flex items-center justify-center gap-2 bg-black text-white py-4 rounded-2xl font-medium hover:bg-neutral-800 transition-colors shadow-sm animate-[modalIn_0.3s_ease-out]"
            >
              Go to Editor <ArrowRight size={18} />
            </button>
          ) : (
            <div className={`transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${status === 'processing' ? 'ai-glow-wrapper shadow-md scale-[1.01]' : 'p-0 shadow-sm rounded-2xl'}`}>
              <form onSubmit={handleSubmit} className={`relative flex flex-col rounded-2xl transition-all ${status === 'processing' ? 'ai-glow-inner' : 'bg-[#F0F0F0] border border-border focus-within:border-geist-blue focus-within:ring-[3px] focus-within:ring-geist-blue/10'}`}>
              <textarea
                className="w-full bg-transparent border-none outline-none text-[15px] text-text-primary resize-none min-h-[60px] max-h-[200px] py-4 pl-5 pr-14 overflow-y-auto leading-relaxed"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={status === 'needs_title' ? "Enter a title for your survey..." : (status === 'vague' ? "Answer the clarifying questions..." : "Ask anything...")}
                autoFocus
                rows={1}
                disabled={status === 'processing'}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />

              <button
                type="submit"
                disabled={!inputValue.trim() || status === 'processing'}
                className="absolute right-3 bottom-3 w-8 h-8 rounded-full inline-flex items-center justify-center bg-black text-white hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:bg-surface disabled:text-text-muted disabled:border disabled:border-border"
              >
                {status === 'processing' ? <Loader2 size={16} className="animate-spin text-text-muted" /> : <ArrowRight size={16} />}
              </button>
            </form>
            </div>
          )}
          <div className="text-center mt-4">
            <span className="text-[12px] font-medium text-text-muted">AI can make mistakes. Please review the generated structural schema.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
