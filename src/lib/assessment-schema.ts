import type { AssessmentReport, ToolRecommendation, QuickStartTask } from "../data/mockAssessmentData";

/**
 * The business rules from the offer. These are promises made to the client —
 * they are enforced here rather than trusted to the model.
 */
export const ASSESSMENT_RULES = {
  MIN_TOOLS: 3,
  MAX_TOOLS: 7,
  /** The money-back guarantee threshold. Below this, we owe a refund. */
  GUARANTEE_MIN_HOURS: 5,
  QUICK_START_DAYS: 4,
  TARGET_MIN_EMPLOYEES: 2,
  TARGET_MAX_EMPLOYEES: 20,
  TARGET_MIN_REVENUE: 500_000,
  TARGET_MAX_REVENUE: 5_000_000,
  /** Guards token spend. A 45-min transcript is ~45k chars; this is generous headroom. */
  MAX_INTAKE_CHARS: 120_000,
  MIN_INTAKE_CHARS: 50,
} as const;

const EFFORT_VALUES = ["low", "medium", "high"] as const;
const IMPACT_VALUES = ["low", "medium", "high"] as const;

export const REVENUE_BANDS = [
  { value: "under_500k", label: "Under $500k",    min: 0,         max: 500_000 },
  { value: "500k_1m",    label: "$500k – $1M",    min: 500_000,   max: 1_000_000 },
  { value: "1m_5m",      label: "$1M – $5M",      min: 1_000_000, max: 5_000_000 },
  { value: "over_5m",    label: "Over $5M",       min: 5_000_000, max: Infinity },
] as const;

export type RevenueBand = (typeof REVENUE_BANDS)[number]["value"];

export interface TargetFit {
  inTarget: boolean;
  /** Human-readable reasons the business sits outside the ideal client profile. */
  reasons: string[];
}

/**
 * Classifies a business against the ideal client profile (2–20 employees, $500k–$5M revenue).
 * Missing data is not a disqualifier — we only flag what we actually know to be out of range.
 */
export function assessTargetFit(
  employeeCount?: number,
  revenueBand?: RevenueBand
): TargetFit {
  const reasons: string[] = [];

  if (typeof employeeCount === "number" && Number.isFinite(employeeCount)) {
    if (employeeCount < ASSESSMENT_RULES.TARGET_MIN_EMPLOYEES) {
      reasons.push(
        `${employeeCount} employee${employeeCount === 1 ? "" : "s"} is below the ${ASSESSMENT_RULES.TARGET_MIN_EMPLOYEES}-employee floor — likely too small to have delegable process bottlenecks.`
      );
    } else if (employeeCount > ASSESSMENT_RULES.TARGET_MAX_EMPLOYEES) {
      reasons.push(
        `${employeeCount} employees is above the ${ASSESSMENT_RULES.TARGET_MAX_EMPLOYEES}-employee ceiling — likely needs a custom engagement, not an off-the-shelf assessment.`
      );
    }
  }

  const band = REVENUE_BANDS.find(b => b.value === revenueBand);
  if (band) {
    if (band.max <= ASSESSMENT_RULES.TARGET_MIN_REVENUE) {
      reasons.push(`Revenue ${band.label} is below the $500k floor — may not have budget for the recommended tool stack.`);
    } else if (band.min >= ASSESSMENT_RULES.TARGET_MAX_REVENUE) {
      reasons.push(`Revenue ${band.label} is above the $5M ceiling — likely has in-house ops staff already.`);
    }
  }

  return { inTarget: reasons.length === 0, reasons };
}

