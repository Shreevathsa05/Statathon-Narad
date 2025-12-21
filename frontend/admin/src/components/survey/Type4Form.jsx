import React from "react";

export default function Type4Form({ data, setData }) {
  const update = (k, v) => setData({ ...data, [k]: v });

  return (
    <div className="grid gap-4">
      <input className="border border-gray-300 rounded-md px-3 py-2" placeholder="Enterprise Type"
        value={data.enterpriseType || ""} onChange={(e)=>update("enterpriseType",e.target.value)} />

      <input className="border border-gray-300 rounded-md px-3 py-2" placeholder="Registration Status"
        value={data.registrationStatus || ""} onChange={(e)=>update("registrationStatus",e.target.value)} />

      <input className="border border-gray-300 rounded-md px-3 py-2" placeholder="Industry Classification"
        value={data.industryClassification || ""} onChange={(e)=>update("industryClassification",e.target.value)} />

      <input className="border border-gray-300 rounded-md px-3 py-2" placeholder="Enterprise Size"
        value={data.enterpriseSize || ""} onChange={(e)=>update("enterpriseSize",e.target.value)} />

      <input className="border border-gray-300 rounded-md px-3 py-2" placeholder="Accounting Period"
        value={data.accountingPeriod || ""} onChange={(e)=>update("accountingPeriod",e.target.value)} />
    </div>
  );
}
