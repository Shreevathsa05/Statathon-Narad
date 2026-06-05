import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Volume2 } from "lucide-react";
import DynamicField from "../components/survey/DynamicField";
import { shouldShowField } from "../utils/ConditionEvaluator";
import { BASE_URL, START_TIME } from "../constants";
import { speak } from "../utils/textToSpeech";
import { getOS } from "../utils/getOS";
import AuthModal from "../components/survey/AuthModal";

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

    const [questionSections, setQuestionSections] = useState([]);
    const [answers, setAnswers] = useState({});
    const [consent, setConsent] = useState(null);

    const [language, setLanguage] = useState("english");
    const [supportedLanguages, setSupportedLanguages] = useState([]);

    const [auth, setAuth] = useState(null);
    const [prefill, setPrefill] = useState(false);

    const [surveyName, setSurveyName] = useState("");
    const [surveyDescription, setSurveyDescription] = useState("");
    const [hasAcceptedDescription, setHasAcceptedDescription] = useState(false);

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

    const cleanupAudio = () => {
        if (reqAnimRef.current) cancelAnimationFrame(reqAnimRef.current);
        if (activeQuestionRef.current) {
            activeQuestionRef.current.style.setProperty('--audio-intensity', '0');
        }
    };

    const handleSpeakQuestion = async (field) => {
        try {
            const audioId = field.audio?.[language];
            if (!audioId || audioId.trim() === "") {
                setErrors("Pre-generated audio not found for this language.");
                return;
            }

            if (playingAudioId === audioId && audioRef.current) {
                if (!audioRef.current.paused) {
                    audioRef.current.pause();
                    cleanupAudio();
                    setPlayingAudioId(null);
                }
                return;
            }

            cleanupAudio();
            setPlayingAudioId(audioId);

            const url = `/speech/audio/${surveyId}/${audioId}`;
            const audio = new Audio(url);
            audio.crossOrigin = "anonymous";
            audioRef.current = audio;

            audio.onended = () => {
                setPlayingAudioId(null);
                cleanupAudio();
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
        } catch {
            setErrors("Unable to play audio. Please try again");
            cleanupAudio();
            setPlayingAudioId(null);
        }
    };

    const handleSubmit = async () => {
        if (loading || submitLoading) return;

        const allQuestions = questionSections.flatMap(section => section.questions);
        const response = allQuestions
            .filter((q) => shouldShowField(q, answers))
            .map((q) => {
                const answer = answers[q.qid];
                if (!answer) return null;

                return { qid: q.qid, answer };
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
                interviewMode: "browser",
                interviewStartTime: localStorage.getItem(START_TIME),
            },
        }

        setErrors("");
        setSubmitLoading(true);

        try {
            const res = await fetch(`${BASE_URL}/response/${surveyId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ response, paraInfo }),
            });

            if (!res.ok) {
                const json = await res.json();
                setErrors(json.message || "Submission failed");
                return;
            }

            navigate("/");
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

    /* ---------- SURVEY UI ---------- */
    return (
        <div className="flex flex-col flex-1 min-w-0 bg-bg min-h-screen">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-bg/80 backdrop-blur-md border-b border-border">
                <div className="max-w-3xl mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="text-[16px] font-semibold tracking-[-0.02em] text-text-primary">Survey Form</h1>

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
            </header>

            <main className="max-w-3xl w-full mx-auto p-6 space-y-8">
                {errors && (
                    <div className="flex items-start gap-2 border border-geist-error/20 bg-geist-error/10 px-4 py-3 rounded-md text-sm text-geist-error">
                        <span>⚠️</span>
                        <span>{errors}</span>
                    </div>
                )}

                {/* Questions */}
                <section className="space-y-10">
                    {questionSections.map((section, index) => {
                        const visibleQuestions = section.questions.filter((q) =>
                            shouldShowField(q, answers));

                        if (visibleQuestions.length === 0) return null;

                        return (
                            <div key={index} className="bg-[#FAFAFA] border border-[#E5E5E5] rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                                {/* Section Header */}
                                <div className="flex justify-between items-center bg-white rounded-t-xl border-b border-[#E5E5E5] px-6 py-4">
                                    <h2 className="text-[16px] font-semibold tracking-[-0.02em] text-black m-0">
                                        {section.sectionName}
                                    </h2>
                                </div>

                                <div className="px-6 py-2">
                                    {section.questions.map((field, qIdx) => {
                                        if (!shouldShowField(field, answers)) return null;

                                        const isActiveAudio = playingAudioId && playingAudioId === field.audio?.[language];

                                        return (
                                            <div
                                                disabled={prefill && index === 0}
                                                key={field.qid}
                                                ref={isActiveAudio ? activeQuestionRef : null}
                                                className={`transition-all duration-300 ${isActiveAudio ? 'audio-glow-wrapper bg-white shadow-sm rounded-xl p-6 -mx-6 my-4 border border-transparent' : `py-6 ${qIdx === section.questions.length - 1 ? '' : 'border-b border-[#E5E5E5]'}`}`}
                                            >
                                                <DynamicField
                                                    field={field}
                                                    value={answers[field.qid]}
                                                    language={language}
                                                    onChange={handleChange}
                                                />

                                                <div className="flex justify-end pt-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSpeakQuestion(field)}
                                                        className={`inline-flex items-center justify-center gap-1.5 text-[13px] font-medium transition-colors ${isActiveAudio ? 'text-black font-semibold' : 'text-[#737373] hover:text-black'}`}
                                                    >
                                                        <Volume2 size={16} className={isActiveAudio ? 'text-black' : ''} /> {isActiveAudio ? 'Stop' : 'Read'}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </section>

                {/* Submit */}
                <div className="flex justify-end pt-6 pb-12 border-t border-border mt-8">
                    <button
                        onClick={handleSubmit}
                        disabled={submitLoading || loading}
                        className={`inline-flex items-center justify-center px-6 h-10 text-[14px] font-medium rounded-md transition-colors
                            ${submitLoading || loading ? "bg-border text-text-muted cursor-not-allowed" : "bg-black text-white hover:bg-gray-800 shadow-[0_4px_14px_0_rgb(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)]"}
                        `}
                    >
                        {submitLoading ? "Submitting..." : "Submit Survey"}
                    </button>
                </div>
            </main>
        </div>
    );
}
