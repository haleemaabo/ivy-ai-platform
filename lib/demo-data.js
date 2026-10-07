export const AI_TOOLS = ["ChatGPT", "Claude", "Notion AI", "Copilot", "Excel AI", "Gemini", "Custom Agent", "Perplexity"];

export const discoveryQuestions = [
  { q: "Which AI tools do you use most often?", a: ["ChatGPT", "Microsoft Copilot", "Claude", "Gemini", "Other", "None yet"] },
  { q: "What do you mainly use AI for?", a: ["Research", "Writing", "Analysis", "Planning", "Automation", "I don't use it yet"] },
  { q: "What are you most comfortable using AI for?", a: ["Starting a draft", "Summarizing", "Exploring ideas", "Working with data", "Routine tasks", "Nothing yet"] },
  { q: "What would help you use AI more effectively?", a: ["Practical examples", "Role-specific training", "Clearer policy", "Better tools", "More review support", "Nothing right now"] },
];

export const steps = [
  { id: "start", label: "Start", x: 60, y: 230, color: "--step-navy", performer: "System", task: "Workflow initiated", tools: [], days: 0, deliverable: "Supply chain review kicked off" },
  { id: "A", label: "Step A", x: 250, y: 70, color: "--step-red", performer: "Alex Johnson", task: "Pull vendor rates", tools: ["ChatGPT", "Claude", "Notion AI"], days: 1.3, deliverable: "Vendor rate sheet & comparative analysis table" },
  { id: "B", label: "Step B", x: 250, y: 230, color: "--step-amber", performer: "Morgan Davis", task: "Inventory snapshot", tools: ["Excel AI"], days: 0.0, deliverable: "Inventory levels exported by SKU" },
  { id: "C", label: "Step C", x: 250, y: 355, color: "--step-red", performer: "Riley Wilson", task: "Logistics cost audit", tools: [], days: 16.6, deliverable: "Freight cost audit summary", bottleneck: true },
  { id: "D", label: "Step D", x: 250, y: 440, color: "--step-green", performer: "Sam White", task: "Supplier risk notes", tools: ["Perplexity"], days: 2.1, deliverable: "Supplier risk register notes" },
  { id: "E", label: "Step E", x: 450, y: 70, color: "--step-amber", performer: "Taylor Smith", task: "Rate benchmarking", tools: ["Claude"], days: 1.3, deliverable: "Benchmark vs. industry rates" },
  { id: "F", label: "Step F", x: 450, y: 230, color: "--step-purple", performer: "Jordan Lee", task: "Demand forecast", tools: ["Copilot", "Excel AI"], days: 5.0, deliverable: "12-week demand forecast model" },
  { id: "G", label: "Step G", x: 575, y: 230, color: "--step-blue", performer: "Casey Brown", task: "Scenario modelling", tools: ["Custom Agent"], days: 1.6, deliverable: "Three margin scenarios" },
  { id: "H", label: "Step H", x: 680, y: 230, color: "--step-teal", performer: "Taylor Smith", task: "Consolidation", tools: [], days: 0.7, deliverable: "Consolidated findings draft" },
  { id: "I", label: "Step I", x: 800, y: 230, color: "--step-red", performer: "Casey Brown", task: "Deck drafting", tools: ["ChatGPT"], days: 6.7, deliverable: "Supply chain risk deck draft", bottleneck: true },
  { id: "J", label: "Step J", x: 935, y: 230, color: "--step-teal", performer: "Chris Miller", task: "Final formatting", tools: ["Gemini"], days: 0.8, deliverable: "Final deck & margin forecast model" },
  { id: "end", label: "End", x: 1060, y: 230, color: "--step-forest", performer: "Chris Miller", task: "Manager review", tools: [], days: 0, deliverable: "Awaiting quality review" },
];

export const employeeWorkflowSteps = steps.filter((step) => !["start", "end"].includes(step.id));
export const supplyChainTeam = ["Alex Johnson", "Morgan Davis", "Riley Wilson", "Sam White", "Taylor Smith", "Jordan Lee", "Casey Brown", "Chris Miller"];

export const edges = [
  { from: "start", to: "A" }, { from: "start", to: "B" }, { from: "start", to: "C", days: 16.6, by: "Riley Wilson" }, { from: "start", to: "D" },
  { from: "A", to: "E", days: 1.3, by: "Alex Johnson" }, { from: "E", to: "F", days: 5.0, by: "Jordan Lee" }, { from: "E", to: "H", days: 1.3, by: "Taylor Smith" },
  { from: "B", to: "F", days: 0.0, by: "Morgan Davis" }, { from: "C", to: "F", days: 0.5, by: "Jamie Patel" }, { from: "C", to: "H", days: 13.5, by: "Riley Wilson" },
  { from: "D", to: "H", by: "Sam White" }, { from: "F", to: "G", days: 1.6, by: "Casey Brown" }, { from: "G", to: "H", days: 0.7, by: "Taylor Smith" },
  { from: "H", to: "I", days: 6.7, by: "Casey Brown" }, { from: "I", to: "J" }, { from: "J", to: "end" },
];

