import React from "react";

export default function Type4Form({ data, setData }) {
  const update = (k, v) => setData({ ...data, [k]: v });

  return (
    <div className="space-y-4">
      {/* Enterprise Type */}
      <div>
        <label className="block text-sm font-medium mb-1">Enterprise Type</label>
        {["proprietary", "partnership", "company", "cooperative"].map((e) => (
          <label key={e} className="flex gap-1 items-center">
            <input
              type="radio"
              checked={data.enterpriseType === e}
              onChange={() => update("enterpriseType", e)}
            />
            {e}
          </label>
        ))}
      </div>

      {/* Registration */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Registration Status
        </label>
        {["registered", "unregistered"].map((r) => (
          <label key={r} className="flex gap-1 items-center">
            <input
              type="radio"
              checked={data.registrationStatus === r}
              onChange={() => update("registrationStatus", r)}
            />
            {r}
          </label>
        ))}
      </div>

      {/* Industry */}
      <select
        className="w-full border rounded px-3 py-2"
        value={data.industryClassification || ""}
        onChange={(e) =>
          update("industryClassification", e.target.value)
        }
      >
        <option value="">Industry Classification</option>
        <option value="manufacturing">Manufacturing</option>
        <option value="trade">Trade</option>
        <option value="services">Services</option>
        <option value="construction">Construction</option>
        <option value="other">Other</option>
      </select>

      {/* Size */}
      <select
        className="w-full border rounded px-3 py-2"
        value={data.enterpriseSize || ""}
        onChange={(e) => update("enterpriseSize", e.target.value)}
      >
        <option value="">Enterprise Size</option>
        <option value="micro">Micro</option>
        <option value="small">Small</option>
        <option value="medium">Medium</option>
        <option value="large">Large</option>
      </select>

      {/* Accounting Period */}
      <select
        className="w-full border rounded px-3 py-2"
        value={data.accountingPeriod || ""}
        onChange={(e) => update("accountingPeriod", e.target.value)}
      >
        <option value="">Accounting Period</option>
        <option value="financial_year">Last Financial Year</option>
        <option value="quarter">Last Quarter</option>
        <option value="custom">Custom Period</option>
      </select>

      {/* Data Source */}
      <div>
        <label className="block text-sm font-medium mb-1">Data Source</label>
        {["records", "recall", "mixed"].map((d) => (
          <label key={d} className="flex gap-1 items-center">
            <input
              type="radio"
              checked={data.dataSourceType === d}
              onChange={() => update("dataSourceType", d)}
            />
            {d}
          </label>
        ))}
      </div>

      {/* Validation Strictness */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Validation Strictness
        </label>
        {["low", "medium", "high"].map((v) => (
          <label key={v} className="flex gap-1 items-center">
            <input
              type="radio"
              checked={data.validationStrictness === v}
              onChange={() => update("validationStrictness", v)}
            />
            {v}
          </label>
        ))}
      </div>
    </div>
  );
}
