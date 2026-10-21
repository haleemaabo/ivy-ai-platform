import React, { useState } from "react";

export default function BlindQualityReview({ deliverable, onSubmitReview }) {
  const [scores, setScores] = useState({
    accuracy: 3,
    completeness: 3,
    actionability: 3,
    compliance: 3,
  });
  const [submitted, setSubmitted] = useState(false);

  const averageScore = (
    (Number(scores.accuracy) +
      Number(scores.completeness) +
      Number(scores.actionability) +
      Number(scores.compliance)) /
    4
  ).toFixed(2);

  const clearedGate = averageScore >= 3.5;

  const handleScoreChange = (dimension, value) => {
    setScores((prev) => ({ ...prev, [dimension]: Number(value) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (onSubmitReview) {
      onSubmitReview({
        deliverableId: deliverable?.id,
        scores,
        averageScore: Number(averageScore),
        clearedGate,
      });
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm max-w-xl">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
        <div>
          <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-semibold rounded mb-1">
            Blind Assessment Mode
          </span>
          <h3 className="text-base font-bold text-slate-900">
            {deliverable?.label || "Deliverable Audit"}
          </h3>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-500 block">Owner / Performer</span>
          <span className="text-sm font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
            [ANONYMIZED]
          </span>
        </div>
      </div>

      <div className="mb-4">
        <label className="text-xs font-semibold text-slate-500 uppercase">Deliverable Content / Sample</label>
        <p className="text-sm text-slate-800 bg-slate-50 p-3 rounded border border-slate-200 mt-1 italic">
          "{deliverable?.deliverable || "Draft output pending review."}"
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {[
          { key: "accuracy", label: "Accuracy & Factuality" },
          { key: "completeness", label: "Completeness & Scope" },
          { key: "actionability", label: "Actionability & Utility" },
          { key: "compliance", label: "Compliance & Governance" },
        ].map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700">{label}</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((val) => (
                <button
                  type="button"
                  key={val}
                  onClick={() => handleScoreChange(key, val)}
                  className={`w-8 h-8 rounded text-xs font-bold transition-colors ${
                    scores[key] === val
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 block">Composite Quality Score</span>
            <span className={`text-2xl font-black ${clearedGate ? "text-emerald-600" : "text-amber-600"}`}>
              {averageScore} <span className="text-xs font-normal text-slate-400">/ 5.0</span>
            </span>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-500 block">Quality Gate (3.5 Threshold)</span>
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                clearedGate ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
              }`}
            >
              {clearedGate ? "✓ CLEARED — UNLOCK CAPACITY" : "✕ FAILED — HOLD CAPACITY"}
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitted}
          className="w-full mt-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors disabled:opacity-50"
        >
          {submitted ? "Review Submitted & Recorded" : "Submit Blind Quality Assessment"}
        </button>
      </form>
    </div>
  );
}