import React from "react";

export default function SurveyTypeSelector({ value, onChange }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-1">
        Survey Type
      </label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white"
      >
        <option value="">Select Survey Type</option>
        <option value="type1">Household Consumption</option>
        <option value="type2">Labour & Employment</option>
        <option value="type3">Assets & Debt</option>
        <option value="type4">Enterprise</option>
      </select>
    </div>
  );
}
