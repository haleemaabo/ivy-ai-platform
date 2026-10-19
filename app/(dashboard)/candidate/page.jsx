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
  Play,
  UserCheck,
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
  const [activeTab, setActiveTab] = useState('home');

  // Data States from Supabase
  const [assignedSteps, setAssignedSteps] = useState([]);
  const [allWorkflows, setAllWorkflows] = useState([]);
  const [workflowTemplates, setWorkflowTemplates] = useState([]);
  const [handoffs, setHandoffs] = useState([]);
  const [colleagues, setColleagues] = useState([]);
  const [managers, setManagers] = useState([]);

  // Form States for Logging a Step
  const [selectedWorkflowId, setSelectedWorkflowId] = useState('');
  const [selectedStepId, setSelectedStepId] = useState('');
  const [hours, setHours] = useState('');
  const [selectedTools, setSelectedTools] = useState([]);
  const [otherTool, setOtherTool] = useState('');
  const [noAiReason, setNoAiReason] = useState('');
  const [handoffType, setHandoffType] = useState('COLLEAGUE');
  const [handoffTarget, setHandoffTarget] = useState('');
  const [selectedManagerId, setSelectedManagerId] = useState('');
  const [deliverableSummary, setDeliverableSummary] = useState('');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // UI Feedback States
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Session & Data
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

      // Fetch Candidate Profile
      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, organization, department, job_title, employee_id, city, country, gender, age, years_in_company, years_in_role, created_at')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profileErr) throw profileErr;

      const currentProf = profileData || {
        id: session.user.id,
        email: session.user.email,
        full_name: 'Candidate',
      };
      setProfile(currentProf);

      // Fetch Workflow Steps
      const { data: stepsData, error: stepsErr } = await supabase
        .from('workflow_steps')
        .select('*, workflows (id, title, name, department, organization, is_approved)')
        .or(`performer_id.eq.${session.user.id},handoff_target_id.eq.${session.user.id}`)
        .order('created_at', { ascending: false });

      if (stepsErr) console.warn('Error loading user steps:', stepsErr.message);
      const userSteps = stepsData || [];
      setAssignedSteps(userSteps);

      const assignedWfIds = Array.from(
        new Set(userSteps.map((s) => s.workflow_id).filter(Boolean))
      );

      if (assignedWfIds.length > 0) {
        const { data: wfStepsData } = await supabase
          .from('workflow_steps')
          .select('*, workflows (id, title, name, department, is_approved)')
          .in('workflow_id', assignedWfIds)
          .order('step_order', { ascending: true });

        setAllWorkflows(wfStepsData || []);

        const { data: wfHeaders } = await supabase
          .from('workflows')
          .select('*')
          .in('id', assignedWfIds);

        setWorkflowTemplates(wfHeaders || []);
      }

      // Fetch Pending Candidate Handoffs
      const { data: handoffData } = await supabase
        .from('workflow_steps')
        .select('*, profiles!workflow_steps_assigned_by_fkey(full_name, email, role), workflows (id, title, name, department, is_approved)')
        .or(`performer_id.eq.${session.user.id},handoff_target_id.eq.${session.user.id}`)
        .eq('status', 'PENDING');

      const genuineHandoffs = (handoffData || []).filter((h) => {
        const assignerRole = (h.profiles?.role || '').toUpperCase();
        return assignerRole !== 'ADMIN';
      });

      setHandoffs(genuineHandoffs);

      // Fetch Colleagues and Managers
      if (currentProf?.organization) {
        const { data: teamData } = await supabase
          .from('profiles')
          .select('id, full_name, email, organization, department, role')
          .eq('organization', currentProf.organization)
          .neq('id', session.user.id);

        const filteredColleagues = (teamData || []).filter(
          (u) => (u.role || '').toUpperCase() === 'CANDIDATE'
        );
        const filteredManagers = (teamData || []).filter(
          (u) => (u.role || '').toUpperCase() === 'MANAGER'
        );

        setColleagues(filteredColleagues);
        setManagers(filteredManagers);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load candidate data');
    } finally {
      setLoading(false);
    }
  }, [supabase, router]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // Active Workflows filter (Only show processes that are NOT fully completed or approved)
  const activeWorkflowProcesses = useMemo(() => {
    return workflowTemplates
      .filter((wf) => {
        if (wf.is_approved) return false;
        const stepsForWf = allWorkflows.filter((s) => String(s.workflow_id) === String(wf.id));
        if (stepsForWf.length > 0 && stepsForWf.every((s) => s.status === 'APPROVED' || s.status === 'COMPLETED')) {
          return false;
        }
        return true;
      })
      .map((wf) => {
        const stepsForWf = allWorkflows.filter(
          (s) => String(s.workflow_id) === String(wf.id)
        );
        return {
          ...wf,
          steps: stepsForWf,
        };
      });
  }, [workflowTemplates, allWorkflows]);

  // All Workflows (including completed for candidate historical view)
  const allAssignedProcesses = useMemo(() => {
    return workflowTemplates.map((wf) => {
      const stepsForWf = allWorkflows.filter((s) => String(s.workflow_id) === String(wf.id));
      const isCompleted = wf.is_approved || (stepsForWf.length > 0 && stepsForWf.every((s) => s.status === 'APPROVED' || s.status === 'COMPLETED'));
      return {
        ...wf,
        steps: stepsForWf,
        isCompleted,
      };
    });
  }, [workflowTemplates, allWorkflows]);

  const stepsForSelectedWorkflow = useMemo(() => {
    if (!selectedWorkflowId) return [];
    const selectedWfHeader = workflowTemplates.find(
      (wf) => String(wf.id) === String(selectedWorkflowId)
    );
    const parentTitle = (selectedWfHeader?.title || selectedWfHeader?.name || '')
      .trim()
      .toLowerCase();

    return allWorkflows
      .filter((s) => String(s.workflow_id) === String(selectedWorkflowId))
      .filter((s) => {
        const stepTitle = (s.task_name || '').trim().toLowerCase();
        return stepTitle !== parentTitle && !stepTitle.startsWith('handoff from');
      })
      .sort((a, b) => (a.step_order || 0) - (b.step_order || 0));
  }, [allWorkflows, selectedWorkflowId, workflowTemplates]);

  const completedSteps = useMemo(() => {
    return assignedSteps.filter(
      (s) =>
        s.status === 'APPROVED' ||
        s.status === 'COMPLETED' ||
        s.status === 'SUBMITTED TO MANAGER'
    );
  }, [assignedSteps]);

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

  const handleSubmitStep = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedWorkflowId) return setErrorMsg('Please select a workflow process.');
    if (!selectedStepId) return setErrorMsg('Please select a step in the process.');
    if (selectedTools.length === 0) return setErrorMsg('Please select at least one AI tool option.');
    if (selectedTools.includes('No AI tools used') && !noAiReason.trim()) return setErrorMsg('Please state what you used instead of AI tools.');
    if (selectedTools.includes('Other') && !otherTool.trim()) return setErrorMsg('Please specify the other AI tool used.');
    if (!hours || Number(hours) <= 0) return setErrorMsg('Please enter valid active work hours.');
    if (handoffType === 'COLLEAGUE' && !handoffTarget) return setErrorMsg('Please select a colleague to hand off the next step.');
    if (handoffType === 'MANAGER' && !selectedManagerId) return setErrorMsg('Please select a manager to submit the workflow.');

    setIsSubmitting(true);
    try {
      const stepToUpdate = allWorkflows.find((s) => String(s.id) === String(selectedStepId));
      const toolsArray = selectedTools.map((t) => (t === 'Other' ? otherTool : t));
      const finalStatus = handoffType === 'MANAGER' ? 'SUBMITTED TO MANAGER' : 'APPROVED';

      const targetColleagueId = handoffType === 'COLLEAGUE' ? handoffTarget : null;
      const targetManagerId = handoffType === 'MANAGER' ? selectedManagerId : null;
      const finalHandoffTarget = targetColleagueId || targetManagerId;

      const { error: updateErr } = await supabase
        .from('workflow_steps')
        .update({
          status: finalStatus,
          completed_date: endDate,
          end_time: new Date().toISOString(),
          duration_hours: parseFloat(hours),
          deliverable_summary: deliverableSummary,
          tools_tagged: toolsArray,
          no_ai_reason: selectedTools.includes('No AI tools used') ? noAiReason : null,
          other_tool: selectedTools.includes('Other') ? otherTool : null,
          handoff_target_id: finalHandoffTarget,
          assigned_by: profile.id,
        })
        .eq('id', selectedStepId);

      if (updateErr) throw updateErr;

      if (handoffType === 'COLLEAGUE' && handoffTarget) {
        const targetUser = colleagues.find((c) => c.id === handoffTarget || c.email === handoffTarget);

        const selectedWfHeader = workflowTemplates.find((wf) => String(wf.id) === String(selectedWorkflowId));
        const parentTitle = (selectedWfHeader?.title || selectedWfHeader?.name || '').trim().toLowerCase();

        const realSteps = allWorkflows
          .filter((s) => String(s.workflow_id) === String(selectedWorkflowId))
          .filter((s) => {
            const t = (s.task_name || '').trim().toLowerCase();
            return t !== parentTitle && !t.startsWith('handoff from');
          })
          .sort((a, b) => (a.step_order || 0) - (b.step_order || 0));

        const currentIndex = realSteps.findIndex((s) => String(s.id) === String(selectedStepId));
        const nextStep = realSteps[currentIndex + 1];

        if (nextStep) {
          await supabase
            .from('workflow_steps')
            .update({
              performer_id: targetUser.id,
              assigned_by: profile.id,
              handoff_target_id: targetUser.id,
              status: 'PENDING',
              assigned_date: new Date().toISOString().split('T')[0],
              start_time: new Date().toISOString(),
            })
            .eq('id', nextStep.id);
        } else {
          const nextOrder = (stepToUpdate?.step_order || 1) + 1;
          await supabase.from('workflow_steps').insert({
            performer_id: targetUser.id,
            handoff_target_id: targetUser.id,
            assigned_by: profile.id,
            workflow_id: selectedWorkflowId,
            step_order: nextOrder,
            task_name: `Step ${nextOrder}`,
            start_time: new Date().toISOString(),
            assigned_date: new Date().toISOString().split('T')[0],
            status: 'PENDING',
            is_final_step: false,
          });
        }
      } else if (handoffType === 'MANAGER' && selectedManagerId) {
        const nextOrder = (stepToUpdate?.step_order || 1) + 1;
        await supabase.from('workflow_steps').insert({
          performer_id: selectedManagerId,
          handoff_target_id: selectedManagerId,
          assigned_by: profile.id,
          workflow_id: selectedWorkflowId,
          step_order: nextOrder,
          task_name: `Final Review for ${stepToUpdate?.task_name || 'Workflow'}`,
          start_time: new Date().toISOString(),
          assigned_date: new Date().toISOString().split('T')[0],
          status: 'SUBMITTED TO MANAGER',
          is_final_step: true,
          deliverable_summary: deliverableSummary,
        });
      }

      setSuccessMsg(
        handoffType === 'MANAGER'
          ? 'Workflow process finalized and submitted to manager for review!'
          : 'Step completed and handed off to colleague!'
      );

      setSelectedWorkflowId('');
      setSelectedStepId('');
      setHours('');
      setSelectedTools([]);
      setOtherTool('');
      setNoAiReason('');
      setDeliverableSummary('');
      setHandoffTarget('');
      setSelectedManagerId('');
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
    <div className={`${inter.variable} ${marcellus.variable} min-h-screen bg-[#F8FAFC] text-[#1E293B] flex flex-col antialiased`}>
      {/* HEADER BAR */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 px-8 py-3 flex items-center justify-between h-16">
        <div className="flex items-center gap-4">
          <Image src="/ivy-logo-dark.png" alt="IVY & COMPANY" width={60} height={40} priority className="object-contain" />
          <span className="text-[10px] font-bold tracking-[0.18em] text-slate-400 uppercase border-l border-slate-200 pl-4 py-1">
            Candidate Portal
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#F1F5F9]/80 border border-slate-200/60 rounded-full px-3.5 py-1.5 text-slate-600">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-medium text-slate-600">{profile?.email}</span>
          </div>
          <button onClick={handleLogout} className="p-2 border border-slate-200/60 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 cursor-pointer">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <div className="flex-1 w-full px-8 py-8 flex gap-8 items-start">
        {/* SIDEBAR NAVIGATION */}
        <aside className="w-[230px] shrink-0 space-y-1.5 sticky top-24">
          <button
            onClick={() => setActiveTab('home')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold cursor-pointer ${
              activeTab === 'home' ? 'bg-[#1E2540] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100/80'
            }`}
          >
            <ClipboardList className="w-4 h-4 shrink-0" />
            <span>Dashboard Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('assignments')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold cursor-pointer ${
              activeTab === 'assignments' ? 'bg-[#1E2540] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100/80'
            }`}
          >
            <div className="flex items-center gap-3">
              <Inbox className="w-4 h-4 shrink-0" />
              <span>Assigned Workflows</span>
            </div>
            {activeWorkflowProcesses.length > 0 && (
              <span className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                {activeWorkflowProcesses.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('log-step')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold cursor-pointer ${
              activeTab === 'log-step' ? 'bg-[#1E2540] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100/80'
            }`}
          >
            <Send className="w-4 h-4 shrink-0" />
            <span>Log Workflow Step</span>
          </button>

          <button
            onClick={() => setActiveTab('help')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold cursor-pointer ${
              activeTab === 'help' ? 'bg-[#1E2540] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100/80'
            }`}
          >
            <HelpCircle className="w-4 h-4 shrink-0" />
            <span>Help & FAQ</span>
          </button>
        </aside>

        {/* MAIN BODY */}
        <main className="flex-1 min-w-0 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'home' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <div className="border-b border-slate-200/80 pb-6 w-full">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Welcome Back</p>
                <h1 className="text-3xl font-normal text-[#1F1F3B] mt-1" style={{ fontFamily: "'Marcellus', serif" }}>
                  {profile?.full_name || 'Candidate'}
                </h1>
                <p className="text-sm text-slate-500 mt-1.5 max-w-2xl">
                  You are involved in <b>{activeWorkflowProcesses.length} active workflow process(es)</b>. Select a step to execute, record work hours, and hand off to colleagues or submit to a manager.
                </p>
              </div>

              {/* STAT CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div onClick={() => setActiveTab('assignments')} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 cursor-pointer flex flex-col justify-between h-40">
                  <div className="flex justify-between items-start">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Workflows</p>
                    <div className="p-2 bg-slate-50 rounded-xl"><Clock className="w-4 h-4 text-slate-400" /></div>
                  </div>
                  <div>
                    <p className="text-4xl font-normal text-slate-900" style={{ fontFamily: "'Marcellus', serif" }}>
                      {activeWorkflowProcesses.length}
                    </p>
                    <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
                      <span>Active assigned processes</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </div>

                <div onClick={() => setActiveTab('assignments')} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 cursor-pointer flex flex-col justify-between h-40">
                  <div className="flex justify-between items-start">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Incoming Handoffs</p>
                    <div className="p-2 bg-slate-50 rounded-xl"><Inbox className="w-4 h-4 text-slate-400" /></div>
                  </div>
                  <div>
                    <p className="text-4xl font-normal text-slate-900" style={{ fontFamily: "'Marcellus', serif" }}>
                      {handoffs.length}
                    </p>
                    <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
                      <span>From candidate colleagues</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </div>

                <div onClick={() => setActiveTab('log-step')} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 cursor-pointer flex flex-col justify-between h-40">
                  <div className="flex justify-between items-start">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Completed Steps</p>
                    <div className="p-2 bg-emerald-50 rounded-xl"><CheckCircle2 className="w-4 h-4 text-emerald-600" /></div>
                  </div>
                  <div>
                    <p className="text-4xl font-normal text-emerald-600" style={{ fontFamily: "'Marcellus', serif" }}>
                      {completedSteps.length}
                    </p>
                    <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
                      <span>Submitted step logs</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* CANDIDATE HANDOFFS */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-2">
                <div className="lg:col-span-2 space-y-4">
                  <h2 className="text-xl font-normal text-slate-900" style={{ fontFamily: "'Marcellus', serif" }}>
                    Incoming Colleague Handoffs
                  </h2>
                  {handoffs.length === 0 ? (
                    <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center flex flex-col items-center justify-center gap-3 text-slate-400 shadow-xs">
                      <Inbox className="w-8 h-8 text-slate-300 stroke-1" />
                      <p className="text-xs text-slate-500 font-medium">No candidate-to-candidate handoffs waiting for you.</p>
                    </div>
                  ) : (
                    handoffs.map((h) => {
                      const wfHeader = workflowTemplates.find((w) => String(w.id) === String(h.workflow_id));
                      const workflowTitle = wfHeader?.title || wfHeader?.name || h.workflows?.title || h.workflows?.name || 'Accounting Process';
                      const parentTitle = workflowTitle.trim().toLowerCase();

                      const validProcessSteps = allWorkflows
                        .filter((s) => String(s.workflow_id) === String(h.workflow_id))
                        .filter((s) => {
                          const title = (s.task_name || '').trim().toLowerCase();
                          return title !== parentTitle && !title.startsWith('handoff from');
                        })
                        .sort((a, b) => (a.step_order || 0) - (b.step_order || 0));

                      const currentStepIndex = validProcessSteps.findIndex((s) => String(s.id) === String(h.id));
                      let completedStepObj = null;
                      let currentStepObj = null;

                      if (currentStepIndex > 0) {
                        completedStepObj = validProcessSteps[currentStepIndex - 1];
                        currentStepObj = validProcessSteps[currentStepIndex];
                      } else if (validProcessSteps.length > 0) {
                        completedStepObj = validProcessSteps[0];
                        currentStepObj = validProcessSteps[1] || validProcessSteps[0];
                      }

                      const completedStepName = completedStepObj?.task_name || 'Step 1';
                      const cleanNextStepTitle = (currentStepObj?.task_name || h.task_name || '').replace(/^Handoff from [^:]+:\s*/i, '');
                      const displayStepNumber = currentStepIndex >= 0 ? currentStepIndex + 1 : h.step_order || 1;
                      const assignerName = h.profiles?.full_name || 'Colleague';

                      return (
                        <div key={h.id} className="bg-white p-6 rounded-2xl border-l-4 border-l-[#1E2540] border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-slate-800">
                              Handoff from {assignerName}: <span className="italic font-normal">"{workflowTitle} - {completedStepName}"</span> completed.
                            </p>
                            <p className="text-xs text-slate-500">
                              Next: <span className="font-semibold text-slate-700">Step {displayStepNumber}: {cleanNextStepTitle}</span>
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedWorkflowId(String(h.workflow_id));
                              setSelectedStepId(String(currentStepObj?.id || h.id));
                              setActiveTab('log-step');
                            }}
                            className="px-5 py-2.5 bg-[#1E2540] text-white text-xs font-semibold rounded-xl hover:bg-slate-800 cursor-pointer shrink-0"
                          >
                            Log Step Now &rarr;
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <h3 className="text-base font-normal text-slate-900" style={{ fontFamily: "'Marcellus', serif" }}>
                      Workflow Guidance
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    You can perform and log any step of an active workflow process. Upon completing your step, hand off the deliverable to the next candidate or submit it to your reviewing manager if it is the final step.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ASSIGNED WORKFLOWS */}
          {activeTab === 'assignments' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <div className="border-b border-slate-200/80 pb-6 w-full">
                <h1 className="text-3xl font-normal text-slate-900" style={{ fontFamily: "'Marcellus', serif" }}>
                  Assigned Workflow Processes
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  View all workflow processes assigned to your account.
                </p>
              </div>

              <div className="space-y-6">
                {allAssignedProcesses.length === 0 ? (
                  <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center flex flex-col items-center justify-center gap-3 text-slate-400 shadow-xs">
                    <FileText className="w-8 h-8 text-slate-300 stroke-1" />
                    <p className="text-xs text-slate-500 font-medium">No workflow processes assigned.</p>
                  </div>
                ) : (
                  allAssignedProcesses.map((wf) => (
                    <div key={wf.id} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl font-normal text-slate-900" style={{ fontFamily: "'Marcellus', serif" }}>
                              {wf.title || wf.name}
                            </h3>
                            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                              {wf.department || 'Department'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            Status:{' '}
                            {wf.isCompleted ? (
                              <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                                Completed Process ({wf.steps.length} steps)
                              </span>
                            ) : (
                              <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                                Active Workflow Process ({wf.steps.length} steps)
                              </span>
                            )}
                          </p>
                        </div>

                        {!wf.isCompleted && (
                          <button
                            onClick={() => {
                              setSelectedWorkflowId(String(wf.id));
                              setActiveTab('log-step');
                            }}
                            className="px-4 py-2 bg-[#1E2540] text-white text-xs font-semibold rounded-xl hover:bg-slate-800 cursor-pointer flex items-center gap-1.5 shrink-0"
                          >
                            <Play className="w-3.5 h-3.5 fill-white" />
                            <span>Start / Log Step</span>
                          </button>
                        )}
                      </div>

                      <div className="space-y-2 pt-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">All Process Steps:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {wf.steps.map((st, idx) => (
                            <div key={st.id} className="p-3 bg-[#F8FAFC] rounded-xl text-xs flex items-center justify-between border border-slate-200/60">
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center">
                                  {st.step_order || idx + 1}
                                </span>
                                <span className="font-medium text-slate-800">
                                  {(st.task_name || `Step ${idx + 1}`).replace(/^Handoff from [^:]+:\s*/i, '')}
                                </span>
                              </div>
                              <span className="text-[10px] font-semibold text-slate-400">
                                {st.status === 'COMPLETED' || st.status === 'APPROVED' || st.status === 'SUBMITTED TO MANAGER' || wf.isCompleted ? (
                                  <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Completed</span>
                                ) : (
                                  'Pending'
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: LOG WORKFLOW STEP */}
          {activeTab === 'log-step' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <div className="border-b border-slate-200/80 pb-6 w-full">
                <h1 className="text-3xl font-normal text-slate-900" style={{ fontFamily: "'Marcellus', serif" }}>
                  Log Workflow Step
                </h1>
                <p className="text-xs text-slate-500 mt-1">Select your process, execute your step, and hand off to a colleague or submit to a manager.</p>
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

                <form onSubmit={handleSubmitStep} className="bg-white border border-slate-200/80 rounded-2xl p-8 space-y-6 shadow-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">WORKFLOW PROCESS *</label>
                      <select
                        required
                        value={selectedWorkflowId}
                        onChange={(e) => {
                          setSelectedWorkflowId(e.target.value);
                          setSelectedStepId('');
                        }}
                        className="w-full p-3.5 bg-[#F8FAFC] border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-800"
                      >
                        <option value="">-- Select Assigned Workflow Process --</option>
                        {activeWorkflowProcesses.map((wf) => (
                          <option key={wf.id} value={wf.id}>
                            {wf.title || wf.name} ({wf.department || 'General'})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">PROCESS STEP *</label>
                      <select
                        required
                        disabled={!selectedWorkflowId}
                        value={selectedStepId}
                        onChange={(e) => setSelectedStepId(e.target.value)}
                        className="w-full p-3.5 bg-[#F8FAFC] border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-800 disabled:opacity-50"
                      >
                        <option value="">
                          {selectedWorkflowId ? '-- Select Executed Step --' : 'Choose Process First --'}
                        </option>
                        {stepsForSelectedWorkflow.map((st, idx) => {
                          const cleanTitle = (st.task_name || '').replace(/^Handoff from [^:]+:\s*/i, '');
                          return (
                            <option key={st.id} value={st.id}>
                              Step {idx + 1}: {cleanTitle}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">ACTIVE WORK HOURS *</label>
                    <input
                      type="number"
                      step="0.25"
                      min="0.25"
                      placeholder="e.g. 3.5"
                      value={hours}
                      onChange={(e) => setHours(e.target.value)}
                      className="w-full p-3.5 bg-[#F8FAFC] border border-slate-200/80 rounded-xl text-xs text-slate-900"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">AI TOOLS UTILIZED *</label>
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
                        className="w-full mt-3 p-3.5 bg-[#F8FAFC] border border-slate-200/80 rounded-xl text-xs text-slate-900"
                      />
                    )}

                    {selectedTools.includes('No AI tools used') && (
                      <textarea
                        rows={2}
                        placeholder="Describe manual or alternate methods used..."
                        value={noAiReason}
                        onChange={(e) => setNoAiReason(e.target.value)}
                        className="w-full mt-3 p-3.5 bg-[#F8FAFC] border border-slate-200/80 rounded-xl text-xs text-slate-900"
                      />
                    )}
                  </div>

                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">HANDOFF ROUTING *</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setHandoffType('COLLEAGUE');
                          setSelectedManagerId('');
                        }}
                        className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer ${
                          handoffType === 'COLLEAGUE' ? 'bg-[#1E2540] text-white border-[#1E2540]' : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        <User className="w-4 h-4" />
                        <span>Hand Off to Next Candidate</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setHandoffType('MANAGER');
                          setHandoffTarget('');
                        }}
                        className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer ${
                          handoffType === 'MANAGER' ? 'bg-[#1E2540] text-white border-[#1E2540]' : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>Submit Final Step to Manager</span>
                      </button>
                    </div>

                    {handoffType === 'COLLEAGUE' && (
                      <div className="space-y-1.5 pt-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Select Next Candidate (Required) *</label>
                        <select
                          required
                          value={handoffTarget}
                          onChange={(e) => setHandoffTarget(e.target.value)}
                          className="w-full p-3.5 bg-[#F8FAFC] border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-800"
                        >
                          <option value="">-- Choose Colleague Candidate --</option>
                          {colleagues.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.full_name || c.email} ({c.department || 'Department'})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {handoffType === 'MANAGER' && (
                      <div className="space-y-1.5 pt-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Select Reviewing Manager (Required) *</label>
                        <select
                          required
                          value={selectedManagerId}
                          onChange={(e) => setSelectedManagerId(e.target.value)}
                          className="w-full p-3.5 bg-[#F8FAFC] border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-800"
                        >
                          <option value="">-- Choose Reviewing Manager --</option>
                          {managers.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.full_name || m.email} (Manager - {m.department || 'General'})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">DELIVERABLE SUMMARY</label>
                    <textarea
                      rows={4}
                      placeholder="Brief summary of outputs generated or work performed..."
                      value={deliverableSummary}
                      onChange={(e) => setDeliverableSummary(e.target.value)}
                      className="w-full p-3.5 bg-[#F8FAFC] border border-slate-200/80 rounded-xl text-xs text-slate-900"
                    />
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400 pt-2">
                    <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>No confidential files, raw prompts, or proprietary data are transmitted or stored.</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-[#1E2540] hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting
                      ? 'Submitting Step...'
                      : handoffType === 'MANAGER'
                      ? 'Submit Final Step to Manager'
                      : 'Submit Step & Hand Off'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 4: HELP & FAQ */}
          {activeTab === 'help' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <div className="border-b border-slate-200/80 pb-6 w-full">
                <h1 className="text-3xl font-normal text-slate-900" style={{ fontFamily: "'Marcellus', serif" }}>
                  Help & FAQ
                </h1>
                <p className="text-xs text-slate-500 mt-1">Common guidance on logging steps and manager submissions.</p>
              </div>
              <div className="bg-white border border-slate-200/80 rounded-2xl p-8 space-y-6 shadow-xs">
                <div className="space-y-2">
                  <h3 className="text-base font-semibold text-slate-900" style={{ fontFamily: "'Marcellus', serif" }}>
                    How do handoffs work?
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Candidate-to-candidate handoffs route active steps to fellow team members. Submitting the final step routes the completed process map directly to your manager for review.
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