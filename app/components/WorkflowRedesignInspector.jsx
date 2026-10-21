import React from "react";
import { ActionTypeBadge, HumanAiModeBadge } from "./WorkflowRedesignBadges";
import { calculateTurnaroundReduction } from "@/lib/analytics";

export default function WorkflowRedesignInspector({ step, onUpdateStep, onClose }) {
  if (!step) return null;

  const reductionPct = calculateTurnaroundReduction(step.beforeHours ?? 0, step.afterHours ?? 0);

  const handleChange = (field, value) => {
    onUpdateStep({
      ...step,
      [field]: field === "beforeHours" || field === "afterHours" ? parseFloat(value) || 0 : value,
    });
  };

  return (
    <div className="w-80 border-l border-slate-200 bg-white p-4 h-full flex flex-col justify-between shadow-lg">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
          <h3 className="text-base font-semibold text-slate-800">Redesign Inspector</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
        </div>

        <div className="space-y-4 text-sm">
          <div>
            <label className="block font-medium text-slate-700">Step Name</label>
            <p className="text-slate-900 font-semibold">{step.label} — {step.task}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">5-Action Classification</label>
            <select
              value={step.actionType || "STANDARDIZE"}
              onChange={(e) => handleChange("actionType", e.target.value)}
              className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ELIMINATE">ELIMINATE (Remove step completely)</option>
              <option value="SIMPLIFY">SIMPLIFY (Reduce complexity/handoffs)</option>
              <option value="STANDARDIZE">STANDARDIZE (Uniform template/process)</option>
              <option value="AUTOMATE">AUTOMATE (Agent executes autonomously)</option>
              <option value="AUGMENT">AUGMENT (Agent drafts, Human reviews)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Human-AI Execution Mode</label>
            <select
              value={step.humanAiMode || "HUMAN_UNCHANGED"}
              onChange={(e) => handleChange("humanAiMode", e.target.value)}
              className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="AGENT_EXECUTES">Agent Executes</option>
              <option value="AGENT_DRAFTS_HUMAN_OWNS">Agent Drafts / Human Owns</option>
              <option value="HUMAN_UNCHANGED">Human Unchanged</option>
              <option value="ELIMINATED">Eliminated</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs text-slate-500 font-medium">Before Hours</label>
              <input
                type="number"
                step="0.5"
                value={step.beforeHours ?? 0}
                onChange={(e) => handleChange("beforeHours", e.target.value)}
                className="w-full border border-slate-300 rounded px-2 py-1 text-sm mt-1"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 font-medium">After Hours</label>
              <input
                type="number"
                step="0.5"
                value={step.afterHours ?? 0}
                onChange={(e) => handleChange("afterHours", e.target.value)}
                className="w-full border border-slate-300 rounded px-2 py-1 text-sm mt-1"
              />
            </div>
          </div>

          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 mt-2">
            <span className="block text-xs text-emerald-700 font-medium">Turnaround Time Reduction</span>
            <span className="text-xl font-bold text-emerald-800">{reductionPct}%</span>
            <span className="text-xs text-emerald-600 block mt-0.5">
              Saved {Math.max(0, (step.beforeHours ?? 0) - (step.afterHours ?? 0))} hours / cycle
            </span>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
        <ActionTypeBadge actionType={step.actionType} />
        <HumanAiModeBadge mode={step.humanAiMode} />
      </div>
    </div>
  );
}