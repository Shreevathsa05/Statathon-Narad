import React from "react";

export default function Type2Form({ data, setData }) {
  const update = (k, v) => setData({ ...data, [k]: v });

  return (
    <div className="grid gap-4">
      <input className="border border-gray-300 rounded-md px-3 py-2" placeholder="Survey Objective"
        value={data.surveyObjective || ""} onChange={(e)=>update("surveyObjective",e.target.value)} />

      <input className="border border-gray-300 rounded-md px-3 py-2" placeholder="Age Group"
        value={data.ageGroup || ""} onChange={(e)=>update("ageGroup",e.target.value)} />

      <input className="border border-gray-300 rounded-md px-3 py-2" placeholder="Reference Period"
        value={data.referencePeriod || ""} onChange={(e)=>update("referencePeriod",e.target.value)} />

      <input className="border border-gray-300 rounded-md px-3 py-2" placeholder="Sector Focus"
        value={data.sectorFocus || ""} onChange={(e)=>update("sectorFocus",e.target.value)} />

      <input className="border border-gray-300 rounded-md px-3 py-2" placeholder="Question Depth"
        value={data.questionDepth || ""} onChange={(e)=>update("questionDepth",e.target.value)} />

      <input className="border border-gray-300 rounded-md px-3 py-2" placeholder="Interview Mode"
        value={data.interviewMode || ""} onChange={(e)=>update("interviewMode",e.target.value)} />
    </div>
  );
}
