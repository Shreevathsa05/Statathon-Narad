import React from "react";

export default function Type2Form({ data, setData }) {
  const update = (k, v) => setData({ ...data, [k]: v });

  const toggle = (key, value) => {
    const arr = data[key] || [];
    update(
      key,
      arr.includes(value)
        ? arr.filter((v) => v !== value)
        : [...arr, value]
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">
          Survey Objective
        </label>
        <input
          className="w-full border border-gray-300 rounded-md px-3 py-2"
          placeholder="e.g. Assess employment status and labour force participation among working-age individuals."
          value={data.surveyObjective || ""}
          onChange={(e) => update("surveyObjective", e.target.value)}
        />
      </div>

      <select
        className="w-full border rounded px-3 py-2"
        value={data.ageGroup || ""}
        onChange={(e) => update("ageGroup", e.target.value)}
      >
        <option value="">Age Group</option>
        <option value="15_plus">15+</option>
        <option value="15_29">15–29</option>
        <option value="18_60">18–60</option>
        <option value="all">All ages</option>
      </select>

      <select
        className="w-full border rounded px-3 py-2"
        value={data.referencePeriod || ""}
        onChange={(e) => update("referencePeriod", e.target.value)}
      >
        <option value="">Reference Period</option>
        <option value="current_week">Current week</option>
        <option value="last_7_days">Last 7 days</option>
        <option value="usual_status">Usual status (12 months)</option>
      </select>

      {/* Sector Focus */}
      <div>
        <label className="block text-sm font-medium mb-1">Sector Focus</label>
        <div className="grid grid-cols-2 gap-2">
          {["agriculture", "manufacturing", "construction", "services"].map(
            (s) => (
              <label key={s} className="flex gap-1 items-center">
                <input
                  type="checkbox"
                  checked={(data.sectorFocus || []).includes(s)}
                  onChange={() => toggle("sectorFocus", s)}
                />
                {s}
              </label>
            )
          )}
        </div>
      </div>

      {/* Question Depth */}
      <div>
        <label className="block text-sm font-medium mb-1">Question Depth</label>
        {["minimal", "standard", "detailed"].map((d) => (
          <label key={d} className="flex gap-1 items-center">
            <input
              type="radio"
              checked={data.questionDepth === d}
              onChange={() => update("questionDepth", d)}
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

      {/* Interview Mode */}
      <div>
        <label className="block text-sm font-medium mb-1">Interview Mode</label>
        {["CAPI", "CATI", "CAWI"].map((m) => (
          <label key={m} className="flex gap-1 items-center">
            <input
              type="radio"
              checked={data.interviewMode === m}
              onChange={() => update("interviewMode", m)}
            />
            {m}
          </label>
        ))}
      </div>
    </div>
  );
}
