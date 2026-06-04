import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Settings } from "lucide-react";
import { useToast } from "../../context/ToastContext.jsx";
import { surveyClient } from "../../api/survey";

export default function ChannelsModal({ survey, onClose, onUpdate }) {
  const toast = useToast();
  const [channels, setChannels] = useState({
    web: survey.allowedChannels?.includes("web") || false,
    ivr: survey.allowedChannels?.includes("ivr") || false,
    whatsapp: survey.allowedChannels?.includes("whatsapp") || false,
  });
  const [savingChannels, setSavingChannels] = useState(false);

  const handleSaveChannels = async () => {
    try {
      setSavingChannels(true);
      const allowedChannels = Object.entries(channels)
        .filter(([_, v]) => v)
        .map(([k]) => k);
      await surveyClient.updateSurvey(survey.surveyId, { allowedChannels });
      toast.success("Delivery channels updated");
      onUpdate();
      onClose();
    } catch (err) {
      toast.error(
        "Failed to update channels: " + (err.message || "Unknown error"),
      );
    } finally {
      setSavingChannels(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-bg border border-border shadow-2xl rounded-lg w-full max-w-[500px] flex flex-col max-h-[90vh] overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex justify-between items-center bg-surface">
          <div className="flex items-center gap-2">
            <Settings size={18} className="text-text-primary" />
            <div>
              <h2 className="text-lg font-bold text-text-primary">
                Delivery Channels
              </h2>
              <p className="text-xs text-text-muted mt-1 font-mono">
                #{survey.surveyId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary p-1 rounded-md hover:bg-border/30"
          >
            ✕
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 bg-bg">
          <div className="flex flex-col gap-6">
            <p className="text-sm text-text-secondary">
              Select the delivery channels through which citizens can access
              this survey.
            </p>

            <div className="flex flex-col gap-3">
              {["web", "ivr", "whatsapp"].map((ch) => (
                <label
                  key={ch}
                  className="flex items-center gap-3 p-3 rounded-md border border-border hover:bg-surface cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    className="rounded border-border text-black focus:ring-black w-4 h-4"
                    checked={channels[ch]}
                    onChange={(e) =>
                      setChannels({ ...channels, [ch]: e.target.checked })
                    }
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold capitalize text-text-primary">
                      {ch} Delivery
                    </span>
                    <span className="text-xs text-text-muted">
                      Allow respondents to complete the survey via {ch}.
                    </span>
                  </div>
                </label>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-border flex justify-end">
              <button
                onClick={handleSaveChannels}
                disabled={savingChannels}
                className="px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-neutral-800 disabled:opacity-50 transition-colors"
              >
                {savingChannels ? "Saving..." : "Save Channels"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
