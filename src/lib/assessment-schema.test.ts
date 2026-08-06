import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  ASSESSMENT_RULES,
  assessTargetFit,
  validateIntake,
  validateAssessment,
} from "./assessment-schema.ts";

/** Builds a report that satisfies every rule, so each test can break exactly one thing. */
function validReport(overrides: Record<string, unknown> = {}) {
  return {
    executiveSummary: "A four-paragraph summary of the business and its bottlenecks.",
    totalEstimatedHoursSavedPerWeek: 9,
    painPoints: [
      { id: "pain-1", title: "Manual scheduling", description: "d", currentProcess: "c", hoursPerWeekLost: 5 },
      { id: "pain-2", title: "Manual invoicing", description: "d", currentProcess: "c", hoursPerWeekLost: 4 },
    ],
    toolRecommendations: [
      { id: "tool-1", name: "Jobber", category: "FSM", painPointAddressed: "pain-1", whatItDoes: "w", estimatedTimeSavedHrsPerWeek: 4, effort: "low", impact: "high", monthlyCost: "$99/mo" },
      { id: "tool-2", name: "Dext", category: "OCR", painPointAddressed: "pain-2", whatItDoes: "w", estimatedTimeSavedHrsPerWeek: 3, effort: "medium", impact: "high", monthlyCost: "$40/mo" },
      { id: "tool-3", name: "Zapier", category: "Automation", painPointAddressed: "pain-2", whatItDoes: "w", estimatedTimeSavedHrsPerWeek: 2, effort: "low", impact: "medium", monthlyCost: "$20/mo" },
    ],
    quickStartPlan: [
      { day: 1, title: "T1", description: "d", toolId: "tool-1" },
      { day: 2, title: "T2", description: "d", toolId: "tool-2" },
      { day: 3, title: "T3", description: "d", toolId: "tool-3" },
      { day: 4, title: "T4", description: "d" },
    ],
    guaranteeMet: true,
    ...overrides,
  };
}

function tool(id: string, painId: string, hours: number) {
  return {
    id, name: `Tool ${id}`, category: "Cat", painPointAddressed: painId,
    whatItDoes: "w", estimatedTimeSavedHrsPerWeek: hours,
    effort: "low", impact: "high", monthlyCost: "$10/mo",
  };
}

// ───────────────────────────────────────────────────────────
// THE PITCH: "a report prescribing 3 to 7 tools"
// ───────────────────────────────────────────────────────────
describe("The Pitch — 3 to 7 tool recommendations", () => {
  test("accepts exactly 3 tools (the floor)", () => {
    const { errors } = validateAssessment(validReport());
    assert.deepEqual(errors, []);
  });

  test("accepts exactly 7 tools (the ceiling)", () => {
    const tools = Array.from({ length: 7 }, (_, i) => tool(`tool-${i + 1}`, "pain-1", 1));
    const { errors } = validateAssessment(validReport({
      toolRecommendations: tools,
      totalEstimatedHoursSavedPerWeek: 7,
      quickStartPlan: [1, 2, 3, 4].map(d => ({ day: d, title: `T${d}`, description: "d" })),
    }));
    assert.deepEqual(errors, []);
  });

  test("rejects 2 tools — under-delivers on the promise", () => {
    const { errors } = validateAssessment(validReport({
      toolRecommendations: [tool("tool-1", "pain-1", 4), tool("tool-2", "pain-2", 3)],
    }));
    assert.ok(errors.some(e => e.includes("at least 3")), `expected a floor error, got: ${errors.join(" | ")}`);
  });

  test("rejects 8 tools — overwhelms the client", () => {
    const tools = Array.from({ length: 8 }, (_, i) => tool(`tool-${i + 1}`, "pain-1", 1));
    const { errors } = validateAssessment(validReport({
      toolRecommendations: tools,
      totalEstimatedHoursSavedPerWeek: 8,
      quickStartPlan: [1, 2, 3, 4].map(d => ({ day: d, title: `T${d}`, description: "d" })),
    }));
    assert.ok(errors.some(e => e.includes("caps this at 7")), `expected a ceiling error, got: ${errors.join(" | ")}`);
  });
});

