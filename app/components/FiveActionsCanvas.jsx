import React, { useState } from 'react';

const ACTION_LEVERS = [
  {
    id: 'ELIMINATE',
    name: 'Eliminate',
    color: 'bg-red-100 text-red-800 border-red-300',
    description: 'Remove redundant approvals, duplicate data entry, or low-value status meetings.'
  },
  {
    id: 'SIMPLIFY',
    name: 'Simplify',
    color: 'bg-amber-100 text-amber-800 border-amber-300',
    description: 'Reduce step complexity, collapse multiple handoffs, or streamline review loops.'
  },
  {
    id: 'STANDARDIZE',
    name: 'Standardize',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    description: 'Enforce structured inputs, standardized templates, or canonical data formats.'
  },
  {
    id: 'AUTOMATE',
    name: 'Automate',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    description: 'Let AI/agents execute end-to-end tasks directly with zero manual intervention.'
  },
  {
    id: 'AUGMENT',
    name: 'Augment',
    color: 'bg-purple-100 text-purple-800 border-purple-300',
    description: 'AI drafts initial outputs; humans review, refine, and retain final decision ownership.'
  }
];

export default function FiveActionsCanvas({ steps = [], onSaveRedesign }) {
  const [redesignState, setRedesignState] = useState(() =>
    steps.reduce((acc, step) => {
      acc[step.id] = {
        lever: step.lever || 'AUGMENT',
        humanHoursBefore: step.durationHours || 2,
        humanHoursAfter: step.durationHoursAfter ?? (step.durationHours ? step.durationHours * 0.1 : 0.5),
        notes: step.notes || ''
      };
      return acc;
    }, {})
  );

  const handleLeverChange = (stepId, leverId) => {
    setRedesignState((prev) => ({
      ...prev,
      [stepId]: { ...prev[stepId], lever: leverId }
    }));
  };

  const handleHoursChange = (stepId, field, value) => {
    const numValue = Math.max(0, parseFloat(value) || 0);
    setRedesignState((prev) => ({
      ...prev,
      [stepId]: { ...prev[stepId], [field]: numValue }
    }));
  };

  const handleNotesChange = (stepId, notes) => {
    setRedesignState((prev) => ({
      ...prev,
      [stepId]: { ...prev[stepId], notes }
    }));
  };

  const totalBefore = Object.values(redesignState).reduce((acc, curr) => acc + curr.humanHoursBefore, 0);
  const totalAfter = Object.values(redesignState).reduce((acc, curr) => acc + curr.humanHoursAfter, 0);
  const totalSaved = totalBefore - totalAfter;
  const reductionPct = totalBefore > 0 ? ((totalSaved / totalBefore) * 100).toFixed(1) : '0.0';

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200 font-sans text-slate-800">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-slate-200 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">5-Action Redesign Canvas</h2>
          <p className="text-sm text-slate-500">
            Apply redesign levers (Eliminate, Simplify, Standardize, Automate, Augment) across workflow steps.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm">
          <div>
            <span className="block text-xs text-slate-500 uppercase font-semibold">Baseline ($T_0$)</span>
            <span className="font-bold text-slate-700">{totalBefore} hrs</span>
          </div>
          <span className="text-slate-400 font-bold">→</span>
          <div>
            <span className="block text-xs text-slate-500 uppercase font-semibold">Target ($T_2$)</span>
            <span className="font-bold text-emerald-600">{totalAfter} hrs</span>
          </div>
          <div className="pl-3 border-l border-slate-300">
            <span className="block text-xs text-slate-500 uppercase font-semibold">Reduction</span>
            <span className="font-bold text-indigo-600">{reductionPct}% ({totalSaved} hrs)</span>
          </div>
        </div>
      </div>

      <div className="py-4">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Redesign Levers Legend</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {ACTION_LEVERS.map((lever) => (
            <div key={lever.id} className={`p-2.5 rounded-lg border text-xs ${lever.color}`}>
              <div className="font-bold mb-0.5">{lever.name}</div>
              <div className="opacity-90">{lever.description}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {steps.map((step, idx) => {
          const config = redesignState[step.id] || {};
          return (
            <div key={step.id || idx} className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 hover:bg-white transition-colors">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="lg:w-1/3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                      Step {idx + 1}
                    </span>
                    <h4 className="font-semibold text-slate-900">{step.name || step.title}</h4>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{step.description || 'No description provided.'}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:w-2/3 justify-start lg:justify-end">
                  <div className="flex gap-1">
                    {ACTION_LEVERS.map((lever) => {
                      const isSelected = config.lever === lever.id;
                      return (
                        <button
                          key={lever.id}
                          type="button"
                          onClick={() => handleLeverChange(step.id, lever.id)}
                          className={`px-2.5 py-1 text-xs font-medium rounded border transition-all ${
                            isSelected
                              ? `${lever.color} font-bold ring-2 ring-indigo-500 shadow-sm`
                              : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          {lever.name}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-2 ml-auto">
                    <div className="flex items-center gap-1">
                      <label className="text-xs text-slate-500">$T_0$ h:</label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={config.humanHoursBefore}
                        onChange={(e) => handleHoursChange(step.id, 'humanHoursBefore', e.target.value)}
                        className="w-16 px-2 py-1 border border-slate-300 rounded text-xs text-center"
                      />
                    </div>
                    <span className="text-slate-400">→</span>
                    <div className="flex items-center gap-1">
                      <label className="text-xs text-slate-500">$T_2$ h:</label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={config.humanHoursAfter}
                        onChange={(e) => handleHoursChange(step.id, 'humanHoursAfter', e.target.value)}
                        className="w-16 px-2 py-1 border border-slate-300 rounded text-xs text-center font-bold text-emerald-600"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <input
                  type="text"
                  placeholder="Redesign rationale or agent execution prompt details..."
                  value={config.notes}
                  onChange={(e) => handleNotesChange(step.id, e.target.value)}
                  className="w-full text-xs px-3 py-1.5 border border-slate-200 rounded bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end">
        <button
          type="button"
          onClick={() => onSaveRedesign && onSaveRedesign(redesignState)}
          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm shadow transition-colors"
        >
          Save & Apply Redesign State
        </button>
      </div>
    </div>
  );
}