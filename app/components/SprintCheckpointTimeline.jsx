import React from "react";

export default function SprintCheckpointTimeline({ checkpoints }) {
  if (!checkpoints || checkpoints.length === 0) return null;

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm mb-6">
      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">
        4-Week Sprint Progress & Milestone Checkpoints
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {checkpoints.map((cp, idx) => {
          const isCompleted = cp.status === "Completed";
          const isActive = cp.status === "Active";

          return (
            <div
              key={idx}
              className={`p-4 rounded-lg border relative ${
                isActive
                  ? "border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-200"
                  : isCompleted
                  ? "border-emerald-200 bg-emerald-50/30"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500">{cp.checkpoint}</span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    isCompleted
                      ? "bg-emerald-100 text-emerald-800"
                      : isActive
                      ? "bg-indigo-100 text-indigo-800"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {cp.status}
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900">{cp.hoursRequired}h</div>
              <div className="text-xs text-slate-500 font-medium mt-1">
                Capacity Unlocked: <span className="font-bold text-slate-700">{cp.capacityUnlockedPct}%</span>
              </div>
              <div className="text-xs text-slate-500 font-medium">
                Blind Quality Rating: <span className={`font-bold ${cp.qualityScore >= 3.5 ? "text-emerald-700" : "text-amber-600"}`}>{cp.qualityScore} / 5.0</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}