// ───────────────────────────────────────────────────────────
// THE GUARANTEE: "money-back if you cannot find at least 5 hours"
// This decides whether we owe a refund, so it is computed, never trusted.
// ───────────────────────────────────────────────────────────
describe("The Guarantee — 5 hrs/week threshold", () => {
  test("guarantee is met at exactly 5 hours (inclusive boundary)", () => {
    const { report } = validateAssessment(validReport({
      toolRecommendations: [tool("tool-1", "pain-1", 3), tool("tool-2", "pain-1", 1), tool("tool-3", "pain-1", 1)],
      totalEstimatedHoursSavedPerWeek: 5,
    }));
    assert.equal(report?.totalEstimatedHoursSavedPerWeek, 5);
    assert.equal(report?.guaranteeMet, true);
  });

  test("guarantee is NOT met at 4.9 hours", () => {
    const { report } = validateAssessment(validReport({
      toolRecommendations: [tool("tool-1", "pain-1", 2.9), tool("tool-2", "pain-1", 1), tool("tool-3", "pain-1", 1)],
      totalEstimatedHoursSavedPerWeek: 4.9,
    }));
    assert.equal(report?.guaranteeMet, false);
  });

  test("overrides a model that falsely claims the guarantee was met", () => {
    const { report, repairs } = validateAssessment(validReport({
      toolRecommendations: [tool("tool-1", "pain-1", 1), tool("tool-2", "pain-1", 1), tool("tool-3", "pain-1", 1)],
      totalEstimatedHoursSavedPerWeek: 3,
      guaranteeMet: true, // the model lying in our favour — financially dangerous
    }));
    assert.equal(report?.guaranteeMet, false);
    assert.ok(repairs.some(r => r.includes("guaranteeMet")), "expected the correction to be recorded");
  });

  test("overrides a model that falsely claims the guarantee was missed", () => {
    const { report } = validateAssessment(validReport({ guaranteeMet: false }));
    assert.equal(report?.totalEstimatedHoursSavedPerWeek, 9);
    assert.equal(report?.guaranteeMet, true);
  });

  test("clamps a total that exceeds the sum of per-tool savings", () => {
    // tools sum to 9; the model claims 30
    const { report, repairs } = validateAssessment(validReport({ totalEstimatedHoursSavedPerWeek: 30 }));
    assert.equal(report?.totalEstimatedHoursSavedPerWeek, 9, "must not promise more than the parts add up to");
    assert.ok(repairs.some(r => r.includes("clamped")), "expected the clamp to be recorded");
  });

  test("a clamped total can flip the guarantee to false", () => {
    const { report } = validateAssessment(validReport({
      toolRecommendations: [tool("tool-1", "pain-1", 1), tool("tool-2", "pain-1", 1), tool("tool-3", "pain-1", 1)],
      totalEstimatedHoursSavedPerWeek: 20, // inflated; real sum is 3
      guaranteeMet: true,
    }));
    assert.equal(report?.totalEstimatedHoursSavedPerWeek, 3);
    assert.equal(report?.guaranteeMet, false, "an inflated claim must not survive into a refund decision");
  });

  test("a total below the tool sum is left alone (dedup for overlap is legitimate)", () => {
    const { report } = validateAssessment(validReport({ totalEstimatedHoursSavedPerWeek: 7 }));
    assert.equal(report?.totalEstimatedHoursSavedPerWeek, 7);
  });

  test("missing total falls back to the tool sum", () => {
    const { report, repairs } = validateAssessment(validReport({ totalEstimatedHoursSavedPerWeek: undefined }));
    assert.equal(report?.totalEstimatedHoursSavedPerWeek, 9);
    assert.ok(repairs.some(r => r.includes("missing or invalid")));
  });

  test("the guarantee threshold matches the advertised offer", () => {
    assert.equal(ASSESSMENT_RULES.GUARANTEE_MIN_HOURS, 5);
  });
});

