import React from "react";

const ACTION_CONFIGS = {
  ELIMINATE: { label: "Eliminate", bg: "bg-red-100 text-red-800 border-red-300" },
  SIMPLIFY: { label: "Simplify", bg: "bg-amber-100 text-amber-800 border-amber-300" },
  STANDARDIZE: { label: "Standardize", bg: "bg-blue-100 text-blue-800 border-blue-300" },
  AUTOMATE: { label: "Automate", bg: "bg-green-100 text-green-800 border-green-300" },
  AUGMENT: { label: "Augment", bg: "bg-purple-100 text-purple-800 border-purple-300" },
};

const MODE_CONFIGS = {
  AGENT_EXECUTES: { label: "Agent Executes", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  AGENT_DRAFTS_HUMAN_OWNS: { label: "Agent Drafts / Human Owns", bg: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  HUMAN_UNCHANGED: { label: "Human Unchanged", bg: "bg-slate-100 text-slate-700 border-slate-300" },
  ELIMINATED: { label: "Eliminated", bg: "bg-gray-100 text-gray-500 border-gray-200 line-through" },
};

export function ActionTypeBadge({ actionType }) {
  const config = ACTION_CONFIGS[actionType] || { label: actionType || "N/A", bg: "bg-gray-100 text-gray-700 border-gray-200" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${config.bg}`}>
      {config.label}
    </span>
  );
}

export function HumanAiModeBadge({ mode }) {
  const config = MODE_CONFIGS[mode] || { label: mode || "N/A", bg: "bg-gray-100 text-gray-700 border-gray-200" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg}`}>
      {config.label}
    </span>
  );
}