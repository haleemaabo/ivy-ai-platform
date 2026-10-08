'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../../../lib/supabase/client';
import { PortalShell } from '../../../components/PortalShell';
import { ChevronRight, ChevronDown as MapChevron, Network as MapIcon } from 'lucide-react';
import { Marcellus } from 'next/font/google';

const marcellus = Marcellus({
  weight: '400',
  subsets: ['latin'],
});

// Process Map Steps Renderer
function ProcessMap({ steps = [], selectedStep, setSelectedStep }) {
  if (!steps || steps.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#E5E3ED] p-6 text-center text-xs font-sans text-[#79768D]">
        No process map steps recorded for this department.
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-[#E5E3ED] bg-[#EEEEF4]/40 p-4 font-sans">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, idx) => {
          const isSelected =
            selectedStep?.id === step.id ||
            selectedStep?.name === step.name ||
            selectedStep?.title === step.title;

          return (
            <div
              key={step.id || idx}
              onClick={() => setSelectedStep(step)}
              className={`cursor-pointer rounded-lg border p-3.5 transition-all ${
                isSelected
                  ? 'border-[#1F1F3B] bg-white shadow-xs ring-1 ring-[#1F1F3B]'
                  : 'border-[#E5E3ED] bg-white hover:border-[#79768D]'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-semibold text-[#79768D]">
                <span>Step {step.step_number || idx + 1}</span>
                {(step.time || step.duration) && (
                  <span className="text-[11px] text-[#79768D]">
                    {step.time || step.duration}
                  </span>
                )}
              </div>
              <h4 className={`mt-1 text-sm text-[#1F1F3B] ${marcellus.className}`}>
                {step.title || step.name || step.step_name || 'Process Step'}
              </h4>
              {(step.performer || step.role) && (
                <p className="mt-1 text-xs text-[#79768D]">
                  Performer: {step.performer || step.role}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {selectedStep && (
        <div className="rounded-lg border border-[#D3CCDE] bg-[#EEEEF4] p-4 text-xs text-[#1F1F3B] font-sans">
          <p className={`font-bold text-[#1F1F3B] ${marcellus.className}`}>
            {selectedStep.title || selectedStep.name || selectedStep.step_name}
          </p>
          {(selectedStep.description || selectedStep.detail) && (
            <p className="mt-1 text-[#4C4B64]">
              {selectedStep.description || selectedStep.detail}
            </p>
          )}
          {(selectedStep.tools || selectedStep.ai_tools) && (
            <p className="mt-2 font-medium text-[#1F1F3B]">
              Tools:{' '}
              {Array.isArray(selectedStep.tools || selectedStep.ai_tools)
                ? (selectedStep.tools || selectedStep.ai_tools).join(', ')
                : selectedStep.tools || selectedStep.ai_tools}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Collapsible Department Process Map Wrapper
function DepartmentProcessMap({ deptName, deptId }) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mapData, setMapData] = useState(null);
  const [selectedStep, setSelectedStep] = useState(null);

  useEffect(() => {
    if (!open) return;

    async function fetchProcessMap() {
      setLoading(true);
      let query = supabase.from('process_maps').select('*');

      if (deptId) {
        query = query.eq('department_id', deptId);
      } else {
        query = query.ilike('department_name', deptName);
      }

      const { data } = await query.maybeSingle();

      if (data) {
        const steps =
          data.steps ||
          data.process_steps ||
          (typeof data.process_data === 'string'
            ? JSON.parse(data.process_data)
            : data.process_data) ||
          [];

        setMapData({
          owner: data.owner || data.process_owner || deptName,
          workflow: data.workflow || data.workflow_name || 'Standard Flow',
          steps: Array.isArray(steps) ? steps : [],
        });
      } else {
        setMapData({
          owner: deptName,
          workflow: 'Standard Operational Flow',
          steps: [],
        });
      }
      setLoading(false);
    }

    fetchProcessMap();
  }, [open, deptName, deptId, supabase]);

  return (
    <div className="border-t border-[#E5E3ED] font-sans">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-[#F7F9FB] sm:px-6 cursor-pointer"
      >
        <span className="flex items-center gap-2 font-semibold text-[#1F1F3B]">
          <MapIcon className="h-4 w-4 text-[#1F1F3B]" />
          Process map
          <span className="hidden text-sm font-normal text-[#79768D] sm:inline">
            · {mapData?.owner || deptName} — {mapData?.workflow || 'Overview'}
          </span>
        </span>
        <MapChevron
          className={`h-5 w-5 text-[#79768D] transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div className="px-5 pb-5 sm:px-6 sm:pb-6">
          <p className="mb-3 text-sm text-[#79768D]">
            Click a step for performer, time, and AI tools.
          </p>
          {loading ? (
            <div className="py-6 text-center text-xs text-[#79768D]">
              Loading process map details...
            </div>
          ) : (
            <ProcessMap
              steps={mapData?.steps}
              selectedStep={selectedStep}
              setSelectedStep={setSelectedStep}
            />
          )}
        </div>
      )}
    </div>
  );
}

// Helper to determine department styling tone
function performanceTone(value) {
  if (value >= 75) {
    return {
      badge: 'bg-emerald-600 text-white',
      surface: 'bg-emerald-50/40',
    };
  }
  if (value >= 60) {
    return {
      badge: 'bg-[#1F1F3B] text-white',
      surface: 'bg-[#EEEEF4]/40',
    };
  }
  if (value >= 50) {
    return {
      badge: 'bg-amber-500 text-white',
      surface: 'bg-amber-50/40',
    };
  }
  return {
    badge: 'bg-rose-600 text-white',
    surface: 'bg-rose-50/40',
  };
}

export default function DepartmentsPage() {
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState({ email: '', role: '' });
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, email')
          .eq('id', user.id)
          .single();

        setUserProfile({
          email: user.email || profile?.email || '',
          role: profile?.role || 'Executive',
        });
      }

      const { data: depts } = await supabase
        .from('departments')
        .select('*');

      setDepartments(depts || []);
      setLoading(false);
    }

    fetchData();
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center font-sans font-medium text-[#79768D]">
        Loading Department Intelligence...
      </div>
    );
  }

  return (
    <PortalShell email={userProfile.email} role={userProfile.role}>
      <section id="departments" className="mb-10 scroll-mt-24">
        {/* Header */}
        <div className="mb-7 border-b border-[#E5E3ED] pb-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#1F1F3B]">
                Evidence explorer
              </p>
              <h2 className={`mt-1 text-3xl font-normal text-[#1F1F3B] ${marcellus.className}`}>
                Department breakdowns
              </h2>
              <p className="mt-2 text-sm text-[#79768D]">
                Operational results and process detail by operational area.
              </p>
            </div>
            <button
              onClick={() => router.push('/executive')}
              className="flex items-center gap-1 text-sm font-semibold text-[#1F1F3B] hover:underline cursor-pointer"
            >
              Back to overview
              <ChevronRight className="h-4 w-4 rotate-180" />
            </button>
          </div>
        </div>

        {/* Content */}
        {departments.length === 0 ? (
          <div className="rounded-2xl border border-[#E5E3ED] bg-white p-12 text-center text-sm text-[#79768D]">
            No department records available.
          </div>
        ) : (
          <div className="space-y-6">
            {departments.map((department) => {
              const indexVal = department.index || department.adoption_index || 0;
              const tone = performanceTone(indexVal);

              return (
                <article
                  key={department.name || department.id}
                  className="overflow-hidden rounded-2xl border border-[#E5E3ED] bg-white shadow-xs"
                >
                  <div className={`grid gap-5 border-b border-[#E5E3ED] p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_repeat(2,minmax(110px,auto))] lg:items-center ${tone.surface}`}>
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className={`text-2xl font-normal text-[#1F1F3B] ${marcellus.className}`}>
                          {department.name}
                        </h3>
                        <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${tone.badge}`}>
                          {indexVal} adoption index
                        </span>
                      </div>
                    </div>

                    <dl className="contents">
                      <div>
                        <dt className="text-xs text-[#79768D]">Quality Score</dt>
                        <dd className="mt-1 text-xl font-bold text-[#1F1F3B]">
                          {department.quality || department.quality_score ? `${department.quality || department.quality_score} / 5` : 'N/A'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-[#79768D]">Turnaround Time</dt>
                        <dd className="mt-1 text-xl font-bold text-[#1F1F3B]">
                          {department.turnaroundAfter || department.turnaround_days
                            ? `${department.turnaroundAfter || department.turnaround_days}d`
                            : 'N/A'}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  {/* Dynamic Department Process Map */}
                  <DepartmentProcessMap
                    deptName={department.name}
                    deptId={department.id}
                  />
                </article>
              );
            })}
          </div>
        )}
      </section>
    </PortalShell>
  );
}