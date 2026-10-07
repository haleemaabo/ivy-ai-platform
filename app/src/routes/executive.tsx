import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  ChevronRight,
  CircleCheck,
  Clock3,
  ShieldCheck,
} from "lucide-react";
import { PortalShell, Stat } from "@/components/PortalShell";
import { ProcessMap } from "@/components/ProcessMap";
import { departmentProcessMap } from "@/lib/demo-data";
import { ChevronDown as MapChevron, Network as MapIcon } from "lucide-react";
import {
  adoptionIndex,
  departments,
  financialValue,
  fteEquivalent,
  managerBreakdowns,
  unlockedCapacity,
} from "@/lib/demo-data";

export const Route = createFileRoute("/executive")({
  head: () => ({
    meta: [
      { title: "Executive AI Adoption Intelligence | Ivy & Company" },
      { name: "description", content: "Executive trends, capability, value, risk, and department-level AI adoption evidence." },
      { property: "og:title", content: "Executive AI Adoption Intelligence" },
      { property: "og:description", content: "Organization-level AI adoption trends with department and manager drilldowns." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Executive,
});

const deliverables = [
  { baseline: 12, ai: 5, volume: 40, quality: 4.6 },
  { baseline: 8, ai: 3, volume: 60, quality: 4.8 },
  { baseline: 20, ai: 9, volume: 12, quality: 3.1 },
  { baseline: 6, ai: 2, volume: 80, quality: 4.2 },
];

const trendData = [
  { month: "May", adoption: 39, verified: 24, target: 42 },
  { month: "Jun", adoption: 45, verified: 30, target: 48 },
  { month: "Jul", adoption: 51, verified: 37, target: 54 },
  { month: "Aug", adoption: 58, verified: 44, target: 60 },
  { month: "Sep", adoption: 65, verified: 51, target: 66 },
  { month: "Oct", adoption: 73, verified: 58, target: 72 },
];

const capabilityData = [
  { capability: "Usage", score: 74, benchmark: 70 },
  { capability: "Skills", score: 61, benchmark: 70 },
  { capability: "Quality", score: 90, benchmark: 80 },
  { capability: "Governance", score: 67, benchmark: 75 },
  { capability: "Scaling", score: 55, benchmark: 70 },
];

const stageData = [
  { name: "Not started", value: 9, fill: "var(--chart-3)" },
  { name: "Exploring", value: 28, fill: "var(--chart-5)" },
  { name: "Regular", value: 41, fill: "var(--chart-1)" },
  { name: "Scaling", value: 22, fill: "var(--chart-2)" },
];

const discoveryUseCases = [
  { label: "Research", share: 72 },
  { label: "Writing", share: 64 },
  { label: "Analysis", share: 49 },
  { label: "Planning", share: 38 },
  { label: "Automation", share: 24 },
];

const attentionItems = [
  { icon: AlertTriangle, tone: "text-destructive", title: "HR adoption has stalled", detail: "44 index · only +1 point this month", action: "Sponsor skills sprint" },
  { icon: ShieldCheck, tone: "text-warning", title: "42% of AI output remains unverified", detail: "Quality gate is limiting released capacity", action: "Expand reviewer coverage" },
  { icon: Clock3, tone: "text-warning", title: "Operations turnaround is off target", detail: "5.9 days current · 4.8 day target", action: "Review two bottlenecks" },
  { icon: CircleCheck, tone: "text-success", title: "Finance playbook is ready to scale", detail: "81 index · 4.7 quality · 63% faster", action: "Replicate in Sales" },
];

function performanceTone(value: number) {
  if (value >= 75) return { badge: "bg-performance-strong text-primary-foreground", surface: "bg-performance-strong-soft", border: "border-l-performance-strong", avatar: "bg-performance-strong-soft text-performance-strong" };
  if (value >= 60) return { badge: "bg-performance-steady text-primary-foreground", surface: "bg-performance-steady-soft", border: "border-l-performance-steady", avatar: "bg-performance-steady-soft text-performance-steady" };
  if (value >= 50) return { badge: "bg-performance-watch text-foreground", surface: "bg-performance-watch-soft", border: "border-l-performance-watch", avatar: "bg-performance-watch-soft text-performance-watch" };
  return { badge: "bg-performance-risk text-primary-foreground", surface: "bg-performance-risk-soft", border: "border-l-performance-risk", avatar: "bg-performance-risk-soft text-performance-risk" };
}

function TrendChart() {
  const points = trendData.map((item, index) => `${28 + index * 68},${190 - item.adoption * 1.55}`).join(" ");
  const verified = trendData.map((item, index) => `${28 + index * 68},${190 - item.verified * 1.55}`).join(" ");
  const target = trendData.map((item, index) => `${28 + index * 68},${190 - item.target * 1.55}`).join(" ");
  const area = `28,190 ${points} 368,190`;
  return (
    <div className="h-[310px] w-full" aria-label="Six-month adoption, verified output, and plan trend chart">
      <svg viewBox="0 0 400 250" className="h-full w-full" role="img">
        {[35, 74, 113, 152, 190].map((y, index) => <line key={y} x1="28" x2="368" y1={y} y2={y} stroke="var(--border)" strokeDasharray="3 3" />)}
        <polygon points={area} fill="var(--chart-1)" opacity="0.09" />
        <polyline points={target} fill="none" stroke="var(--muted-foreground)" strokeWidth="2" strokeDasharray="6 5" />
        <polyline points={verified} fill="none" stroke="var(--chart-2)" strokeWidth="3" strokeLinejoin="round" />
        <polyline points={points} fill="none" stroke="var(--chart-1)" strokeWidth="3" strokeLinejoin="round" />
        {trendData.map((item, index) => <circle key={item.month} cx={28 + index * 68} cy={190 - item.verified * 1.55} r="3" fill="var(--chart-2)" />)}
        {trendData.map((item, index) => <text key={item.month} x={28 + index * 68} y="214" textAnchor="middle" fill="var(--muted-foreground)" fontSize="11">{item.month}</text>)}
        <g transform="translate(52 236)" fontSize="10" fill="var(--muted-foreground)"><circle cx="0" cy="-3" r="4" fill="var(--chart-1)" /><text x="9">Adoption</text><circle cx="90" cy="-3" r="4" fill="var(--chart-2)" /><text x="99">Verified</text><line x1="174" x2="192" y1="-3" y2="-3" stroke="var(--muted-foreground)" strokeDasharray="4 3" /><text x="198">Plan</text></g>
      </svg>
    </div>
  );
}

function MaturityDonut() {
  let offset = 0;
  return (
    <div className="relative mx-auto h-[220px] w-full max-w-[250px]" aria-label="Employee adoption maturity donut chart">
      <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90" role="img">
        <circle cx="100" cy="100" r="67" fill="none" stroke="var(--muted)" strokeWidth="28" />
        {stageData.map((stage) => {
          const dash = stage.value * 4.21;
          const currentOffset = offset;
          offset += dash;
          return <circle key={stage.name} cx="100" cy="100" r="67" fill="none" stroke={stage.fill} strokeWidth="28" strokeDasharray={`${Math.max(0, dash - 5)} ${421 - Math.max(0, dash - 5)}`} strokeDashoffset={-currentOffset} />;
        })}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="text-3xl font-bold text-foreground">63%</span><span className="text-xs text-muted-foreground">regular + scaling</span></div>
    </div>
  );
}

function CapabilityRadar() {
  const center = 130;
  const point = (index: number, value: number) => { const angle = (-90 + index * 72) * Math.PI / 180; const radius = value * 0.82; return `${center + Math.cos(angle) * radius},${center + Math.sin(angle) * radius}`; };
  const score = capabilityData.map((item, index) => point(index, item.score)).join(" ");
  const benchmark = capabilityData.map((item, index) => point(index, item.benchmark)).join(" ");
  return (
    <div className="h-[300px] w-full" aria-label="Enterprise AI capability radar chart">
      <svg viewBox="0 0 260 270" className="h-full w-full" role="img">
        {[20, 40, 60, 80, 100].map((value) => <polygon key={value} points={capabilityData.map((_, index) => point(index, value)).join(" ")} fill="none" stroke="var(--border)" />)}
        {capabilityData.map((_, index) => { const p = point(index, 100).split(","); return <line key={index} x1={center} y1={center} x2={p[0]} y2={p[1]} stroke="var(--border)" />; })}
        <polygon points={benchmark} fill="none" stroke="var(--chart-3)" strokeWidth="2" strokeDasharray="5 4" />
        <polygon points={score} fill="var(--chart-1)" fillOpacity="0.2" stroke="var(--chart-1)" strokeWidth="2" />
        {capabilityData.map((item, index) => { const p = point(index, 116).split(","); return <text key={item.capability} x={p[0]} y={p[1]} textAnchor="middle" dominantBaseline="middle" fill="var(--muted-foreground)" fontSize="10">{item.capability}</text>; })}
        <g transform="translate(66 255)" fontSize="9" fill="var(--muted-foreground)"><circle cx="0" cy="-3" r="4" fill="var(--chart-1)" /><text x="8">Acme Corp</text><circle cx="75" cy="-3" r="4" fill="var(--chart-3)" /><text x="83">Benchmark</text></g>
      </svg>
    </div>
  );
}

function DiscoveryUseCases() {
  return (
    <div className="space-y-4 py-2" aria-label="Most common AI use cases reported through discovery">
      {discoveryUseCases.map((item) => (
        <div key={item.label}>
          <div className="mb-2 flex items-center justify-between gap-4 text-xs"><span className="font-medium text-foreground">{item.label}</span><strong>{item.share}% mentioned</strong></div>
          <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${item.share}%` }} /></div>
        </div>
      ))}
    </div>
  );
}

function ChartHeading({ eyebrow, title, detail }: { eyebrow: string; title: string; detail: string }) {
  return (
    <div className="mb-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-primary">{eyebrow}</p>
      <h2 className="mt-1 text-xl text-foreground">{title}</h2>
      <p className="mt-1 text-sm leading-5 text-muted-foreground">{detail}</p>
    </div>
  );
}

function Executive() {
  const [view, setView] = useState<"overview" | "departments">("overview");
  const hours = unlockedCapacity(deliverables);
  const idx = adoptionIndex({ freq: 74, qual: 92, verif: 61, maturity: 55 });
  useEffect(() => {
    const syncView = () => setView(window.location.hash === "#departments" ? "departments" : "overview");
    syncView();
    window.addEventListener("hashchange", syncView);
    return () => window.removeEventListener("hashchange", syncView);
  }, []);
  return (
    <PortalShell mode="Executive Dashboard" email="ceo@acme.com" role="executive">
      {view === "overview" && <>
      <section id="overview" className="mb-8 scroll-mt-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Enterprise intelligence · October 2026</p>
            <h1 className="mt-2 max-w-3xl text-4xl leading-tight text-foreground sm:text-5xl">AI adoption is advancing, but verified value is lagging.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Acme Corp portfolio view across 360 employees, 5 departments, and 42 mapped workflows.</p>
          </div>
          <div className="rounded-md border bg-card px-4 py-3 text-right">
            <p className="text-xs font-medium text-muted-foreground">Next leadership review</p>
            <p className="mt-1 text-sm font-semibold text-foreground">30 October · 09:00</p>
          </div>
        </div>
      </section>

      <section aria-label="Organization summary" className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Adoption Index" value={`${idx.toFixed(0)}%`} sub="+8 pts vs September" trend="up" />
        <Stat label="Verified Output" value="58%" sub="+7 pts vs September" trend="up" />
        <Stat label="Unlocked Capacity" value={`${hours}h`} sub="Quality-cleared monthly" trend="up" />
        <Stat label="Value Realized" value={`$${(financialValue(hours, 85) / 1000).toFixed(1)}k`} sub={`${fteEquivalent(hours).toFixed(1)} FTE equivalent`} trend="up" />
        <Stat label="Departments at Target" value="2 / 5" sub="Finance and Supply Chain" />
      </section>

      <section id="trends" className="mb-8 grid scroll-mt-24 gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.85fr)]">
        <article className="card-elevated min-w-0 p-5 sm:p-7">
          <ChartHeading eyebrow="Momentum" title="Adoption and verified output over time" detail="Usage is now above plan; verified outcomes remain the constraint on value." />
          <TrendChart />
        </article>

        <article className="card-elevated min-w-0 p-5 sm:p-7">
          <ChartHeading eyebrow="Workforce" title="Adoption maturity" detail="Share of employees by current behavior stage, based on discovery responses." />
          <MaturityDonut />
          <div className="grid grid-cols-2 gap-x-3 gap-y-2 border-t pt-4">
            {stageData.map((stage) => (
              <div key={stage.name} className="flex items-center justify-between gap-2 text-xs">
                <span className="flex min-w-0 items-center gap-2 text-muted-foreground"><span className="h-2 w-2 shrink-0 rounded-sm" style={{ backgroundColor: stage.fill }} />{stage.name}</span>
                <strong>{stage.value}%</strong>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="mb-8 grid gap-6 xl:grid-cols-2">
        <article className="card-elevated min-w-0 p-5 sm:p-7">
          <ChartHeading eyebrow="Portfolio" title="Department adoption index" detail="A concise view of adoption by department." />
          <div className="grid gap-3 sm:grid-cols-2">
            {departments.map((department) => {
              const tone = performanceTone(department.index);
              return (
                <div key={department.name} className={`rounded-md border-l-4 p-4 ${tone.surface} ${tone.border}`}>
                  <div className="flex items-start justify-between gap-3"><span className="text-sm font-semibold text-foreground">{department.name}</span><strong className="text-2xl text-foreground">{department.index}</strong></div>
                  <a href="#departments" className="mt-4 flex items-center justify-between border-t border-foreground/10 pt-3 text-xs font-semibold text-foreground">Learn more <ChevronRight className="h-4 w-4" /></a>
                </div>
              );
            })}
          </div>
        </article>

        <article className="card-elevated min-w-0 p-5 sm:p-7">
          <ChartHeading eyebrow="Readiness" title="Enterprise capability profile" detail="Quality is strong; skills and scaling maturity require investment." />
          <CapabilityRadar />
        </article>
      </section>

      <section id="attention" className="mb-8 grid scroll-mt-24 gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(310px,0.65fr)]">
        <article className="card-elevated p-5 sm:p-7">
          <ChartHeading eyebrow="Leadership attention" title="Where intervention will change the trajectory" detail="Prioritized from adoption, workflow, quality, and discovery evidence." />
          <div className="divide-y">
            {attentionItems.map((item) => (
              <div key={item.title} className="grid gap-3 py-4 first:pt-0 last:pb-0 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
                <item.icon className={`h-5 w-5 ${item.tone}`} />
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
                </div>
                <span className="flex items-center gap-1 text-xs font-semibold text-primary">{item.action}<ArrowUpRight className="h-3.5 w-3.5" /></span>
              </div>
            ))}
          </div>
        </article>

        <article className="card-elevated min-w-0 p-5 sm:p-7">
          <ChartHeading eyebrow="Discovery insights" title="Most common AI use cases" detail="312 completed discovery modules · respondents could select their primary use." />
          <DiscoveryUseCases />
          <p className="border-t pt-4 text-xs leading-5 text-muted-foreground"><strong className="text-foreground">Role-specific training</strong> is the most requested support need, followed by practical examples and clearer policy.</p>
        </article>
      </section>
      </>}

      {view === "departments" && <section id="departments" className="mb-10 scroll-mt-24">
        <div className="mb-7 border-b pb-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Evidence explorer</p>
            <h2 className="mt-1 text-2xl text-foreground">Department breakdowns</h2>
            <p className="mt-2 text-sm text-muted-foreground">Each department is shown with its operational results and manager-level detail.</p>
            </div>
            <a href="#overview" className="flex items-center gap-1 text-sm font-semibold text-primary">Back to overview <ChevronRight className="h-4 w-4 rotate-180" /></a>
          </div>
        </div>
        <div className="space-y-6">
          {departments.map((department) => {
            const reduction = Math.round((1 - department.turnaroundAfter / department.turnaroundBefore) * 100);
            const deptManagers = managerBreakdowns[department.name] ?? [];
            const tone = performanceTone(department.index);
            return (
              <article key={department.name} id={`department-${department.name.toLowerCase().replaceAll(" ", "-")}`} className="card-elevated scroll-mt-24 overflow-hidden">
                <div className={`grid gap-5 border-b p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_repeat(3,minmax(110px,auto))] lg:items-center ${tone.surface}`}>
                  <div>
                    <div className="flex flex-wrap items-center gap-3"><h3 className="text-2xl text-foreground">{department.name}</h3><span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${tone.badge}`}>{department.index} adoption index</span></div>
                    <p className="mt-2 text-sm text-muted-foreground">{deptManagers.length} managers · {deptManagers.reduce((sum, manager) => sum + manager.workflows, 0)} mapped workflows</p>
                  </div>
                  <dl className="contents">
                    <div><dt className="text-xs text-muted-foreground">Quality</dt><dd className="mt-1 text-xl font-bold">{department.quality} / 5</dd></div>
                    <div><dt className="text-xs text-muted-foreground">Turnaround</dt><dd className="mt-1 text-xl font-bold">{department.turnaroundAfter}d</dd></div>
                    <div><dt className="text-xs text-muted-foreground">Improvement</dt><dd className="mt-1 text-xl font-bold text-success">−{reduction}%</dd></div>
                  </dl>
                </div>
                <div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-2">
                  {deptManagers.map((manager) => (
                  <article key={manager.name} className={`grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-start gap-4 rounded-md border border-l-4 bg-card p-5 ${tone.border}`}>
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-lg font-bold ${tone.avatar}`}>{manager.name[0]}</div>
                    <div className="min-w-0">
                      <h4 className="truncate text-lg">{manager.name}</h4>
                      <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{manager.team} · {manager.evidence}</p>
                      <dl className="mt-4 grid grid-cols-2 gap-x-5 gap-y-4 border-t pt-4 sm:grid-cols-4 lg:grid-cols-2 2xl:grid-cols-4">
                        <div><dt className="text-xs text-muted-foreground">Team index</dt><dd className="mt-1 text-xl font-bold">{manager.adoption}%</dd></div>
                        <div><dt className="text-xs text-muted-foreground">Quality</dt><dd className="mt-1 text-xl font-bold">{manager.quality}</dd></div>
                        <div><dt className="text-xs text-muted-foreground">Workflows</dt><dd className="mt-1 text-xl font-bold">{manager.workflows}</dd></div>
                        <div><dt className="text-xs text-muted-foreground">Turnaround</dt><dd className="mt-1 text-xl font-bold">{manager.turnaround}d</dd></div>
                      </dl>
                    </div>
                  </article>
                  ))}
                </div>
                <DepartmentProcessMap dept={department.name} />
              </article>
            );
          })}
        </div>
      </section>}
    </PortalShell>
  );
}
function DepartmentProcessMap({ dept }: { dept: string }) {
  const [open, setOpen] = useState(false);
  const data = departmentProcessMap(dept);
  return (
    <div className="border-t">
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/50 sm:px-6">
        <span className="flex items-center gap-2 font-semibold"><MapIcon className="h-4 w-4 text-primary" />Process map<span className="hidden text-sm font-normal text-muted-foreground sm:inline">· {data.owner} — {data.workflow}</span></span>
        <MapChevron className={`h-5 w-5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-5 pb-5 sm:px-6 sm:pb-6"><p className="mb-3 text-sm text-muted-foreground">Click a step for performer, time and AI tools.</p><ProcessMap steps={data.steps} edges={data.edges} /></div>}
    </div>
  );
}
