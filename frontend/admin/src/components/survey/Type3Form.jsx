import React from "react";

export default function Type3Form({ data, setData }) {
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
      {/* Asset Coverage */}
      <div>
        <label className="block text-sm font-medium mb-1">Asset Coverage</label>
        {["land", "housing", "financial", "livestock", "durables"].map((a) => (
          <label key={a} className="flex gap-1 items-center">
            <input
              type="checkbox"
              checked={(data.assetCoverage || []).includes(a)}
              onChange={() => toggle("assetCoverage", a)}
            />
            {a}
          </label>
        ))}
      </div>

      {/* Debt Type */}
      <div>
        <label className="block text-sm font-medium mb-1">Debt Type</label>
        {["institutional", "non_institutional"].map((d) => (
          <label key={d} className="flex gap-1 items-center">
            <input
              type="checkbox"
              checked={(data.debtType || []).includes(d)}
              onChange={() => toggle("debtType", d)}
            />
            {d}
          </label>
        ))}
      </div>

      {/* Reference Period */}
      <div>
        <label className="block text-sm font-medium mb-1">Reference Period</label>
        {["stock", "flow"].map((r) => (
          <label key={r} className="flex gap-1 items-center">
            <input
              type="radio"
              checked={data.referencePeriod === r}
              onChange={() => update("referencePeriod", r)}
            />
            {r}
          </label>
        ))}
      </div>

      {/* Sensitivity */}
      <div>
        <label className="block text-sm font-medium mb-1">Sensitivity</label>
        {["low", "medium", "high"].map((s) => (
          <label key={s} className="flex gap-1 items-center">
            <input
              type="radio"
              checked={data.sensitivityLevel === s}
              onChange={() => update("sensitivityLevel", s)}
            />
            {s}
          </label>
        ))}
      </div>

      {/* Validation Mode */}
      <select
        className="w-full border rounded px-3 py-2"
        value={data.validationMode || ""}
        onChange={(e) => update("validationMode", e.target.value)}
      >
        <option value="">Validation Mode</option>
        <option value="cross_check">Cross-check enabled</option>
        <option value="light">Light validation</option>
        <option value="none">No validation</option>
      </select>

      {/* Privacy Mode */}
      <div>
        <label className="block text-sm font-medium mb-1">Privacy Mode</label>
        {["full", "partial", "anonymous"].map((p) => (
          <label key={p} className="flex gap-1 items-center">
            <input
              type="radio"
              checked={data.privacyMode === p}
              onChange={() => update("privacyMode", p)}
            />
            {p}
          </label>
        ))}
      </div>
    </div>
  );
}
