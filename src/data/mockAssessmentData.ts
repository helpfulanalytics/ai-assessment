export interface ToolRecommendation {
  id: string;
  name: string;                 // e.g. "Zapier", "Fathom", a custom GPT
  category: string;             // e.g. "Scheduling", "Notetaking", "CRM"
  painPointAddressed: string;   // which specific pain point from the interview this solves
  whatItDoes: string;           // 1-2 sentences
  estimatedTimeSavedHrsPerWeek: number;
  effort: "low" | "medium" | "high";   // effort to implement
  impact: "low" | "medium" | "high";   // impact once implemented
  monthlyCost: string;          // e.g. "$0-20/mo", "$49/mo"
  link?: string;                // off-the-shelf tool URL if applicable
}

export interface QuickStartTask {
  day: 1 | 2 | 3 | 4;
  title: string;
  description: string;
  toolId?: string;              // links back to a ToolRecommendation.id if applicable
}

export interface AssessmentReport {
  id?: string;
  createdAt?: string;
  company?: string;
  contact?: string;
  email?: string;

  /** Firmographics used to check the business against the ideal client profile. */
  employeeCount?: number;
  revenueBand?: string;
  targetFit?: { inTarget: boolean; reasons: string[] };

  /** Deterministic corrections applied to the model's output. Internal, not client-facing. */
  validationRepairs?: string[];

  intakeSource: "transcript" | "questionnaire";
  date: string;

  executiveSummary: string;             // 3-4 paragraphs
  totalEstimatedHoursSavedPerWeek: number;

  painPoints: Array<{
    id: string;
    title: string;
    description: string;              // grounded in what was actually said in the interview/transcript
    currentProcess: string;           // how they do it today (manual, tool, workaround)
    hoursPerWeekLost: number;
  }>;

  toolRecommendations: ToolRecommendation[]; // 3-7 items per the pitch

  quickStartPlan: QuickStartTask[];   // exactly 4 items, one per day

  guaranteeMet: boolean;              // did the recommendations clear the 5hr/week bar
}

export const initialAssessmentReport: AssessmentReport = {
  company: "Riverside Family Dental",
  contact: "Dr. Priya Anand",
  intakeSource: "transcript",
  date: "August 5, 2026",
  executiveSummary:
    "Riverside Family Dental runs a 4-chair practice with 6 staff, and the interview surfaced three recurring bottlenecks: appointment reminders are sent manually via phone calls, new patient intake forms are filled out on paper and re-keyed into the practice management system, and insurance verification requires a staff member to call each provider individually before every appointment. These three processes alone consume an estimated 14 hours per week of front-desk staff time. The recommended stack below — an automated reminder system, a digital intake form with API sync, and an insurance verification service — is projected to recover 9-11 hours per week, comfortably clearing the 5-hour guarantee threshold. Implementation is low-lift: none of the recommended tools require custom development, and the 4-day quick start plan gets the highest-impact piece (reminders) live before day two.",
  totalEstimatedHoursSavedPerWeek: 10,
  painPoints: [
    {
      id: "pain-1",
      title: "Manual appointment reminder calls",
      description: "Front desk calls every patient 48 hours before their appointment to confirm; no-shows still run ~12% per the owner's estimate.",
      currentProcess: "Staff member works down a printed daily schedule and calls each patient individually.",
      hoursPerWeekLost: 6,
    },
    {
      id: "pain-2",
      title: "Paper intake forms re-keyed by hand",
      description: "New patients fill out a clipboard form in the waiting room; a staff member retypes it into the practice management system after the visit.",
      currentProcess: "Paper form -> manual re-entry into Dentrix.",
      hoursPerWeekLost: 4,
    },
    {
      id: "pain-3",
      title: "Insurance verification by phone",
      description: "Before each appointment, staff calls the patient's insurance provider to confirm coverage and benefits.",
      currentProcess: "Manual phone call per patient, per provider, logged in a spreadsheet.",
      hoursPerWeekLost: 4,
    },
  ],
  toolRecommendations: [
    {
      id: "tool-1",
      name: "Weave",
      category: "Patient Communication",
      painPointAddressed: "pain-1",
      whatItDoes: "Automated SMS/email appointment reminders with two-way confirmation, purpose-built for dental/medical practices.",
      estimatedTimeSavedHrsPerWeek: 5,
      effort: "low",
      impact: "high",
      monthlyCost: "$300-400/mo",
      link: "https://www.getweave.com",
    },
    {
      id: "tool-2",
      name: "Dentrix Forms (digital intake)",
      category: "Intake",
      painPointAddressed: "pain-2",
      whatItDoes: "Digital new-patient intake form that syncs directly into the existing Dentrix practice management system, eliminating re-keying.",
      estimatedTimeSavedHrsPerWeek: 3,
      effort: "low",
      impact: "medium",
      monthlyCost: "$99/mo",
    },
    {
      id: "tool-3",
      name: "Zocdoc Insurance Check / Vyne Trellis",
      category: "Insurance Verification",
      painPointAddressed: "pain-3",
      whatItDoes: "Automated real-time insurance eligibility verification pulled directly from payer databases before the appointment.",
      estimatedTimeSavedHrsPerWeek: 3,
      effort: "medium",
      impact: "high",
      monthlyCost: "$150-250/mo",
    },
  ],
  quickStartPlan: [
    { day: 1, title: "Set up Weave account and import patient list", description: "Connect Weave to the existing phone/SMS number and import the current patient roster from Dentrix.", toolId: "tool-1" },
    { day: 2, title: "Turn on automated reminders for next week's schedule", description: "Enable 48-hour and 2-hour reminder sequences; keep manual calls as backup for the first week only.", toolId: "tool-1" },
    { day: 3, title: "Publish digital intake form and test end-to-end sync", description: "Set up the digital intake form and confirm a test submission lands correctly in Dentrix without manual re-entry.", toolId: "tool-2" },
    { day: 4, title: "Enable automated insurance verification for upcoming appointments", description: "Connect the verification tool to the top 3 insurance providers seen most often and run it against next week's schedule.", toolId: "tool-3" },
  ],
  guaranteeMet: true,
};
