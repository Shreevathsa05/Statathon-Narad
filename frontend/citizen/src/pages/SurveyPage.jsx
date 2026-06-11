import { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Volume2, Loader2, Bot } from "lucide-react";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import DynamicField from "../components/survey/DynamicField";
import { shouldShowField } from "../utils/ConditionEvaluator";
import { BASE_URL, START_TIME } from "../constants";
import { speak } from "../utils/textToSpeech";
import { getOS } from "../utils/getOS";
import AuthModal from "../components/survey/AuthModal";
import AvatarSurveyMode from "../components/avatar/AvatarSurveyMode";
export default function SurveyPage() {
    const navigate = useNavigate();
    const { surveyId } = useParams();
    
    // Audio State & Refs
    const [playingAudioId, setPlayingAudioId] = useState(null);
    const audioRef = useRef(null);
    const audioCtxRef = useRef(null);
    const analyserRef = useRef(null);
    const sourceNodeRef = useRef(null);
    const reqAnimRef = useRef(null);
    const activeQuestionRef = useRef(null);

    const [errors, setErrors] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    const [questionSections, setQuestionSections] = useState([]);
    const [answers, setAnswers] = useState({});
    const [paradata, setParadata] = useState({});
    const [consent, setConsent] = useState(null);

    const [language, setLanguage] = useState("english");
    const [supportedLanguages, setSupportedLanguages] = useState([]);

    const [auth, setAuth] = useState(null);
    const [prefill, setPrefill] = useState(false);

    const [surveyName, setSurveyName] = useState("");
    const [surveyDescription, setSurveyDescription] = useState("");
    const [hasAcceptedDescription, setHasAcceptedDescription] = useState(false);
    
    const [isAvatarMode, setIsAvatarMode] = useState(false);

    // Stepper State
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const hasInitializedStep = useRef(false);
    const questionStartTimeRef = useRef(Date.now());

    const flattenedQuestions = useMemo(() => {
        return questionSections.flatMap(section => section.questions);
    }, [questionSections]);

    const activeQuestions = useMemo(() => {
        return flattenedQuestions.filter(q => shouldShowField(q, answers));
    }, [flattenedQuestions, answers]);

    const totalCount = activeQuestions.length;
    const progress = totalCount === 0 ? 0 : (currentStepIndex / totalCount) * 100;

    const firstUnansweredIdx = useMemo(() => {
        const idx = activeQuestions.findIndex(q => {
            const val = answers[q.qid];
            if (Array.isArray(val)) return val.length === 0;
            return !val;
        });
        return idx === -1 ? activeQuestions.length : idx;
    }, [activeQuestions, answers]);

    // Initialize step to first unanswered on load
    useEffect(() => {
        if (activeQuestions.length > 0 && !hasInitializedStep.current) {
            setCurrentStepIndex(firstUnansweredIdx);
            hasInitializedStep.current = true;
        }
    }, [activeQuestions, firstUnansweredIdx]);

    // Ensure currentStepIndex doesn't go completely out of bounds if skip logic shrinks array
    useEffect(() => {
        if (hasInitializedStep.current && currentStepIndex > activeQuestions.length) {
            setCurrentStepIndex(activeQuestions.length);
        }
    }, [activeQuestions.length, currentStepIndex]);

    // Reset question start timer whenever the step changes
    useEffect(() => {
        questionStartTimeRef.current = Date.now();
    }, [currentStepIndex]);

    const resolveText = (text) => {
        if (!text) return "";
        return text.replace(/\{\{(.*?)\}\}/g, (match, qid) => {
            const ans = answers[qid];
            if (!ans) return match;
            
            const refQ = flattenedQuestions.find(q => q.qid === qid);
            if (refQ && (refQ.type === 'mcq' || refQ.type === 'checkbox')) {
                const ansArray = Array.isArray(ans) ? ans : [ans];
                const labels = ansArray.map(a => {
                    const opt = refQ.options?.find(o => o.id === a);
                    return opt?.label?.[language] || opt?.label?.english || a;
                });
                return labels.join(", ");
            }
            return String(ans);
        });
    };

    const handleVerified = (data) => {
        setAuth(data);

        if (data.demographic) {
            setPrefill(true);
            setAnswers((prev) => ({
                ...prev,
                ...data.demographic
            }));
        }
    };

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${BASE_URL}/survey/${surveyId}`);
                const data = await res.json();

                if (!res.ok) {
                    setErrors(data.message || "Unable to load survey. Please try again.");
                    return;
                }

                if (res.status === 404) {
                    setErrors("Survey not found.");
                    return;
                }

                const ONE_HOUR = 60 * 60 * 1000;
                const existingStartTime = localStorage.getItem(START_TIME);

                if (!existingStartTime || (Date.now() - new Date(existingStartTime).getTime()) > ONE_HOUR) {
                    localStorage.setItem(START_TIME, new Date().toISOString());
                }

                setQuestionSections(data?.data?.questionSections || []);
                setSupportedLanguages(data?.data?.supportedLanguages);
                setSurveyName(data?.data?.name || "");
                setSurveyDescription(data?.data?.description || "");
            } catch {
                setErrors("Network error. Please check your connection.");
            } finally {
                setLoading(false);
            }
        })();
    }, [surveyId]);

    const handleChange = (qid, value) => {
        setErrors("");
        setAnswers((prev) => ({ ...prev, [qid]: value }));
    };

    const handleNext = () => {
        if (currentStepIndex < activeQuestions.length) {
            const activeQ = activeQuestions[currentStepIndex];
            const timeTaken = (Date.now() - questionStartTimeRef.current) / 1000;
            
            setParadata(prev => {
                const existing = prev[activeQ.qid] || { timeTaken: 0 };
                return {
                    ...prev,
                    [activeQ.qid]: {
                        timeTaken: existing.timeTaken + timeTaken,
                        timestamp: new Date().toISOString()
                    }
                };
            });
        }
        setCurrentStepIndex(prev => Math.min(prev + 1, activeQuestions.length));
    };

    const handleBack = () => {
        if (currentStepIndex < activeQuestions.length) {
            const activeQ = activeQuestions[currentStepIndex];
            const timeTaken = (Date.now() - questionStartTimeRef.current) / 1000;
            
            setParadata(prev => {
                const existing = prev[activeQ.qid] || { timeTaken: 0 };
                return {
                    ...prev,
                    [activeQ.qid]: {
                        timeTaken: existing.timeTaken + timeTaken,
                        timestamp: new Date().toISOString()
                    }
                };
            });
        }
        setCurrentStepIndex(prev => Math.max(prev - 1, 0));
    };

    const cleanupAudio = () => {
        if (reqAnimRef.current) cancelAnimationFrame(reqAnimRef.current);
        if (activeQuestionRef.current) {
            activeQuestionRef.current.style.setProperty('--audio-intensity', '0');
        }
    };

    const currentPlayingRef = useRef(null);

    const handleSpeakQuestion = async (field) => {
        try {
            const audioId = field.audio?.[language];
            if (!audioId || audioId.trim() === "") {
                setErrors("Pre-generated audio not found for this language.");
                return;
            }

            if (playingAudioId === field.qid && audioRef.current) {
                if (!audioRef.current.paused) {
                    audioRef.current.pause();
                    cleanupAudio();
                    setPlayingAudioId(null);
                    currentPlayingRef.current = null;
                }
                return;
            }

            cleanupAudio();
            setPlayingAudioId(field.qid);
            currentPlayingRef.current = field.qid;

            let audioQueue = [];

            if (audioId === "stitched") {
                const parts = field.audioParts?.[language] || [];
                for (const part of parts) {
                    if (part.type === "text" && part.audioId) {
                        audioQueue.push(`/speech/audio/${surveyId}/${part.audioId}`);
                    } else if (part.type === "variable" && part.refQid) {
                        const ans = answers[part.refQid];
                        if (ans) {
                            const refQ = flattenedQuestions.find(q => q.qid === part.refQid);
                            if (refQ) {
                                const ansArray = Array.isArray(ans) ? ans : [ans];
                                for (const a of ansArray) {
                                    const opt = refQ.options?.find(o => o.id === a);
                                    if (opt && opt.audio?.[language]) {
                                        audioQueue.push(`/speech/audio/${surveyId}/${opt.audio[language]}`);
                                    }
                                }
                            }
                        }
                    }
                }
            } else {
                audioQueue.push(`/speech/audio/${surveyId}/${audioId}`);
            }

            if (audioQueue.length === 0) {
                setErrors("No audio chunks available to play.");
                setPlayingAudioId(null);
                currentPlayingRef.current = null;
                return;
            }

            if (!audioCtxRef.current) {
                audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
                analyserRef.current = audioCtxRef.current.createAnalyser();
                analyserRef.current.fftSize = 256;
            }
            
            if (audioCtxRef.current.state === 'suspended') {
                await audioCtxRef.current.resume();
            }

            let queueIndex = 0;

            const playNextInQueue = async () => {
                if (queueIndex >= audioQueue.length || currentPlayingRef.current !== field.qid) {
                    if (currentPlayingRef.current === field.qid) {
                        setPlayingAudioId(null);
                        currentPlayingRef.current = null;
                        cleanupAudio();
                    }
                    return;
                }

                const url = audioQueue[queueIndex];
                const audio = new Audio(url);
                audio.crossOrigin = "anonymous";
                audioRef.current = audio;

                audio.onended = () => {
                    queueIndex++;
                    playNextInQueue();
                };

                if (sourceNodeRef.current) {
                    sourceNodeRef.current.disconnect();
                }

                sourceNodeRef.current = audioCtxRef.current.createMediaElementSource(audio);
                sourceNodeRef.current.connect(analyserRef.current);
                analyserRef.current.connect(audioCtxRef.current.destination);

                await audio.play().catch(() => {
                    setErrors("Unable to play audio. Please try again");
                    cleanupAudio();
                    setPlayingAudioId(null);
                    currentPlayingRef.current = null;
                });

                if (queueIndex === 0) {
                    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
                    const update = () => {
                        if (!analyserRef.current || currentPlayingRef.current !== field.qid) return;
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
                }
            };

            await playNextInQueue();

        } catch (e) {
            setErrors("Unable to play audio. Please try again");
            cleanupAudio();
            setPlayingAudioId(null);
            currentPlayingRef.current = null;
        }
    };

    const handleSubmit = async () => {
        if (loading || submitLoading) return;

        const allQuestions = questionSections.flatMap(section => section.questions);
        const response = allQuestions
            .filter((q) => shouldShowField(q, answers))
            .map((q) => {
                let answer = answers[q.qid];
                if (!answer) return null;

                if (typeof answer === 'number') {
                    answer = String(answer);
                }

                const pd = paradata[q.qid] || {};

                return { 
                    qid: q.qid, 
                    answer,
                    timeTaken: pd.timeTaken || 0,
                    timestamp: pd.timestamp || new Date().toISOString()
                };
            })
            .filter(Boolean);

        if (response.length === 0) {
            setErrors("No responses to submit");
            return;
        }

        const paraInfo = {
            deviceInfo: {
                os: getOS()
            },
            interviewInfo: {
                interviewMode: isAvatarMode ? "avatar" : "browser",
                interviewStartTime: localStorage.getItem(START_TIME),
            },
        }

        setErrors("");
        setSubmitLoading(true);

        try {
            const hasAudio = response.some(r => r.answer?.isAudioBlob);
            let fetchOptions;

            if (hasAudio) {
                const formData = new FormData();
                const textResponses = [];

                response.forEach((r) => {
                    if (r.answer?.isAudioBlob) {
                        formData.append(`audio_${r.qid}`, r.answer.blob, `response_${r.qid}.webm`);
                        textResponses.push({ ...r, answer: "AUDIO_UPLOADED" });
                    } else {
                        textResponses.push(r);
                    }
                });

                formData.append('response', JSON.stringify(textResponses));
                formData.append('paraInfo', JSON.stringify(paraInfo));

                fetchOptions = {
                    method: "POST",
                    body: formData,
                };
            } else {
                fetchOptions = {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ response, paraInfo }),
                };
            }

            const res = await fetch(`${BASE_URL}/response/${surveyId}`, fetchOptions);

            if (!res.ok) {
                const json = await res.json();
                setErrors(json.message || "Submission failed");
                return;
            }

            setSubmitSuccess(true);
            setTimeout(() => {
                navigate("/");
            }, 3500);
        } catch {
            setErrors("Something went wrong");
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleConsent = (val) => {
        setConsent(val);
        if (!val) {
            navigate("/")
        }
    }

    // /* ---------- CONSENT SCREEN ---------- */
    // if (consent === null) {
    //     return (
    //         <div className="min-h-screen flex items-center justify-center bg-bg px-4">
    //             <div className="max-w-md w-full bg-surface border border-border rounded-xl shadow-md p-6 space-y-5">
    //                 <h1 className="text-xl font-semibold text-text-primary">
    //                     Consent Required
    //                 </h1>

    //                 <p className="text-sm text-text-muted leading-relaxed">
    //                     By continuing, you agree to participate in this survey and allow
    //                     your responses to be used for research purposes.
    //                 </p>

    //                 <div className="flex gap-3">
    //                     <button
    //                         onClick={() => handleConsent(true)}
    //                         className="flex-1 bg-text-primary text-bg font-medium py-2 rounded-lg hover:bg-text-secondary transition-colors"
    //                     >
    //                         I Agree
    //                     </button>
    //                     <button
    //                         onClick={() => handleConsent(false)}
    //                         className="flex-1 border border-border bg-transparent text-text-muted font-medium py-2 rounded-lg hover:bg-surface-alt hover:text-text-primary transition-colors"
    //                     >
    //                         Decline
    //                     </button>
    //                 </div>
    //             </div>
    //         </div>
    //     );
    // }

    if (!hasAcceptedDescription) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-bg px-4 py-12">
                <div className="max-w-2xl w-full bg-surface border border-border rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 md:p-10 space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6 rounded-full bg-[#0070F3]"></div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text-primary m-0">
                            {surveyName || "Loading Survey..."}
                        </h1>
                    </div>
                    
                    <div className="text-[15px] text-text-muted leading-relaxed whitespace-pre-wrap bg-[#FAFAFA] p-6 rounded-lg border border-[#E5E5E5]">
                        {surveyDescription || "No description provided."}
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            onClick={() => setHasAcceptedDescription(true)}
                            className="inline-flex items-center justify-center px-8 h-12 text-[15px] font-medium rounded-lg bg-black text-white hover:bg-neutral-800 transition-all shadow-[0_4px_14px_0_rgb(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] disabled:opacity-50"
                            disabled={loading || !surveyName}
                        >
                            Attempt the survey
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!auth) {
        return <AuthModal onVerified={handleVerified} />;
    }

    if (isAvatarMode) {
        const allQuestions = questionSections.flatMap(section => section.questions);
        return (
            <AvatarSurveyMode
                questions={allQuestions}
                answers={answers}
                setAnswers={setAnswers}
                setParadata={setParadata}
                language={language}
                surveyId={surveyId}
                onComplete={handleSubmit}
                onExit={() => setIsAvatarMode(false)}
            />
        );
    }

    /* ---------- SURVEY UI ---------- */
    return (
        <div className="flex flex-col flex-1 min-w-0 bg-bg min-h-screen">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-bg/80 backdrop-blur-md border-b border-border">
                <div className="max-w-3xl mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="text-[16px] font-semibold tracking-[-0.02em] text-text-primary">Survey Form</h1>

                    <div className="flex items-center gap-3 sm:gap-4">
                        <button 
                            onClick={() => setIsAvatarMode(true)}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-black text-white text-sm font-medium hover:bg-neutral-800 transition-colors"
                        >
                            <Bot size={16} /> <span className="hidden sm:inline">Take with AI Avatar</span><span className="sm:hidden">Avatar</span>
                        </button>
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="bg-surface border border-border text-text-primary rounded-md px-3 py-1.5 text-sm outline-none focus:border-geist-blue transition-colors"
                        >
                            {supportedLanguages.map((l) => (
                                <option key={l} value={l}>
                                    {l.charAt(0).toUpperCase() + l.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </header>

            <main className="max-w-2xl w-full mx-auto p-6 space-y-8 relative min-h-[60vh] flex flex-col justify-center">
                {/* Progress Bar */}
                {questionSections.length > 0 && (
                    <div className="absolute top-0 left-0 right-0 z-10 bg-bg pb-4 pt-2">
                        <div className="flex justify-between text-sm text-text-muted mb-2 font-medium">
                            <span>Survey Progress</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full bg-border rounded-full h-1.5">
                            <div className="bg-black h-1.5 rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                )}

                {errors && (
                    <div className="flex items-start gap-2 border border-geist-error/20 bg-geist-error/10 px-4 py-3 rounded-md text-sm text-geist-error absolute top-16 left-0 right-0">
                        <span>⚠️</span>
                        <span>{errors}</span>
                    </div>
                )}

                <div className="pt-8">
                    {currentStepIndex < activeQuestions.length ? (
                        (() => {
                            const activeQ = activeQuestions[currentStepIndex];
                            const section = questionSections.find(s => s.questions.some(q => q.qid === activeQ.qid));
                            const isActiveAudio = playingAudioId === activeQ.qid;
                            
                            const resolvedField = {
                                ...activeQ,
                                text: {
                                    ...activeQ.text,
                                    [language]: resolveText(activeQ.text?.[language])
                                }
                            };

                            const isAnswered = () => {
                                const val = answers[activeQ.qid];
                                if (Array.isArray(val)) return val.length > 0;
                                return !!val;
                            };

                            return (
                                <div key={activeQ.qid} className="animate-in slide-in-from-bottom-4 fade-in duration-500">
                                    <div className="mb-6 flex items-center gap-3">
                                        {currentStepIndex > 0 && (
                                            <button onClick={handleBack} className="text-text-muted hover:text-black transition-colors" title="Go Back">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                                            </button>
                                        )}
                                        <h2 className="text-sm font-bold text-text-muted uppercase tracking-wider m-0">
                                            {section?.sectionName}
                                        </h2>
                                    </div>

                                    <div 
                                        ref={isActiveAudio ? activeQuestionRef : null}
                                        className={`transition-all duration-300 ${isActiveAudio ? 'audio-glow-wrapper bg-white shadow-sm rounded-xl p-6 -mx-6 border border-transparent' : ''}`}
                                    >
                                        <div className="text-lg md:text-xl mb-6">
                                            <DynamicField
                                                field={resolvedField}
                                                value={answers[activeQ.qid]}
                                                language={language}
                                                onChange={handleChange}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between pt-6 border-t border-[#E5E5E5] mt-8">
                                            <button
                                                type="button"
                                                onClick={() => handleSpeakQuestion(activeQ)}
                                                className={`inline-flex items-center justify-center gap-1.5 text-[14px] font-medium transition-colors ${isActiveAudio ? 'text-black font-semibold' : 'text-[#737373] hover:text-black'}`}
                                            >
                                                <Volume2 size={18} className={isActiveAudio ? 'text-black' : ''} /> {isActiveAudio ? 'Stop' : 'Read Aloud'}
                                            </button>

                                            <button
                                                onClick={handleNext}
                                                disabled={!isAnswered()}
                                                className={`inline-flex items-center justify-center px-6 h-11 text-[15px] font-medium rounded-md transition-all duration-300
                                                    ${!isAnswered() ? "bg-border text-text-muted cursor-not-allowed" : "bg-black text-white hover:bg-gray-800 shadow-[0_4px_14px_0_rgb(0,0,0,0.1)]"}
                                                `}
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()
                    ) : (
                        <div className="animate-in zoom-in-95 fade-in duration-500 flex flex-col items-center text-center space-y-6 py-12">
                            <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center mb-4 shadow-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                            </div>
                            <h2 className="text-3xl font-bold text-black tracking-tight">You're all set!</h2>
                            <p className="text-text-muted">Thank you for completing all the questions.</p>
                            <div className="flex flex-col gap-3 mt-4 w-full max-w-[240px]">
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitLoading || loading || submitSuccess}
                                    className={`w-full inline-flex items-center justify-center px-8 h-12 text-[16px] font-medium rounded-lg transition-all duration-300
                                        ${(submitLoading || loading || submitSuccess) ? "bg-border text-text-muted cursor-not-allowed" : "bg-black text-white hover:bg-gray-800 shadow-[0_4px_14px_0_rgb(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)]"}
                                    `}
                                >
                                    Submit Survey
                                </button>
                                <button
                                    onClick={handleBack}
                                    disabled={submitLoading || loading || submitSuccess}
                                    className="w-full inline-flex items-center justify-center px-8 h-12 text-[15px] font-medium text-text-muted hover:text-black hover:bg-surface-alt rounded-lg transition-colors"
                                >
                                    Review Answers
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Loading / Success Overlay */}
            {(submitLoading || submitSuccess) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-sm transition-opacity duration-300">
                    <div className="bg-white p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-[#E5E5E5] flex flex-col items-center justify-center min-w-[300px]">
                        {submitSuccess ? (
                            <DotLottieReact src="/success-tick.lottie" autoplay loop className="w-24 h-24" />
                        ) : (
                            <Loader2 className="w-16 h-16 animate-spin text-black" />
                        )}
                        <h2 className="mt-6 text-xl font-semibold text-black tracking-tight">
                            {submitSuccess ? "Response Recorded!" : "Submitting..."}
                        </h2>
                        <p className="text-sm text-text-muted mt-2">
                            {submitSuccess ? "Redirecting to home page..." : "Please wait while we save your response."}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
