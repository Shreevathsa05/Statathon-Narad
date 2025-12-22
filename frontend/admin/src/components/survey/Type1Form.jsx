import React, { useEffect } from "react";

/* ---------------------------------- */
/* Region eligibility by household type */
/* ---------------------------------- */

const REGION_OPTIONS = {
  rural: [
    { value: "national", label: "National" },
    { value: "state", label: "State" },
    { value: "district", label: "District" },
    { value: "rural_cluster", label: "Rural Cluster" },
  ],
  urban: [
    { value: "national", label: "National" },
    { value: "state", label: "State" },
    { value: "district", label: "District" },
    { value: "city", label: "City" },
    { value: "suburban", label: "Suburban" },
  ],
  mixed: [
    { value: "national", label: "National" },
    { value: "state", label: "State" },
    { value: "district", label: "District" },
  ],
};

export default function Type1Form({ data, setData }) {
  const update = (key, value) =>
    setData((prev) => ({ ...prev, [key]: value }));

  /* ------------------------------------------------ */
  /* Reset region if household type changes to invalid */
  /* ------------------------------------------------ */
  useEffect(() => {
    if (!data.householdType || !data.region) return;

    const allowedRegions =
      REGION_OPTIONS[data.householdType]?.map((r) => r.value) || [];

    if (!allowedRegions.includes(data.region)) {
      update("region", "");
    }
  }, [data.householdType]);

  return (
    <div className="space-y-5 mt-4">

      {/* Survey Objective */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Survey Objective
        </label>
        <input
          className="w-full border border-gray-300 rounded-md px-3 py-2"
          placeholder="e.g. Measure household consumption and living conditions"
          value={data.surveyObjective || ""}
          onChange={(e) => update("surveyObjective", e.target.value)}
        />
        <p className="text-xs text-gray-500 mt-1">
          Defines which consumption modules (food, housing, energy) will be activated.
        </p>
      </div>

      {/* Household Type */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Household Type
        </label>
        <select
          className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white"
          value={data.householdType || ""}
          onChange={(e) => update("householdType", e.target.value)}
        >
          <option value="">Select household type</option>
          <option value="rural">Rural</option>
          <option value="urban">Urban</option>
          <option value="mixed">Mixed</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Determines settlement-specific routing and eligibility logic.
        </p>
      </div>

      {/* Recall Period */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Recall Period
        </label>
        <select
          className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white"
          value={data.recallPeriod || ""}
          onChange={(e) => update("recallPeriod", e.target.value)}
        >
          <option value="">Select recall period</option>
          <option value="7_days">Last 7 days</option>
          <option value="30_days">Last 30 days</option>
          <option value="365_days">Last 365 days</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Must align with the consumption variable being measured.
        </p>
      </div>

      {/* Survey Length */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Survey Length
        </label>
        <select
          className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white"
          value={data.surveyLength || ""}
          onChange={(e) => update("surveyLength", e.target.value)}
        >
          <option value="">Select length</option>
          <option value="short">Short</option>
          <option value="standard">Standard</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Controls number of questions to manage respondent fatigue.
        </p>
      </div>

      {/* Region / Geography (FILTERED) */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Region / Geography
        </label>

        <select
          className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white"
          value={data.region || ""}
          onChange={(e) => update("region", e.target.value)}
          disabled={!data.householdType}
        >
          <option value="">
            {data.householdType
              ? "Select region"
              : "Select household type first"}
          </option>

          {(REGION_OPTIONS[data.householdType] || []).map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>

        <p className="text-xs text-gray-500 mt-1">
          Region options are filtered based on household settlement type to
          maintain eligibility and language consistency.
        </p>
      </div>
    </div>
  );
}
