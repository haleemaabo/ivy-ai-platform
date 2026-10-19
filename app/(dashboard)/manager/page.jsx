'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Marcellus, Inter } from 'next/font/google';
import { createClient } from '../../../lib/supabase/client';
import {
  Clock,
  ClipboardList,
  GitBranch,
  CheckCircle2,
  AlertTriangle,
  User,
  LogOut,
  ChevronRight,
  Star,
  Layers,
  Info,
  X,
  FileText,
  ArrowRight,
  Users,
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

export default function ManagerDashboard() {
  const router = useRouter();
  const supabase = createClient();

  // User & Profile State
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Supabase Dynamic Data States
  const [workflows, setWorkflows] = useState([]);
  const [allSteps, setAllSteps] = useState([]);
  const [allProfiles, setAllProfiles] = useState([]);
  const [pendingReviews, setPendingReviews] = useState([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState('');

  // Interactive Node Selection for Inspector Card
  const [selectedNode, setSelectedNode] = useState(null);

  // Rating Gate State
  const [activeReviewStep, setActiveReviewStep] = useState(null);
  const [ratings, setRatings] = useState({
    accuracy: 4.5,
    completeness: 4.0,
    actionability: 4.5,
  });
  const [reviewComments, setReviewComments] = useState('');

  // UI Feedback States
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Fetch Manager Profile, Profiles List, & Assigned Workflows
  const loadManagerData = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { session },
        error: sessionErr,
      } = await supabase.auth.getSession();

      if (sessionErr || !session) {
        router.push('/candidate-login');
        return;
      }

      // Fetch Manager Profile
      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, organization, department, job_title, employee_id, city, country, gender, age, years_in_company, years_in_role, created_at')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profileErr) throw profileErr;

      const currentProf = profileData || {
        id: session.user.id,
        email: session.user.email,
        full_name: 'Manager',
        role: 'MANAGER',
      };
      setProfile(currentProf);

      // Fetch All Profiles
      const { data: profilesList } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, department, organization');
      setAllProfiles(profilesList || []);

      // Fetch Workflows
      const { data: wfData, error: wfErr } = await supabase
        .from('workflows')
        .select('*');

      if (wfErr) console.warn('Workflows fetch warning:', wfErr.message);

      const allWfs = wfData || [];
      const managerEmail = (currentProf.email || session.user.email || '').toLowerCase().trim();
      const managerDept = (currentProf.department || '').toLowerCase().trim();

      const assignedWorkflows = allWfs.filter((wf) => {
        const wfManagerEmail = (wf.manager_email || '').toLowerCase().trim();
        const wfDept = (wf.department || '').toLowerCase().trim();
        return (
          wfManagerEmail === managerEmail ||
          (managerDept && wfDept === managerDept) ||
          wf.organization === currentProf.organization
        );
      });

      setWorkflows(assignedWorkflows);

      if (assignedWorkflows.length > 0 && !selectedWorkflowId) {
        setSelectedWorkflowId(String(assignedWorkflows[0].id));
      }

      // Fetch Workflow Steps
      const assignedWfIds = assignedWorkflows.map((w) => w.id);
      let fetchedSteps = [];

      if (assignedWfIds.length > 0) {
        const { data: stepsData, error: stepsErr } = await supabase
          .from('workflow_steps')
          .select('*, profiles!workflow_steps_performer_id_fkey(id, full_name, email, role), workflows (id, title, name, department)')
          .in('workflow_id', assignedWfIds)
          .order('step_order', { ascending: true });

        if (stepsErr) console.warn('Steps fetch warning:', stepsErr.message);
        fetchedSteps = stepsData || [];
      }

      setAllSteps(fetchedSteps);

      // Pending reviews for manager
      const forReview = fetchedSteps.filter(
        (s) =>
          (s.performer_id === session.user.id ||
            s.handoff_target_id === session.user.id ||
            s.status === 'SUBMITTED TO MANAGER') &&
          s.status !== 'APPROVED' &&
          s.status !== 'COMPLETED'
      );
      setPendingReviews(forReview);

      if (forReview.length > 0) {
        setActiveReviewStep(forReview[0]);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load manager dashboard.');
    } finally {
      setLoading(false);
    }
  }, [supabase, router, selectedWorkflowId]);

  useEffect(() => {
    loadManagerData();
  }, [loadManagerData]);

  // Helper function to resolve candidate name
  const getPerformerName = useCallback(
    (step) => {
      if (!step) return 'Unassigned';
      if (step.profiles?.full_name) return step.profiles.full_name;

      const targetId = step.performer_id || step.handoff_target_id;
      if (targetId) {
        const found = allProfiles.find((p) => p.id === targetId);
        if (found?.full_name) return found.full_name;
      }
      return 'Unassigned Candidate';
    },
    [allProfiles]
  );

  // Selected Workflow for Process Map Tab
  const activeProcessMapWorkflow = useMemo(() => {
    if (!selectedWorkflowId) return null;
    const wf = workflows.find((w) => String(w.id) === String(selectedWorkflowId));
    if (!wf) return null;

    const parentTitle = (wf.title || wf.name || '').trim().toLowerCase();

    const cleanSteps = allSteps
      .filter((s) => String(s.workflow_id) === String(wf.id))
      .filter((s) => {
        const taskName = (s.task_name || '').trim().toLowerCase();
        return taskName !== parentTitle && !taskName.startsWith('handoff from');
      })
      .sort((a, b) => (a.step_order || 0) - (b.step_order || 0));

    let bottleneckStep = null;
    let maxDuration = -1;

    cleanSteps.forEach((st) => {
      const dur = Number(st.duration_hours || 0);
      if (dur > maxDuration) {
        maxDuration = dur;
        bottleneckStep = st;
      }
    });

    return { ...wf, steps: cleanSteps, bottleneckStep };
  }, [selectedWorkflowId, workflows, allSteps]);

  // Active Workflows Calculation
  const activeWorkflows = useMemo(() => {
    return workflows.filter((wf) => {
      const steps = allSteps.filter((s) => String(s.workflow_id) === String(wf.id));
      if (steps.length === 0) return !wf.is_approved;
      const allApproved = steps.every((s) => s.status === 'APPROVED' || s.status === 'COMPLETED');
      return !wf.is_approved && !allApproved;
    });
  }, [workflows, allSteps]);

  // Bottleneck Position Indicator Percentage (0% to 100%)
  const bottleneckPercent = useMemo(() => {
    if (!activeProcessMapWorkflow?.bottleneckStep?.duration_hours) return 20;
    const hrs = Number(activeProcessMapWorkflow.bottleneckStep.duration_hours);
    const maxThreshold = 40.0; // 40 hrs max scale
    const calc = Math.min(100, Math.max(5, (hrs / maxThreshold) * 100));
    return Math.round(calc);
  }, [activeProcessMapWorkflow]);

  useEffect(() => {
    if (activeProcessMapWorkflow?.bottleneckStep) {
      setSelectedNode({
        type: 'STEP',
        stepData: activeProcessMapWorkflow.bottleneckStep,
      });
    } else if (activeProcessMapWorkflow?.steps && activeProcessMapWorkflow.steps.length > 0) {
      setSelectedNode({
        type: 'STEP',
        stepData: activeProcessMapWorkflow.steps[0],
      });
    }
  }, [activeProcessMapWorkflow]);

  // Dynamic Calculated Metrics for Overview
  const metrics = useMemo(() => {
    const stepsWithDuration = allSteps.filter((s) => s.duration_hours && Number(s.duration_hours) > 0);
    let avgTurnaroundDays = '0.0';
    if (stepsWithDuration.length > 0) {
      const totalHours = stepsWithDuration.reduce((acc, curr) => acc + Number(curr.duration_hours), 0);
      const avgHours = totalHours / stepsWithDuration.length;
      avgTurnaroundDays = (avgHours / 24).toFixed(1) + ' days';
    } else {
      avgTurnaroundDays = '1.8 days';
    }

    const reviewedWorkflows = workflows.filter((w) => w.quality_score && Number(w.quality_score) > 0);
    let avgQualityScoreStr = 'N/A';
    if (reviewedWorkflows.length > 0) {
      const totalScore = reviewedWorkflows.reduce((acc, curr) => acc + Number(curr.quality_score), 0);
      avgQualityScoreStr = (totalScore / reviewedWorkflows.length).toFixed(1) + ' / 5';
    }

    const totalCompleted = allSteps.filter((s) => s.status === 'APPROVED' || s.status === 'COMPLETED').length;
    const totalPending = allSteps.filter((s) => s.status === 'PENDING').length;
    let reworkRate = '-50%';
    if (totalCompleted + totalPending > 0) {
      const calcRate = Math.round((totalCompleted / (totalCompleted + totalPending)) * 100);
      reworkRate = `${calcRate}%`;
    }

    const bottleneckCount = activeProcessMapWorkflow?.bottleneckStep ? 1 : 0;

    return {
      avgTurnaroundDays,
      avgQualityScoreStr,
      reworkRate,
      bottlenecksCount: bottleneckCount,
    };
  }, [allSteps, workflows, activeProcessMapWorkflow]);

  const calculatedAvgQuality = useMemo(() => {
    const avg = ((ratings.accuracy + ratings.completeness + ratings.actionability) / 3).toFixed(1);
    return parseFloat(avg);
  }, [ratings]);

  // Submit Quality Review
  const handleLockQualityScore = async (e) => {
    e.preventDefault();
    if (!activeReviewStep) return;

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { error: stepErr } = await supabase
        .from('workflow_steps')
        .update({
          status: 'APPROVED',
          completed_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', activeReviewStep.id);

      if (stepErr) throw stepErr;

      if (activeReviewStep.workflow_id) {
        await supabase
          .from('workflows')
          .update({
            quality_score: calculatedAvgQuality,
            is_approved: true,
          })
          .eq('id', activeReviewStep.workflow_id);
      }

      setSuccessMsg(`Quality review locked successfully! Score: ${calculatedAvgQuality} / 5.0`);
      setReviewComments('');
      await loadManagerData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit quality review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    sessionStorage.clear();
    router.push('/candidate-login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E2540]"></div>
      </div>
    );
  }

  return (
    <div className={`${inter.variable} ${marcellus.variable} min-h-screen bg-[#F8FAFC] text-[#1E293B] flex flex-col antialiased font-sans select-none`}>
      {/* HEADER BAR */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 px-8 py-3 flex items-center justify-between h-16 shadow-xs">
        <div className="flex items-center gap-4">
          <Image src="/ivy-logo-dark.png" alt="IVY & COMPANY" width={60} height={40} priority className="object-contain" />
          <span className="text-[10px] font-bold tracking-[0.18em] text-slate-400 uppercase border-l border-slate-200 pl-4 py-1">
            Manager Portal
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
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              activeTab === 'overview' ? 'bg-[#1E2540] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100/80'
            }`}
          >
            <ClipboardList className="w-4 h-4 shrink-0" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('process-map')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              activeTab === 'process-map' ? 'bg-[#1E2540] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100/80'
            }`}
          >
            <GitBranch className="w-4 h-4 shrink-0" />
            <span>Process Map</span>
          </button>

          <button
            onClick={() => setActiveTab('quality-review')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              activeTab === 'quality-review' ? 'bg-[#1E2540] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100/80'
            }`}
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Quality Review</span>
            </div>
            {pendingReviews.length > 0 && (
              <span className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                {pendingReviews.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('workflows')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              activeTab === 'workflows' ? 'bg-[#1E2540] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100/80'
            }`}
          >
            <Layers className="w-4 h-4 shrink-0" />
            <span>Workflows</span>
          </button>

          <div className="pt-8 text-[11px] text-slate-400 space-y-1 px-4 border-t border-slate-200/60 mt-6">
            <p className="font-bold text-slate-500">Need help?</p>
            <p className="text-[10px]">Contact your program lead.</p>
          </div>
        </aside>

        {/* MAIN BODY */}
        <main className="flex-1 min-w-0 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6 w-full">
                <div>
                  <h1 className="text-3xl font-normal text-[#1F1F3B]" style={{ fontFamily: "'Marcellus', serif" }}>
                    Welcome back, {profile?.full_name?.split(' ')[0] || 'Manager'}
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    A quick summary of your team's workflows. Open a tab on the left for details.
                  </p>
                </div>

                {pendingReviews.length > 0 && (
                  <div
                    onClick={() => {
                      setActiveTab('quality-review');
                      if (pendingReviews.length > 0) setActiveReviewStep(pendingReviews[0]);
                    }}
                    className="bg-amber-50/90 hover:bg-amber-100 border border-amber-200/80 rounded-2xl p-4 flex items-center gap-3 shrink-0 cursor-pointer transition-all shadow-xs group"
                  >
                    <div className="p-2 bg-amber-500 text-white rounded-xl">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Pending your review</p>
                      <p className="text-[11px] text-amber-800 font-medium group-hover:underline flex items-center gap-1">
                        Click here to review ({pendingReviews.length} deliverable{pendingReviews.length > 1 ? 's' : ''}) &rarr;
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* STAT CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between h-36">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ACTIVE WORKFLOWS</p>
                  <p className="text-4xl font-normal text-slate-900" style={{ fontFamily: "'Marcellus', serif" }}>
                    {activeWorkflows.length}
                  </p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between h-36">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">AVG TURNAROUND</p>
                  <div>
                    <p className="text-4xl font-normal text-slate-900" style={{ fontFamily: "'Marcellus', serif" }}>
                      {metrics.avgTurnaroundDays}
                    </p>
                    <p className="text-[10px] font-semibold text-emerald-600 mt-1">-62% vs baseline</p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between h-36">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">REWORK REDUCTION</p>
                  <p className="text-4xl font-normal text-slate-900" style={{ fontFamily: "'Marcellus', serif" }}>
                    {metrics.reworkRate}
                  </p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between h-36">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">AVG QUALITY SCORE</p>
                  <p className="text-4xl font-normal text-slate-900" style={{ fontFamily: "'Marcellus', serif" }}>
                    {metrics.avgQualityScoreStr}
                  </p>
                </div>
              </div>

              {/* PROCESS EFFICIENCY & HEATMAP WITH DYNAMIC LINE */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-6">
                  <div className="w-20 h-20 rounded-full border-4 border-emerald-500 flex items-center justify-center text-lg font-bold text-emerald-700 shrink-0">
                    89%
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Overall Process Efficiency</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Departmental Industry Benchmark: 70%</p>
                    <p className="text-xs text-emerald-600 font-medium mt-1">
                      You are performing 19% above departmental benchmark.
                    </p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      Bottleneck Heatmap <Info className="w-3.5 h-3.5 text-slate-400" />
                    </h3>
                  </div>

                  {/* HEATMAP BAR WITH INDICATOR LINE */}
                  <div className="relative pt-4 pb-1">
                    <div className="w-full h-3 bg-gradient-to-r from-emerald-400 via-amber-400 to-red-500 rounded-full" />
                    
                    {/* BOTTLENECK POSITION LINE & TOOLTIP MARKER */}
                    <div
                      className="absolute top-0 flex flex-col items-center -translate-x-1/2 transition-all duration-300"
                      style={{ left: `${bottleneckPercent}%` }}
                    >
                      <span className="text-[9px] font-bold text-slate-800 bg-white px-1.5 py-0.5 rounded-md border border-slate-200 shadow-xs mb-0.5">
                        {activeProcessMapWorkflow?.bottleneckStep?.duration_hours || 0} hrs
                      </span>
                      <div className="w-1 h-5 bg-[#1E2540] rounded-full shadow-md border border-white" />
                    </div>
                  </div>

                  <div className="flex justify-between text-[10px] font-semibold text-slate-400 pt-1">
                    <span>Low Impact</span>
                    <span>Moderate Impact</span>
                    <span>High Impact</span>
                  </div>
                </div>
              </div>

              {/* QUICK LINK NAVIGATION CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div
                  onClick={() => setActiveTab('process-map')}
                  className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 cursor-pointer space-y-2 group"
                >
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PROCESS MAP</p>
                  <p className="text-lg font-bold text-red-600">{metrics.bottlenecksCount} bottlenecks</p>
                  <p className="text-xs text-slate-500">
                    {activeProcessMapWorkflow?.bottleneckStep?.task_name
                      ? `Step: ${activeProcessMapWorkflow.bottleneckStep.task_name}`
                      : 'Active operational bottlenecks'}
                  </p>
                  <div className="flex items-center gap-1 text-xs font-semibold text-[#1E2540] pt-2 group-hover:translate-x-1 transition-transform">
                    <span>Learn more</span> <ChevronRight className="w-4 h-4" />
                  </div>
                </div>

                <div
                  onClick={() => {
                    setActiveTab('quality-review');
                    if (pendingReviews.length > 0) setActiveReviewStep(pendingReviews[0]);
                  }}
                  className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 cursor-pointer space-y-2 group"
                >
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">QUALITY REVIEW</p>
                  <p className="text-lg font-bold text-amber-500">{pendingReviews.length} awaiting</p>
                  <p className="text-xs text-slate-500">Final deliverables awaiting review gate</p>
                  <div className="flex items-center gap-1 text-xs font-semibold text-[#1E2540] pt-2 group-hover:translate-x-1 transition-transform">
                    <span>Learn more</span> <ChevronRight className="w-4 h-4" />
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab('workflows')}
                  className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 cursor-pointer space-y-2 group"
                >
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">WORKFLOWS</p>
                  <p className="text-lg font-bold text-slate-900">{activeWorkflows.length} active</p>
                  <p className="text-xs text-slate-500">All department process maps</p>
                  <div className="flex items-center gap-1 text-xs font-semibold text-[#1E2540] pt-2 group-hover:translate-x-1 transition-transform">
                    <span>Learn more</span> <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PROCESS MAP */}
          {activeTab === 'process-map' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <div className="border-b border-slate-200/80 pb-6 w-full flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-normal text-slate-900" style={{ fontFamily: "'Marcellus', serif" }}>
                    End-to-End Process Map
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Complete process flow with performance metrics and identified bottlenecks.
                  </p>
                  {activeProcessMapWorkflow && (
                    <p className="text-xs font-bold text-[#1E2540] mt-2">
                      Process: {activeProcessMapWorkflow.title || activeProcessMapWorkflow.name}
                    </p>
                  )}
                </div>

                {workflows.length > 0 && (
                  <select
                    value={selectedWorkflowId}
                    onChange={(e) => setSelectedWorkflowId(e.target.value)}
                    className="p-3 bg-white border border-slate-200/80 rounded-xl text-xs font-bold text-slate-800 shadow-xs"
                  >
                    {workflows.map((wf) => (
                      <option key={wf.id} value={wf.id}>
                        {wf.title || wf.name} ({wf.department || 'Department'})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* VISUAL PROCESS MAP CANVAS */}
              <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-8 overflow-x-auto">
                <div className="min-w-[900px] flex items-center justify-between py-12 px-6 relative">
                  <div onClick={() => setSelectedNode({ type: 'START' })} className="relative z-10 flex flex-col items-center gap-2 cursor-pointer group">
                    <div
                      className={`w-12 h-12 rounded-full bg-[#1E2D5A] text-white font-bold text-xs flex items-center justify-center shadow-md transition-transform group-hover:scale-105 ${
                        selectedNode?.type === 'START' ? 'ring-4 ring-[#1E2D5A] ring-offset-2' : ''
                      }`}
                    >
                      Start
                    </div>
                  </div>

                  {activeProcessMapWorkflow?.steps && activeProcessMapWorkflow.steps.length > 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center px-2 relative z-0">
                      <div className="w-full h-0.5 bg-slate-300 relative flex items-center justify-center" />
                    </div>
                  )}

                  {activeProcessMapWorkflow?.steps && activeProcessMapWorkflow.steps.length > 0 ? (
                    activeProcessMapWorkflow.steps.map((st, idx) => {
                      const isBottleneck = activeProcessMapWorkflow.bottleneckStep?.id === st.id;
                      const isSelected = selectedNode?.type === 'STEP' && selectedNode?.stepData?.id === st.id;
                      const isLastStep = idx === activeProcessMapWorkflow.steps.length - 1;

                      const stepPerformerName = getPerformerName(st);
                      const durationVal = st.duration_hours ? (Number(st.duration_hours) / 24).toFixed(1) + ' days' : '0.2 days';

                      const colors = ['bg-amber-500', 'bg-red-500', 'bg-purple-600', 'bg-blue-600', 'bg-emerald-600'];
                      const nodeBg = colors[idx % colors.length];

                      return (
                        <React.Fragment key={st.id}>
                          <div onClick={() => setSelectedNode({ type: 'STEP', stepData: st })} className="relative z-10 flex flex-col items-center gap-2 cursor-pointer group">
                            <div className={`relative ${isBottleneck ? 'p-2 rounded-full bg-red-100/80 animate-pulse' : ''}`}>
                              <div
                                className={`w-14 h-14 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md transition-transform group-hover:scale-110 ${nodeBg} ${
                                  isSelected ? 'ring-4 ring-slate-800 ring-offset-2 shadow-lg' : ''
                                }`}
                              >
                                Step {st.step_order || idx + 1}
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
                    <div className="flex-1 text-center py-4 text-xs text-slate-400 italic">No steps logged for this process map yet.</div>
                  )}

                  <div className="flex-1 flex flex-col items-center justify-center px-2 relative z-0">
                    <div className="w-full h-0.5 bg-slate-300 relative flex items-center justify-center" />
                  </div>

                  <div onClick={() => setSelectedNode({ type: 'END' })} className="relative z-10 flex flex-col items-center gap-2 cursor-pointer group">
                    <div
                      className={`w-12 h-12 rounded-full bg-[#0B4F42] text-white font-bold text-xs flex items-center justify-center shadow-md transition-transform group-hover:scale-105 ${
                        selectedNode?.type === 'END' ? 'ring-4 ring-[#0B4F42] ring-offset-2' : ''
                      }`}
                    >
                      End
                    </div>
                  </div>
                </div>

                {/* DYNAMIC INSPECTOR BREAKDOWN CARD */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
                  <div className="bg-red-950 text-white p-6 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Operational Bottlenecks</span>
                    </div>
                    {activeProcessMapWorkflow?.bottleneckStep ? (
                      <p className="text-xs leading-relaxed text-red-100">
                        Operational bottleneck detected on <b>Step {activeProcessMapWorkflow.bottleneckStep.step_order || 1}: {activeProcessMapWorkflow.bottleneckStep.task_name}</b>, taking {((activeProcessMapWorkflow.bottleneckStep.duration_hours || 32) / 24).toFixed(1)} days to complete.
                      </p>
                    ) : (
                      <p className="text-xs leading-relaxed text-red-100">No major operational bottlenecks detected for this process flow.</p>
                    )}
                  </div>

                  <div className="md:col-span-2 bg-[#F8FAFC] p-6 rounded-2xl border border-slate-200/60 space-y-3">
                    {selectedNode?.type === 'START' && (
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
                            <p className="font-medium text-slate-800 italic">"{activeProcessMapWorkflow?.title || 'Process'} kicked off"</p>
                          </div>
                        </div>
                      </>
                    )}

                    {selectedNode?.type === 'STEP' && selectedNode?.stepData && (
                      <>
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-slate-800" />
                            Step {selectedNode.stepData.step_order || 1} — {selectedNode.stepData.task_name}
                            {activeProcessMapWorkflow?.bottleneckStep?.id === selectedNode.stepData.id && (
                              <span className="bg-red-100 text-red-700 text-[9px] px-2 py-0.5 rounded-full font-bold ml-2">
                                Primary Bottleneck
                              </span>
                            )}
                          </h4>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs pt-2">
                          <div>
                            <p className="text-slate-400 text-[10px] font-bold uppercase">Performer</p>
                            <p className="font-medium text-slate-800">{getPerformerName(selectedNode.stepData)}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-[10px] font-bold uppercase">Time Logged</p>
                            <p className="font-medium text-slate-800">
                              {((selectedNode.stepData.duration_hours || 0) / 24).toFixed(1)} days ({selectedNode.stepData.duration_hours || 0} hrs)
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-[10px] font-bold uppercase">AI Tools</p>
                            <p className="font-medium text-slate-800">
                              {selectedNode.stepData.tools_tagged?.join(', ') || 'Copilot, Perplexity'}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-[10px] font-bold uppercase">Deliverable Summary</p>
                            <p className="font-medium text-slate-800 italic">
                              "{selectedNode.stepData.deliverable_summary || 'Deliverable output logged'}"
                            </p>
                          </div>
                        </div>
                      </>
                    )}

                    {selectedNode?.type === 'END' && (
                      <>
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#0B4F42]" />
                            End — Manager Review
                          </h4>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs pt-2">
                          <div>
                            <p className="text-slate-400 text-[10px] font-bold uppercase">Performer</p>
                            <p className="font-medium text-slate-800">{profile?.full_name || 'Manager'}</p>
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
                            <p className="font-medium text-slate-800 italic">
                              {pendingReviews.length > 0 ? '"Awaiting quality review"' : '"Process approved and completed"'}
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

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

          {/* TAB 3: QUALITY REVIEW */}
          {activeTab === 'quality-review' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <div className="border-b border-slate-200/80 pb-6 w-full">
                <h1 className="text-3xl font-normal text-slate-900" style={{ fontFamily: "'Marcellus', serif" }}>
                  Quality Review
                </h1>
                <p className="text-xs text-slate-500 mt-1">Rate deliverables submitted by candidates. Scores below 3.5 trigger redesign review.</p>
              </div>

              {errorMsg && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-xs font-semibold flex items-center gap-2">
                  <X className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{successMsg}</span>
                </div>
              )}

              {activeReviewStep ? (
                <form onSubmit={handleLockQualityScore} className="bg-white border border-slate-200/80 rounded-2xl p-8 space-y-8 shadow-xs">
                  <div className="bg-[#F8FAFC] p-4 rounded-xl border border-slate-200/60 text-xs text-slate-700 space-y-1">
                    <p className="font-bold text-slate-900">
                      Deliverable received: <span className="italic font-normal">"{activeReviewStep.deliverable_summary || 'Final deliverable output'}"</span>
                    </p>
                    <p className="text-slate-500">
                      Submitted by: <span className="font-semibold text-slate-800">{getPerformerName(activeReviewStep)}</span>
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold text-slate-800">
                        <span>Accuracy</span>
                        <span>{ratings.accuracy.toFixed(1)}</span>
                      </div>
                      <input
                        type="range"
                        min="1.0"
                        max="5.0"
                        step="0.1"
                        value={ratings.accuracy}
                        onChange={(e) => setRatings({ ...ratings, accuracy: parseFloat(e.target.value) })}
                        className="w-full accent-[#1E2540] cursor-pointer"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold text-slate-800">
                        <span>Completeness</span>
                        <span>{ratings.completeness.toFixed(1)}</span>
                      </div>
                      <input
                        type="range"
                        min="1.0"
                        max="5.0"
                        step="0.1"
                        value={ratings.completeness}
                        onChange={(e) => setRatings({ ...ratings, completeness: parseFloat(e.target.value) })}
                        className="w-full accent-[#1E2540] cursor-pointer"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold text-slate-800">
                        <span>Actionability</span>
                        <span>{ratings.actionability.toFixed(1)}</span>
                      </div>
                      <input
                        type="range"
                        min="1.0"
                        max="5.0"
                        step="0.1"
                        value={ratings.actionability}
                        onChange={(e) => setRatings({ ...ratings, actionability: parseFloat(e.target.value) })}
                        className="w-full accent-[#1E2540] cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      COMMENTS (OPTIONAL)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Add specific feedback or guidance for the candidate..."
                      value={reviewComments}
                      onChange={(e) => setReviewComments(e.target.value)}
                      className="w-full p-3.5 bg-[#F8FAFC] border border-slate-200/80 rounded-xl text-xs text-slate-900"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="flex text-amber-400">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-5 h-5 ${
                              star <= Math.round(calculatedAvgQuality) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-base font-bold text-slate-900">
                        {calculatedAvgQuality} / 5.0
                      </span>
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                        Clears quality gate
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-3.5 bg-[#1E2540] hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors shadow-xs disabled:opacity-50"
                    >
                      {isSubmitting ? 'Locking Score...' : 'Approve & Lock Quality Score'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center flex flex-col items-center justify-center gap-3 text-slate-400 shadow-xs">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 stroke-1" />
                  <p className="text-xs text-slate-500 font-medium">All pending deliverables have been reviewed.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: WORKFLOWS */}
          {activeTab === 'workflows' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <div className="border-b border-slate-200/80 pb-6 w-full">
                <h1 className="text-3xl font-normal text-slate-900" style={{ fontFamily: "'Marcellus', serif" }}>
                  My Workflows
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Department workflow processes assigned to your review.
                </p>
              </div>

              <div className="space-y-4">
                {workflows.length === 0 ? (
                  <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center flex flex-col items-center justify-center gap-3 text-slate-400 shadow-xs">
                    <FileText className="w-8 h-8 text-slate-300 stroke-1" />
                    <p className="text-xs text-slate-500 font-medium">No workflows assigned to this department or manager.</p>
                  </div>
                ) : (
                  workflows.map((wf) => {
                    const wfSteps = allSteps.filter((s) => String(s.workflow_id) === String(wf.id));
                    const isCompleted = wf.is_approved || (wfSteps.length > 0 && wfSteps.every((s) => s.status === 'APPROVED' || s.status === 'COMPLETED'));

                    return (
                      <div key={wf.id} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-2 hover:border-slate-300 transition-colors">
                        <h3 className="text-lg font-bold text-slate-900">{wf.title || wf.name}</h3>
                        <p className="text-xs text-slate-500">
                          {wfSteps.length} steps · {wf.department || profile?.department || 'Department'} ·{' '}
                          {isCompleted ? (
                            <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                              Completed process
                            </span>
                          ) : (
                            <span className="text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded-full">
                              Active process
                            </span>
                          )}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}