export const workflows = [
  { id: "wf1", name: "Supply Chain Risk Review", dept: "Supply Chain & Logistics", status: "Ready for review", steps: 10, turnaround: 18.4, quality: null },
  { id: "wf2", name: "Vendor Onboarding", dept: "Supply Chain & Logistics", status: "In progress", steps: 6, turnaround: 4.2, quality: 4.6 },
  { id: "wf3", name: "Quarterly Freight Audit", dept: "Supply Chain & Logistics", status: "Completed", steps: 5, turnaround: 3.1, quality: 4.8 },
];

export const departments = [
  { name: "Supply Chain", index: 72, turnaroundBefore: 9.4, turnaroundAfter: 4.1, quality: 4.6 },
  { name: "Finance", index: 81, turnaroundBefore: 6.2, turnaroundAfter: 2.3, quality: 4.7 },
  { name: "Operations", index: 58, turnaroundBefore: 7.8, turnaroundAfter: 5.9, quality: 4.1 },
  { name: "HR", index: 44, turnaroundBefore: 5.0, turnaroundAfter: 4.4, quality: 4.3 },
  { name: "Sales", index: 66, turnaroundBefore: 4.6, turnaroundAfter: 2.8, quality: 4.4 },
];

export const managerBreakdowns = {
  "Supply Chain": [
    { name: "Chris Miller", team: "Logistics & Freight", workflows: 6, adoption: 78, turnaround: 3.8, quality: 4.7, evidence: "Benchmark validated" },
    { name: "Nadia Flores", team: "Sourcing", workflows: 5, adoption: 71, turnaround: 4.2, quality: 4.5, evidence: "Sample validated" },
    { name: "Owen Brooks", team: "Inventory Planning", workflows: 3, adoption: 66, turnaround: 4.5, quality: 4.4, evidence: "Triangulated" },
  ],
  Finance: [
    { name: "Tom Reyes", team: "FP&A", workflows: 7, adoption: 86, turnaround: 2.1, quality: 4.8, evidence: "Benchmark validated" },
    { name: "Elena Park", team: "Controllership", workflows: 4, adoption: 76, turnaround: 2.6, quality: 4.6, evidence: "Sample validated" },
  ],
  Operations: [
    { name: "Maya Chen", team: "Service Operations", workflows: 5, adoption: 61, turnaround: 5.4, quality: 4.2, evidence: "Sample validated" },
    { name: "David Okafor", team: "Facilities", workflows: 3, adoption: 54, turnaround: 6.4, quality: 4.0, evidence: "Triangulated" },
  ],
  HR: [
    { name: "Amelia Hart", team: "People Operations", workflows: 4, adoption: 48, turnaround: 4.1, quality: 4.4, evidence: "Sample validated" },
    { name: "Jon Bell", team: "Talent", workflows: 3, adoption: 40, turnaround: 4.8, quality: 4.2, evidence: "Triangulated" },
  ],
  Sales: [
    { name: "Leila Moore", team: "Enterprise Sales", workflows: 6, adoption: 70, turnaround: 2.5, quality: 4.5, evidence: "Benchmark validated" },
    { name: "Ben Carter", team: "Sales Operations", workflows: 4, adoption: 62, turnaround: 3.1, quality: 4.3, evidence: "Sample validated" },
  ],
};

export const users = [
  { name: "Sarah Jenkins", email: "s.jenkins@acme.com", org: "Acme Corp", dept: "Supply Chain", role: "EMPLOYEE", module: "AI Workplace Discovery", status: "COMPLETED" },
  { name: "Mark Davis", email: "m.davis@acme.com", org: "Acme Corp", dept: "Supply Chain", role: "EMPLOYEE", module: "AI Workplace Discovery", status: "PENDING" },
  { name: "Chris Miller", email: "c.miller@acme.com", org: "Acme Corp", dept: "Supply Chain", role: "MANAGER", module: "—", status: "—" },
  { name: "Dana Whitfield", email: "ceo@acme.com", org: "Acme Corp", dept: "Executive", role: "EXECUTIVE", module: "—", status: "—" },
  { name: "Priya Shah", email: "p.shah@globex.com", org: "Globex", dept: "Finance", role: "EMPLOYEE", module: "AI Capability Scenarios", status: "PENDING" },
  { name: "Tom Reyes", email: "t.reyes@globex.com", org: "Globex", dept: "Finance", role: "MANAGER", module: "—", status: "—" },
];

