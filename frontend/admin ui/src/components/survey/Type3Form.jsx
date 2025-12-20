import React from "react";

export default function Type3Form({ data, setData }) {
  const update = (k, v) => setData({ ...data, [k]: v });

  return (
    <div className="grid gap-4">
      <input className="border border-gray-300 rounded-md px-3 py-2" placeholder="Asset Coverage"
        value={data.assetCoverage || ""} onChange={(e)=>update("assetCoverage",e.target.value)} />

      <input className="border border-gray-300 rounded-md px-3 py-2" placeholder="Debt Type"
        value={data.debtType || ""} onChange={(e)=>update("debtType",e.target.value)} />

      <input className="border border-gray-300 rounded-md px-3 py-2" placeholder="Reference Period"
        value={data.referencePeriod || ""} onChange={(e)=>update("referencePeriod",e.target.value)} />

      <input className="border border-gray-300 rounded-md px-3 py-2" placeholder="Sensitivity Level"
        value={data.sensitivityLevel || ""} onChange={(e)=>update("sensitivityLevel",e.target.value)} />

      <input className="border border-gray-300 rounded-md px-3 py-2" placeholder="Privacy Mode"
        value={data.privacyMode || ""} onChange={(e)=>update("privacyMode",e.target.value)} />
    </div>
  );
}
