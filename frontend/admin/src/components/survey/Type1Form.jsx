import React from "react";

export default function Type1Form({ data, setData }) {
  const update = (k, v) => setData({ ...data, [k]: v });

  return (
    <div className="grid gap-4">
      <input
        className="border border-gray-300 rounded-md px-3 py-2"
        placeholder="Survey Objective"
        value={data.surveyObjective || ""}
        onChange={(e) => update("surveyObjective", e.target.value)}
      />

      <input
        className="border border-gray-300 rounded-md px-3 py-2"
        placeholder="Household Type (rural / urban / mixed)"
        value={data.householdType || ""}
        onChange={(e) => update("householdType", e.target.value)}
      />

      <input
        className="border border-gray-300 rounded-md px-3 py-2"
        placeholder="Recall Period"
        value={data.recallPeriod || ""}
        onChange={(e) => update("recallPeriod", e.target.value)}
      />

      <input
        className="border border-gray-300 rounded-md px-3 py-2"
        placeholder="Survey Length"
        value={data.surveyLength || ""}
        onChange={(e) => update("surveyLength", e.target.value)}
      />

      <input
        className="border border-gray-300 rounded-md px-3 py-2"
        placeholder="Region"
        value={data.region || ""}
        onChange={(e) => update("region", e.target.value)}
      />
    </div>
  );
}
