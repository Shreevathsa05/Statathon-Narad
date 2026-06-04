import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Globe, Volume2 } from "lucide-react";
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

    const activeSurveys = surveys.filter((s) => s.status === "active");
    console.log(activeSurveys);

    if (loading) {
        return (
            <div className="flex flex-col flex-1 min-w-0 bg-bg min-h-screen">
                <div className="flex flex-col p-6 w-full max-w-[1200px] mx-auto mt-4">
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4 mt-8">
                        {Array.from({ length: 4 }).map((_, i) => (
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
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col flex-1 min-w-0 bg-bg min-h-screen">
            <div className="flex flex-col p-6 w-full max-w-[1200px] mx-auto mt-4">
                {/* Page Header */}
                <div className="flex items-center justify-between pb-6 mb-6 border-b border-border">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-[-0.03em] text-text-primary mb-1">Citizen Portal</h1>
                        <p className="text-[14px] text-text-muted">Participate in active surveys and contribute to data-driven decisions.</p>
                    </div>
                </div>

                {/* Content */}
                {errors && (
                    <div className="flex items-start px-4 py-3 rounded-md text-sm border border-geist-error/20 bg-geist-error/10 text-geist-error mb-4">
                        <div className="flex flex-col">
                            <span className="font-semibold">Error</span>
                            {errors}
                        </div>
                    </div>
                )}

                {activeSurveys.length === 0 && !errors ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center bg-surface border border-dashed border-border rounded-md text-text-muted">
                        <h3 className="text-base font-medium text-text-primary mb-1">No active surveys found</h3>
                        <p className="text-sm">Check back later for new surveys.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
                        {activeSurveys.map(survey => {
                            let displayName = survey.name || 'Untitled Survey';
                            if (displayName.startsWith("Survey on Survey on")) {
                                displayName = displayName.replace("Survey on Survey on", "Survey on");
                            }

                            return (
                                <div 
                                    key={survey._id || survey.surveyId} 
                                    className="bg-bg border border-border rounded-md shadow-sm p-4 flex flex-col gap-4 cursor-pointer hover:border-black hover:shadow-md transition-all h-full group" 
                                    onClick={() => navigate(`/survey/${survey.surveyId}`)}
                                >
                                    <div className="flex justify-between items-start gap-3">
                                        <h3 className="text-base font-medium text-text-primary m-0 leading-tight line-clamp-2 overflow-hidden group-hover:text-geist-blue transition-colors">
                                            {displayName}
                                        </h3>
                                        <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full border uppercase tracking-wider shrink-0 bg-geist-blue/10 text-geist-blue border-geist-blue/20`}>
                                            {survey.status}
                                        </span>
                                    </div>

                                    <div className="mt-auto pt-4 flex flex-col gap-2">
                                        <div className="flex items-center text-[13px] text-text-muted">
                                            <span>{new Date(survey.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}