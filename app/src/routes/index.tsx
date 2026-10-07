import { createFileRoute, Link } from "@tanstack/react-router";
import { BarChart3, Workflow, ClipboardList, ArrowRight } from "lucide-react";
import { Logo } from "@/components/PortalShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ivy & Company — AI Workflow Adoption Platform" },
      { name: "description", content: "Measure AI adoption across enterprise workflows: handoffs, cycle time, tools used and deliverable quality." },
      { property: "og:title", content: "Ivy & Company — AI Workflow Adoption Platform" },
      { property: "og:description", content: "Measure AI adoption across enterprise workflows." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const views = [
  { to: "/executive", title: "Executive", desc: "AI Adoption Index, unlocked capacity, savings and department heatmaps.", icon: BarChart3 },
  { to: "/manager", title: "Manager", desc: "End-to-end process map, handoffs, bottlenecks and the quality gate.", icon: Workflow },
  { to: "/employee", title: "Employee", desc: "Complete discovery modules and log finished workflow steps with their handoffs.", icon: ClipboardList },
] as const;

function Index() {
  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
      <Logo />
      <h1 className="mt-10 text-5xl font-bold tracking-tight">AI Workflow Adoption Platform</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
        Demo — pick a view to explore. Everything uses sample data; no files are ever uploaded, only typed summaries.
      </p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {views.map((v) => (
          <Link key={v.to} to={v.to} className="card-elevated group flex items-start gap-4 p-6 transition-transform hover:-translate-y-0.5">
            <div className="rounded-lg bg-primary/10 p-3 text-primary"><v.icon className="h-6 w-6" /></div>
            <div className="flex-1">
              <div className="flex items-center justify-between text-lg font-semibold">{v.title} view<ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" /></div>
              <p className="mt-1 text-sm text-muted-foreground">{v.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