/** Validates raw client intake before spending a single token on it. */
export function validateIntake(body: {
  transcript?: unknown;
  answers?: unknown;
}): { ok: true; intakeText: string; intakeSource: "transcript" | "questionnaire" } | { ok: false; error: string } {
  const { transcript, answers } = body;

  if (transcript !== undefined && transcript !== null) {
    if (typeof transcript !== "string") {
      return { ok: false, error: "'transcript' must be a string." };
    }
    const text = transcript.trim();
    if (text.length < ASSESSMENT_RULES.MIN_INTAKE_CHARS) {
      return { ok: false, error: `Transcript is too short to analyze (minimum ${ASSESSMENT_RULES.MIN_INTAKE_CHARS} characters).` };
    }
    if (text.length > ASSESSMENT_RULES.MAX_INTAKE_CHARS) {
      return { ok: false, error: `Transcript exceeds the ${ASSESSMENT_RULES.MAX_INTAKE_CHARS.toLocaleString()} character limit. Trim it to the discovery portion of the call.` };
    }
    return { ok: true, intakeText: text, intakeSource: "transcript" };
  }

  if (answers !== undefined && answers !== null) {
    if (typeof answers !== "object" || Array.isArray(answers)) {
      return { ok: false, error: "'answers' must be an object of question -> answer." };
    }
    const entries = Object.entries(answers as Record<string, unknown>)
      .filter(([, v]) => typeof v === "string" && v.trim().length > 0) as [string, string][];

    if (entries.length === 0) {
      return { ok: false, error: "'answers' contained no non-empty responses." };
    }

    const intakeText = entries.map(([q, a]) => `Q: ${q}\nA: ${a.trim()}`).join("\n\n");
    if (intakeText.length < ASSESSMENT_RULES.MIN_INTAKE_CHARS) {
      return { ok: false, error: `Answers are too short to analyze (minimum ${ASSESSMENT_RULES.MIN_INTAKE_CHARS} characters total).` };
    }
    if (intakeText.length > ASSESSMENT_RULES.MAX_INTAKE_CHARS) {
      return { ok: false, error: `Answers exceed the ${ASSESSMENT_RULES.MAX_INTAKE_CHARS.toLocaleString()} character limit.` };
    }
    return { ok: true, intakeText, intakeSource: "questionnaire" };
  }

  return { ok: false, error: "Provide either 'transcript' (string) or 'answers' (object of question -> answer)." };
}

function toFiniteNumber(v: unknown): number | null {
  const n = typeof v === "string" ? Number(v) : v;
  return typeof n === "number" && Number.isFinite(n) ? n : null;
}

function roundHours(n: number): number {
  return Math.round(n * 100) / 100;
}

export interface ValidationResult {
  /** Structural problems that warrant regenerating the report. */
  errors: string[];
  /** Safe repairs that were applied automatically. */
  repairs: string[];
  report: AssessmentReport | null;
}

/**
 * Validates and normalizes a model-generated assessment against ASSESSMENT_RULES.
 *
 * Safe, deterministic problems (a wrong guarantee flag, an overstated total, an
 * unsorted plan) are repaired in place. Structural problems that need different
 * content (too few tools, a broken cross-reference) are reported as errors so the
 * caller can regenerate.
 */
