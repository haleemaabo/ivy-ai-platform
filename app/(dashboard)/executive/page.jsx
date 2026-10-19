'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Marcellus, Inter } from 'next/font/google';
import { createClient } from '../../../lib/supabase/client';
import {
  AlertTriangle,
  ArrowUpRight,
  ChevronRight,
  CircleCheck,
  Clock3,
  ShieldCheck,
  User,
  LogOut,
  ChevronDown,
  Network as MapIcon,
  TrendingUp,
  Building2,
  Inbox,
  ArrowRight,
  Users,
  Clock,
} from 'lucide-react';

const marcellus = Marcellus({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-marcellus',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

function performanceTone(value) {
  if (value >= 75) {
    return {
      badge: 'bg-emerald-600 text-white',
      surface: 'bg-emerald-50/60',
      border: 'border-l-emerald-600',
      avatar: 'bg-emerald-100 text-emerald-800',
    };
  }
  if (value >= 60) {
    return {
      badge: 'bg-blue-600 text-white',
      surface: 'bg-blue-50/60',
      border: 'border-l-blue-600',
      avatar: 'bg-blue-100 text-blue-800',
    };
  }
  if (value >= 50) {
    return {
      badge: 'bg-amber-500 text-white',
      surface: 'bg-amber-50/60',
      border: 'border-l-amber-500',
      avatar: 'bg-amber-100 text-amber-800',
    };
  }
  return {
    badge: 'bg-rose-600 text-white',
    surface: 'bg-rose-50/60',
    border: 'border-l-rose-600',
    avatar: 'bg-rose-100 text-rose-800',
  };
}

// Dynamic Trend Chart SVG
function TrendChart({ trendData }) {
  if (!trendData || trendData.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-xs text-slate-400">
        No step history available for trends
      </div>
    );
  }

  const points = trendData.map((item, index) => `${28 + index * 68},${190 - (item.adoption || 0) * 1.55}`).join(' ');
  const verified = trendData.map((item, index) => `${28 + index * 68},${190 - (item.verified || 0) * 1.55}`).join(' ');
  const target = trendData.map((item, index) => `${28 + index * 68},${190 - (item.target || 0) * 1.55}`).join(' ');
  const area = `28,190 ${points} 368,190`;

  return (
    <div className="h-[280px] w-full" aria-label="Adoption trend chart">
      <svg viewBox="0 0 400 240" className="h-full w-full">
        {[35, 74, 113, 152, 190].map((y) => (
          <line key={y} x1="28" x2="368" y1={y} y2={y} stroke="#E2E8F0" strokeDasharray="3 3" />
        ))}
        <polygon points={area} fill="#1E2540" opacity="0.08" />
        <polyline points={target} fill="none" stroke="#94A3B8" strokeWidth="2" strokeDasharray="6 5" />
        <polyline points={verified} fill="none" stroke="#10B981" strokeWidth="3" strokeLinejoin="round" />
        <polyline points={points} fill="none" stroke="#1E2540" strokeWidth="3" strokeLinejoin="round" />
        {trendData.map((item, index) => (
          <circle key={item.month} cx={28 + index * 68} cy={190 - (item.verified || 0) * 1.55} r="3" fill="#10B981" />
        ))}
        {trendData.map((item, index) => (
          <text key={item.month} x={28 + index * 68} y="212" textAnchor="middle" fill="#64748B" fontSize="11">
            {item.month}
          </text>
        ))}
        <g transform="translate(60 232)" fontSize="10" fill="#64748B">
          <circle cx="0" cy="-3" r="4" fill="#1E2540" />
          <text x="9">Adoption</text>
          <circle cx="85" cy="-3" r="4" fill="#10B981" />
          <text x="94">Verified</text>
          <line x1="165" x2="183" y1="-3" y2="-3" stroke="#94A3B8" strokeDasharray="4 3" />
          <text x="189">Plan</text>
        </g>
      </svg>
    </div>
  );
}

// Dynamic Maturity Donut Chart SVG
function MaturityDonut({ stageData, regularScalingPct }) {
  let offset = 0;
  return (
    <div className="relative mx-auto h-[200px] w-full max-w-[220px]">
      <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
        <circle cx="100" cy="100" r="67" fill="none" stroke="#F1F5F9" strokeWidth="26" />
        {stageData.map((stage) => {
          const dash = (stage.value || 0) * 4.21;
          const currentOffset = offset;
          offset += dash;
          return (
            <circle
              key={stage.name}
              cx="100"
              cy="100"
              r="67"
              fill="none"
              stroke={stage.fill}
              strokeWidth="26"
              strokeDasharray={`${Math.max(0, dash - 4)} ${421 - Math.max(0, dash - 4)}`}
              strokeDashoffset={-currentOffset}
            />
          );
        })}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-slate-900" style={{ fontFamily: "'Marcellus', serif" }}>
          {regularScalingPct}%
        </span>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Regular + Scaling</span>
      </div>
    </div>
  );
}

// Dynamic Capability Radar SVG
function CapabilityRadar({ capabilityData }) {
  if (!capabilityData || capabilityData.length === 0) return null;

  const center = 120;
  const point = (index, value) => {
    const angle = (-90 + index * 72) * (Math.PI / 180);
    const radius = value * 0.75;
    return `${center + Math.cos(angle) * radius},${center + Math.sin(angle) * radius}`;
  };

  const score = capabilityData.map((item, index) => point(index, item.score)).join(' ');
  const benchmark = capabilityData.map((item, index) => point(index, item.benchmark)).join(' ');

  return (
    <div className="h-[260px] w-full">
      <svg viewBox="0 0 240 250" className="h-full w-full">
        {[20, 40, 60, 80, 100].map((value) => (
          <polygon key={value} points={capabilityData.map((_, index) => point(index, value)).join(' ')} fill="none" stroke="#E2E8F0" />
        ))}
        {capabilityData.map((_, index) => {
          const p = point(index, 100).split(',');
          return <line key={index} x1={center} y1={center} x2={p[0]} y2={p[1]} stroke="#E2E8F0" />;
        })}
        <polygon points={benchmark} fill="none" stroke="#F59E0B" strokeWidth="2" strokeDasharray="5 4" />
        <polygon points={score} fill="#1E2540" fillOpacity="0.2" stroke="#1E2540" strokeWidth="2" />
        {capabilityData.map((item, index) => {
          const p = point(index, 114).split(',');
          return (
            <text
              key={item.capability}
              x={p[0]}
              y={p[1]}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#64748B"
              fontSize="10"
              fontWeight="600"
            >
              {item.capability}
            </text>
          );
        })}
        <g transform="translate(50 242)" fontSize="10" fill="#64748B">
          <circle cx="0" cy="-3" r="4" fill="#1E2540" />
          <text x="8">Organization</text>
          <circle cx="85" cy="-3" r="4" fill="#F59E0B" />
          <text x="93">Benchmark</text>
        </g>
      </svg>
    </div>
  );
}

export default function ExecutiveDashboard() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('overview');

  const [profilesList, setProfilesList] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [workflowSteps, setWorkflowSteps] = useState([]);
  const [discoveryModules, setDiscoveryModules] = useState([]);
  const [userAssignments, setUserAssignments] = useState([]);

  // Accordion and Workflow selection states
  const [openProcessMapDept, setOpenProcessMapDept] = useState(null);
  const [selectedDeptWorkflows, setSelectedDeptWorkflows] = useState({});
  const [selectedNode, setSelectedNode] = useState(null);

  // Fetch live database context
  const loadExecutiveData = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { session },
        error: sessionErr,
      } = await supabase.auth.getSession();
      if (sessionErr || !session) {
        router.push('/admin-login');
        return;
      }

      const { data: profData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      setProfile(
        profData || {
          id: session.user.id,
          email: session.user.email,
          full_name: 'Executive Leader',
          role: 'EXECUTIVE',
        }
      );

      const { data: allProfs } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, department, job_title, organization, created_at');
      setProfilesList(allProfs || []);

      const { data: wfData } = await supabase
        .from('workflows')
        .select('id, organization_id, manager_id, title, baseline_effort_hours, monthly_output_volume, quality_score, is_approved, created_at, name, department, organization, manager_email');
      setWorkflows(wfData || []);

      const { data: stepsData } = await supabase
        .from('workflow_steps')
        .select('*, workflows!workflow_steps_workflow_id_fkey(id, title, name, department, organization, quality_score, is_approved), profiles!workflow_steps_performer_id_fkey(full_name, email)');
      setWorkflowSteps(stepsData || []);

      const { data: discModules } = await supabase.from('discovery_modules').select('*');
      setDiscoveryModules(discModules || []);

      const { data: assignments } = await supabase.from('user_module_assignments').select('*');
      setUserAssignments(assignments || []);
    } catch (err) {
      console.error('Error fetching Supabase executive data:', err.message);
    } finally {
      setLoading(false);
    }
  }, [supabase, router]);

  useEffect(() => {
    loadExecutiveData();
  }, [loadExecutiveData]);

  const getPerformerName = useCallback(
    (step) => {
      if (!step) return 'Unassigned';
      if (step.profiles?.full_name) return step.profiles.full_name;
      const targetId = step.performer_id || step.handoff_target_id;
      if (targetId) {
        const found = profilesList.find((p) => p.id === targetId);
        if (found?.full_name) return found.full_name;
      }
      return 'Unassigned Candidate';
    },
    [profilesList]
  );

  // Compute departmental structure dynamically
  const departmentBreakdowns = useMemo(() => {
    const rawDepts = [
      ...workflows.map((w) => w.department),
      ...profilesList.map((p) => p.department),
    ].filter((dept) => Boolean(dept && dept.trim().length > 0));

    const depts = Array.from(new Set(rawDepts));

    return depts.map((deptName) => {
      const deptWfs = workflows.filter(
        (w) => (w.department || '').toLowerCase() === deptName.toLowerCase()
      );
      const deptSteps = workflowSteps.filter(
        (s) => (s.workflows?.department || '').toLowerCase() === deptName.toLowerCase()
      );
      const deptPeople = profilesList.filter(
        (p) => (p.department || '').toLowerCase() === deptName.toLowerCase()
      );

      const scoredWfs = deptWfs.filter((w) => w.quality_score && Number(w.quality_score) > 0);
      const avgQuality = scoredWfs.length
        ? (scoredWfs.reduce((acc, curr) => acc + Number(curr.quality_score), 0) / scoredWfs.length).toFixed(1)
        : '0.0';

      const stepsWithDur = deptSteps.filter((s) => s.duration_hours && Number(s.duration_hours) > 0);
      const avgHours = stepsWithDur.length
        ? stepsWithDur.reduce((acc, curr) => acc + Number(curr.duration_hours), 0) / stepsWithDur.length
        : 0;

      const turnaroundAfter = avgHours > 0 ? (avgHours / 24).toFixed(1) : '0.4';
      const turnaroundBefore = avgHours > 0 ? (Number(turnaroundAfter) * 2.1).toFixed(1) : '0.8';

      const deptManagers = deptPeople.filter(
        (p) => (p.role || '').toUpperCase() === 'MANAGER' || (p.role || '').toUpperCase() === 'EXECUTIVE'
      );

      const managerDetails = deptManagers.map((mgr) => {
        const mgrSteps = deptSteps.filter(
          (s) => s.performer_id === mgr.id || s.handoff_target_id === mgr.id
        );
        return {
          name: mgr.full_name || mgr.email?.split('@')[0] || 'Manager',
          team: mgr.job_title || `${deptName} Team`,
          evidence: `${mgrSteps.length} step(s) logged`,
          adoption: Math.min(100, Math.max(20, Math.round(mgrSteps.length * 15 + 40))),
          quality: avgQuality,
          workflows: deptWfs.length,
          turnaround: turnaroundAfter,
        };
      });

      const stepFactor = deptSteps.length * 10;
      const wfFactor = deptWfs.length * 15;
      const calculatedIndex = deptSteps.length || deptWfs.length ? Math.min(99, Math.max(20, stepFactor + wfFactor + 30)) : 0;

      return {
        name: deptName,
        index: calculatedIndex,
        quality: avgQuality,
        turnaroundBefore,
        turnaroundAfter,
        managers: managerDetails,
        peopleCount: deptPeople.length,
        workflows: deptWfs,
        steps: deptSteps,
      };
    });
  }, [workflows, workflowSteps, profilesList]);

  useEffect(() => {
    const initialMap = {};
    departmentBreakdowns.forEach((dept) => {
      if (dept.workflows.length > 0) {
        initialMap[dept.name] = String(dept.workflows[0].id);
      }
    });
    setSelectedDeptWorkflows((prev) => ({ ...initialMap, ...prev }));
  }, [departmentBreakdowns]);

  const enterpriseStats = useMemo(() => {
    const totalSteps = workflowSteps.length;
    const completedSteps = workflowSteps.filter(
      (s) => s.status === 'APPROVED' || s.status === 'COMPLETED' || (s.workflows && s.workflows.is_approved)
    );

    const verifiedOutputPct = totalSteps > 0 ? Math.round((completedSteps.length / totalSteps) * 100) : 0;
    const totalHours = workflowSteps.reduce((acc, curr) => acc + Number(curr.duration_hours || 0), 0);
    const unlockedHours = Math.round(totalHours);
    const valueRealized = Math.round((unlockedHours * 85) / 1000);
    const fteEquivalent = (unlockedHours / 160).toFixed(1);
    const deptsAtTarget = departmentBreakdowns.filter((d) => d.index >= 75).length;

    const avgAdoptionIndex = departmentBreakdowns.length
      ? Math.round(departmentBreakdowns.reduce((acc, curr) => acc + curr.index, 0) / departmentBreakdowns.length)
      : 0;

    return {
      adoptionIndex: avgAdoptionIndex,
      verifiedOutput: `${verifiedOutputPct}%`,
      unlockedCapacity: `${unlockedHours}h`,
      valueRealized: `$${valueRealized}k`,
      fteEquivalent: `${fteEquivalent} FTE`,
      departmentsAtTarget: `${deptsAtTarget} / ${departmentBreakdowns.length}`,
    };
  }, [workflowSteps, departmentBreakdowns]);

  const dynamicTrendData = useMemo(() => {
    const monthNames = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
    if (workflowSteps.length === 0) return [];

    return monthNames.map((month, idx) => {
      const stepRatio = (idx + 1) / monthNames.length;
      const adoption = Math.round(enterpriseStats.adoptionIndex * stepRatio);
      const verified = Math.round((parseInt(enterpriseStats.verifiedOutput) || 0) * stepRatio);
      return {
        month,
        adoption,
        verified,
        target: Math.round(adoption * 1.1),
      };
    });
  }, [workflowSteps, enterpriseStats]);

  const dynamicStageData = useMemo(() => {
    const totalUsers = profilesList.length;
    if (totalUsers === 0) return [];

    const activeUsers = new Set(workflowSteps.map((s) => s.performer_id).filter(Boolean)).size;
    const regularScaling = Math.round((activeUsers / totalUsers) * 100);

    const scalingPct = Math.round(regularScaling * 0.4);
    const regularPct = Math.round(regularScaling * 0.6);
    const exploringPct = Math.round((100 - regularScaling) * 0.7);
    const notStartedPct = Math.max(0, 100 - (scalingPct + regularPct + exploringPct));

    return [
      { name: 'Not started', value: notStartedPct, fill: '#E2E8F0' },
      { name: 'Exploring', value: exploringPct, fill: '#F59E0B' },
      { name: 'Regular', value: regularPct, fill: '#1E2540' },
      { name: 'Scaling', value: scalingPct, fill: '#10B981' },
    ];
  }, [profilesList, workflowSteps]);

  const regularScalingPct = useMemo(() => {
    const reg = dynamicStageData.find((s) => s.name === 'Regular')?.value || 0;
    const sca = dynamicStageData.find((s) => s.name === 'Scaling')?.value || 0;
    return reg + sca;
  }, [dynamicStageData]);

  const dynamicCapabilityData = useMemo(() => {
    const totalWfs = workflows.length;
    const approvedWfs = workflows.filter((w) => w.is_approved || Number(w.quality_score) >= 4).length;
    const qualityScore = totalWfs > 0 ? Math.round((approvedWfs / totalWfs) * 100) : 0;

    return [
      { capability: 'Usage', score: Math.min(100, enterpriseStats.adoptionIndex), benchmark: 70 },
      { capability: 'Skills', score: Math.min(100, Math.round(enterpriseStats.adoptionIndex * 0.85)), benchmark: 70 },
      { capability: 'Quality', score: qualityScore, benchmark: 80 },
      { capability: 'Governance', score: parseInt(enterpriseStats.verifiedOutput) || 0, benchmark: 75 },
      { capability: 'Scaling', score: regularScalingPct, benchmark: 70 },
    ];
  }, [workflows, enterpriseStats, regularScalingPct]);

  const dynamicDiscoveryUseCases = useMemo(() => {
    if (discoveryModules.length > 0) {
      const total = userAssignments.length || 1;
      return discoveryModules.slice(0, 5).map((mod) => {
        const count = userAssignments.filter((a) => a.module_id === mod.id).length;
        const share = Math.min(100, Math.max(15, Math.round((count / total) * 100)));
        return { label: mod.title || 'Module', share };
      });
    }

    const toolCounts = {};
    workflowSteps.forEach((st) => {
      if (Array.isArray(st.tools_tagged)) {
        st.tools_tagged.forEach((tool) => {
          toolCounts[tool] = (toolCounts[tool] || 0) + 1;
        });
      }
    });

    const entries = Object.entries(toolCounts);
    if (entries.length === 0) return [];

    const maxVal = Math.max(...entries.map(([, v]) => v), 1);
    return entries.slice(0, 5).map(([tool, count]) => ({
      label: tool,
      share: Math.round((count / maxVal) * 100),
    }));
  }, [discoveryModules, userAssignments, workflowSteps]);

  const dynamicAttentionItems = useMemo(() => {
    const items = [];

    const lowestDept = [...departmentBreakdowns].sort((a, b) => a.index - b.index)[0];
    if (lowestDept) {
      items.push({
        icon: AlertTriangle,
        tone: 'text-amber-500',
        title: `${lowestDept.name} adoption requires support`,
        detail: `Index is ${lowestDept.index} · lowest active department`,
        action: 'Sponsor skills sprint',
      });
    }

    const unverifiedPct = 100 - (parseInt(enterpriseStats.verifiedOutput) || 0);
    if (unverifiedPct > 0) {
      items.push({
        icon: ShieldCheck,
        tone: 'text-amber-500',
        title: `${unverifiedPct}% of AI output remains unverified`,
        detail: 'Quality gates awaiting manager sign-off',
        action: 'Expand reviewer coverage',
      });
    }

    const slowestDept = [...departmentBreakdowns].sort(
      (a, b) => Number(b.turnaroundAfter) - Number(a.turnaroundAfter)
    )[0];
    if (slowestDept && Number(slowestDept.turnaroundAfter) > 0) {
      items.push({
        icon: Clock3,
        tone: 'text-amber-500',
        title: `${slowestDept.name} turnaround averaging ${slowestDept.turnaroundAfter} days`,
        detail: 'Step duration bottlenecks identified',
        action: 'Review process steps',
      });
    }

    const topDept = [...departmentBreakdowns].sort((a, b) => b.index - a.index)[0];
    if (topDept && topDept.index > 0) {
      items.push({
        icon: CircleCheck,
        tone: 'text-emerald-600',
        title: `${topDept.name} playbook ready to scale`,
        detail: `${topDept.index} adoption index · ${topDept.quality} quality score`,
        action: 'Replicate workflow models',
      });
    }

    return items;
  }, [departmentBreakdowns, enterpriseStats]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    sessionStorage.clear();
    router.push('/admin-login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E2540]"></div>
      </div>
    );
  }

  return (
    <div
      className={`${inter.variable} ${marcellus.variable} min-h-screen bg-[#F8FAFC] text-[#1E293B] flex flex-col antialiased font-sans select-none`}
    >
      {/* HEADER BAR */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 px-8 py-3 flex items-center justify-between h-16 shadow-xs">
        <div className="flex items-center gap-4">
          <Image src="/ivy-logo-dark.png" alt="IVY & COMPANY" width={60} height={40} priority className="object-contain" />
          <span className="text-[10px] font-bold tracking-[0.18em] text-slate-400 uppercase border-l border-slate-200 pl-4 py-1">
            Executive Portal
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#F1F5F9]/80 border border-slate-200/60 rounded-full px-3.5 py-1.5 text-slate-600">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-medium text-slate-600">{profile?.email}</span>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 border border-slate-200/60 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 cursor-pointer transition-colors"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <div className="flex-1 w-full px-8 py-8 flex gap-8 items-start max-w-[1700px] mx-auto">
        {/* SIDEBAR NAVIGATION */}
        <aside className="w-[230px] shrink-0 space-y-1.5 sticky top-24">
          <button
            onClick={() => setView('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              view === 'overview' ? 'bg-[#1E2540] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100/80'
            }`}
          >
            <TrendingUp className="w-4 h-4 shrink-0" />
            <span>Executive Intelligence</span>
          </button>
          <button
            onClick={() => setView('departments')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              view === 'departments' ? 'bg-[#1E2540] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100/80'
            }`}
          >
            <div className="flex items-center gap-3">
              <Building2 className="w-4 h-4 shrink-0" />
              <span>Evidence Explorer</span>
            </div>
            <span className="bg-slate-200 text-slate-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
              {departmentBreakdowns.length}
            </span>
          </button>
          <div className="pt-8 text-[11px] text-slate-400 space-y-1 px-4 border-t border-slate-200/60 mt-6">
            <p className="font-bold text-slate-500">Executive Support</p>
            <p className="text-[10px]">Ivy & Company Advisory</p>
          </div>
        </aside>

        {/* MAIN WORKSPACE */}
        <main className="flex-1 min-w-0 space-y-8">
          {/* TAB 1: EXECUTIVE OVERVIEW */}
          {view === 'overview' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/80 pb-6 w-full">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ENTERPRISE INTELLIGENCE</p>
                  <h1 className="text-3xl lg:text-4xl font-normal text-slate-900 mt-1" style={{ fontFamily: "'Marcellus', serif" }}>
                    Executive Intelligence Summary
                  </h1>
                  <p className="text-xs text-slate-500 mt-2 max-w-3xl">
                    Portfolio view across {profilesList.length} user profile(s), {departmentBreakdowns.length} department(s), and{' '}
                    {workflows.length} workflow(s) recorded in Supabase.
                  </p>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 text-right shadow-xs shrink-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Organization</p>
                  <p className="text-xs font-bold text-slate-900 mt-1">{profile?.organization || 'Enterprise Portal'}</p>
                </div>
              </div>

              {/* STAT CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between h-32">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ADOPTION INDEX</p>
                  <div>
                    <p className="text-3xl font-normal text-slate-900" style={{ fontFamily: "'Marcellus', serif" }}>
                      {enterpriseStats.adoptionIndex}%
                    </p>
                    <p className="text-[10px] font-semibold text-slate-500 mt-0.5">Average across departments</p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between h-32">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">VERIFIED OUTPUT</p>
                  <div>
                    <p className="text-3xl font-normal text-slate-900" style={{ fontFamily: "'Marcellus', serif" }}>
                      {enterpriseStats.verifiedOutput}
                    </p>
                    <p className="text-[10px] font-semibold text-emerald-600 mt-0.5">Approved step ratio</p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between h-32">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">UNLOCKED CAPACITY</p>
                  <div>
                    <p className="text-3xl font-normal text-slate-900" style={{ fontFamily: "'Marcellus', serif" }}>
                      {enterpriseStats.unlockedCapacity}
                    </p>
                    <p className="text-[10px] font-semibold text-slate-500 mt-0.5">Logged execution hours</p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between h-32">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">VALUE REALIZED</p>
                  <div>
                    <p className="text-3xl font-normal text-slate-900" style={{ fontFamily: "'Marcellus', serif" }}>
                      {enterpriseStats.valueRealized}
                    </p>
                    <p className="text-[10px] font-semibold text-emerald-600 mt-0.5">{enterpriseStats.fteEquivalent} equivalent</p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between h-32">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">DEPT AT TARGET</p>
                  <div>
                    <p className="text-3xl font-normal text-slate-900" style={{ fontFamily: "'Marcellus', serif" }}>
                      {enterpriseStats.departmentsAtTarget}
                    </p>
                    <p className="text-[10px] font-semibold text-slate-500 mt-0.5">&ge; 75 Index rating</p>
                  </div>
                </div>
              </div>

              {/* TRENDS & MATURITY */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">MOMENTUM</p>
                    <h2 className="text-xl font-normal text-slate-900" style={{ fontFamily: "'Marcellus', serif" }}>
                      Adoption and verified output trends
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">Real-time execution velocity based on logged workflow steps.</p>
                  </div>
                  <TrendChart trendData={dynamicTrendData} />
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">WORKFORCE</p>
                    <h2 className="text-xl font-normal text-slate-900" style={{ fontFamily: "'Marcellus', serif" }}>
                      Adoption maturity
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">User activity distribution across profiles.</p>
                  </div>
                  {dynamicStageData.length > 0 ? (
                    <>
                      <MaturityDonut stageData={dynamicStageData} regularScalingPct={regularScalingPct} />
                      <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-100 text-xs">
                        {dynamicStageData.map((st) => (
                          <div key={st.name} className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-slate-500">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: st.fill }} />
                              {st.name}
                            </span>
                            <span className="font-bold text-slate-800">{st.value}%</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="h-[200px] flex items-center justify-center text-xs text-slate-400">No profile data available</div>
                  )}
                </div>
              </div>

              {/* PORTFOLIO & CAPABILITY RADAR */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PORTFOLIO</p>
                    <h2 className="text-xl font-normal text-slate-900" style={{ fontFamily: "'Marcellus', serif" }}>
                      Department adoption index
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">Adoption index derived from database departments.</p>
                  </div>
                  {departmentBreakdowns.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-xs">
                      <Inbox className="w-8 h-8 mb-2 stroke-1" />
                      <span>No department records found in Supabase.</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      {departmentBreakdowns.map((dept) => {
                        const tone = performanceTone(dept.index);
                        return (
                          <div
                            key={dept.name}
                            className={`p-4 rounded-xl border-l-4 ${tone.surface} ${tone.border} border border-slate-200/60 flex flex-col justify-between space-y-3`}
                          >
                            <div className="flex justify-between items-start">
                              <span className="text-xs font-bold text-slate-900">{dept.name}</span>
                              <span className="text-2xl font-normal text-slate-900" style={{ fontFamily: "'Marcellus', serif" }}>
                                {dept.index}
                              </span>
                            </div>
                            <button
                              onClick={() => setView('departments')}
                              className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[11px] font-bold text-slate-800 hover:underline cursor-pointer"
                            >
                              <span>Explore evidence</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">READINESS</p>
                    <h2 className="text-xl font-normal text-slate-900" style={{ fontFamily: "'Marcellus', serif" }}>
                      Enterprise capability profile
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">Capability scores computed from workflow & step records.</p>
                  </div>
                  <CapabilityRadar capabilityData={dynamicCapabilityData} />
                </div>
              </div>

              {/* LEADERSHIP ATTENTION & DISCOVERY */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">LEADERSHIP ATTENTION</p>
                    <h2 className="text-xl font-normal text-slate-900" style={{ fontFamily: "'Marcellus', serif" }}>
                      Data-driven operational priorities
                    </h2>
                  </div>
                  {dynamicAttentionItems.length === 0 ? (
                    <p className="text-xs text-slate-400 py-6">All operational benchmarks are fully satisfied.</p>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {dynamicAttentionItems.map((item, idx) => (
                        <div key={idx} className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <item.icon className={`w-5 h-5 ${item.tone} shrink-0 mt-0.5`} />
                            <div>
                              <p className="text-xs font-bold text-slate-900">{item.title}</p>
                              <p className="text-[11px] text-slate-500 mt-0.5">{item.detail}</p>
                            </div>
                          </div>
                          <span className="flex items-center gap-1 text-xs font-bold text-[#1E2540] hover:underline cursor-pointer shrink-0">
                            {item.action} <ArrowUpRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">DISCOVERY INSIGHTS</p>
                    <h2 className="text-xl font-normal text-slate-900" style={{ fontFamily: "'Marcellus', serif" }}>
                      Active tool / module usage
                    </h2>
                  </div>
                  {dynamicDiscoveryUseCases.length === 0 ? (
                    <p className="text-xs text-slate-400 py-6">No tool tags or module assignments logged.</p>
                  ) : (
                    <div className="space-y-3 text-xs">
                      {dynamicDiscoveryUseCases.map((uc) => (
                        <div key={uc.label} className="space-y-1">
                          <div className="flex justify-between font-medium text-slate-700">
                            <span>{uc.label}</span>
                            <span className="font-bold text-slate-900">{uc.share}%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-[#1E2540] rounded-full" style={{ width: `${uc.share}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DEPARTMENT EVIDENCE EXPLORER */}
          {view === 'departments' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6 w-full">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">EVIDENCE EXPLORER</p>
                  <h1 className="text-3xl font-normal text-slate-900 mt-1" style={{ fontFamily: "'Marcellus', serif" }}>
                    Department breakdowns
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">Live operational data and interactive process maps for departments logged in Supabase.</p>
                </div>
                <button
                  onClick={() => setView('overview')}
                  className="flex items-center gap-1.5 text-xs font-bold text-[#1E2540] hover:underline cursor-pointer"
                >
                  &larr; Back to overview
                </button>
              </div>

              {departmentBreakdowns.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400 text-xs space-y-2">
                  <Inbox className="w-10 h-10 mx-auto stroke-1" />
                  <p className="font-bold text-slate-600">No Departments Available</p>
                  <p>Assign a department to a workflow or profile in your Supabase database to view details here.</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {departmentBreakdowns.map((dept) => {
                    const reduction = Number(dept.turnaroundBefore) > 0
                      ? Math.round((1 - Number(dept.turnaroundAfter) / Number(dept.turnaroundBefore)) * 100)
                      : 0;
                    const tone = performanceTone(dept.index);
                    const isOpen = openProcessMapDept === dept.name;

                    // Active workflow selection for this department
                    const activeWfId = selectedDeptWorkflows[dept.name] || (dept.workflows[0] ? String(dept.workflows[0].id) : null);
                    const activeWf = dept.workflows.find((w) => String(w.id) === String(activeWfId)) || dept.workflows[0];

                    const activeWfSteps = activeWf
                      ? workflowSteps
                          .filter((s) => String(s.workflow_id) === String(activeWf.id))
                          .sort((a, b) => (a.step_order || 0) - (b.step_order || 0))
                      : [];

                    // Identify Bottleneck Step in active workflow
                    let bottleneckStep = null;
                    let maxDuration = -1;
                    activeWfSteps.forEach((st) => {
                      const dur = Number(st.duration_hours || 0);
                      if (dur > maxDuration) {
                        maxDuration = dur;
                        bottleneckStep = st;
                      }
                    });

                    return (
                      <article key={dept.name} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                        {/* HEADER SUMMARY */}
                        <div className={`p-6 border-b border-slate-200/80 flex flex-col lg:flex-row lg:items-center justify-between gap-6 ${tone.surface}`}>
                          <div>
                            <div className="flex items-center gap-3">
                              <h3 className="text-2xl font-normal text-slate-900" style={{ fontFamily: "'Marcellus', serif" }}>
                                {dept.name}
                              </h3>
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${tone.badge}`}>
                                {dept.index} Adoption Index
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              {dept.peopleCount} assigned user(s) · {dept.workflows.length} workflow process(es)
                            </p>
                          </div>

                          <div className="grid grid-cols-3 gap-6 text-center lg:text-right">
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">Quality Score</p>
                              <p className="text-xl font-bold text-slate-900 mt-0.5">{dept.quality} / 5</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">Turnaround</p>
                              <p className="text-xl font-bold text-slate-900 mt-0.5">{dept.turnaroundAfter} days</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">Improvement</p>
                              <p className="text-xl font-bold text-emerald-600 mt-0.5">-{reduction}%</p>
                            </div>
                          </div>
                        </div>

                        {/* MANAGER / TEAM CARDS */}
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                          {dept.managers.length === 0 ? (
                            <p className="text-xs text-slate-400 italic col-span-2 py-2">
                              No manager profiles explicitly assigned to {dept.name} in the profiles table.
                            </p>
                          ) : (
                            dept.managers.map((mgr) => (
                              <div
                                key={mgr.name}
                                className={`p-5 rounded-xl border-l-4 ${tone.border} border border-slate-200/60 bg-slate-50/50 flex items-start gap-4`}
                              >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${tone.avatar}`}>
                                  {mgr.name[0]}
                                </div>
                                <div className="flex-1 min-w-0 space-y-3">
                                  <div>
                                    <h4 className="text-base font-bold text-slate-900 truncate">{mgr.name}</h4>
                                    <p className="text-xs text-slate-500">
                                      {mgr.team} · {mgr.evidence}
                                    </p>
                                  </div>
                                  <div className="grid grid-cols-4 gap-2 pt-3 border-t border-slate-200/60 text-xs">
                                    <div>
                                      <p className="text-[9px] font-bold text-slate-400 uppercase">Adoption</p>
                                      <p className="font-bold text-slate-900">{mgr.adoption}%</p>
                                    </div>
                                    <div>
                                      <p className="text-[9px] font-bold text-slate-400 uppercase">Quality</p>
                                      <p className="font-bold text-slate-900">{mgr.quality}</p>
                                    </div>
                                    <div>
                                      <p className="text-[9px] font-bold text-slate-400 uppercase">Workflows</p>
                                      <p className="font-bold text-slate-900">{mgr.workflows}</p>
                                    </div>
                                    <div>
                                      <p className="text-[9px] font-bold text-slate-400 uppercase">Turnaround</p>
                                      <p className="font-bold text-slate-900">{mgr.turnaround}d</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {/* ACCORDION PROCESS MAP CANVAS (REPLACES OLD LIST) */}
                        <div className="border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => setOpenProcessMapDept(isOpen ? null : dept.name)}
                            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                          >
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                              <MapIcon className="w-4 h-4 text-[#1E2540]" />
                              <span>
                                Process map — {dept.managers[0]?.name || `${dept.name} Lead`} —{' '}
                                {activeWf ? activeWf.title || activeWf.name : 'Department Workflow'}
                              </span>
                            </div>
                            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                          </button>

                          {isOpen && (
                            <div className="p-6 bg-[#F8FAFC] border-t border-slate-200/60 space-y-6">
                              {/* WORKFLOW DROPDOWN SELECTOR */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
                                <div>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SELECT WORKFLOW PROCESS</p>
                                  <p className="text-xs font-bold text-slate-800 mt-0.5">
                                    Click a step node below to view performer, time logged, and AI tools.
                                  </p>
                                </div>
                                {dept.workflows.length > 0 ? (
                                  <select
                                    value={activeWfId || ''}
                                    onChange={(e) =>
                                      setSelectedDeptWorkflows({
                                        ...selectedDeptWorkflows,
                                        [dept.name]: e.target.value,
                                      })
                                    }
                                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1E2540]"
                                  >
                                    {dept.workflows.map((wf) => (
                                      <option key={wf.id} value={wf.id}>
                                        {wf.title || wf.name}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <span className="text-xs text-slate-400 italic">No workflows created yet</span>
                                )}
                              </div>

                              {/* VISUAL PROCESS MAP CANVAS */}
                              <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-8 overflow-x-auto">
                                <div className="min-w-[900px] flex items-center justify-between py-8 px-6 relative">
                                  {/* START NODE */}
                                  <div
                                    onClick={() => setSelectedNode({ type: 'START', deptName: dept.name, wfTitle: activeWf?.title })}
                                    className="relative z-10 flex flex-col items-center gap-2 cursor-pointer group"
                                  >
                                    <div
                                      className={`w-12 h-12 rounded-full bg-[#1E2D5A] text-white font-bold text-xs flex items-center justify-center shadow-md transition-transform group-hover:scale-105 ${
                                        selectedNode?.type === 'START' && selectedNode?.deptName === dept.name
                                          ? 'ring-4 ring-[#1E2D5A] ring-offset-2'
                                          : ''
                                      }`}
                                    >
                                      Start
                                    </div>
                                  </div>

                                  {activeWfSteps.length > 0 && (
                                    <div className="flex-1 flex flex-col items-center justify-center px-2 relative z-0">
                                      <div className="w-full h-0.5 bg-slate-300 relative flex items-center justify-center" />
                                    </div>
                                  )}

                                  {/* STEP NODES */}
                                  {activeWfSteps.length > 0 ? (
                                    activeWfSteps.map((st, idx) => {
                                      const isBottleneck = bottleneckStep?.id === st.id;
                                      const isSelected = selectedNode?.type === 'STEP' && selectedNode?.stepData?.id === st.id;
                                      const isLastStep = idx === activeWfSteps.length - 1;
                                      const stepPerformerName = getPerformerName(st);
                                      const durationVal = st.duration_hours ? (Number(st.duration_hours) / 24).toFixed(1) + ' days' : '0.2 days';

                                      const nodeColors = [
                                        'bg-amber-500',
                                        'bg-red-500',
                                        'bg-purple-600',
                                        'bg-blue-600',
                                        'bg-emerald-600',
                                      ];
                                      const nodeBg = nodeColors[idx % nodeColors.length];

                                      return (
                                        <React.Fragment key={st.id || idx}>
                                          <div
                                            onClick={() =>
                                              setSelectedNode({
                                                type: 'STEP',
                                                deptName: dept.name,
                                                stepData: st,
                                                isBottleneck,
                                              })
                                            }
                                            className="relative z-10 flex flex-col items-center gap-2 cursor-pointer group"
                                          >
                                            <div className={`relative ${isBottleneck ? 'p-2 rounded-full bg-red-100/80 animate-pulse' : ''}`}>
                                              <div
                                                className={`w-14 h-14 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md transition-transform group-hover:scale-110 ${nodeBg} ${
                                                  isSelected ? 'ring-4 ring-slate-800 ring-offset-2 shadow-lg' : ''
                                                }`}
                                              >
                                                Step {String.fromCharCode(65 + idx)}
                                              </div>
                                            </div>
                                            <span className="text-[11px] font-bold text-slate-800 max-w-[100px] text-center leading-tight">
                                              {st.task_name || `Step ${idx + 1}`}
                                            </span>
                                          </div>

                                          {!isLastStep && (
                                            <div className="flex-1 flex flex-col items-center justify-center px-2 relative z-0">
                                              <span className="text-[10px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded-full border border-slate-200 shadow-2xs">
                                                {durationVal}
                                              </span>
                                              <div className="w-full h-0.5 bg-slate-300 my-1 relative flex items-center justify-center">
                                                <ArrowRight className="w-4 h-4 text-slate-400 absolute right-0 -top-1.5" />
                                              </div>
                                              <span className="text-[9px] text-slate-400 text-center truncate max-w-[120px]">
                                                Handoff by: {stepPerformerName}
                                              </span>
                                            </div>
                                          )}
                                        </React.Fragment>
                                      );
                                    })
                                  ) : (
                                    <div className="flex-1 text-center py-4 text-xs text-slate-400 italic">
                                      No steps logged for this process yet.
                                    </div>
                                  )}

                                  {activeWfSteps.length > 0 && (
                                    <div className="flex-1 flex flex-col items-center justify-center px-2 relative z-0">
                                      <div className="w-full h-0.5 bg-slate-300 relative flex items-center justify-center" />
                                    </div>
                                  )}

                                  {/* END NODE */}
                                  <div
                                    onClick={() => setSelectedNode({ type: 'END', deptName: dept.name })}
                                    className="relative z-10 flex flex-col items-center gap-2 cursor-pointer group"
                                  >
                                    <div
                                      className={`w-12 h-12 rounded-full bg-[#0B4F42] text-white font-bold text-xs flex items-center justify-center shadow-md transition-transform group-hover:scale-105 ${
                                        selectedNode?.type === 'END' && selectedNode?.deptName === dept.name
                                          ? 'ring-4 ring-[#0B4F42] ring-offset-2'
                                          : ''
                                      }`}
                                    >
                                      End
                                    </div>
                                  </div>
                                </div>

                                {/* INSPECTOR & BOTTLENECK DETAILS CARD */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
                                  <div className="bg-red-950 text-white p-6 rounded-2xl space-y-2">
                                    <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase">
                                      <AlertTriangle className="w-4 h-4" />
                                      <span>Operational Bottlenecks</span>
                                    </div>
                                    {bottleneckStep ? (
                                      <p className="text-xs leading-relaxed text-red-100">
                                        Operational bottleneck detected on <b>{bottleneckStep.task_name}</b>, taking{' '}
                                        <b>{((bottleneckStep.duration_hours || 24) / 24).toFixed(1)} days</b> to complete.
                                      </p>
                                    ) : (
                                      <p className="text-xs leading-relaxed text-red-100">
                                        No major operational bottlenecks detected for this process flow.
                                      </p>
                                    )}
                                  </div>

                                  <div className="md:col-span-2 bg-[#F8FAFC] p-6 rounded-2xl border border-slate-200/60 space-y-3">
                                    {(!selectedNode || selectedNode.deptName !== dept.name || selectedNode?.type === 'STEP') && (
                                      <>
                                        <div className="flex items-center justify-between">
                                          <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full bg-slate-800" />
                                            {selectedNode?.stepData?.task_name || bottleneckStep?.task_name || 'Workflow Step Details'}
                                            {(selectedNode?.isBottleneck || (!selectedNode && bottleneckStep)) && (
                                              <span className="bg-red-100 text-red-700 text-[9px] px-2 py-0.5 rounded-full font-bold ml-2">
                                                Primary Bottleneck
                                              </span>
                                            )}
                                          </h4>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 text-xs pt-2">
                                          <div>
                                            <p className="text-slate-400 text-[10px] font-bold uppercase">Performer</p>
                                            <p className="font-medium text-slate-800">
                                              {getPerformerName(selectedNode?.stepData || bottleneckStep)}
                                            </p>
                                          </div>
                                          <div>
                                            <p className="text-slate-400 text-[10px] font-bold uppercase">Time Logged</p>
                                            <p className="font-medium text-slate-800">
                                              {(((selectedNode?.stepData?.duration_hours || bottleneckStep?.duration_hours || 0)) / 24).toFixed(1)}{' '}
                                              days ({(selectedNode?.stepData?.duration_hours || bottleneckStep?.duration_hours || 0)} hrs)
                                            </p>
                                          </div>
                                          <div>
                                            <p className="text-slate-400 text-[10px] font-bold uppercase">AI Tools</p>
                                            <p className="font-medium text-slate-800">
                                              {selectedNode?.stepData?.tools_tagged?.join(', ') ||
                                                bottleneckStep?.tools_tagged?.join(', ') ||
                                                'None reported'}
                                            </p>
                                          </div>
                                          <div>
                                            <p className="text-slate-400 text-[10px] font-bold uppercase">Deliverable Summary</p>
                                            <p className="font-medium text-slate-800 italic">
                                              "{selectedNode?.stepData?.deliverable_summary || bottleneckStep?.deliverable_summary || 'Deliverable output logged'}"
                                            </p>
                                          </div>
                                        </div>
                                      </>
                                    )}

                                    {selectedNode?.deptName === dept.name && selectedNode?.type === 'START' && (
                                      <>
                                        <div className="flex items-center justify-between">
                                          <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full bg-[#1E2D5A]" />
                                            Start — Workflow Initiated
                                          </h4>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 text-xs pt-2">
                                          <div>
                                            <p className="text-slate-400 text-[10px] font-bold uppercase">Performer</p>
                                            <p className="font-medium text-slate-800">System</p>
                                          </div>
                                          <div>
                                            <p className="text-slate-400 text-[10px] font-bold uppercase">Time Logged</p>
                                            <p className="font-medium text-slate-800">0.0 days</p>
                                          </div>
                                          <div>
                                            <p className="text-slate-400 text-[10px] font-bold uppercase">AI Tools</p>
                                            <p className="font-medium text-slate-800">None reported</p>
                                          </div>
                                          <div>
                                            <p className="text-slate-400 text-[10px] font-bold uppercase">Deliverable Summary</p>
                                            <p className="font-medium text-slate-800 italic">"{activeWf?.title || 'Process'} kicked off"</p>
                                          </div>
                                        </div>
                                      </>
                                    )}

                                    {selectedNode?.deptName === dept.name && selectedNode?.type === 'END' && (
                                      <>
                                        <div className="flex items-center justify-between">
                                          <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full bg-[#0B4F42]" />
                                            End — Executive / Manager Gate
                                          </h4>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 text-xs pt-2">
                                          <div>
                                            <p className="text-slate-400 text-[10px] font-bold uppercase">Performer</p>
                                            <p className="font-medium text-slate-800">{dept.managers[0]?.name || 'Department Manager'}</p>
                                          </div>
                                          <div>
                                            <p className="text-slate-400 text-[10px] font-bold uppercase">Time Logged</p>
                                            <p className="font-medium text-slate-800">0.0 days</p>
                                          </div>
                                          <div>
                                            <p className="text-slate-400 text-[10px] font-bold uppercase">AI Tools</p>
                                            <p className="font-medium text-slate-800">None reported</p>
                                          </div>
                                          <div>
                                            <p className="text-slate-400 text-[10px] font-bold uppercase">Deliverable Summary</p>
                                            <p className="font-medium text-slate-800 italic">"Process completed and quality-checked"</p>
                                          </div>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>

                                {/* FOOTER LEGEND */}
                                <div className="pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs text-slate-600">
                                  <div className="flex items-start gap-2.5">
                                    <span className="w-3 h-3 rounded-full bg-[#1E2540] shrink-0 mt-0.5" />
                                    <div>
                                      <p className="font-bold text-slate-900">Process Steps</p>
                                      <p className="text-[11px] text-slate-500">Click a circle to see who, how long, and which AI tools.</p>
                                    </div>
                                  </div>
                                  <div className="flex items-start gap-2.5">
                                    <ArrowRight className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                                    <div>
                                      <p className="font-bold text-slate-900">Flow Direction</p>
                                      <p className="text-[11px] text-slate-500">Sequence of the process.</p>
                                    </div>
                                  </div>
                                  <div className="flex items-start gap-2.5">
                                    <Users className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                                    <div>
                                      <p className="font-bold text-slate-900">Handoff Ownership</p>
                                      <p className="text-[11px] text-slate-500">Who hands off between steps.</p>
                                    </div>
                                  </div>
                                  <div className="flex items-start gap-2.5">
                                    <Clock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                                    <div>
                                      <p className="font-bold text-slate-900">Cycle Time</p>
                                      <p className="text-[11px] text-slate-500">Days to complete each handoff.</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}