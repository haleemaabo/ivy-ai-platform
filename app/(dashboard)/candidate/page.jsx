'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Marcellus, Inter } from 'next/font/google';
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
  ChevronRight,
  Lock,
  User,
  FileText,
  Sparkles,
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

const AI_TOOLS = ['ChatGPT', 'Claude', 'Copilot', 'Perplexity', 'Gemini', 'Midjourney'];

export default function CandidateDashboard() {
  const router = useRouter();
  const supabase = createClient();

  // User & Profile State
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'assignments' | 'log-step' | 'help'

  // Data States from Supabase
  const [assignedSteps, setAssignedSteps] = useState([]);
  const [handoffs, setHandoffs] = useState([]);
  const [colleagues, setColleagues] = useState([]);

  // Form States for Logging a Step
  const [selectedStepId, setSelectedStepId] = useState('');
  const [hours, setHours] = useState('');
  const [selectedTools, setSelectedTools] = useState([]);
  const [otherTool, setOtherTool] = useState('');
  const [noAiReason, setNoAiReason] = useState('');
  const [handoffTarget, setHandoffTarget] = useState('');
  const [deliverableSummary, setDeliverableSummary] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // UI Feedback States
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Current Session & Profile Data
  const loadUserData = useCallback(async () => {
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

      // Fetch Profile
      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profileErr) throw profileErr;

      setProfile(profileData || { email: session.user.email, full_name: 'Candidate' });

      // Fetch Assigned Workflow Steps from `workflow_steps`
      const { data: stepsData, error: stepsErr } = await supabase
        .from('workflow_steps')
        .select('*, workflows(id, title)')
        .eq('performer_id', session.user.id)
        .order('assigned_date', { ascending: false });

      if (stepsErr) console.warn('Error loading workflow steps:', stepsErr.message);
      setAssignedSteps(stepsData || []);

      // Fetch Pending Handoffs targeting this user
      const { data: handoffData, error: handoffErr } = await supabase
        .from('workflow_steps')
        .select('*, profiles!workflow_steps_assigned_by_fkey(full_name, email)')
        .eq('performer_id', session.user.id)
        .eq('status', 'PENDING');

      if (handoffErr) console.warn('Error loading handoffs:', handoffErr.message);
      setHandoffs(handoffData || []);

      // Fetch Team / Colleagues for handoff targets (Same Organization & Department)
      const userOrg = profileData?.organization;
      const userDept = profileData?.department;

      if (userOrg && userDept) {
        const { data: teamData, error: teamErr } = await supabase
          .from('profiles')
          .select('id, full_name, email, organization, department')
          .eq('organization', userOrg)
          .eq('department', userDept)
          .neq('id', session.user.id)
          .not('department', 'is', null)
          .neq('department', '');

        if (teamErr) console.warn('Error fetching colleagues:', teamErr.message);

        setColleagues(teamData || []);
      } else {
        setColleagues([]);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  }, [supabase, router]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // Derived Counts
  const pendingSteps = useMemo(
    () => assignedSteps.filter((s) => s.status === 'PENDING' || !s.status),
    [assignedSteps]
  );
  const completedSteps = useMemo(
    () => assignedSteps.filter((s) => s.status === 'APPROVED' || s.status === 'COMPLETED'),
    [assignedSteps]
  );

  // Toggle AI Tools
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

  // Submit Step Completion & Handoff to Supabase
  const handleSubmitStep = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedStepId) return setErrorMsg('Please select a workflow step.');
    if (selectedTools.length === 0) return setErrorMsg('Please select at least one AI tool option.');
    if (selectedTools.includes('No AI tools used') && !noAiReason.trim()) {
      return setErrorMsg('Please state what you used instead of AI tools.');
    }
    if (selectedTools.includes('Other') && !otherTool.trim()) {
      return setErrorMsg('Please specify the other AI tool used.');
    }
    if (!hours || Number(hours) <= 0) return setErrorMsg('Please enter valid active work hours.');

    setIsSubmitting(true);

    try {
      const stepToUpdate = assignedSteps.find((s) => String(s.id) === String(selectedStepId));
      const toolsList = selectedTools.map((t) => (t === 'Other' ? otherTool : t)).join(', ');

      const { error: updateErr } = await supabase
        .from('workflow_steps')
        .update({
          status: 'COMPLETED',
          completed_date: endDate,
          duration: `${hours} hours`,
          deliverable_summary: deliverableSummary,
          tools_used: toolsList,
          no_ai_reason: selectedTools.includes('No AI tools used') ? noAiReason : null,
        })
        .eq('id', selectedStepId);

      if (updateErr) throw updateErr;

      if (handoffTarget) {
        const targetUser = colleagues.find((c) => c.id === handoffTarget || c.email === handoffTarget);

        const myDept = profile?.department || profile?.department_name;
        const targetDept = targetUser?.department || targetUser?.department_name;

        if (
          !targetUser ||
          targetUser.organization !== profile.organization ||
          targetDept !== myDept
        ) {
          throw new Error('Handoff target must belong to the same organization and department.');
        }

        await supabase.from('workflow_steps').insert({
          performer_id: targetUser.id,
          workflow_id: stepToUpdate?.workflow_id,
          title: `Handoff: ${stepToUpdate?.title || 'Deliverable Step'}`,
          assigned_by: profile.id,
          assigned_date: new Date().toISOString().split('T')[0],
          status: 'PENDING',
        });
      }

      setSuccessMsg('Step completed and deliverable successfully handed off!');
      setSelectedStepId('');
      setHours('');
      setSelectedTools([]);
      setOtherTool('');
      setNoAiReason('');
      setDeliverableSummary('');
      setHandoffTarget('');

      await loadUserData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit workflow step.');
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
    <div 
      className={`${inter.variable} ${marcellus.variable} min-h-screen bg-[#F8FAFC] text-[#1E293B] flex flex-col antialiased`}
    >
      {/* HEADER / NAVIGATION BAR */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 px-8 py-3 flex items-center justify-between h-16">
        <div className="flex items-center gap-4">
          <Image src="/ivy-logo-dark.png" alt="IVY & COMPANY" width={48} height={32} priority className="object-contain" />
          <span className="text-[10px] font-bold tracking-[0.18em] text-slate-400 uppercase border-l border-slate-200 pl-4 py-1">
            Candidate Portal
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#F1F5F9]/80 border border-slate-200/60 rounded-full px-3.5 py-1.5 text-slate-600 hover:bg-[#F1F5F9] transition-colors">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-medium text-slate-600">{profile?.email}</span>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 border border-slate-200/60 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <div className="flex-1 w-full px-8 py-8 flex gap-8 items-start">
        {/* SIDEBAR NAVIGATION */}
        <aside className="w-[230px] shrink-0 space-y-1.5 sticky top-24">
          <button
            onClick={() => setActiveTab('home')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'home'
                ? 'bg-[#1E2540] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100/80'
            }`}
          >
            <ClipboardList className="w-4 h-4 shrink-0" />
            <span>Dashboard Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('assignments')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'assignments'
                ? 'bg-[#1E2540] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100/80'
            }`}
          >
            <div className="flex items-center gap-3">
              <Inbox className="w-4 h-4 shrink-0" />
              <span>Pending Assignments</span>
            </div>
            {pendingSteps.length > 0 && (
              <span className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                {pendingSteps.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('log-step')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'log-step'
                ? 'bg-[#1E2540] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100/80'
            }`}
          >
            <Send className="w-4 h-4 shrink-0" />
            <span>Log Workflow Step</span>
          </button>

          <button
            onClick={() => setActiveTab('help')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'help'
                ? 'bg-[#1E2540] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100/80'
            }`}
          >
            <HelpCircle className="w-4 h-4 shrink-0" />
            <span>Help & FAQ</span>
          </button>
        </aside>

        {/* MAIN CONTENT CONTAINER */}
        <main className="flex-1 min-w-0 space-y-6">
          {/* TAB 1: OVERVIEW HOME */}
          {activeTab === 'home' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <div className="border-b border-slate-200/80 pb-6 w-full">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Welcome Back
                </p>
                <h1
                  className="text-3xl font-normal text-[#1F1F3B] mt-1"
                  style={{ fontFamily: "'Marcellus', serif" }}
                >
                  {profile?.full_name || 'Candidate'}
                </h1>
                <p className="text-sm text-slate-500 mt-1.5 max-w-2xl">
                  Track your pending pilot steps, log completed work, and submit handoffs seamlessly across your assigned organization workflow.
                </p>
              </div>

              {/* STAT CARDS - GRID FULL WIDTH */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div
                  onClick={() => setActiveTab('assignments')}
                  className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between h-40"
                >
                  <div className="flex justify-between items-start">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pending Tasks</p>
                    <div className="p-2 bg-slate-50 rounded-xl">
                      <Clock className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                  <div>
                    <p 
                      className="text-4xl font-normal text-slate-900"
                      style={{ fontFamily: "'Marcellus', serif" }}
                    >
                      {pendingSteps.length}
                    </p>
                    <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
                      <span>Assigned workflow modules</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab('assignments')}
                  className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between h-40"
                >
                  <div className="flex justify-between items-start">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Incoming Handoffs</p>
                    <div className="p-2 bg-slate-50 rounded-xl">
                      <Inbox className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                  <div>
                    <p 
                      className="text-4xl font-normal text-slate-900"
                      style={{ fontFamily: "'Marcellus', serif" }}
                    >
                      {handoffs.length}
                    </p>
                    <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
                      <span>Awaiting your completion</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab('log-step')}
                  className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between h-40"
                >
                  <div className="flex justify-between items-start">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Completed Steps</p>
                    <div className="p-2 bg-emerald-50 rounded-xl">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </div>
                  </div>
                  <div>
                    <p 
                      className="text-4xl font-normal text-emerald-600"
                      style={{ fontFamily: "'Marcellus', serif" }}
                    >
                      {completedSteps.length}
                    </p>
                    <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
                      <span>Submitted workflow records</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* HANDOFF CARDS & QUICK ACTIONS SECTION */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-2">
                <div className="lg:col-span-2 space-y-4">
                  <h2 
                    className="text-xl font-normal text-slate-900"
                    style={{ fontFamily: "'Marcellus', serif" }}
                  >
                    Incoming Handoffs
                  </h2>
                  {handoffs.length === 0 ? (
                    <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center flex flex-col items-center justify-center gap-3 text-slate-400 shadow-xs">
                      <Inbox className="w-8 h-8 text-slate-300 stroke-1" />
                      <p className="text-xs text-slate-500 font-medium">No active handoffs waiting for you at the moment.</p>
                    </div>
                  ) : (
                    handoffs.map((h) => (
                      <div
                        key={h.id}
                        className="bg-white p-6 rounded-2xl border-l-4 border-l-[#1E2540] border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs"
                      >
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-800">
                            {h.profiles?.full_name || h.assigned_by || 'Colleague'} handed off a step
                          </p>
                          <p className="text-xs text-slate-500">
                            Module: <span className="font-semibold text-slate-700">{h.title}</span>
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedStepId(String(h.id));
                            setActiveTab('log-step');
                          }}
                          className="px-5 py-2.5 bg-[#1E2540] text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                        >
                          Log Step Now &rarr;
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* SIDE HELPER PANEL */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <h3 
                      className="text-base font-normal text-slate-900"
                      style={{ fontFamily: "'Marcellus', serif" }}
                    >
                      Workflow Tips
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Make sure to log all active hours spent and specific AI tools utilized during your assigned pilot tasks. Accurate step logging allows team leads to measure efficiency metrics correctly.
                  </p>
                  <div className="pt-2 border-t border-slate-100">
                    <button
                      onClick={() => setActiveTab('log-step')}
                      className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold rounded-xl transition-colors border border-slate-200/60"
                    >
                      Quick Log Step
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ASSIGNMENTS */}
          {activeTab === 'assignments' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <div className="border-b border-slate-200/80 pb-6 w-full">
                <h1 
                  className="text-3xl font-normal text-slate-900"
                  style={{ fontFamily: "'Marcellus', serif" }}
                >
                  Pending Assignments
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Complete assigned discovery steps, review module requirements, and submit deliverable details.
                </p>
              </div>

              <div className="space-y-4">
                {assignedSteps.length === 0 ? (
                  <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center flex flex-col items-center justify-center gap-3 text-slate-400 shadow-xs">
                    <FileText className="w-8 h-8 text-slate-300 stroke-1" />
                    <p className="text-xs text-slate-500 font-medium">No workflow assignments found for your account.</p>
                  </div>
                ) : (
                  assignedSteps.map((step) => {
                    const isDone = step.status === 'COMPLETED' || step.status === 'APPROVED';
                    return (
                      <div
                        key={step.id}
                        className="bg-white p-6 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xs hover:border-slate-300 transition-all"
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ${
                              isDone ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {isDone ? <CheckCircle2 className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                          </div>
                          <div className="space-y-1">
                            <h3 
                              className="text-lg font-normal text-slate-900"
                              style={{ fontFamily: "'Marcellus', serif" }}
                            >
                              {step.workflows?.title || step.title || 'Workflow Module'}
                            </h3>
                            <p className="text-xs text-slate-500">
                              Assigned: <span className="font-medium text-slate-700">{step.assigned_date || 'Recent'}</span> &bull; Status:{' '}
                              <span
                                className={`font-semibold ${isDone ? 'text-emerald-600' : 'text-amber-600'}`}
                              >
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
                            className="px-5 py-2.5 bg-[#1E2540] text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition-colors cursor-pointer shrink-0 self-end sm:self-center"
                          >
                            Complete Step
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 3: LOG WORKFLOW STEP */}
          {activeTab === 'log-step' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <div className="border-b border-slate-200/80 pb-6 w-full">
                <h1 
                  className="text-3xl font-normal text-slate-900"
                  style={{ fontFamily: "'Marcellus', serif" }}
                >
                  Log Workflow Step
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Record active hours, tools used, and hand off deliverables upon completion.
                </p>
              </div>

              <div className="space-y-6">
                {errorMsg && (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-xs font-semibold flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}
                {successMsg && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl text-xs font-semibold flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <form
                  onSubmit={handleSubmitStep}
                  className="bg-white border border-slate-200/80 rounded-2xl p-8 space-y-6 shadow-xs"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        WORKFLOW STEP *
                      </label>
                      <select
                        required
                        value={selectedStepId}
                        onChange={(e) => setSelectedStepId(e.target.value)}
                        className="w-full p-3.5 bg-[#F8FAFC] border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 transition-all"
                      >
                        <option value="">-- Select Pending Step --</option>
                        {pendingSteps.map((s) => (
                          <option key={s.id} value={s.id}>
                            #{s.id} - {s.workflows?.title || s.title || 'Step'}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        ACTIVE WORK HOURS *
                      </label>
                      <input
                        type="number"
                        step="0.25"
                        min="0.1"
                        placeholder="e.g. 3.5"
                        value={hours}
                        onChange={(e) => setHours(e.target.value)}
                        className="w-full p-3.5 bg-[#F8FAFC] border border-slate-200/80 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      AI TOOLS UTILIZED *
                    </label>
                    <div className="flex flex-wrap gap-2.5">
                      {[...AI_TOOLS, 'Other', 'No AI tools used'].map((tool) => {
                        const isSelected = selectedTools.includes(tool);
                        return (
                          <button
                            key={tool}
                            type="button"
                            onClick={() => toggleTool(tool)}
                            className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#1E2540] text-white border-[#1E2540]'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
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
                        placeholder="Specify other AI tool name"
                        value={otherTool}
                        onChange={(e) => setOtherTool(e.target.value)}
                        className="w-full mt-3 p-3.5 bg-[#F8FAFC] border border-slate-200/80 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                      />
                    )}

                    {selectedTools.includes('No AI tools used') && (
                      <textarea
                        rows={2}
                        placeholder="Describe manual or alternate methods used..."
                        value={noAiReason}
                        onChange={(e) => setNoAiReason(e.target.value)}
                        className="w-full mt-3 p-3.5 bg-[#F8FAFC] border border-slate-200/80 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      HAND OFF DELIVERABLE TO
                    </label>
                    <select
                      value={handoffTarget}
                      onChange={(e) => setHandoffTarget(e.target.value)}
                      className="w-full p-3.5 bg-[#F8FAFC] border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 transition-all"
                    >
                      <option value="">-- Optional Handoff Recipient --</option>
                      {colleagues.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.full_name || c.email}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      DELIVERABLE SUMMARY
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Brief summary of outputs generated or work performed..."
                      value={deliverableSummary}
                      onChange={(e) => setDeliverableSummary(e.target.value)}
                      className="w-full p-3.5 bg-[#F8FAFC] border border-slate-200/80 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400 transition-all"
                    />
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400 pt-2">
                    <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      No confidential files, raw prompts, or proprietary data are transmitted or stored.
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-[#1E2540] hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? 'Submitting Step...' : 'Submit Step & Handoff'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 4: HELP & FAQ */}
          {activeTab === 'help' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <div className="border-b border-slate-200/80 pb-6 w-full">
                <h1 
                  className="text-3xl font-normal text-slate-900"
                  style={{ fontFamily: "'Marcellus', serif" }}
                >
                  Help & FAQ
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Common guidance for candidates on logging steps and managing handoffs.
                </p>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-2xl p-8 space-y-6 shadow-xs">
                <div className="space-y-2">
                  <h3 
                    className="text-base font-semibold text-slate-900"
                    style={{ fontFamily: "'Marcellus', serif" }}
                  >
                    How do handoffs work?
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    When completing a step, selecting a colleague in the "Hand off deliverable to" dropdown automatically creates a pending step in their queue.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 
                    className="text-base font-semibold text-slate-900"
                    style={{ fontFamily: "'Marcellus', serif" }}
                  >
                    Why can't I find a colleague in my dropdown?
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Handoffs are restricted to team members belonging to your exact Organization and Department.
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}