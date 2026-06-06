import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  Target,
  ChevronDown,
  FileSpreadsheet,
  Upload,
  Filter,
  Globe,
} from "lucide-react";
import { useToast } from "../../context/ToastContext.jsx";
import { surveyClient } from "../../api/survey";
import { campaignClient } from "../../api/campaign";

export default function TargetingModal({ survey, onClose, onUpdate }) {
  const toast = useToast();

  const [accessType, setAccessType] = useState(survey.accessType);
  const [isAccessDropdownOpen, setIsAccessDropdownOpen] = useState(false);
  const [savingAccessType, setSavingAccessType] = useState(false);

  const [targetMode, setTargetMode] = useState("upload");
  const [file, setFile] = useState(null);
  const [filters, setFilters] = useState({
    gender: "",
    primaryLanguage: "",
    pincode: "",
    minAge: "",
    maxAge: "",
  });
  const [processingTarget, setProcessingTarget] = useState(false);
  const [deletingTargets, setDeletingTargets] = useState(false);

  const handleDeleteTargets = async () => {
    if (
      !confirm(
        "Are you sure you want to delete all existing targets for this survey?",
      )
    )
      return;
    try {
      setDeletingTargets(true);
      await campaignClient.deleteTargets(survey.surveyId);
      toast.success("All targets deleted successfully");
      onUpdate();
    } catch (err) {
      toast.error(
        "Failed to delete targets: " + (err.message || "Unknown error"),
      );
    } finally {
      setDeletingTargets(false);
    }
  };

  const handleSaveAccessType = async () => {
    try {
      setSavingAccessType(true);
      await campaignClient.makeGeneralAccess(survey.surveyId);
      toast.success("Access type updated to general and targets generated");
      onUpdate();
    } catch (err) {
      toast.error(
        "Failed to update access type: " + (err.message || "Unknown error"),
      );
    } finally {
      setSavingAccessType(false);
    }
  };

  const handleUploadTarget = async () => {
    if (!file) {
      toast.error("Please select an Excel file");
      return;
    }
    try {
      setProcessingTarget(true);
      const res = await campaignClient.uploadExcel(survey.surveyId, file);
      toast.success(`Uploaded ${res.data.data.count} targets successfully`);
      setAccessType("targeted");
      onUpdate();
      onClose(); // Close modal on success
    } catch (err) {
      toast.error(
        "Failed to upload targets: " + (err.message || "Unknown error"),
      );
    } finally {
      setProcessingTarget(false);
    }
  };

  const handleGenerateTarget = async () => {
    const activeFilters = {};
    if (filters.gender) activeFilters.gender = filters.gender;
    if (filters.primaryLanguage)
      activeFilters.primaryLanguage = filters.primaryLanguage;
    if (filters.pincode) activeFilters.pincode = filters.pincode;

    if (filters.minAge || filters.maxAge) {
      activeFilters.age = {};
      if (filters.minAge) activeFilters.age.min = parseInt(filters.minAge, 10);
      if (filters.maxAge) activeFilters.age.max = parseInt(filters.maxAge, 10);
    }

    if (Object.keys(activeFilters).length === 0) {
      toast.error("Please specify at least one filter");
      return;
    }

    try {
      setProcessingTarget(true);
      const res = await campaignClient.generateFromDemographics(
        survey.surveyId,
        activeFilters,
      );
      toast.success(`Generated ${res.data.data.count} targets successfully`);
      setAccessType("targeted");
      onUpdate();
      onClose(); // Close modal on success
    } catch (err) {
      toast.error(
        "Failed to generate targets: " + (err.message || "Unknown error"),
      );
    } finally {
      setProcessingTarget(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-bg border border-border shadow-2xl rounded-lg w-full max-w-[600px] flex flex-col max-h-[90vh] overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex justify-between items-center bg-surface">
          <div className="flex items-center gap-2">
            <Target size={18} className="text-text-primary" />
            <div>
              <h2 className="text-lg font-bold text-text-primary">
                Targeted Audience
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
          <div className="flex flex-col gap-5">
            {survey.status !== "active" && (
              <div className="flex flex-col gap-3 pb-5 border-b border-border">
                <p className="text-sm font-semibold text-text-primary">
                  Survey Access Type
                </p>
                <div className="flex items-center gap-4">
                  <div className="relative w-full max-w-[250px]">
                    <button
                      onClick={() =>
                        setIsAccessDropdownOpen(!isAccessDropdownOpen)
                      }
                      className="flex items-center justify-between w-full text-sm rounded-md border border-border bg-white px-3 py-2 outline-none hover:border-black transition-colors"
                    >
                      {accessType === "general"
                        ? "General (Open to all)"
                        : accessType === "targeted"
                          ? "Targeted (Only chosen users)"
                          : "Select Access Type"}
                      <ChevronDown
                        size={16}
                        className={`transition-transform text-text-muted ${isAccessDropdownOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    {isAccessDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-md shadow-lg z-10 overflow-hidden">
                        {survey.status === "approved" && (
                          <button
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-surface transition-colors ${accessType === "general" ? "bg-surface font-medium" : ""}`}
                            onClick={() => {
                              setAccessType("general");
                              setIsAccessDropdownOpen(false);
                            }}
                          >
                            General (Open to all)
                          </button>
                        )}
                        <button
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-surface transition-colors border-t border-border ${accessType === "targeted" ? "bg-surface font-medium" : ""}`}
                          onClick={() => {
                            setAccessType("targeted");
                            setIsAccessDropdownOpen(false);
                          }}
                        >
                          Targeted (Only chosen users)
                        </button>
                      </div>
                    )}
                  </div>
                  {survey.status === "approved" &&
                    survey.accessType !== accessType &&
                    accessType === "general" && (
                      <button
                        onClick={handleSaveAccessType}
                        disabled={savingAccessType}
                        className="px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-neutral-800 disabled:opacity-50 transition-colors"
                      >
                        {savingAccessType ? "Saving..." : "Save"}
                      </button>
                    )}
                </div>
              </div>
            )}
            {survey.status === "active" || accessType === "targeted" ? (
              <>
                {survey.status !== "active" && (
                  <div className="flex p-1 bg-surface border border-border rounded-md">
                    <button
                      className={`flex-1 py-1.5 text-xs font-medium rounded-sm transition-colors ${targetMode === "upload" ? "bg-white shadow-sm text-black border border-border/50" : "text-text-muted hover:text-text-primary"}`}
                      onClick={() => setTargetMode("upload")}
                    >
                      Upload Excel
                    </button>
                    {survey.status === "approved" && (
                      <button
                        className={`flex-1 py-1.5 text-xs font-medium rounded-sm transition-colors ${targetMode === "generate" ? "bg-white shadow-sm text-black border border-border/50" : "text-text-muted hover:text-text-primary"}`}
                        onClick={() => setTargetMode("generate")}
                      >
                        Generate from Demographics
                      </button>
                    )}
                  </div>
                )}

                {(survey.status === "active" &&
                  survey.targetSource !== "generated") ||
                targetMode === "upload" ? (
                  survey.targetSource === "generated" ? (
                    <div className="flex flex-col items-center justify-center p-8 mt-4 bg-amber-50 border border-amber-200 rounded-lg text-center">
                      <p className="text-amber-800 text-sm font-medium">
                        Please delete all previous targets before uploading new
                        ones.
                      </p>
                      <p className="text-amber-700/80 text-xs mt-1 mb-4">
                        This operation is restricted based on current targeting
                        configuration.
                      </p>
                      <button
                        onClick={handleDeleteTargets}
                        disabled={deletingTargets}
                        className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50"
                      >
                        {deletingTargets ? "Deleting..." : "Delete All Targets"}
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <div className="p-6 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center text-center bg-surface/50">
                        <FileSpreadsheet
                          size={32}
                          className="text-text-muted mb-3"
                        />
                        <p className="text-sm font-medium text-text-primary mb-1">
                          Upload Campaign Target List
                        </p>
                        <p className="text-xs text-text-muted max-w-[250px] mb-4">
                          Excel file must contain `aadhaarNo` and `phone`
                          columns in the first sheet.
                        </p>
                        <input
                          type="file"
                          accept=".xlsx,.xls"
                          onChange={(e) => setFile(e.target.files[0])}
                          className="block w-full max-w-xs text-xs text-text-muted file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-border/30 file:text-text-primary hover:file:bg-border/50"
                        />
                      </div>
                      <div className="flex justify-end pt-2">
                        <button
                          onClick={handleUploadTarget}
                          disabled={processingTarget || !file}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-neutral-800 disabled:opacity-50 transition-colors"
                        >
                          <Upload size={16} />{" "}
                          {processingTarget ? "Uploading..." : "Upload Targets"}
                        </button>
                      </div>
                    </div>
                  )
                ) : survey.targetSource !== null ? (
                  <div className="flex flex-col items-center justify-center p-8 mt-4 bg-amber-50 border border-amber-200 rounded-lg text-center">
                    <p className="text-amber-800 text-sm font-medium">
                      Please delete all previous targets before generating new
                      ones.
                    </p>
                    <p className="text-amber-700/80 text-xs mt-1 mb-4">
                      This operation is restricted based on current targeting
                      configuration.
                    </p>
                    <button
                      onClick={handleDeleteTargets}
                      disabled={deletingTargets}
                      className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50"
                    >
                      {deletingTargets ? "Deleting..." : "Delete All Targets"}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <div className="p-4 border border-border rounded-md bg-surface/50 grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-text-primary mb-1">
                          Gender
                        </label>
                        <select
                          value={filters.gender}
                          onChange={(e) =>
                            setFilters({ ...filters, gender: e.target.value })
                          }
                          className="w-full text-sm rounded-md border border-border bg-white px-3 py-2 outline-none focus:border-black"
                        >
                          <option value="">Any</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-text-primary mb-1">
                          Primary Language
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. hindi, english"
                          value={filters.primaryLanguage}
                          onChange={(e) =>
                            setFilters({
                              ...filters,
                              primaryLanguage: e.target.value,
                            })
                          }
                          className="w-full text-sm rounded-md border border-border bg-white px-3 py-2 outline-none focus:border-black placeholder:text-text-muted/50"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-text-primary mb-1">
                          Pincode
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 110001"
                          value={filters.pincode}
                          onChange={(e) =>
                            setFilters({
                              ...filters,
                              pincode: e.target.value,
                            })
                          }
                          className="w-full text-sm rounded-md border border-border bg-white px-3 py-2 outline-none focus:border-black placeholder:text-text-muted/50"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-text-primary mb-1">
                          Min Age
                        </label>
                        <input
                          type="number"
                          placeholder="18"
                          value={filters.minAge}
                          onChange={(e) =>
                            setFilters({ ...filters, minAge: e.target.value })
                          }
                          className="w-full text-sm rounded-md border border-border bg-white px-3 py-2 outline-none focus:border-black placeholder:text-text-muted/50"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-text-primary mb-1">
                          Max Age
                        </label>
                        <input
                          type="number"
                          placeholder="65"
                          value={filters.maxAge}
                          onChange={(e) =>
                            setFilters({ ...filters, maxAge: e.target.value })
                          }
                          className="w-full text-sm rounded-md border border-border bg-white px-3 py-2 outline-none focus:border-black placeholder:text-text-muted/50"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end pt-2">
                      <button
                        onClick={handleGenerateTarget}
                        disabled={processingTarget}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-neutral-800 disabled:opacity-50 transition-colors"
                      >
                        <Filter size={16} />{" "}
                        {processingTarget
                          ? "Generating..."
                          : "Generate Targets"}
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 mt-2 text-center bg-surface border border-dashed border-border rounded-md text-text-muted">
                <Globe size={32} className="opacity-20 mb-3" />
                <p className="text-sm">
                  This survey is open to a general audience.
                </p>
                <p className="text-xs mt-1">
                  Change access type to 'Targeted' to define a specific
                  audience.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