export const toolUsage = [
  { tool: "ChatGPT", pct: 78 }, { tool: "Claude", pct: 52 }, { tool: "Copilot", pct: 47 },
  { tool: "Excel AI", pct: 39 }, { tool: "Notion AI", pct: 28 }, { tool: "Custom Agent", pct: 14 },
];

/** Formulas from the platform spec */
export const QUALITY_GATE = 3.5;

export function unlockedCapacity(items) {
  return items.filter((i) => i.quality >= QUALITY_GATE).reduce((s, i) => s + (i.baseline - i.ai) * i.volume, 0);
}

export const financialValue = (hours, rate) => hours * rate;

export const fteEquivalent = (hours, monthly = 160) => hours / monthly;

export function adoptionIndex(s, w = [0.3, 0.3, 0.2, 0.2]) {
  return w[0] * s.freq + w[1] * s.qual + w[2] * s.verif + w[3] * s.maturity;
}

/** Employee time logging: dates → days, or same-day hours → days (8h day) */
export function durationDays(opts) {
  if (opts.mode === "direct") return opts.unit === "days" ? opts.value : opts.value / 8;
  if (opts.start === opts.end) return (opts.hours ?? 0) / 8;
  return Math.max(0, (new Date(opts.end).getTime() - new Date(opts.start).getTime()) / 86400000);
}

/** Per-department sample process maps reuse the Supply Chain map layout with department-specific tasks and people. */
const deptProcessSpecs = {
  Finance: { workflow: "Monthly Close", owner: "Tom Reyes", tasks: ["Pull ledger extracts", "Bank reconciliation", "Accruals review", "Variance notes", "Intercompany checks", "Cash forecast", "Scenario modelling", "Consolidation", "Board pack drafting", "Final formatting"], team: ["Priya Shah", "Leo Grant", "Ana Ruiz", "Ken Ito", "Mia Ford", "Raj Patel", "Zoe Hall", "Tom Reyes"] },
  Operations: { workflow: "Service Incident Review", owner: "Maya Chen", tasks: ["Collect incident logs", "Ticket snapshot", "Root-cause audit", "Vendor notes", "SLA benchmarking", "Capacity forecast", "Fix scenarios", "Consolidation", "Report drafting", "Final formatting"], team: ["Ian Cole", "Lucy Park", "Omar Diaz", "Eva Stone", "Noah Kim", "Ruth Adams", "Femi Ola", "Maya Chen"] },
  HR: { workflow: "Quarterly Hiring Plan", owner: "Amelia Hart", tasks: ["Gather headcount requests", "Org snapshot", "Compensation audit", "Policy notes", "Market benchmarking", "Hiring forecast", "Budget scenarios", "Consolidation", "Plan drafting", "Final formatting"], team: ["Grace Lin", "Paul Neri", "Sofia Rossi", "Dan Wu", "Hana Mori", "Ivy Brooks", "Jon Bell", "Amelia Hart"] },
  Sales: { workflow: "Pipeline Forecast", owner: "Leila Moore", tasks: ["Pull CRM pipeline", "Account snapshot", "Deal hygiene audit", "Competitor notes", "Win-rate benchmarking", "Revenue forecast", "Quota scenarios", "Consolidation", "Forecast deck drafting", "Final formatting"], team: ["Kyle Ross", "Nina Shah", "Max Ford", "Tara Lee", "Sam Ortiz", "Ella Moss", "Ben Carter", "Leila Moore"] },
};

export function departmentProcessMap(dept) {
  const spec = deptProcessSpecs[dept];
  if (!spec) return { workflow: "Supply Chain Risk Review", owner: "Chris Miller", steps, edges };
  const rename = (name) => { const i = name ? supplyChainTeam.indexOf(name) : -1; return i >= 0 ? spec.team[i] : name; };
  const work = steps.filter((s) => !["start", "end"].includes(s.id));
  return {
    workflow: spec.workflow,
    owner: spec.owner,
    steps: steps.map((s) => {
      const i = work.findIndex((w) => w.id === s.id);
      return { ...s, performer: s.id === "start" ? "System" : rename(s.performer) ?? s.performer, task: i >= 0 ? spec.tasks[i] ?? s.task : s.task, deliverable: i >= 0 ? `${spec.tasks[i]} output` : s.deliverable };
    }),
    edges: edges.map((e) => (e.by ? { ...e, by: rename(e.by) ?? e.by } : e)),
  };
}