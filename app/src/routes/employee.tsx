import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { addDays, differenceInCalendarDays, format, formatDistanceStrict } from "date-fns";
import type { DateRange } from "react-day-picker";
import { ArrowRight, CalendarDays, CheckCircle2, ChevronDown, CircleHelp, ClipboardCheck, Clock3, Inbox, Lock, Send, ShieldCheck } from "lucide-react";
import { PortalShell } from "@/components/PortalShell";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Progress } from "@/components/ui/progress";
import { AI_TOOLS, discoveryQuestions, employeeWorkflowSteps, supplyChainTeam } from "@/lib/demo-data";

export const Route = createFileRoute("/employee")({
  head: () => ({
    meta: [
      { title: "Employee Home — Assignments & Pilot Steps | Ivy & Company" },
      { name: "description", content: "Complete assigned discovery modules, see incoming handoffs, and log controlled pilot workflow steps." },
      { property: "og:title", content: "Employee Home — Ivy & Company" },
      { property: "og:description", content: "A low-burden home for discovery modules, handoffs and controlled pilot steps." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Employee,
});

type View = "home" | "assignments" | "log-step" | "help";
const VIEWS: View[] = ["home", "assignments", "log-step", "help"];

const assignments = [
  { id: "adoption", title: "AI Workplace Discovery", detail: "Tools, use cases and comfort", due: "Due 9 Oct", minutes: "8–10 min", status: "Ready" },
  { id: "scenario", title: "Responsible AI Scenario", detail: "Verification and judgement", due: "Due 14 Oct", minutes: "6 min", status: "Upcoming" },
] as const;

const HOUR = 3600000;
const incomingHandoffs = [
  { id: "h1", from: "Alex Johnson", stepId: "E", deliverable: "Vendor rate sheet & comparative analysis table", agoMs: 2 * 24 * HOUR },
  { id: "h2", from: "Morgan Davis", stepId: "F", deliverable: "Inventory levels exported by SKU", agoMs: 5 * HOUR },
];

const NO_AI = "No AI tools used";
const OTHER = "Other";

function Employee() {
  const [view, setView] = useState<View>("home");
  const [activeAssignment, setActiveAssignment] = useState<string | null>(null);
  const [completedAssignments, setCompletedAssignments] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [handoffsDone, setHandoffsDone] = useState<string[]>([]);
  const [fromHandoff, setFromHandoff] = useState<string | null>(null);
  const [loggedCount, setLoggedCount] = useState(0);

  const [dateRange, setDateRange] = useState<DateRange | undefined>({ from: new Date(2026, 9, 5), to: addDays(new Date(2026, 9, 5), 1) });
  const [hours, setHours] = useState("");
  const [selectedStep, setSelectedStep] = useState(employeeWorkflowSteps[0]?.id ?? "");
  const [tools, setTools] = useState<string[]>([]);
  const [noAiReason, setNoAiReason] = useState("");
  const [otherTool, setOtherTool] = useState("");
  const [handoff, setHandoff] = useState("Chris Miller");
  const [summary, setSummary] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const sync = () => { const h = window.location.hash.slice(1) as View; setView(VIEWS.includes(h) ? h : "home"); };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const go = (v: View) => { window.location.hash = v; };
  const days = dateRange?.from && dateRange.to ? Math.max(1, differenceInCalendarDays(dateRange.to, dateRange.from) + 1) : 1;
  const stepName = (id: string) => employeeWorkflowSteps.find((s) => s.id === id)?.task ?? "Workflow step";
  const pendingAssignments = assignments.length - completedAssignments.length;
  const openHandoffs = incomingHandoffs.filter((h) => !handoffsDone.includes(h.id));
  const noAi = tools.includes(NO_AI);

  function toggleTool(tool: string) {
    setError("");
    if (tool === NO_AI) return setTools(noAi ? [] : [NO_AI]);
    setTools((cur) => { const base = cur.filter((t) => t !== NO_AI); return base.includes(tool) ? base.filter((t) => t !== tool) : [...base, tool]; });
  }

  function startFromHandoff(id: string) {
    const h = incomingHandoffs.find((x) => x.id === id);
    if (h) { setSelectedStep(h.stepId); setFromHandoff(id); setDone(false); }
    go("log-step");
  }

  function completeDiscovery() {
    if (Object.keys(answers).length !== discoveryQuestions.length || !activeAssignment) return;
    setCompletedAssignments((c) => [...c, activeAssignment]);
    setActiveAssignment(null);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (tools.length === 0) return setError("Select at least one AI tool, “Other”, or “No AI tools used”.");
    if (noAi && !noAiReason.trim()) return setError("Tell us what you used instead of AI tools.");
    if (tools.includes(OTHER) && !otherTool.trim()) return setError("Name the other AI tool you used.");
    const h = Number(hours);
    if (!hours || !Number.isFinite(h) || h <= 0 || h > 200) return setError("Enter the hours of active work (between 0 and 200).");
    if (fromHandoff) setHandoffsDone((c) => [...c, fromHandoff]);
    setLoggedCount((c) => c + 1);
    setDone(true);
  }

  function resetForm() {
    setDone(false); setFromHandoff(null); setTools([]); setNoAiReason(""); setOtherTool(""); setHours(""); setSummary(""); setError("");
  }

  const toolLabel = tools.map((t) => (t === OTHER ? otherTool : t)).join(", ");

  const handoffCards = (
    <div className="space-y-3">
      {openHandoffs.length === 0 && <p className="text-sm text-muted-foreground">No handoffs waiting for you.</p>}
      {openHandoffs.map((h) => (
        <article key={h.id} className="card-elevated flex flex-col gap-4 border-l-4 border-l-primary p-5 sm:flex-row sm:items-center">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground"><Inbox /></div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{h.from} handed this off to you {formatDistanceStrict(0, h.agoMs)} ago</p>
            <p className="mt-1 text-sm text-muted-foreground">{h.deliverable} · Next: {stepName(h.stepId)}</p>
            <p className="mt-1 text-sm font-medium">Have you completed it?</p>
          </div>
          <Button onClick={() => startFromHandoff(h.id)}>Log the step now<ArrowRight /></Button>
        </article>
      ))}
    </div>
  );

  return (
    <PortalShell mode="Employee Portal" email="s.jenkins@acme.com" role="employee">
      {view === "home" && (
        <div id="home" className="scroll-mt-24 space-y-8">
          <header className="border-b pb-7">
            <p className="text-sm font-semibold text-primary">Tuesday, 6 October</p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Welcome back, Sarah</h1>
            <p className="mt-2 text-muted-foreground">Here's a quick summary. Open a tab on the left for the details.</p>
          </header>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Pending assignments", value: pendingAssignments, sub: "Discovery modules to complete", to: "assignments" as View },
              { label: "Handoffs waiting", value: openHandoffs.length, sub: "Deliverables passed to you", to: "log-step" as View },
              { label: "Steps logged", value: loggedCount, sub: "This session", to: "log-step" as View },
            ].map((c) => (
              <button key={c.label} onClick={() => go(c.to)} className="card-elevated p-5 text-left transition-transform hover:-translate-y-0.5">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{c.label}</div>
                <div className="mt-2 text-3xl font-bold">{c.value}</div>
                <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">{c.sub}<span className="flex items-center gap-1 font-medium text-primary">Learn more<ArrowRight className="h-4 w-4" /></span></div>
              </button>
            ))}
          </div>
          <section>
            <h2 className="mb-3 text-xl font-semibold">Handed off to you</h2>
            {handoffCards}
          </section>
        </div>
      )}

      {view === "assignments" && (
        <section id="assignments" className="scroll-mt-24">
          <div className="flex items-end justify-between gap-4">
            <div><h1 className="text-3xl font-bold">Pending assignments</h1><p className="mt-1 text-sm text-muted-foreground">Your responses are reported to leadership in aggregate.</p></div>
            <span className="text-sm font-medium">{pendingAssignments} remaining</span>
          </div>
          <div className="mt-6 space-y-3">
            {assignments.map((a) => {
              const complete = completedAssignments.includes(a.id);
              const open = activeAssignment === a.id;
              return (
                <article key={a.id} className="card-elevated overflow-hidden">
                  <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md ${complete ? "bg-success-soft text-success" : "bg-accent text-accent-foreground"}`}>{complete ? <CheckCircle2 /> : <ClipboardCheck />}</div>
                    <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{a.title}</h3><span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium">{complete ? "Completed" : a.status}</span></div><p className="mt-1 text-sm text-muted-foreground">{a.detail} · {a.minutes} · {a.due}</p></div>
                    <Button variant={open ? "secondary" : "outline"} disabled={complete || a.id === "scenario"} onClick={() => setActiveAssignment(open ? null : a.id)}>{complete ? "Completed" : a.id === "scenario" ? "Available soon" : open ? "Close" : "Start"}<ChevronDown className={open ? "rotate-180" : ""} /></Button>
                  </div>
                  {open && (
                    <div className="border-t bg-muted/30 p-5 sm:p-6">
                      <div className="mb-5 flex items-center gap-3"><Progress value={(Object.keys(answers).length / discoveryQuestions.length) * 100} /><span className="shrink-0 text-xs text-muted-foreground">{Object.keys(answers).length}/{discoveryQuestions.length}</span></div>
                      <div className="space-y-6">{discoveryQuestions.map((q, i) => <fieldset key={q.q}><legend className="text-sm font-medium">{i + 1}. {q.q}</legend><div className="mt-2 flex flex-wrap gap-2">{q.a.map((ans) => <Button key={ans} type="button" size="sm" variant={answers[i] === ans ? "default" : "outline"} onClick={() => setAnswers((c) => ({ ...c, [i]: ans }))}>{ans}</Button>)}</div></fieldset>)}</div>
                      <p className="mt-6 text-xs leading-5 text-muted-foreground">Your responses describe current habits and support needs. This module does not produce a score.</p>
                      <Button className="mt-3" disabled={Object.keys(answers).length !== discoveryQuestions.length} onClick={completeDiscovery}><CheckCircle2 />Submit discovery</Button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}

      {view === "log-step" && (
        <section id="log-step" className="scroll-mt-24 space-y-8">
          <div><h1 className="text-3xl font-bold">Log a completed pilot step</h1><p className="mt-1 text-sm text-muted-foreground">One short record at handoff—not continuous time tracking.</p></div>
          <div><h2 className="mb-3 text-xl font-semibold">Handed off to you</h2>{handoffCards}</div>
          <div className="card-elevated overflow-hidden">
            {done ? (
              <div className="flex flex-col items-center gap-3 p-12 text-center"><CheckCircle2 className="h-12 w-12 text-success" /><h3 className="text-xl font-semibold">Step handed off to {handoff}</h3><p className="text-sm text-muted-foreground">{stepName(selectedStep)} · {hours}h over {days} calendar {days === 1 ? "day" : "days"} · {noAi ? `No AI tools (${noAiReason})` : toolLabel}</p><Button variant="outline" onClick={resetForm}>Log another step</Button></div>
            ) : (
              <form className="grid lg:grid-cols-[minmax(0,1fr)_360px]" onSubmit={submit} noValidate>
                <div className="space-y-6 p-5 sm:p-7">
                  {fromHandoff && <p className="rounded-md bg-accent px-3 py-2 text-sm text-accent-foreground">Logging the step handed off by {incomingHandoffs.find((h) => h.id === fromHandoff)?.from}.</p>}
                  <label className="block text-sm font-medium">Workflow step<select required value={selectedStep} onChange={(e) => setSelectedStep(e.target.value)} className="mt-2 w-full rounded-md border bg-background p-2.5 text-sm">{employeeWorkflowSteps.map((s) => <option key={s.id} value={s.id}>{s.label} — {s.task}</option>)}</select></label>
                  <label className="block text-sm font-medium">Hours of active work<input type="number" min={0.25} max={200} step={0.25} value={hours} onChange={(e) => { setHours(e.target.value); setError(""); }} placeholder="e.g. 3.5" className="mt-2 w-full rounded-md border bg-background p-2.5 text-sm" /></label>
                  <div>
                    <p className="text-sm font-medium">AI tools used <span className="text-muted-foreground">(select at least one)</span></p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {[...AI_TOOLS, OTHER, NO_AI].map((tool) => <Button key={tool} type="button" size="sm" variant={tools.includes(tool) ? "default" : "outline"} onClick={() => toggleTool(tool)}>{tool}</Button>)}
                    </div>
                    {tools.includes(OTHER) && <label className="mt-3 block text-sm font-medium">Which other AI tool?<input value={otherTool} maxLength={80} onChange={(e) => { setOtherTool(e.target.value); setError(""); }} placeholder="e.g. Midjourney" className="mt-2 w-full rounded-md border bg-background p-2.5 text-sm" /></label>}
                    {noAi && <label className="mt-3 block text-sm font-medium">What did you use instead?<textarea value={noAiReason} maxLength={300} rows={2} onChange={(e) => { setNoAiReason(e.target.value); setError(""); }} placeholder="e.g. Excel formulas, manual research" className="mt-2 w-full rounded-md border bg-background p-3 text-sm" /></label>}
                  </div>
                  <div><p className="text-sm font-medium">Hand off deliverable to</p><div className="mt-2 flex flex-wrap gap-2">{supplyChainTeam.filter((n) => n !== "Sarah Jenkins").map((n) => <Button key={n} type="button" size="sm" variant={handoff === n ? "default" : "outline"} onClick={() => setHandoff(n)}>{n}</Button>)}</div></div>
                  <label className="block text-sm font-medium">Deliverable summary<textarea value={summary} maxLength={500} onChange={(e) => setSummary(e.target.value)} rows={3} placeholder="Briefly describe what was completed" className="mt-2 w-full rounded-md border bg-background p-3 text-sm" /></label>
                  <div className="flex items-start gap-2 text-xs leading-5 text-muted-foreground"><Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />No files, prompts, or confidential work content are collected.</div>
                  {error && <p role="alert" className="text-sm font-medium text-destructive">{error}</p>}
                  <Button type="submit" size="lg" className="w-full"><Send />Submit and hand off</Button>
                </div>
                <aside className="border-t bg-muted/30 p-5 lg:border-l lg:border-t-0">
                  <div className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-primary" /><h3 className="font-semibold">Pilot date range</h3></div>
                  <p className="mt-1 text-xs text-muted-foreground">Click the first and last date for this completed step.</p>
                  <Calendar mode="range" selected={dateRange} onSelect={setDateRange} numberOfMonths={1} className="pointer-events-auto mt-4 w-full rounded-md border bg-card" />
                  <div className="mt-4 rounded-md border bg-card p-4"><div className="flex items-center gap-2 text-sm font-medium"><Clock3 className="h-4 w-4 text-primary" />{days} calendar {days === 1 ? "day" : "days"}</div><p className="mt-1 text-xs text-muted-foreground">{dateRange?.from ? format(dateRange.from, "d MMM yyyy") : "Select start"} → {dateRange?.to ? format(dateRange.to, "d MMM yyyy") : "Select end"}</p></div>
                  <div className="mt-4 flex items-start gap-2 text-xs leading-5 text-muted-foreground"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />This entry supports a controlled pilot review and is not used for employee surveillance.</div>
                </aside>
              </form>
            )}
          </div>
        </section>
      )}

      {view === "help" && (
        <section id="help" className="scroll-mt-24 space-y-4">
          <h1 className="text-3xl font-bold">Help</h1>
          {[
            ["When should I log a step?", "Once, when you finish your part of a pilot workflow and hand the deliverable on."],
            ["What if I didn't use AI?", "Choose “No AI tools used” and briefly note what you used instead."],
            ["Who sees my entries?", "Your manager sees workflow steps; leadership only sees aggregated results."],
          ].map(([q, a]) => (
            <div key={q} className="card-elevated flex gap-3 p-5"><CircleHelp className="h-5 w-5 shrink-0 text-primary" /><div><h3 className="font-semibold">{q}</h3><p className="mt-1 text-sm text-muted-foreground">{a}</p></div></div>
          ))}
          <p className="text-sm text-muted-foreground">Still stuck? Contact your program lead.</p>
        </section>
      )}
    </PortalShell>
  );
}
