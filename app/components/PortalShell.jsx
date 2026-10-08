'use client';

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Marcellus, Inter } from "next/font/google";
import { createClient } from "../../lib/supabase/client";
import {
  BarChart3,
  BellRing,
  ChevronLeft,
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

const marcellus = Marcellus({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-marcellus",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const roleNav = {
  employee: [
    { href: "/employee/overview", label: "Overview", icon: Home },
    { href: "/employee/assignments", label: "Assignments", icon: ClipboardCheck },
    { href: "/employee/log-step", label: "Log a step", icon: Route },
    { href: "/employee/help", label: "Help", icon: CircleHelp },
  ],
  manager: [
    { href: "/manager/overview", label: "Overview", icon: Gauge },
    { href: "/manager/process-map", label: "Process Map", icon: Network },
    { href: "/manager/quality", label: "Quality Review", icon: ClipboardCheck },
    { href: "/manager/workflows", label: "Workflows", icon: Layers3 },
  ],
  executive: [
    { href: "/executive", label: "Executive Summary", icon: BarChart3 },
    { href: "/executive/trends", label: "Trends", icon: LineChart },
    { href: "/executive/departments", label: "Departments", icon: UsersRound },
    { href: "/executive/attention", label: "Attention", icon: BellRing },
  ],
};

export function Logo({ small }) {
  return (
    <div className="flex items-center gap-2">
      <Image
        src="/ivy-logo-dark.png"
        alt="Ivy & Company Logo"
        width={small ? 48 : 56}
        height={small ? 48 : 56}
        className="object-contain brightness-0 invert"
        priority
      />
    </div>
  );
}

export function PortalShell({ mode = "Executive", email, role, children }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const modeStr = (mode || "").toLowerCase();
  const inferredRole = modeStr.includes("executive")
    ? "executive"
    : modeStr.includes("manager")
      ? "manager"
      : "employee";

  const activeRole = role ?? inferredRole;
  const nav = roleNav[activeRole] || roleNav.executive;

  const handleLogout = async () => {
    sessionStorage.removeItem('portalMode');
    await supabase.auth.signOut();
    router.push('/admin-login');
  };

  return (
    <div className={`${inter.className} flex min-h-screen w-full bg-[#F8FAFC] antialiased`}>
      {/* Dark Sidebar */}
      <aside className="sticky top-0 z-20 flex h-screen w-[240px] shrink-0 flex-col justify-between bg-[#1B1F3B] py-6 px-4 text-slate-300 shadow-xl">
        <div>
          {/* Header Brand + Collapse Icon */}
          <div className="flex items-center justify-between px-2 pb-6 border-b border-slate-700/50">
            <Link href="/" className="flex items-center gap-2">
              <Logo small />
            </Link>
            <button
              type="button"
              className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav aria-label={`${mode} navigation`} className="mt-6 flex flex-col gap-1.5">
            {nav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex h-10 items-center gap-3 rounded-lg px-3 text-xs transition-all ${
                    isActive
                      ? "bg-white/20 text-white font-semibold shadow-xs"
                      : "text-slate-300 hover:bg-white/10 hover:text-white font-normal"
                  }`}
                >
                  <item.icon className="h-4 w-4 shrink-0 text-slate-300" />
                  <span className={`${inter.className} tracking-wide text-xs`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Log Out Button */}
        <div className="border-t border-slate-700/50 pt-4 px-2">
          <button
            onClick={handleLogout}
            type="button"
            className="flex w-full items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="min-w-0 flex-1">
        {/* Top Bar */}
        <header className="sticky top-0 z-10 flex min-h-14 items-center justify-between gap-3 border-b border-slate-200/80 bg-white px-6 py-3 shadow-2xs">
          <h1 className={`${marcellus.className} text-xl font-normal text-slate-900`}>
            Enterprise AI Adoption
          </h1>
          <div className={`${inter.className} flex items-center gap-3 text-xs text-slate-500`}>
            <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
              {email || "executive@ivyandco.com"}
            </span>
          </div>
        </header>

        {/* Page Content Workspace */}
        <main className="mx-auto max-w-[1400px] p-6">{children}</main>
      </div>
    </div>
  );
}

export default PortalShell;

export function Stat({ label, value, sub, trend }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
      <div className={`${inter.className} text-[10px] font-bold uppercase tracking-wider text-slate-400`}>
        {label}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <div className={`${marcellus.className} text-3xl font-normal text-slate-900`}>
          {value}
        </div>
        {trend && (
          <span className={`text-xs font-bold ${trend === "up" ? "text-emerald-600" : "text-rose-600"}`}>
            {trend === "up" ? "↑" : "↓"}
          </span>
        )}
      </div>
      {sub && <div className={`${inter.className} mt-1 text-xs text-slate-500`}>{sub}</div>}
    </div>
  );
}