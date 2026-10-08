'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '../../../lib/supabase/client';
import {
  CheckCircle2,
  Clock,
  ClipboardList,
  Inbox,
  Send,
  LogOut,
  HelpCircle,
  AlertCircle,
  Lock,
  ChevronRight,
  UserCheck,
  Building2,
  Layers
} from 'lucide-react';

const AI_TOOLS = [
  'ChatGPT',
  'Claude',
  'Notion AI',
  'Copilot',
  'Excel AI',
  'Gemini',
  'Custom Agent',
  'Perplexity'
];

export default function CandidateDashboard() {
  const router = useRouter();
  const supabase = createClient();

  // Profile & Context States
  const [profile, setProfile] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');

  // Relational Dropdown Data States
  const [assignedSteps, setAssignedSteps] = useState([]);
  const [handoffs, setHandoffs] = useState([]);
  const [departmentPeers, setDepartmentPeers] = useState([]);
  const [departmentManagers, setDepartmentManagers] = useState([]);

  // Form Logging States
  const [selectedStepId, setSelectedStepId] = useState('');
  const [hours, setHours] = useState('');
  const [selectedTools, setSelectedTools] = useState([]);
  const [otherTool, setOtherTool] = useState('');
  const [noAiReason, setNoAiReason] = useState('');
  const [isFinalStep, setIsFinalStep] = useState(false);
  const [handoffTarget, setHandoffTarget] = useState('');
  const [deliverableSummary, setDeliverableSummary] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Alert Feedback
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load User, Organization, Department & Relational Data
  const loadUserData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr || !session) {
        router.push('/candidate-login');
        return;
      }

      // 1. Fetch Current User Profile
      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('*, organizations(*), departments(*)')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profileErr) throw profileErr;
      
      const userProf = profileData || { 
        id: session.user.id, 
        email: session.user.email, 
        full_name: 'Candidate' 
      };
      setProfile(userProf);
      setOrganization(userProf.organizations || null);
      setDepartment(userProf.departments || null);

      // 2. Fetch Assigned Workflow Steps for this Performer
      const { data: stepsData, error: stepsErr } = await supabase
        .from('workflow_steps')
        .select('*, workflows!inner(id, title, organization_id, department_id)')
        .eq('performer_id', session.user.id)
        .order('created_at', { ascending: false });

      if (stepsErr) console.warn('Error fetching assigned steps:', stepsErr.message);
      setAssignedSteps(stepsData || []);

      // 3. Fetch Incoming Peer Handoffs
      const { data: handoffData, error: handoffErr } = await supabase
        .from('workflow_steps')
        .select('*, assigner:profiles!workflow_steps_assigned_by_fkey(full_name, email, job_title)')
        .eq('performer_id', session.user.id)
        .eq('status', 'PENDING');

      if (handoffErr) console.warn('Error fetching handoffs:', handoffErr.message);
      setHandoffs(handoffData || []);

      // 4. Fetch Department Peers & Managers Dynamically
      if (userProf?.department_id) {
        // Peer Candidates in the same Department
        const { data: peersData } = await supabase
          .from('profiles')
          .select('id, full_name, email, job_title')
          .eq('department_id', userProf.department_id)
          .eq('role', 'candidate')
          .neq('id', session.user.id);
        setDepartmentPeers(peersData || []);

        // Managers in the same Department
        const { data: mgrData } = await supabase
          .from('profiles')
          .select('id, full_name, email, job_title')
          .eq('department_id', userProf.department_id)
          .eq('role', 'manager');
        setDepartmentManagers(mgrData || []);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load user environment.');
    } finally {
      setLoading(false);
    }
  }, [supabase, router]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // Derived Steps Lists
  const pendingSteps = useMemo(
    () => assignedSteps.filter((s) => s.status === 'PENDING' || !s.status),
    [assignedSteps]
  );
  const completedSteps = useMemo(
    () => assignedSteps.filter((s) => s.status === 'COMPLETED' || s.status === 'APPROVED'),
    [assignedSteps]
  );

  // Tool Selection Helper
  const toggleTool = (tool) => {
    setErrorMsg('');
    if (tool === 'No AI tools used') {
      setSelectedTools(selectedTools.includes('No AI tools used') ? [] : ['No AI tools used']);
      return;
    }
    let updated = selectedTools.filter((t) => t !== 'No AI tools used');
    if (updated.includes(tool)) {
      updated = updated.filter((t) => t !== tool);
    } else {
      updated.push(tool);
    }
    setSelectedTools(updated);
  };

  // Submit Completed Step & Process Handoff
  const handleSubmitStep = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedStepId) return setErrorMsg('Please select a workflow step.');
    if (selectedTools.length === 0) return setErrorMsg('Please select at least one AI tool option.');
    if (selectedTools.includes('No AI tools used') && !noAiReason.trim()) {
      return setErrorMsg('Please specify why no AI tools were used.');
    }
    if (selectedTools.includes('Other') && !otherTool.trim()) {
      return setErrorMsg('Please specify the custom AI tool.');
    }
    if (!hours || Number(hours) <= 0) return setErrorMsg('Please enter valid active hours.');
    if (!handoffTarget) return setErrorMsg(isFinalStep ? 'Please select a manager for review.' : 'Please select a peer for handoff.');

    setIsSubmitting(true);
    try {
      const currentStep = assignedSteps.find((s) => String(s.id) === String(selectedStepId));

      const startTimeIso = new Date(startDate).toISOString();
      const endTimeIso = new Date(endDate).toISOString();

      // 1. Update Current Step Record
      const { error: updateErr } = await supabase
        .from('workflow_steps')
        .update({
          status: 'COMPLETED',
          start_time: startTimeIso,
          end_time: endTimeIso,
          duration_hours: Number(hours),
          deliverable_summary: deliverableSummary,
          tools_tagged: selectedTools,
          no_ai_reason: selectedTools.includes('No AI tools used') ? noAiReason : null,
          other_tool: selectedTools.includes('Other') ? otherTool : null,
          is_final_step: isFinalStep,
          handoff_target_id: handoffTarget
        })
        .eq('id', selectedStepId);

      if (updateErr) throw updateErr;

      // 2. Dynamic Workflow Routing
      if (isFinalStep) {
        // Update main workflow status to PENDING_MANAGER_REVIEW for Manager/Executive dashboards
        if (currentStep?.workflow_id) {
          await supabase
            .from('workflows')
            .update({ status: 'PENDING_MANAGER_REVIEW' })
            .eq('id', currentStep.workflow_id);
        }
        setSuccessMsg('Workflow step completed! Routed to Manager for final quality review.');
      } else {
        // Create next step in the sequence for the selected peer
        await supabase.from('workflow_steps').insert({
          workflow_id: currentStep?.workflow_id,
          step_order: (currentStep?.step_order || 1) + 1,
          task_name: `Handoff: ${currentStep?.task_name || 'Next Workflow Step'}`,
          performer_id: handoffTarget,
          assigned_by: profile.id,
          status: 'PENDING'
        });
        setSuccessMsg('Step completed! Project handed off to colleague successfully.');
      }

      // Reset Inputs
      setSelectedStepId('');
      setHours('');
      setSelectedTools([]);
      setOtherTool('');
      setNoAiReason('');
      setDeliverableSummary('');
      setHandoffTarget('');
      setIsFinalStep(false);

      await loadUserData();
    } catch (err) {
      setErrorMsg(err.message || 'Error submitting workflow step.');
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
      <div className="min-h-screen flex items-center justify-center bg-[#EEEEF4] text-[#79768D] font-sans">
        <span>Loading Candidate Portal...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F9FB] text-[#1F1F3B] font-sans flex flex-col antialiased">
      {/* HEADER */}
      <header className="bg-white border-b border-[#E5E3ED] sticky top-0 z-30 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Image src="/ivy-logo-dark.png" alt="IVY & COMPANY" width={120} height={32} priority />
          <span className="text-[11px] font-bold tracking-widest text-[#79768D] uppercase border-l border-[#E5E3ED] pl-4 py-1">
            Candidate Portal
          </span>
        </div>
        <div className="flex items-center gap-5">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-[#1F1F3B]">{profile?.full_name || 'Candidate'}</p>
            <p className="text-[10px] text-[#79768D]">
              {organization?.name || 'Organization'} &bull; {department?.name || 'Department'}
            </p>
          </div>
          <button
            onClick={handleLogout}
            title="Log Out"
            className="p-2 text-[#79768D] hover:text-[#1F1F3B] hover:bg-[#EEEEF4] rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* PORTAL BODY */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8">
        {/* SIDEBAR NAVIGATION */}
        <aside className="space-y-2">
          <button
            onClick={() => setActiveTab('home')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'home'
                ? 'bg-[#1F1F3B] text-white shadow-xs'
                : 'text-[#79768D] hover:bg-[#EEEEF4] hover:text-[#1F1F3B]'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Dashboard Overview</span>
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'assignments'
                ? 'bg-[#1F1F3B] text-white shadow-xs'
                : 'text-[#79768D] hover:bg-[#EEEEF4] hover:text-[#1F1F3B]'
            }`}
          >
            <div className="flex items-center gap-3">
              <Inbox className="w-4 h-4" />
              <span>Pending Tasks</span>
            </div>
            {pendingSteps.length > 0 && (
              <span className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                {pendingSteps.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('log-step')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'log-step'
                ? 'bg-[#1F1F3B] text-white shadow-xs'
                : 'text-[#79768D] hover:bg-[#EEEEF4] hover:text-[#1F1F3B]'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Log Workflow Step</span>
          </button>
          <button
            onClick={() => setActiveTab('help')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'help'
                ? 'bg-[#1F1F3B] text-white shadow-xs'
                : 'text-[#79768D] hover:bg-[#EEEEF4] hover:text-[#1F1F3B]'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Help & FAQ</span>
          </button>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'home' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-[#E5E3ED] pb-5">
                <p className="text-xs font-semibold text-[#79768D] uppercase tracking-wider">
                  Welcome Back
                </p>
                <h1
                  className="text-3xl font-normal text-[#1F1F3B] mt-1"
                  style={{ fontFamily: "'Marcellus', serif" }}
                >
                  {profile?.full_name || 'Candidate'}
                </h1>
                <div className="flex items-center gap-4 mt-2 text-xs text-[#79768D]">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" />
                    {organization?.name || 'Unassigned Organization'}
                  </span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5" />
                    {department?.name || 'Unassigned Department'}
                  </span>
                </div>
              </div>

              {/* STAT CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div
                  onClick={() => setActiveTab('assignments')}
                  className="bg-white p-5 rounded-2xl border border-[#E5E3ED] shadow-xs hover:border-[#1F1F3B] transition-all cursor-pointer"
                >
                  <p className="text-[10px] font-bold text-[#79768D] uppercase tracking-wider">
                    Pending Tasks
                  </p>
                  <p
                    className="text-3xl font-normal text-[#1F1F3B] mt-2"
                    style={{ fontFamily: "'Marcellus', serif" }}
                  >
                    {pendingSteps.length}
                  </p>
                  <div className="flex items-center justify-between text-xs text-[#79768D] mt-3">
                    <span>Assigned workflow steps</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab('assignments')}
                  className="bg-white p-5 rounded-2xl border border-[#E5E3ED] shadow-xs hover:border-[#1F1F3B] transition-all cursor-pointer"
                >
                  <p className="text-[10px] font-bold text-[#79768D] uppercase tracking-wider">
                    Incoming Handoffs
                  </p>
                  <p
                    className="text-3xl font-normal text-[#1F1F3B] mt-2"
                    style={{ fontFamily: "'Marcellus', serif" }}
                  >
                    {handoffs.length}
                  </p>
                  <div className="flex items-center justify-between text-xs text-[#79768D] mt-3">
                    <span>Awaiting execution</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab('log-step')}
                  className="bg-white p-5 rounded-2xl border border-[#E5E3ED] shadow-xs hover:border-[#1F1F3B] transition-all cursor-pointer"
                >
                  <p className="text-[10px] font-bold text-[#79768D] uppercase tracking-wider">
                    Completed Steps
                  </p>
                  <p
                    className="text-3xl font-normal text-emerald-600 mt-2"
                    style={{ fontFamily: "'Marcellus', serif" }}
                  >
                    {completedSteps.length}
                  </p>
                  <div className="flex items-center justify-between text-xs text-[#79768D] mt-3">
                    <span>Logged executions</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* INCOMING PEER HANDOFFS */}
              <div className="space-y-3 pt-2">
                <h2
                  className="text-xl font-normal text-[#1F1F3B]"
                  style={{ fontFamily: "'Marcellus', serif" }}
                >
                  Incoming Peer Handoffs
                </h2>
                {handoffs.length === 0 ? (
                  <div className="bg-white p-6 rounded-2xl border border-[#E5E3ED] text-center text-xs text-[#79768D]">
                    No active peer handoffs currently pending for your account.
                  </div>
                ) : (
                  handoffs.map((h) => (
                    <div
                      key={h.id}
                      className="bg-white p-5 rounded-2xl border-l-4 border-l-[#1F1F3B] border border-[#E5E3ED] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs"
                    >
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-[#1F1F3B]">
                          {h.assigner?.full_name || 'Department Colleague'} handed off a step
                        </p>
                        <p className="text-xs text-[#79768D]">
                          Task: <span className="font-semibold text-[#1F1F3B]">{h.task_name}</span>
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedStepId(String(h.id));
                          setActiveTab('log-step');
                        }}
                        className="px-4 py-2 bg-[#1F1F3B] text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        Complete Step &rarr;
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: ASSIGNMENTS */}
          {activeTab === 'assignments' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h1
                  className="text-2xl font-normal text-[#1F1F3B]"
                  style={{ fontFamily: "'Marcellus', serif" }}
                >
                  Assigned Steps
                </h1>
                <p className="text-xs text-[#79768D] mt-0.5">
                  View assigned tasks registered under your department workflow.
                </p>
              </div>

              <div className="space-y-3">
                {assignedSteps.length === 0 ? (
                  <div className="bg-white p-8 rounded-2xl border border-[#E5E3ED] text-center text-xs text-[#79768D]">
                    No workflow steps currently assigned to you.
                  </div>
                ) : (
                  assignedSteps.map((step) => {
                    const isDone = step.status === 'COMPLETED' || step.status === 'APPROVED';
                    return (
                      <div
                        key={step.id}
                        className="bg-white p-5 rounded-2xl border border-[#E5E3ED] flex items-center justify-between gap-4 shadow-xs"
                      >
                        <div className="flex items-center gap-3.5">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              isDone ? 'bg-emerald-50 text-emerald-600' : 'bg-[#EEEEF4] text-[#1F1F3B]'
                            }`}
                          >
                            {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                          </div>
                          <div>
                            <h3 className="text-xs font-bold text-[#1F1F3B]">
                              {step.task_name || step.workflows?.title || 'Task Step'}
                            </h3>
                            <p className="text-[11px] text-[#79768D] mt-0.5">
                              Step #{step.step_order || 1} &bull; Status:{' '}
                              <span className={`font-semibold ${isDone ? 'text-emerald-600' : 'text-amber-600'}`}>
                                {step.status || 'PENDING'}
                              </span>
                            </p>
                          </div>
                        </div>
                        {!isDone && (
                          <button
                            onClick={() => {
                              setSelectedStepId(String(step.id));
                              setActiveTab('log-step');
                            }}
                            className="px-4 py-2 bg-[#1F1F3B] text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            Log Step
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 3: STEP LOGGING & HANDOFF */}
          {activeTab === 'log-step' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h1
                  className="text-2xl font-normal text-[#1F1F3B]"
                  style={{ fontFamily: "'Marcellus', serif" }}
                >
                  Log Completed Step
                </h1>
                <p className="text-xs text-[#79768D] mt-0.5">
                  Record duration, select AI tools used, and hand off to the next peer or manager.
                </p>
              </div>

              {errorMsg && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
              {successMsg && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmitStep} className="bg-white border border-[#E5E3ED] rounded-2xl p-6 space-y-5 shadow-xs">
                {/* WORKFLOW STEP SELECTION */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-[#79768D] uppercase tracking-wider">
                    SELECT PENDING STEP *
                  </label>
                  <select
                    required
                    value={selectedStepId}
                    onChange={(e) => setSelectedStepId(e.target.value)}
                    className="w-full p-3 bg-[#F7F9FB] border border-[#E5E3ED] rounded-xl text-xs font-semibold text-[#1F1F3B] focus:outline-none"
                  >
                    <option value="">-- Choose Pending Step --</option>
                    {pendingSteps.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.task_name || `Step #${s.step_order || s.id}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* HOURS & DATES */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-[#79768D] uppercase tracking-wider">
                      DURATION (HOURS) *
                    </label>
                    <input
                      type="number"
                      step="0.25"
                      min="0.1"
                      placeholder="e.g. 2.5"
                      value={hours}
                      onChange={(e) => setHours(e.target.value)}
                      className="w-full p-3 bg-[#F7F9FB] border border-[#E5E3ED] rounded-xl text-xs text-[#1F1F3B] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-[#79768D] uppercase tracking-wider">
                      START DATE
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full p-3 bg-[#F7F9FB] border border-[#E5E3ED] rounded-xl text-xs text-[#1F1F3B] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-[#79768D] uppercase tracking-wider">
                      END DATE
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full p-3 bg-[#F7F9FB] border border-[#E5E3ED] rounded-xl text-xs text-[#1F1F3B] focus:outline-none"
                    />
                  </div>
                </div>

                {/* AI TOOLS SELECTION */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-[#79768D] uppercase tracking-wider">
                    AI TOOLS TAGGED *
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[...AI_TOOLS, 'Other', 'No AI tools used'].map((tool) => {
                      const isSelected = selectedTools.includes(tool);
                      return (
                        <button
                          key={tool}
                          type="button"
                          onClick={() => toggleTool(tool)}
                          className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#1F1F3B] text-white border-[#1F1F3B]'
                              : 'bg-[#EEEEF4] text-[#1F1F3B] border-transparent hover:border-[#E5E3ED]'
                          }`}
                        >
                          {tool}
                        </button>
                      );
                    })}
                  </div>

                  {selectedTools.includes('Other') && (
                    <input
                      type="text"
                      placeholder="Specify custom AI tool"
                      value={otherTool}
                      onChange={(e) => setOtherTool(e.target.value)}
                      className="w-full mt-2 p-3 bg-[#F7F9FB] border border-[#E5E3ED] rounded-xl text-xs text-[#1F1F3B] focus:outline-none"
                    />
                  )}

                  {selectedTools.includes('No AI tools used') && (
                    <textarea
                      rows={2}
                      placeholder="Explain alternative methods or manual tools used..."
                      value={noAiReason}
                      onChange={(e) => setNoAiReason(e.target.value)}
                      className="w-full mt-2 p-3 bg-[#F7F9FB] border border-[#E5E3ED] rounded-xl text-xs text-[#1F1F3B] focus:outline-none"
                    />
                  )}
                </div>

                {/* HANDOFF SELECTION */}
                <div className="space-y-3 pt-2 border-t border-[#E5E3ED]">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="isFinalStep"
                      checked={isFinalStep}
                      onChange={(e) => {
                        setIsFinalStep(e.target.checked);
                        setHandoffTarget('');
                      }}
                      className="h-4 w-4 rounded border-[#E5E3ED] text-[#1F1F3B] focus:ring-[#1F1F3B]"
                    />
                    <label htmlFor="isFinalStep" className="text-xs font-bold text-[#1F1F3B] cursor-pointer">
                      Final step in workflow (Submit to Manager for Review)
                    </label>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-[#79768D] uppercase tracking-wider">
                      {isFinalStep ? 'SELECT MANAGER *' : 'HAND OFF TO DEPARTMENT PEER *'}
                    </label>
                    <select
                      required
                      value={handoffTarget}
                      onChange={(e) => setHandoffTarget(e.target.value)}
                      className="w-full p-3 bg-[#F7F9FB] border border-[#E5E3ED] rounded-xl text-xs font-semibold text-[#1F1F3B] focus:outline-none"
                    >
                      <option value="">
                        {isFinalStep ? '-- Select Manager --' : '-- Select Department Peer --'}
                      </option>
                      {isFinalStep
                        ? departmentManagers.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.full_name} ({m.job_title || 'Manager'})
                            </option>
                          ))
                        : departmentPeers.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.full_name} ({p.job_title || 'Candidate'})
                            </option>
                          ))}
                    </select>
                  </div>
                </div>

                {/* DELIVERABLE SUMMARY */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-[#79768D] uppercase tracking-wider">
                    DELIVERABLE SUMMARY
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide a brief, non-confidential description of the generated output..."
                    value={deliverableSummary}
                    onChange={(e) => setDeliverableSummary(e.target.value)}
                    className="w-full p-3 bg-[#F7F9FB] border border-[#E5E3ED] rounded-xl text-xs text-[#1F1F3B] focus:outline-none"
                  />
                </div>

                {/* PRIVACY FOOTER */}
                <div className="flex items-center gap-2 text-[11px] text-[#79768D] pt-1">
                  <Lock className="w-3.5 h-3.5 text-[#79768D]" />
                  <span>No proprietary data or code is stored or exposed.</span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-[#1F1F3B] hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting
                    ? 'Submitting...'
                    : isFinalStep
                    ? 'Complete Step & Send for Manager Review'
                    : 'Complete Step & Handoff to Peer'}
                </button>
              </form>
            </div>
          )}

          {/* TAB 4: HELP */}
          {activeTab === 'help' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h1
                  className="text-2xl font-normal text-[#1F1F3B]"
                  style={{ fontFamily: "'Marcellus', serif" }}
                >
                  Guidelines & FAQ
                </h1>
                <p className="text-xs text-[#79768D] mt-0.5">
                  Frequently asked questions on dynamic handoffs and executive tracking.
                </p>
              </div>
              <div className="space-y-3">
                {[
                  [
                    'How are workflow steps passed between department colleagues?',
                    'When you select a department peer and submit, a new pending step is automatically routed to their dashboard under the same workflow process map.'
                  ],
                  [
                    'How do manager evaluations work?',
                    'When the final candidate marks "Final step in workflow", the process map completes and is forwarded to the manager dashboard for proficiency rating (1-5).'
                  ],
                  [
                    'How does this feed into executive reporting?',
                    'All completed step durations, tool tags, and manager ratings are aggregated across departments to generate the process maps and time-savings metrics on the executive page.'
                  ]
                ].map(([q, a]) => (
                  <div key={q} className="bg-white p-5 rounded-2xl border border-[#E5E3ED] space-y-1 shadow-xs">
                    <h3 className="text-xs font-bold text-[#1F1F3B]">{q}</h3>
                    <p className="text-xs text-[#79768D] leading-relaxed">{a}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}