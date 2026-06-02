import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import NaradIllustration from "../components/survey/NaradIllustration";
import SurveyCard from "../components/survey/SurveyCard";
import { BASE_URL } from "../constants";

export default function Home() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState("");
    const [surveys, setSurveys] = useState([]);

    useEffect(() => {
        async function fetchSurveys() {
            setErrors("");
            try {
                const res = await fetch(`${BASE_URL}/survey`);
                const json = await res.json();
                setSurveys(json.data || []);
            } catch (err) {
                setErrors("Failed to fetch surveys");
            } finally {
                setLoading(false);
            }
        }
        fetchSurveys();
    }, []);

    const activeSurveys = surveys.filter((s) => s.status);
    console.log(activeSurveys);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-3">
                <div className="w-4 h-4 border border-[#2E2E2E] border-t-[#52A8FF] rounded-full animate-spin" />
                <span className="text-xs text-[#525252] font-mono">
                    Loading surveys…
                </span>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-black text-[#EDEDED]" style={{ fontFamily: "'Geist', system-ui, sans-serif" }}>

            {/* ── Hero ── */}
            <section className="border-b border-[#2E2E2E]">
                <div className="max-w-6xl mx-auto px-6 py-14 grid lg:grid-cols-2 gap-12 items-center">

                    <div>
                        <p className="text-xs uppercase tracking-[0.12em] text-[#525252] mb-5 font-mono">
                            Socio-economic survey platform
                        </p>

                        <h1 className="text-5xl font-bold leading-[1.15] tracking-[-0.04em] text-[#EDEDED] mb-5">
                            Empowering{" "}
                            <span className="text-[#52A8FF]">data-driven</span>{" "}
                            decisions
                        </h1>

                        <p className="text-[#A1A1A1] text-sm leading-relaxed max-w-md mb-7">
                            Manage, track, and analyze surveys with real-time visibility and control.
                        </p>

                        <div className="flex gap-2 flex-wrap">
                            {["Accurate", "Transparent", "Efficient"].map(tag => (
                                <span
                                    key={tag}
                                    className="text-xs px-3 py-1 bg-[#0A0A0A] border border-[#2E2E2E] rounded text-[#A1A1A1]"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>

                </div>
            </section>

            {/* ── Section Header ── */}
            <section className="max-w-6xl mx-auto px-6 py-12">

                <div className="mb-6">
                    <h2 className="text-base font-semibold text-[#EDEDED] tracking-[-0.01em]">
                        Active Surveys
                    </h2>
                    <p className="text-[#525252] text-xs mt-1">
                        Currently running and high-priority surveys
                    </p>
                </div>

                {activeSurveys.length === 0 ? (
                    <div className="border border-[#2E2E2E] rounded-md p-12 text-center text-[#525252] text-sm bg-[#0A0A0A]">
                        No active surveys
                    </div>
                ) : (
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">

                        {activeSurveys.map((survey) => (
                            <div
                                key={survey._id}
                                onClick={() => navigate(`/survey/${survey.surveyId}`)}
                                className="p-4 border border-[#2E2E2E] rounded-md bg-[#0A0A0A] hover:border-[rgba(255,255,255,0.145)] transition-colors duration-150 cursor-pointer"
                            >
                                {/* Top */}
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-xs text-[#525252] font-mono tracking-tight">
                                        {survey.surveyId}
                                    </span>

                                    <span className="text-xs px-2 py-0.5 rounded border border-[#50E3C2]/20 bg-[#50E3C2]/5 text-[#50E3C2]">
                                        {survey.status}
                                    </span>
                                </div>

                                {/* Title */}
                                <h3 className="text-sm font-medium text-[#EDEDED] mb-2 tracking-[-0.01em]">
                                    {survey.name}
                                </h3>

                                {/* Date */}
                                <p className="text-xs text-[#525252] font-mono">
                                    {new Date(survey.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        ))}

                    </div>
                )}

            </section>
        </main>
    );
}