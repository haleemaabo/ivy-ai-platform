import React from "react";

export default function QualityGateSummaryCard({ reviews = [] }) {
  const totalReviews = reviews.length;
  const passedReviews = reviews.filter((r) => r.averageScore >= 3.5).length;
  const passRate = totalReviews > 0 ? Math.round((passedReviews / totalReviews) * 100) : 0;
  
  const avgOverall = totalReviews > 0
    ? (reviews.reduce((acc, curr) => acc + Number(curr.averageScore || 0), 0) / totalReviews).toFixed(2)
    : "0.00";

  return (
    <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-5 rounded-xl border border-slate-800 shadow-md mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
          Blind Quality Gate & Capacity Release Monitor
        </h3>
        <span className="text-xs bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 px-2 py-0.5 rounded">
          Gate Threshold: ≥ 3.5 / 5.0
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/5 p-3 rounded-lg border border-white/10">
          <span className="text-xs text-slate-400 block font-medium">Quality Gate Pass Rate</span>
          <span className="text-2xl font-black text-emerald-400">{passRate}%</span>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            {passedReviews} of {totalReviews} deliverables passed
          </span>
        </div>

        <div className="bg-white/5 p-3 rounded-lg border border-white/10">
          <span className="text-xs text-slate-400 block font-medium">Average Quality Score</span>
          <span className="text-2xl font-black text-white">{avgOverall}</span>
          <span className="text-[11px] text-slate-400 block mt-0.5">Across 4 blind criteria</span>
        </div>

        <div className="bg-white/5 p-3 rounded-lg border border-white/10">
          <span className="text-xs text-slate-400 block font-medium">Capacity Release Status</span>
          <span className={`text-2xl font-black ${passRate >= 80 ? "text-emerald-400" : "text-amber-400"}`}>
            {passRate >= 80 ? "APPROVED" : "CONDITIONAL"}
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            {passRate >= 80 ? "ROI realized in dashboard" : "Rework cycles pending"}
          </span>
        </div>
      </div>
    </div>
  );
}