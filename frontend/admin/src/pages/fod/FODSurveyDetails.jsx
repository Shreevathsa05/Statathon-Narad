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

  const fetchSurvey = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      // Wait, is it getSurveyById? Yes, surveyClient.getSurveyById
      const res = await surveyClient.getSurveyById(surveyId);
      setSurvey(res.data.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load survey details.");
      toast.error("Failed to load survey details.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchTargets = async () => {
    if (!survey || survey.accessType === null) return;
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
    if (survey && survey.accessType !== null) {
      fetchTargets();
    }
  }, [survey]);

  const handleUpdate = () => {
    fetchSurvey(true); // This will consequently trigger fetchTargets if needed
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
            {!(
              survey.status === "active" && survey.targetSource === "generated"
            ) && (
              <button
                onClick={() => setIsTargetingModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-neutral-800 transition-colors shadow-sm"
              >
                <Target size={16} /> Targeting Audience
              </button>
            )}
            {survey.status === "approved" && (
              <button
                onClick={async () => {
                  try {
                    await surveyClient.updateSurvey(survey.surveyId, {
                      status: "active",
                    });
                    toast.success("Survey is now active!");
                    handleUpdate();
                  } catch (err) {
                    toast.error(
                      "Failed to activate survey: " +
                        (err.message || "Unknown error"),
                    );
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-md hover:bg-emerald-700 transition-colors shadow-sm"
              >
                Make Active
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-surface border border-border rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-bg flex justify-between items-center">
            <div className="flex items-center gap-2 text-text-primary font-semibold">
              <Users size={18} />
              Targeted Audience ({targets.length})
            </div>
            {survey.accessType !== null && (
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
            {survey.accessType === null ? (
              <div className="flex flex-col items-center justify-center p-12 text-center bg-surface border border-dashed border-border rounded-md text-text-muted h-full">
                <Target size={48} className="opacity-20 mb-4" />
                <p className="text-lg font-medium text-text-primary">
                  Targeting Not Configured
                </p>
                <p className="text-sm mt-2 max-w-md">
                  Please configure the access type for this survey.
                </p>
                <button
                  onClick={() => setIsTargetingModalOpen(true)}
                  className="mt-6 px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-neutral-800 transition-colors shadow-sm"
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
