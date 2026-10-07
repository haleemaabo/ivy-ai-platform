import { useState } from "react";
import { AlertTriangle, ArrowRight, Clock, Users } from "lucide-react";
import { edges as defaultEdges, steps as defaultSteps } from "@/lib/demo-data";

const R = 26;
function edgePath(a, b) {
  const sx = a.x + R, sy = a.y, ex = b.x - R, ey = b.y;
  if (Math.abs(sy - ey) < 2) return `M${sx},${sy} L${ex},${ey}`;
  if (Math.abs(a.x - b.x) < 2) return `M${a.x},${a.y + R} L${b.x},${b.y - R}`;
  const mx = (sx + ex) / 2;
  return `M${sx},${sy} C${mx},${sy} ${mx},${ey} ${ex},${ey}`;
}

/** Shared end-to-end process map used by the manager and executive portals. */
export function ProcessMap({ steps = defaultSteps, edges = defaultEdges }) {
  const map = new Map(steps.map((s) => [s.id, s]));
  const node = (id) => {
    const s = map.get(id);
    if (!s) throw new Error(`Unknown workflow step: ${id}`);
    return s;
  };
  const [sel, setSel] = useState(node("C"));

  return (
    <div className="card-elevated mt-4 min-w-0 max-w-full scroll-mt-24 overflow-x-auto p-4">
      <svg viewBox="0 0 1110 500" className="block min-w-[900px]">
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="var(--primary)" />
          </marker>
          <radialGradient id="heat">
            <stop offset="0%" stopColor="var(--step-red)" stopOpacity="0.9" />
            <stop offset="35%" stopColor="var(--step-orange)" stopOpacity="0.6" />
            <stop offset="60%" stopColor="var(--step-amber)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--step-green)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="250" cy="355" r="115" fill="url(#heat)" />
        <circle cx="800" cy="230" r="90" fill="url(#heat)" opacity="0.72" />
        {edges.map((e, i) => {
          const a = node(e.from), b = node(e.to);
          const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
          return (
            <g key={i}>
              <path d={edgePath(a, b)} fill="none" stroke="var(--primary)" strokeWidth="1.5" markerEnd="url(#arrow)" opacity="0.75" />
              {e.days !== undefined && (
                <text x={mx} y={my - 8} textAnchor="middle" className="fill-foreground text-[12px] font-semibold">
                  {e.days.toFixed(1)} days
                </text>
              )}
              {e.by && (
                <text x={mx} y={my + 16} textAnchor="middle" className="fill-muted-foreground text-[10px]">
                  Handoff by: {e.by}
                </text>
              )}
            </g>
          );
        })}
        {steps.map((s) => (
          <g key={s.id} onClick={() => setSel(s)} className="cursor-pointer">
            {sel.id === s.id && (
              <circle cx={s.x} cy={s.y} r={R + 6} fill="none" stroke="var(--primary)" strokeWidth="2" strokeDasharray="4 3" />
            )}
            <circle cx={s.x} cy={s.y} r={R} fill={`var(${s.color})`} stroke={s.bottleneck ? "var(--card)" : "none"} strokeWidth="2" />
            <text x={s.x} y={s.y + 4} textAnchor="middle" className="fill-primary-foreground text-[11px] font-semibold">
              {s.label}
            </text>
          </g>
        ))}
      </svg>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <div className="flex max-w-sm items-start gap-2 rounded-lg bg-alert p-4 text-alert-foreground">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <div className="font-semibold">Operational Bottlenecks</div>
            <div className="text-sm">
              {steps.filter((x) => x.bottleneck).map((x) => x.task).join(" and ")} account for{" "}
              {steps.filter((x) => x.bottleneck).reduce((a, x) => a + x.days, 0).toFixed(1)} of{" "}
              {steps.reduce((s, x) => s + x.days, 0).toFixed(1)} logged days. Both require redesign review.
            </div>
          </div>
        </div>
        <div className="min-w-0 flex-1 rounded-md border p-4 sm:min-w-[320px]">
          <div className="flex items-center gap-3">
            <span className="h-4 w-4 rounded-full" style={{ background: `var(${sel.color})` }} />
            <span className="font-semibold">
              {sel.label} — {sel.task}
            </span>
            {sel.bottleneck && (
              <span className="rounded bg-destructive px-2 py-0.5 text-xs text-destructive-foreground">
                Bottleneck
              </span>
            )}
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Performer</dt>
            <dd>{sel.performer}</dd>
            <dt className="text-muted-foreground">Time logged</dt>
            <dd>{sel.days.toFixed(1)} days</dd>
            <dt className="text-muted-foreground">AI tools</dt>
            <dd className="flex flex-wrap gap-1">
              {sel.tools.length ? (
                sel.tools.map((t) => (
                  <span key={t} className="rounded bg-secondary px-2 py-0.5 text-xs">
                    {t}
                  </span>
                ))
              ) : (
                <span className="text-muted-foreground">None reported</span>
              )}
            </dd>
            <dt className="text-muted-foreground">Deliverable</dt>
            <dd>"{sel.deliverable}"</dd>
          </dl>
        </div>
      </div>
      <div className="mt-4 grid gap-4 border-t pt-4 text-xs text-muted-foreground md:grid-cols-4">
        <div className="flex gap-2">
          <span className="h-4 w-4 shrink-0 rounded-full bg-primary" />
          <div>
            <b className="text-foreground">Process Steps</b>
            <br />
            Click a circle to see who, how long, and which AI tools.
          </div>
        </div>
        <div className="flex gap-2">
          <ArrowRight className="h-4 w-4 shrink-0 text-primary" />
          <div>
            <b className="text-foreground">Flow Direction</b>
            <br />
            Sequence of the process.
          </div>
        </div>
        <div className="flex gap-2">
          <Users className="h-4 w-4 shrink-0 text-primary" />
          <div>
            <b className="text-foreground">Handoff Ownership</b>
            <br />
            Who hands off between steps.
          </div>
        </div>
        <div className="flex gap-2">
          <Clock className="h-4 w-4 shrink-0 text-primary" />
          <div>
            <b className="text-foreground">Cycle Time</b>
            <br />
            Days to complete each handoff.
          </div>
        </div>
      </div>
    </div>
  );
}