// ───────────────────────────────────────────────────────────
// PHASE 3: the deliverable — Exec Summary, Effort/Impact Matrix, 4-Day Plan
// ───────────────────────────────────────────────────────────
describe("Phase 3 — report deliverable structure", () => {
  test("requires an executive summary", () => {
    const { errors } = validateAssessment(validReport({ executiveSummary: "" }));
    assert.ok(errors.some(e => e.includes("executiveSummary")));
  });

  test("every tool carries the effort and impact needed to plot the matrix", () => {
    const { report } = validateAssessment(validReport());
    for (const t of report!.toolRecommendations) {
      assert.ok(["low", "medium", "high"].includes(t.effort), `bad effort on ${t.id}`);
      assert.ok(["low", "medium", "high"].includes(t.impact), `bad impact on ${t.id}`);
    }
  });

  test("rejects an invalid effort value rather than silently mis-plotting it", () => {
    const { errors } = validateAssessment(validReport({
      toolRecommendations: [
        { ...tool("tool-1", "pain-1", 4), effort: "trivial" },
        tool("tool-2", "pain-1", 3),
        tool("tool-3", "pain-1", 2),
      ],
    }));
    assert.ok(errors.some(e => e.includes("effort")));
  });

  test("rejects an invalid impact value", () => {
    const { errors } = validateAssessment(validReport({
      toolRecommendations: [
        { ...tool("tool-1", "pain-1", 4), impact: "enormous" },
        tool("tool-2", "pain-1", 3),
        tool("tool-3", "pain-1", 2),
      ],
    }));
    assert.ok(errors.some(e => e.includes("impact")));
  });

  test("accepts exactly 4 quick-start days", () => {
    const { errors } = validateAssessment(validReport());
    assert.deepEqual(errors, []);
  });

  test("rejects a 3-day plan", () => {
    const { errors } = validateAssessment(validReport({
      quickStartPlan: [1, 2, 3].map(d => ({ day: d, title: `T${d}`, description: "d" })),
    }));
    assert.ok(errors.some(e => e.includes("exactly 4")));
  });

  test("rejects a day outside 1–4", () => {
    const { errors } = validateAssessment(validReport({
      quickStartPlan: [1, 2, 3, 5].map(d => ({ day: d, title: `T${d}`, description: "d" })),
    }));
    assert.ok(errors.some(e => e.includes("invalid day")));
  });

  test("rejects duplicate days", () => {
    const { errors } = validateAssessment(validReport({
      quickStartPlan: [1, 2, 2, 4].map(d => ({ day: d, title: `T${d}`, description: "d" })),
    }));
    assert.ok(errors.some(e => e.includes("duplicate")));
  });

  test("sorts an out-of-order plan so day 1 always leads", () => {
    const { report, errors } = validateAssessment(validReport({
      quickStartPlan: [3, 1, 4, 2].map(d => ({ day: d, title: `T${d}`, description: "d" })),
    }));
    assert.deepEqual(errors, []);
    assert.deepEqual(report!.quickStartPlan.map(t => t.day), [1, 2, 3, 4]);
  });
});

// ───────────────────────────────────────────────────────────
// Referential integrity — a report that cross-references itself incorrectly
// renders as broken UI ("Solves: undefined"), so it must not ship.
// ───────────────────────────────────────────────────────────
describe("Referential integrity", () => {
  test("rejects a tool pointing at a non-existent pain point", () => {
    const { errors } = validateAssessment(validReport({
      toolRecommendations: [tool("tool-1", "pain-99", 4), tool("tool-2", "pain-1", 3), tool("tool-3", "pain-2", 2)],
    }));
    assert.ok(errors.some(e => e.includes("unknown painPoint")));
  });

  test("rejects a plan day pointing at a non-existent tool", () => {
    const { errors } = validateAssessment(validReport({
      quickStartPlan: [
        { day: 1, title: "T1", description: "d", toolId: "tool-99" },
        { day: 2, title: "T2", description: "d" },
        { day: 3, title: "T3", description: "d" },
        { day: 4, title: "T4", description: "d" },
      ],
    }));
    assert.ok(errors.some(e => e.includes("unknown tool")));
  });

  test("allows a plan day with no tool attached", () => {
    const { errors } = validateAssessment(validReport());
    assert.deepEqual(errors, []);
  });

  test("rejects duplicate pain point ids", () => {
    const { errors } = validateAssessment(validReport({
      painPoints: [
        { id: "pain-1", title: "A", description: "d", currentProcess: "c", hoursPerWeekLost: 5 },
        { id: "pain-1", title: "B", description: "d", currentProcess: "c", hoursPerWeekLost: 4 },
      ],
    }));
    assert.ok(errors.some(e => e.includes("Duplicate painPoint")));
  });

  test("requires at least one pain point", () => {
    const { errors } = validateAssessment(validReport({ painPoints: [] }));
    assert.ok(errors.some(e => e.includes("painPoints")));
  });
});

// ───────────────────────────────────────────────────────────
// Malformed model output must never crash the route
// ───────────────────────────────────────────────────────────
describe("Robustness against malformed output", () => {
  for (const bad of [null, undefined, 42, "a string", []]) {
    test(`handles ${JSON.stringify(bad)} without throwing`, () => {
      const res = validateAssessment(bad);
      assert.ok(res.errors.length > 0);
      assert.equal(res.report, null);
    });
  }

  test("survives non-object entries inside arrays", () => {
    const res = validateAssessment(validReport({
      painPoints: [null, "x", { id: "pain-1", title: "T", description: "d", currentProcess: "c", hoursPerWeekLost: 5 }],
    }));
    assert.equal(res.report?.painPoints.length, 1);
  });

  test("coerces a numeric string for hours", () => {
    const { report } = validateAssessment(validReport({
      toolRecommendations: [
        { ...tool("tool-1", "pain-1", 0), estimatedTimeSavedHrsPerWeek: "4" },
        tool("tool-2", "pain-1", 3), tool("tool-3", "pain-1", 2),
      ],
    }));
    assert.equal(report?.toolRecommendations[0].estimatedTimeSavedHrsPerWeek, 4);
  });

  test("rejects negative savings", () => {
    const { errors } = validateAssessment(validReport({
      toolRecommendations: [
        { ...tool("tool-1", "pain-1", 0), estimatedTimeSavedHrsPerWeek: -5 },
        tool("tool-2", "pain-1", 3), tool("tool-3", "pain-1", 2),
      ],
    }));
    assert.ok(errors.some(e => e.includes("estimatedTimeSavedHrsPerWeek")));
  });
});

