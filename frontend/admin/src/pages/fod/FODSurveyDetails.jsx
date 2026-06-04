import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TopBar from "../../components/TopBar.jsx";
import { Target, Settings, Users, ArrowLeft } from "lucide-react";
import { surveyClient } from "../../api/survey";
import { campaignClient } from "../../api/campaign";
import { useToast } from "../../context/ToastContext.jsx";
import ChannelsModal from "../../components/fod/ChannelsModal.jsx";
import TargetingModal from "../../components/fod/TargetingModal.jsx";

export default function FODSurveyDetails() {
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [targets, setTargets] = useState([]);
  const [loadingTargets, setLoadingTargets] = useState(false);

  const [isChannelsModalOpen, setIsChannelsModalOpen] = useState(false);
  const [isTargetingModalOpen, setIsTargetingModalOpen] = useState(false);

  const fetchSurvey = async () => {
    try {
      setLoading(true);
      setError(null);
      // Wait, is it getSurveyById? Yes, surveyClient.getSurveyById
      const res = await surveyClient.getSurveyById(surveyId);
      setSurvey(res.data.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load survey details.");
      toast.error("Failed to load survey details.");
    } finally {
      setLoading(false);
    }
  };

  const fetchTargets = async () => {
    if (!survey || survey.accessType !== "targeted") return;
    try {
      setLoadingTargets(true);
      const res = await campaignClient.getTargets(survey.surveyId);
      setTargets(res.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load targeted audience");
    } finally {
      setLoadingTargets(false);
    }
  };

  useEffect(() => {
    if (surveyId) {
      fetchSurvey();
    }
  }, [surveyId]);

  useEffect(() => {
    if (survey && survey.accessType === "targeted") {
      fetchTargets();
    }
  }, [survey]);

  const handleUpdate = () => {
    fetchSurvey(); // This will consequently trigger fetchTargets if needed
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col min-h-screen bg-bg">
        <TopBar user={{ name: "FOD Admin", role: "fod" }} />
        <div className="flex-1 p-8 flex items-center justify-center">
          <div className="animate-pulse flex flex-col items-center gap-4 text-text-muted">
            <div className="w-8 h-8 border-4 border-black/10 border-t-black rounded-full animate-spin"></div>
            Loading survey details...
          </div>
        </div>
      </div>
    );
  }

  if (error || !survey) {
    return (
      <div className="flex-1 flex flex-col min-h-screen bg-bg">
        <TopBar user={{ name: "FOD Admin", role: "fod" }} />
        <div className="flex-1 p-8 flex items-center justify-center">
          <div className="text-geist-error">{error || "Survey not found."}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-bg h-screen overflow-hidden">
      <TopBar user={{ name: "FOD Admin", role: "fod" }} />
      <div className="flex-1 p-8 max-w-7xl mx-auto w-full flex flex-col overflow-hidden">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/fod")}
              className="text-text-muted hover:text-black transition-colors bg-surface border border-border p-2 rounded-md"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-text-primary">
                {survey.name || "Untitled Survey"}
              </h1>
              <p className="text-sm text-text-muted mt-1 font-mono">
                #{survey.surveyId} • Status:{" "}
                <span className="uppercase">{survey.status}</span>
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setIsChannelsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-surface border border-border text-text-primary text-sm font-medium rounded-md hover:border-black transition-colors shadow-sm"
            >
              <Settings size={16} /> Delivery Channels
            </button>
            <button
              onClick={() => setIsTargetingModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-neutral-800 transition-colors shadow-sm"
            >
              <Target size={16} /> Targeting Audience
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-surface border border-border rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-bg flex justify-between items-center">
            <div className="flex items-center gap-2 text-text-primary font-semibold">
              <Users size={18} />
              Targeted Audience (
              {survey.accessType === "targeted" ? targets.length : ""})
            </div>
            {survey.accessType === "targeted" && (
              <button
                onClick={fetchTargets}
                disabled={loadingTargets}
                className="text-xs font-medium text-text-secondary hover:text-black transition-colors disabled:opacity-50"
              >
                Refresh List
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-6 bg-bg">
            {survey.accessType !== "targeted" ? (
              <div className="flex flex-col items-center justify-center p-12 text-center bg-surface border border-dashed border-border rounded-md text-text-muted h-full">
                <Target size={48} className="opacity-20 mb-4" />
                <p className="text-lg font-medium text-text-primary">
                  General Access
                </p>
                <p className="text-sm mt-2 max-w-md">
                  This survey is currently open to a general audience. No
                  specific targets have been defined.
                </p>
                <button
                  onClick={() => setIsTargetingModalOpen(true)}
                  className="mt-6 px-4 py-2 bg-surface border border-border text-black text-sm font-medium rounded-md hover:border-black transition-colors"
                >
                  Configure Targeting
                </button>
              </div>
            ) : loadingTargets ? (
              <div className="flex flex-col items-center justify-center p-12 text-text-muted h-full">
                <div className="w-8 h-8 border-4 border-black/10 border-t-black rounded-full animate-spin mb-4"></div>
                Loading audience...
              </div>
            ) : targets.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center bg-surface border border-dashed border-border rounded-md text-text-muted h-full">
                <Users size={48} className="opacity-20 mb-4" />
                <p className="text-sm">No targeted audience found.</p>
                <button
                  onClick={() => setIsTargetingModalOpen(true)}
                  className="mt-4 text-xs font-medium text-black hover:underline"
                >
                  Add Targets
                </button>
              </div>
            ) : (
              <div className="border border-border rounded-md overflow-hidden bg-surface">
                <table className="w-full text-left text-sm">
                  <thead className="bg-bg border-b border-border sticky top-0">
                    <tr>
                      <th className="px-4 py-3 font-medium text-text-secondary">
                        User Key (Hash)
                      </th>
                      <th className="px-4 py-3 font-medium text-text-secondary">
                        Phone
                      </th>
                      <th className="px-4 py-3 font-medium text-text-secondary text-right">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {targets.map((t, idx) => (
                      <tr
                        key={t._id || idx}
                        className="border-b border-border last:border-0 hover:bg-bg/50 transition-colors"
                      >
                        <td className="px-4 py-3 text-text-primary font-mono truncate max-w-[200px]">
                          {t.userKey}
                        </td>
                        <td className="px-4 py-3 text-text-primary">
                          {t.phone || "-"}
                        </td>
                        <td className="px-4 py-3 text-right capitalize">
                          <span
                            className={`inline-flex px-2 py-1 rounded text-xs font-medium border ${
                              t.status === "sent"
                                ? "bg-geist-success/10 text-geist-success border-geist-success/20"
                                : t.status === "pending"
                                  ? "bg-amber-500/10 text-amber-700 border-amber-500/20"
                                  : "bg-border text-text-secondary border-border/50"
                            }`}
                          >
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {isChannelsModalOpen && (
        <ChannelsModal
          survey={survey}
          onClose={() => setIsChannelsModalOpen(false)}
          onUpdate={handleUpdate}
        />
      )}

      {isTargetingModalOpen && (
        <TargetingModal
          survey={survey}
          onClose={() => setIsTargetingModalOpen(false)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}
