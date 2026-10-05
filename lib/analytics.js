export function calculateWorkflowMetrics(inputs) {
  let totalUnlockedCapacityHours = 0;

  inputs.forEach((item) => {
    // Quality-Adjusted Gate Rule: Score >= 3.5 releases capacity
    if (item.qualityScore >= 3.5) {
      const savedHours = Math.max(0, item.baselineEffortHours - item.aiEffortHours);
      totalUnlockedCapacityHours += savedHours * item.monthlyOutputVolume;
    }
  });

  const avgHourlyRate = inputs.length > 0 ? inputs[0].blendedHourlyRate : 0;
  const financialValueRealized = totalUnlockedCapacityHours * avgHourlyRate;
  const fteEquivalentGain = totalUnlockedCapacityHours / 160; // 160h standard month

  return {
    totalUnlockedCapacityHours,
    financialValueRealized,
    fteEquivalentGain,
  };
}

export function calculateAdoptionIndex(sFreq, sQual, sVerif, sMaturity) {
  const w1 = 0.25, w2 = 0.35, w3 = 0.20, w4 = 0.20;
  return Math.round((w1 * sFreq) + (w2 * sQual) + (w3 * sVerif) + (w4 * sMaturity));
}