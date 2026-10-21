export function calculateWorkflowMetrics(inputs) {
  let totalUnlockedCapacityHours = 0;

  inputs.forEach((item) => {
    // Quality-Adjusted Gate Rule: Score >= 3.5 strictly required to release capacity
    const quality = item.qualityScore ?? item.quality ?? 0;
    if (quality >= 3.5) {
      const baseline = item.baselineHours ?? item.baselineEffortHours ?? 0;
      const sprintOrAi = item.sprintHours ?? item.aiEffortHours ?? 0;
      const volume = item.volume ?? item.monthlyOutputVolume ?? 1;

      const savedHours = Math.max(0, baseline - sprintOrAi);
      totalUnlockedCapacityHours += savedHours * volume;
    }
  });

  const avgHourlyRate = inputs.length > 0 ? (inputs[0].blendedHourlyRate ?? inputs[0].blendedRate ?? 85) : 85;
  const financialValueRealized = totalUnlockedCapacityHours * avgHourlyRate;
  const fteEquivalentGain = totalUnlockedCapacityHours / 160; // 160h standard month

  return {
    totalUnlockedCapacityHours,
    financialValueRealized,
    fteEquivalentGain,
  };
}

export function calculateSprintROI(baselineHours, sprintHours, volume = 1, blendedRate = 85) {
  const capacityUnlockedHours = Math.max(0, baselineHours - sprintHours) * volume;
  const financialSavings = capacityUnlockedHours * blendedRate;
  const fteGain = capacityUnlockedHours / 160;

  return {
    capacityUnlockedHours,
    financialSavings,
    fteGain,
  };
}

export function calculateTurnaroundReduction(beforeHours, afterHours) {
  if (!beforeHours || beforeHours <= 0) return 0;
  const reductionFraction = (beforeHours - afterHours) / beforeHours;
  return Math.max(0, Math.round(reductionFraction * 100)); // Target 60%-70% reduction
}

export function calculateAdoptionIndex(sFreq, sQual, sVerif, sMaturity) {
  const w1 = 0.25, w2 = 0.35, w3 = 0.20, w4 = 0.20;
  return Math.round((w1 * sFreq) + (w2 * sQual) + (w3 * sVerif) + (w4 * sMaturity));
}