export function validateAssessment(raw: unknown): ValidationResult {
  const errors: string[] = [];
  const repairs: string[] = [];

  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { errors: ["Report is not an object."], repairs, report: null };
  }

  const r = raw as Record<string, unknown>;

  // ── Executive summary ──
  const executiveSummary = typeof r.executiveSummary === "string" ? r.executiveSummary.trim() : "";
  if (!executiveSummary) errors.push("Missing executiveSummary.");

  // ── Pain points ──
  const rawPains = Array.isArray(r.painPoints) ? r.painPoints : [];
  if (rawPains.length === 0) errors.push("Missing painPoints — at least one bottleneck is required.");

  const seenPainIds = new Set<string>();
  const painPoints = rawPains.flatMap((p, i): AssessmentReport["painPoints"] => {
    if (typeof p !== "object" || p === null) return [];
    const o = p as Record<string, unknown>;
    const id = typeof o.id === "string" && o.id.trim() ? o.id.trim() : `pain-${i + 1}`;
    if (seenPainIds.has(id)) {
      errors.push(`Duplicate painPoint id "${id}".`);
      return [];
    }
    seenPainIds.add(id);

    const hours = toFiniteNumber(o.hoursPerWeekLost);
    if (hours === null || hours < 0) {
      repairs.push(`painPoint "${id}" had an invalid hoursPerWeekLost; treated as 0.`);
    }

    return [{
      id,
      title: typeof o.title === "string" ? o.title : "Untitled bottleneck",
      description: typeof o.description === "string" ? o.description : "",
      currentProcess: typeof o.currentProcess === "string" ? o.currentProcess : "",
      hoursPerWeekLost: hours !== null && hours >= 0 ? roundHours(hours) : 0,
    }];
  });

  const painIds = new Set(painPoints.map(p => p.id));

  // ── Tool recommendations ──
  const rawTools = Array.isArray(r.toolRecommendations) ? r.toolRecommendations : [];
  const seenToolIds = new Set<string>();
  const toolRecommendations = rawTools.flatMap((t, i): ToolRecommendation[] => {
    if (typeof t !== "object" || t === null) return [];
    const o = t as Record<string, unknown>;
    const id = typeof o.id === "string" && o.id.trim() ? o.id.trim() : `tool-${i + 1}`;
    if (seenToolIds.has(id)) {
      errors.push(`Duplicate tool id "${id}".`);
      return [];
    }
    seenToolIds.add(id);

    const name = typeof o.name === "string" && o.name.trim() ? o.name.trim() : "";
    if (!name) errors.push(`Tool "${id}" is missing a name.`);

    const painRef = typeof o.painPointAddressed === "string" ? o.painPointAddressed.trim() : "";
    if (!painIds.has(painRef)) {
      errors.push(`Tool "${id}" references unknown painPoint "${painRef}".`);
    }

    const effort = EFFORT_VALUES.includes(o.effort as never) ? (o.effort as ToolRecommendation["effort"]) : null;
    if (!effort) errors.push(`Tool "${id}" has an invalid effort value "${String(o.effort)}".`);

    const impact = IMPACT_VALUES.includes(o.impact as never) ? (o.impact as ToolRecommendation["impact"]) : null;
    if (!impact) errors.push(`Tool "${id}" has an invalid impact value "${String(o.impact)}".`);

    const saved = toFiniteNumber(o.estimatedTimeSavedHrsPerWeek);
    if (saved === null || saved < 0) {
      errors.push(`Tool "${id}" has an invalid estimatedTimeSavedHrsPerWeek.`);
    }

    return [{
      id,
      name,
      category: typeof o.category === "string" ? o.category : "Uncategorized",
      painPointAddressed: painRef,
      whatItDoes: typeof o.whatItDoes === "string" ? o.whatItDoes : "",
      estimatedTimeSavedHrsPerWeek: saved !== null && saved >= 0 ? roundHours(saved) : 0,
      effort: effort ?? "medium",
      impact: impact ?? "medium",
      monthlyCost: typeof o.monthlyCost === "string" ? o.monthlyCost : "Contact vendor",
      ...(typeof o.link === "string" && o.link.trim() ? { link: o.link.trim() } : {}),
    }];
  });

  if (toolRecommendations.length < ASSESSMENT_RULES.MIN_TOOLS) {
    errors.push(
      `Only ${toolRecommendations.length} tool(s) recommended; the offer promises at least ${ASSESSMENT_RULES.MIN_TOOLS}.`
    );
  }
  if (toolRecommendations.length > ASSESSMENT_RULES.MAX_TOOLS) {
    errors.push(
      `${toolRecommendations.length} tools recommended; the offer caps this at ${ASSESSMENT_RULES.MAX_TOOLS} to avoid overwhelming the client.`
    );
  }

  // ── Savings total: never allow a claim larger than the sum of its parts ──
  const toolHoursSum = roundHours(
    toolRecommendations.reduce((sum, t) => sum + t.estimatedTimeSavedHrsPerWeek, 0)
  );
  const claimedTotal = toFiniteNumber(r.totalEstimatedHoursSavedPerWeek);

  let totalEstimatedHoursSavedPerWeek: number;
  if (claimedTotal === null || claimedTotal < 0) {
    totalEstimatedHoursSavedPerWeek = toolHoursSum;
    repairs.push(`totalEstimatedHoursSavedPerWeek was missing or invalid; set to the tool sum (${toolHoursSum}).`);
  } else if (claimedTotal > toolHoursSum) {
    totalEstimatedHoursSavedPerWeek = toolHoursSum;
    repairs.push(
      `totalEstimatedHoursSavedPerWeek (${claimedTotal}) exceeded the sum of per-tool savings (${toolHoursSum}); clamped down to avoid overstating the guarantee.`
    );
  } else {
    totalEstimatedHoursSavedPerWeek = roundHours(claimedTotal);
  }

  // ── The guarantee is computed, never trusted to the model ──
  const guaranteeMet = totalEstimatedHoursSavedPerWeek >= ASSESSMENT_RULES.GUARANTEE_MIN_HOURS;
  if (typeof r.guaranteeMet === "boolean" && r.guaranteeMet !== guaranteeMet) {
    repairs.push(
      `Model reported guaranteeMet=${r.guaranteeMet} but ${totalEstimatedHoursSavedPerWeek} hrs/week against a ${ASSESSMENT_RULES.GUARANTEE_MIN_HOURS} hr threshold means ${guaranteeMet}; corrected.`
    );
  }

  // ── Quick start plan ──
  const rawPlan = Array.isArray(r.quickStartPlan) ? r.quickStartPlan : [];
  const toolIds = new Set(toolRecommendations.map(t => t.id));
  const seenDays = new Set<number>();

  const quickStartPlan = rawPlan.flatMap((t): QuickStartTask[] => {
    if (typeof t !== "object" || t === null) return [];
    const o = t as Record<string, unknown>;
    const day = toFiniteNumber(o.day);
    if (day === null || !Number.isInteger(day) || day < 1 || day > ASSESSMENT_RULES.QUICK_START_DAYS) {
      errors.push(`quickStartPlan has an invalid day "${String(o.day)}"; expected 1–${ASSESSMENT_RULES.QUICK_START_DAYS}.`);
      return [];
    }
    if (seenDays.has(day)) {
      errors.push(`quickStartPlan has duplicate entries for day ${day}.`);
      return [];
    }
    seenDays.add(day);

    const toolId = typeof o.toolId === "string" && o.toolId.trim() ? o.toolId.trim() : undefined;
    if (toolId && !toolIds.has(toolId)) {
      errors.push(`quickStartPlan day ${day} references unknown tool "${toolId}".`);
    }

    return [{
      day: day as QuickStartTask["day"],
      title: typeof o.title === "string" ? o.title : `Day ${day}`,
      description: typeof o.description === "string" ? o.description : "",
      ...(toolId ? { toolId } : {}),
    }];
  }).sort((a, b) => a.day - b.day);

  if (quickStartPlan.length !== ASSESSMENT_RULES.QUICK_START_DAYS) {
    errors.push(
      `quickStartPlan has ${quickStartPlan.length} day(s); the offer promises exactly ${ASSESSMENT_RULES.QUICK_START_DAYS}.`
    );
  }

  const report: AssessmentReport = {
    intakeSource: r.intakeSource === "questionnaire" ? "questionnaire" : "transcript",
    date: typeof r.date === "string" ? r.date : "",
    executiveSummary,
    totalEstimatedHoursSavedPerWeek,
    painPoints,
    toolRecommendations,
    quickStartPlan,
    guaranteeMet,
  };

  return { errors, repairs, report };
}
