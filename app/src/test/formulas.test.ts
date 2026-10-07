import { describe, it, expect } from "vitest";
import { unlockedCapacity, fteEquivalent, financialValue, durationDays, discoveryQuestions, employeeWorkflowSteps, steps } from "@/lib/demo-data";

describe("platform formulas", () => {
  it("excludes deliverables scoring below the 3.5 quality gate", () => {
    expect(unlockedCapacity([{ baseline: 10, ai: 4, volume: 2, quality: 4 }, { baseline: 10, ai: 0, volume: 5, quality: 3.4 }])).toBe(12);
  });
  it("FTE uses 160h per month", () => expect(fteEquivalent(320)).toBe(2));
  it("value = hours x rate", () => expect(financialValue(10, 85)).toBe(850));
  it("same-day logging converts hours to days", () => expect(durationDays({ mode: "dates", start: "2026-10-05", end: "2026-10-05", hours: 4 })).toBe(0.5));
  it("employee logging offers every manager-visible work step", () => {
    expect(employeeWorkflowSteps.map((step) => step.id)).toEqual(steps.filter((step) => !["start", "end"].includes(step.id)).map((step) => step.id));
  });
  it("flags the longest operational steps as bottlenecks", () => {
    expect(steps.filter((step) => step.bottleneck).map((step) => step.id)).toEqual(["C", "I"]);
  });
  it("discovery modules collect qualitative answers without scoring fields", () => {
    expect(discoveryQuestions).toHaveLength(4);
    expect(discoveryQuestions.every((question) => "q" in question && "a" in question && !("score" in question))).toBe(true);
  });
});
