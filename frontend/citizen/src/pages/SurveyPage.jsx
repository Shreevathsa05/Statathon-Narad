import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DynamicField from "../components/survey/DynamicField";
import { shouldShowField } from "../utils/ConditionEvaluator";
import { BASE_URL, START_TIME } from "../constants";
import { speak } from "../utils/textToSpeech";
import { getOS } from "../utils/getOS";

export default function SurveyPage() {
    const navigate = useNavigate();
    const { surveyId } = useParams();

    const [errors, setErrors] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitLoading, setSubmitLoading] = useState(false);

    const [questionSections, setQuestionSections] = useState([]);
    const [answers, setAnswers] = useState({});
    const [consent, setConsent] = useState(null);

    const [language, setLanguage] = useState("english");
    const [supportedLanguages, setSupportedLanguages] = useState([]);

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

    const handleSpeakQuestion = async (field) => {
        try {
            if (!field.text?.[language]) return;

            window.speechSynthesis.cancel();

            await speak(field.text[language], language);

            if (Array.isArray(field.options)) {
                for (const opt of field.options) {
                    if (opt.label?.[language]) {
                        await speak(opt.label[language], language);
                    }
                }
            }
        } catch {
            setErrors("Unable to play audio. Please try again");
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

    /* ---------- CONSENT SCREEN ---------- */
    if (consent === null) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-bg px-4">
                <div className="max-w-md w-full bg-surface border border-border rounded-xl shadow-md p-6 space-y-5">
                    <h1 className="text-xl font-semibold text-text-primary">
                        Consent Required
                    </h1>

                    <p className="text-sm text-text-muted leading-relaxed">
                        By continuing, you agree to participate in this survey and allow
                        your responses to be used for research purposes.
                    </p>

                    <div className="flex gap-3">
                        <button
                            onClick={() => handleConsent(true)}
                            className="flex-1 bg-text-primary text-bg font-medium py-2 rounded-lg hover:bg-text-secondary transition-colors"
                        >
                            I Agree
                        </button>
                        <button
                            onClick={() => handleConsent(false)}
                            className="flex-1 border border-border bg-transparent text-text-muted font-medium py-2 rounded-lg hover:bg-surface-alt hover:text-text-primary transition-colors"
                        >
                            Decline
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (consent === false) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-bg text-text-muted">
                Consent not provided.
            </div>
        );
    }

    /* ---------- SURVEY UI ---------- */
    return (
        <div className="flex flex-col flex-1 min-w-0 bg-bg min-h-screen">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-bg/80 backdrop-blur-md border-b border-border">
                <div className="max-w-3xl mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="text-[15px] font-semibold text-text-primary tracking-tight">Survey Form</h1>

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
                            <div key={index} className="space-y-6">

                                {/* Section Header */}
                                <div className="sticky top-[72px] z-10 bg-bg py-2">
                                    <h2 className="text-sm font-semibold text-text-primary tracking-tight uppercase letter-spacing-[0.05em]">
                                        {section.sectionName}
                                    </h2>
                                    <div className="h-[1px] bg-border mt-3" />
                                </div>

                                {section.questions.map((field) => {
                                    if (!shouldShowField(field, answers)) return null;

                                    return (
                                        <div
                                            key={field.qid}
                                            className="bg-surface border border-border rounded-xl shadow-sm p-6 space-y-5 transition-colors"
                                        >
                                            <DynamicField
                                                field={field}
                                                value={answers[field.qid]}
                                                language={language}
                                                onChange={handleChange}
                                            />

                                            <div className="flex justify-end pt-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleSpeakQuestion(field)}
                                                    className="inline-flex items-center justify-center gap-2 px-3 h-8 text-[13px] font-medium rounded-md bg-transparent border border-border text-text-muted hover:text-text-primary hover:bg-surface-alt transition-colors"
                                                >
                                                    🔊 Read
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
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
                            ${submitLoading || loading ? "bg-border text-text-muted cursor-not-allowed" : "bg-text-primary text-bg hover:bg-text-secondary"}
                        `}
                    >
                        {submitLoading ? "Submitting..." : "Submit Survey"}
                    </button>
                </div>
            </main>
        </div>
    );
}
