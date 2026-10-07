import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, Info, Users, Clock, ArrowRight, Star } from "lucide-react";
import { PortalShell, Stat } from "@/components/PortalShell";
import { ProcessMap } from "@/components/ProcessMap";
import { Button } from "@/components/ui/button";
import { steps, edges, workflows, QUALITY_GATE, type StepNode } from "@/lib/demo-data";

export const Route = createFileRoute("/manager")({
  head: () => ({
    meta: [
      { title: "Manager View — End-to-End Process Map | Ivy & Company" },
      { name: "description", content: "Track handoffs, cycle times, AI tools and bottlenecks, then score the final deliverable." },
      { property: "og:title", content: "Manager View — End-to-End Process Map" },
      { property: "og:description", content: "Handoffs, bottlenecks and quality gate review." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Manager,
});

const map = new Map(steps.map((s) => [s.id, s]));
const node = (id: string) => {
  const step = map.get(id);
  if (!step) throw new Error(`Unknown workflow step: ${id}`);
  return step;
};
const R = 26;
type View = "overview" | "process-map" | "quality" | "workflows";
const VIEWS: View[] = ["overview", "process-map", "quality", "workflows"];

function edgePath(a: StepNode, b: StepNode) {
  const sx = a.x + R, sy = a.y, ex = b.x - R, ey = b.y;
  if (Math.abs(sy - ey) < 2) return `M${sx},${sy} L${ex},${ey}`;
  if (Math.abs(a.x - b.x) < 2) return `M${a.x},${a.y + R} L${b.x},${b.y - R}`;
  const mx = (sx + ex) / 2;
  return `M${sx},${sy} C${mx},${sy} ${mx},${ey} ${ex},${ey}`;
}

function Manager() {
  const [rubric, setRubric] = useState({ Accuracy: 4.5, Completeness: 4, Actionability: 4.5 });
  const [comment, setComment] = useState("");
  const [locked, setLocked] = useState(false);
  const score = Object.values(rubric).reduce((a, b) => a + b, 0) / 3;
  const totalDays = steps.reduce((s, x) => s + x.days, 0);
  const [view, setView] = useState<View>("overview");
  useEffect(() => {
    const sync = () => { const h = window.location.hash.slice(1) as View; setView(VIEWS.includes(h) ? h : "overview"); };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  const go = (v: View) => { window.location.hash = v; };
  const bottlenecks = steps.filter((x) => x.bottleneck);

  return (
    <PortalShell mode="Manager Portal" email="c.miller@acme.com" role="manager">
      {view === "overview" && (<div id="overview" className="scroll-mt-24">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold">Welcome back, Chris</h1>
          <p className="mt-1 text-muted-foreground">A quick summary of your team's workflows. Open a tab on the left for the details.</p>
          <p className="text-sm italic text-muted-foreground">Supply Chain &amp; Logistics Department — Supply Chain Risk Review</p>
        </div>
        {locked ? (
          <div className="flex items-center gap-3 rounded-md border border-success/30 bg-success-soft px-5 py-3">
            <CheckCircle2 className="h-8 w-8 shrink-0 text-success" />
            <div><div className="font-semibold text-success">Review submitted</div><div className="text-sm text-success">{score.toFixed(1)} / 5.0 pushed to Executive View</div></div>
          </div>
        ) : (
          <button onClick={() => go("quality")} className="flex items-center gap-3 rounded-md border border-warning/40 bg-warning/10 px-5 py-3 text-left">
            <Clock className="h-8 w-8 shrink-0 text-warning" />
            <div><div className="font-semibold text-foreground">Pending your review</div><div className="text-sm text-muted-foreground">Final deliverable awaiting quality review</div></div>
          </button>
        )}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <Stat label="Active workflows" value="14" />
        <Stat label="Avg turnaround" value="1.8 days" sub="−62% vs baseline" />
        <Stat label="Rework reduction" value="−50%" />
        <Stat label="Avg quality score" value="4.6 / 5" />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="card-elevated flex items-center gap-5 p-5">
          <div className="relative h-20 w-20">
            <svg viewBox="0 0 36 36" className="h-20 w-20 -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--muted)" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--success)" strokeWidth="3" strokeDasharray="89 100" strokeLinecap="round" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-success">89%</span>
          </div>
          <div><div className="text-lg font-semibold text-success">Overall Process Efficiency</div><div className="text-sm">Industry Benchmark: 70%</div><div className="text-xs text-muted-foreground">You are performing 19% above industry benchmark.</div></div>
        </div>
        <div className="card-elevated p-5">
          <div className="flex items-center gap-2 font-semibold">Bottleneck Heatmap <Info className="h-4 w-4 text-muted-foreground" /></div>
          <div className="heat-bar mt-3 h-3 rounded-full" />
          <div className="mt-2 flex justify-between text-xs text-muted-foreground"><span>Low Impact</span><span>Moderate Impact</span><span>High Impact</span></div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {[
          { to: "process-map" as View, label: "Process map", value: `${bottlenecks.length} bottlenecks`, sub: bottlenecks.map((b) => `${b.label} · ${b.days.toFixed(1)}d`).join(", "), tone: "text-destructive" },
          { to: "quality" as View, label: "Quality review", value: locked ? "Approved" : "1 awaiting", sub: locked ? `${score.toFixed(1)} / 5.0 locked` : `${node("J").deliverable}`, tone: locked ? "text-success" : "text-warning" },
          { to: "workflows" as View, label: "Workflows", value: `${workflows.length} active`, sub: `${workflows.filter((w) => w.status === "Completed").length} completed · ${workflows.filter((w) => w.status === "In progress").length} in progress`, tone: "text-foreground" },
        ].map((c) => (
          <button key={c.label} onClick={() => go(c.to)} className="card-elevated p-5 text-left transition-transform hover:-translate-y-0.5">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{c.label}</div>
            <div className={`mt-2 text-2xl font-bold ${c.tone}`}>{c.value}</div>
            <div className="mt-1 truncate text-sm text-muted-foreground">{c.sub}</div>
            <div className="mt-3 flex items-center gap-1 text-sm font-medium text-primary">Learn more<ArrowRight className="h-4 w-4" /></div>
          </button>
        ))}
      </div>
      </div>)}

      {view === "process-map" && (<section id="process-map" className="scroll-mt-24">
      <h1 className="text-3xl font-bold">End-to-End Process Map</h1>
      <p className="mt-1 text-muted-foreground">Complete process flow with performance metrics and identified bottlenecks.</p>
      <div className="mt-4"><ProcessMap /></div>
      </section>)}

      {view === "quality" && (<section id="quality" className="scroll-mt-24">
        <h1 className="mb-4 text-3xl font-bold">Quality review</h1>
        <div className="card-elevated p-6">
          <h2 className="text-lg font-semibold">Deliverable Review Gate</h2>
          <p className="text-sm text-muted-foreground">Rate only what you received. Scores below {QUALITY_GATE} don't count toward unlocked capacity.</p>
          <div className="mt-4 rounded-lg bg-muted p-4 text-sm"><b>Deliverable received:</b> "{node("J").deliverable}" — from {node("J").performer}</div>
          <div className="mt-5 space-y-4">
            {(Object.keys(rubric) as (keyof typeof rubric)[]).map((k) => (
              <div key={k}>
                <div className="flex justify-between text-sm"><span className="font-medium">{k}</span><span className="font-semibold">{rubric[k].toFixed(1)}</span></div>
                <input type="range" min={1} max={5} step={0.5} disabled={locked} value={rubric[k]} onChange={(e) => setRubric({ ...rubric, [k]: +e.target.value })} className="w-full accent-primary" />
              </div>
            ))}
          </div>
          <textarea disabled={locked} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Comments (optional)" className="mt-4 w-full rounded-lg border bg-background p-3 text-sm" rows={2} />
          <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              {[1, 2, 3, 4, 5].map((i) => <Star key={i} className={`h-5 w-5 ${i <= Math.round(score) ? "fill-warning text-warning" : "text-border"}`} />)}
              <span className="font-bold">{score.toFixed(1)} / 5.0</span>
              <span className={`text-sm ${score >= QUALITY_GATE ? "text-success" : "text-destructive"}`}>{score >= QUALITY_GATE ? "Clears quality gate" : "Fails quality gate"}</span>
            </div>
            <Button disabled={locked} onClick={() => setLocked(true)}>{locked ? "Approved & Locked" : "Approve & Lock Quality Score"}</Button>
          </div>
        </div>
      </section>)}

      {view === "workflows" && (<section id="workflows" className="scroll-mt-24">
        <h1 className="mb-4 text-3xl font-bold">My workflows</h1>
        <div className="card-elevated p-6">
          <ul className="mt-3 divide-y">
            {workflows.map((w) => (
              <li key={w.id} className="py-3">
                <div className="font-medium">{w.name}</div>
                <div className="text-xs text-muted-foreground">{w.steps} steps · {w.turnaround} days · {w.status}{w.quality ? ` · ${w.quality}/5` : ""}</div>
              </li>
            ))}
          </ul>
        </div>
      </section>)}
    </PortalShell>
  );
}
