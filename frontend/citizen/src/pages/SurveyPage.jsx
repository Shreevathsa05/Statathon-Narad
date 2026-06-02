import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DynamicField from "../components/survey/DynamicField";
import { shouldShowField } from "../components/survey/ConditionEvaluator";
import { BASE_URL } from "../constants";
import { speak } from "../utils/textToSpeech";

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
    const [currentSpeak, setCurrentSpeak] = useState(null);
    const [supportedLanguages, setSupportedLanguages] = useState([]);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${BASE_URL}/survey/${surveyId}`);

                const data = await res.json();
                console.log(data)
                if (!res.ok) {
                    setErrors(data.message || "Unable to load survey. Please try again.");
                    return;
                }

                if (res.status === 404) {
                    setErrors("Survey not found.");
                    return;
                }

                setQuestionSections(data?.data?.questionSections || []);
                setSupportedLanguages(data?.data?.supportedLanguages);

            } catch (error) {
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

            setCurrentSpeak(field.qid);
            window.speechSynthesis.cancel();

            await speak(field.text[language], language);

            if (Array.isArray(field.options)) {
                for (const opt of field.options) {
                    if (opt.label?.[language]) {
                        await speak(opt.label[language], language);
                    }
                }
            }
        } catch (error) {
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

        setErrors("");
        setSubmitLoading(true);

        try {
            const res = await fetch(`${BASE_URL}/response/${surveyId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ response }),
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
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="max-w-md w-full bg-white rounded-xl shadow p-6 space-y-4">
                    <h1 className="text-xl font-semibold text-gray-800">
                        Consent Required
                    </h1>

                    <p className="text-sm text-gray-600">
                        By continuing, you agree to participate in this survey and allow
                        your responses to be used for research purposes.
                    </p>

                    <div className="flex gap-3">
                        <button
                            onClick={() => handleConsent(true)}
                            className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                        >
                            I Agree
                        </button>
                        <button
                            onClick={() => handleConsent(false)}
                            className="flex-1 border py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition"
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
            <div className="min-h-screen flex items-center justify-center text-gray-600">
                Consent not provided.
            </div>
        );
    }

    /* ---------- SURVEY UI ---------- */
    return (
        <div className="bg-gray-50 min-h-screen">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-white border-b">
                <div className="max-w-3xl mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="font-semibold text-gray-800">Survey Form</h1>

                    <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="border rounded-md px-3 py-1.5 text-sm"
                    >
                        {supportedLanguages.map((l) => (
                            <option key={l} value={l}>
                                {l.charAt(0).toUpperCase() + l.slice(1)}
                            </option>
                        ))}
                    </select>
                </div>
            </header>

            <main className="max-w-3xl mx-auto p-6 space-y-8">
                {errors && (
                    <div className="flex items-start gap-2 border border-red-200 bg-red-50 px-4 py-3 rounded-lg text-sm text-red-600">
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
                                <div className="sticky top-[72px] z-10 bg-gray-50 py-2">
                                    <h2 className="text-lg font-semibold text-gray-800">
                                        {section.sectionName}
                                    </h2>
                                    <div className="h-[2px] bg-gray-200 mt-2" />
                                </div>

                                {section.questions.map((field) => {
                                    if (!shouldShowField(field, answers)) return null;

                                    return (
                                        <div
                                            key={field.qid}
                                            className="bg-white rounded-xl shadow p-5 space-y-3"
                                        >
                                            <DynamicField
                                                field={field}
                                                value={answers[field.qid]}
                                                language={language}
                                                onChange={handleChange}
                                            />

                                            <div className="flex justify-end">
                                                <button
                                                    type="button"
                                                    onClick={() => handleSpeakQuestion(field)}
                                                    className="text-sm px-3 py-1 rounded-md border hover:bg-gray-100 transition"
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
                <div className="flex justify-end">
                    <button
                        onClick={handleSubmit}
                        disabled={submitLoading || loading}
                        className={`px-6 py-3 rounded-lg text-white font-medium transition
                            ${submitLoading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}
                        `}
                    >
                        {submitLoading ? "Submitting..." : "Submit Survey"}
                    </button>
                </div>
            </main>
        </div>
    );
}