// ───────────────────────────────────────────────────────────
// THE TARGET: 2–20 employees, $500k–$5M revenue
// ───────────────────────────────────────────────────────────
describe("The Target — ideal client profile", () => {
  test("a 6-person, $1M–$5M business is in target", () => {
    const fit = assessTargetFit(6, "1m_5m");
    assert.equal(fit.inTarget, true);
    assert.deepEqual(fit.reasons, []);
  });

  test("accepts the boundaries: 2 and 20 employees", () => {
    assert.equal(assessTargetFit(2, "500k_1m").inTarget, true);
    assert.equal(assessTargetFit(20, "1m_5m").inTarget, true);
  });

  test("flags a solo operator as below the floor", () => {
    const fit = assessTargetFit(1, "500k_1m");
    assert.equal(fit.inTarget, false);
    assert.ok(fit.reasons[0].includes("below"));
  });

  test("flags a 50-person business as above the ceiling", () => {
    const fit = assessTargetFit(50, "1m_5m");
    assert.equal(fit.inTarget, false);
    assert.ok(fit.reasons[0].includes("above"));
  });

  test("flags revenue under $500k", () => {
    const fit = assessTargetFit(5, "under_500k");
    assert.equal(fit.inTarget, false);
    assert.ok(fit.reasons.some(r => r.includes("$500k floor")));
  });

  test("flags revenue over $5M", () => {
    const fit = assessTargetFit(10, "over_5m");
    assert.equal(fit.inTarget, false);
    assert.ok(fit.reasons.some(r => r.includes("$5M ceiling")));
  });

  test("reports both reasons when both are out of range", () => {
    assert.equal(assessTargetFit(80, "over_5m").reasons.length, 2);
  });

  test("unknown firmographics are not treated as disqualifying", () => {
    assert.equal(assessTargetFit(undefined, undefined).inTarget, true);
  });
});

// ───────────────────────────────────────────────────────────
// PHASE 1: intake — guards spend and prevents malformed requests
// ───────────────────────────────────────────────────────────
describe("Phase 1 — intake validation", () => {
  const longEnough = "x".repeat(200);

  test("accepts a real transcript", () => {
    const res = validateIntake({ transcript: longEnough });
    assert.equal(res.ok, true);
    assert.equal(res.ok && res.intakeSource, "transcript");
  });

  test("accepts questionnaire answers and formats them as Q/A", () => {
    const res = validateIntake({ answers: { "What eats your time?": longEnough } });
    assert.equal(res.ok, true);
    assert.ok(res.ok && res.intakeText.startsWith("Q: What eats your time?\nA: "));
    assert.equal(res.ok && res.intakeSource, "questionnaire");
  });

  test("rejects a request with neither input", () => {
    assert.equal(validateIntake({}).ok, false);
  });

  test("rejects a transcript that is too short to analyze", () => {
    assert.equal(validateIntake({ transcript: "too short" }).ok, false);
  });

  test("rejects a transcript beyond the size cap (token-spend guard)", () => {
    const res = validateIntake({ transcript: "x".repeat(ASSESSMENT_RULES.MAX_INTAKE_CHARS + 1) });
    assert.equal(res.ok, false);
    assert.ok(!res.ok && res.error.includes("limit"));
  });

  test("rejects a non-string transcript", () => {
    assert.equal(validateIntake({ transcript: 12345 }).ok, false);
  });

  test("rejects an array passed as answers", () => {
    assert.equal(validateIntake({ answers: ["a", "b"] }).ok, false);
  });

  test("rejects answers whose values are all empty", () => {
    assert.equal(validateIntake({ answers: { q1: "   ", q2: "" } }).ok, false);
  });

  test("drops empty answers but keeps the substantive ones", () => {
    const res = validateIntake({ answers: { q1: "", q2: longEnough } });
    assert.equal(res.ok, true);
    assert.ok(res.ok && !res.intakeText.includes("q1"));
  });
});
