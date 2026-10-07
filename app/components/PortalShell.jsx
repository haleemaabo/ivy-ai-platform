import { Link } from "@tanstack/react-router";
import {
  BarChart3,
  BellRing,
  ClipboardCheck,
  CircleHelp,
  Gauge,
  Home,
  Layers3,
  LineChart,
  LogOut,
  Network,
  Route,
  UsersRound,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

const roleNav = {
  employee: [
    { href: "#home", label: "Home", icon: Home },
    { href: "#assignments", label: "Assignments", icon: ClipboardCheck },
    { href: "#log-step", label: "Log a step", icon: Route },
    { href: "#help", label: "Help", icon: CircleHelp },
  ],
  manager: [
    { href: "#overview", label: "Overview", icon: Gauge },
    { href: "#process-map", label: "Process map", icon: Network },
    { href: "#quality", label: "Quality review", icon: ClipboardCheck },
    { href: "#workflows", label: "Workflows", icon: Layers3 },
  ],
  executive: [
    { href: "#overview", label: "Overview", icon: BarChart3 },
    { href: "#trends", label: "Trends", icon: LineChart },
    { href: "#departments", label: "Departments", icon: UsersRound },
    { href: "#attention", label: "Attention", icon: BellRing },
  ],
};

export function Logo({ small }) {
  return (
    <div
      className={`font-serif leading-none tracking-wide text-foreground ${
        small ? "text-base" : "text-2xl"
      }`}
    >
      IVY&amp;<br />
      <span className={small ? "text-[0.6rem] tracking-[0.2em]" : "text-xs tracking-[0.25em]"}>
        COMPANY
      </span>
    </div>
  );
}

export function PortalShell({ mode, email, role, children }) {
  const inferredRole = mode.toLowerCase().includes("executive")
    ? "executive"
    : mode.toLowerCase().includes("manager")
      ? "manager"
      : "employee";
  const nav = roleNav[role ?? inferredRole];
  const [active, setActive] = useState(nav[0]?.href ?? "");
  const lockUntil = useRef(0);

  useEffect(() => {
    const goTo = (hash) => {
      if (!nav.some((n) => n.href === hash)) return;
      setActive(hash);
      lockUntil.current = Date.now() + 900;
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" });
        }),
      );
    };

    if (window.location.hash) goTo(window.location.hash);

    const onHash = () => goTo(window.location.hash);
    const onScroll = () => {
      if (Date.now() < lockUntil.current) return;
      let current = "";
      for (const item of nav) {
        const el = document.getElementById(item.href.slice(1));
        if (el && el.getBoundingClientRect().top <= 140) current = item.href;
      }
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) {
        const last = [...nav].reverse().find((n) => document.getElementById(n.href.slice(1)));
        if (last) current = last.href;
      }
      if (current) setActive(current);
    };

    window.addEventListener("hashchange", onHash);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("scroll", onScroll);
    };
  }, [nav]);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="sticky top-0 z-20 flex h-screen w-[76px] shrink-0 flex-col items-center border-r bg-card py-5 md:w-56 md:items-stretch md:px-4">
        <Link to="/" className="mx-auto md:mx-2">
          <Logo small />
        </Link>
        <nav aria-label={`${mode} navigation`} className="mt-8 flex flex-col gap-1.5">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              title={item.label}
              aria-current={active === item.href ? "location" : undefined}
              onClick={() => {
                setActive(item.href);
                lockUntil.current = Date.now() + 900;
                if (window.location.hash === item.href)
                  document.getElementById(item.href.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className={`flex h-11 items-center justify-center gap-3 rounded-md px-3 text-sm font-medium transition-colors md:justify-start ${
                active === item.href
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span className="hidden md:inline">{item.label}</span>
            </a>
          ))}
        </nav>
        <div className="mt-auto hidden border-t pt-4 text-xs leading-5 text-muted-foreground md:block">
          <span className="font-semibold text-foreground">Need help?</span>
          <br />
          Contact your program lead.
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 flex min-h-14 items-center justify-between gap-3 border-b bg-card px-4 py-3 sm:px-8">
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
            {mode}
          </span>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="hidden sm:inline">{email}</span>
            <Link to="/" title="Exit demo" className="flex items-center gap-1 hover:text-foreground">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Exit demo</span>
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-[1280px] px-4 py-7 sm:px-8">{children}</main>
      </div>
    </div>
  );
}

export function Stat({ label, value, sub, trend }) {
  return (
    <div className="card-elevated p-5">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-2 flex items-baseline gap-2">
        <div className="text-3xl font-bold text-foreground">{value}</div>
        {trend && (
          <span className={`text-xs font-bold ${trend === "up" ? "text-success" : "text-destructive"}`}>
            {trend === "up" ? "↑" : "↓"}
          </span>
        )}
      </div>
      {sub && <div className="mt-2 text-sm font-medium text-success/80">{sub}</div>}
    </div>
  );
}