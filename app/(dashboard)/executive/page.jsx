'use client';

import PortalShell from '../../components/PortalShell';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '../../../lib/supabase/client';
import {
  AlertTriangle,
  ArrowUpRight,
  ChevronRight,
  ChevronDown as MapChevron,
  Network as MapIcon,
} from 'lucide-react';

// Dynamic Process Map Component
function ProcessMap({ steps = [], selectedStep, setSelectedStep }) {
  if (!steps || steps.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#E5E3ED] p-6 text-center text-xs text-[#79768D] font-sans">
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
              <h4 className="mt-1 font-serif text-[#1F1F3B] text-sm">
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
          <p className="font-bold text-[#1F1F3B] font-serif">
            {selectedStep.title || selectedStep.name || selectedStep.step_name}
          </p>
          {(selectedStep.description || selectedStep.detail) && (
            <p className="mt-1 text-[#4C4B64]">
              {selectedStep.description || selectedStep.detail}
            </p>
          )}
          {(selectedStep.tools || selectedStep.ai_tools) && (
            <p className="mt-2 text-[#1F1F3B] font-medium">
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
          workflow: data.workflow || data.workflow_name || 'Workflow Overview',
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
            — {mapData?.owner || deptName} ({mapData?.workflow || 'Overview'})
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

function Stat({ label, value, sub, trend }) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-[#E5E3ED] shadow-xs flex flex-col justify-between">
      <p className="text-[10px] font-bold text-[#79768D] uppercase tracking-wider">
        {label}
      </p>
      <p
        className="text-3xl font-normal text-[#1F1F3B] mt-2"
        style={{ fontFamily: "'Marcellus', serif" }}
      >
        {value ?? '-'}
      </p>
      {sub && <p className="text-xs text-[#79768D] mt-1">{sub}</p>}
      {trend && (
        <p className="text-xs text-emerald-600 font-medium mt-1">
          {trend === 'up' ? '▲ Trending Up' : trend}
        </p>
      )}
    </div>
  );
}

function performanceTone(value) {
  if (value >= 75) {
    return {
      badge: 'bg-emerald-600 text-white',
      surface: 'bg-emerald-50/40',
      border: 'border-l-emerald-600',
    };
  }
  if (value >= 60) {
    return {
      badge: 'bg-[#1F1F3B] text-white',
      surface: 'bg-[#EEEEF4]/40',
      border: 'border-l-[#1F1F3B]',
    };
  }
  if (value >= 50) {
    return {
      badge: 'bg-amber-500 text-white',
      surface: 'bg-amber-50/40',
      border: 'border-l-amber-500',
    };
  }
  return {
    badge: 'bg-rose-600 text-white',
    surface: 'bg-rose-50/40',
    border: 'border-l-rose-600',
  };
}

function TrendChart({ trendData = [] }) {
  if (!trendData || trendData.length === 0) {
    return (
      <div className="h-[310px] flex items-center justify-center text-xs text-[#79768D]">
        No trend data recorded.
      </div>
    );
  }

  const stepX = trendData.length > 1 ? 340 / (trendData.length - 1) : 0;
  
  const points = trendData
    .map((item, index) => `${28 + index * stepX},${190 - (item.adoption || 0) * 1.55}`)
    .join(' ');

  const verified = trendData
    .map((item, index) => `${28 + index * stepX},${190 - (item.verified || 0) * 1.55}`)
    .join(' ');

  const target = trendData
    .map((item, index) => `${28 + index * stepX},${190 - (item.target || 0) * 1.55}`)
    .join(' ');

  const area = `28,190 ${points} ${28 + (trendData.length - 1) * stepX},190`;

  return (
    <div className="h-[310px] w-full" aria-label="Adoption and output trend chart">
      <svg viewBox="0 0 400 250" className="h-full w-full" role="img">
        {[35, 74, 113, 152, 190].map((y) => (
          <line
            key={y}
            x1="28"
            x2="368"
            y1={y}
            y2={y}
            stroke="#E5E3ED"
            strokeDasharray="3 3"
          />
        ))}
        <polygon points={area} fill="#1F1F3B" opacity="0.08" />
        <polyline
          points={target}
          fill="none"
          stroke="#79768D"
          strokeWidth="2"
          strokeDasharray="6 5"
        />
        <polyline
          points={verified}
          fill="none"
          stroke="#10B981"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <polyline
          points={points}
          fill="none"
          stroke="#1F1F3B"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {trendData.map((item, index) => (
          <circle
            key={item.month || index}
            cx={28 + index * stepX}
            cy={190 - (item.verified || 0) * 1.55}
            r="3"
            fill="#10B981"
          />
        ))}
        {trendData.map((item, index) => (
          <text
            key={item.month || index}
            x={28 + index * stepX}
            y="214"
            textAnchor="middle"
            fill="#79768D"
            fontSize="11"
          >
            {item.month}
          </text>
        ))}
        <g transform="translate(52 236)" fontSize="10" fill="#79768D">
          <circle cx="0" cy="-3" r="4" fill="#1F1F3B" />
          <text x="9">Adoption</text>
          <circle cx="90" cy="-3" r="4" fill="#10B981" />
          <text x="99">Verified</text>
          <line
            x1="174"
            x2="192"
            y1="-3"
            y2="-3"
            stroke="#79768D"
            strokeDasharray="4 3"
          />
          <text x="198">Plan</text>
        </g>
      </svg>
    </div>
  );
}

function MaturityDonut({ stageData = [] }) {
  if (!stageData || stageData.length === 0) {
    return (
      <div className="h-[220px] flex items-center justify-center text-xs text-[#79768D]">
        No maturity stage data recorded.
      </div>
    );
  }

  let offset = 0;
  const totalValue = stageData.reduce((acc, curr) => acc + (curr.value || 0), 0);

  return (
    <div
      className="relative mx-auto h-[220px] w-full max-w-[250px]"
      aria-label="Adoption maturity stage donut chart"
    >
      <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90" role="img">
        <circle
          cx="100"
          cy="100"
          r="67"
          fill="none"
          stroke="#EEEEF4"
          strokeWidth="28"
        />
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
              stroke={stage.fill || '#1F1F3B'}
              strokeWidth="28"
              strokeDasharray={`${Math.max(0, dash - 5)} ${421 - Math.max(0, dash - 5)}`}
              strokeDashoffset={-currentOffset}
            />
          );
        })}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-3xl font-normal text-[#1F1F3B]"
          style={{ fontFamily: "'Marcellus', serif" }}
        >
          {totalValue}%
        </span>
        <span className="text-xs text-[#79768D]">total tracked</span>
      </div>
    </div>
  );
}

function CapabilityRadar({ capabilityData = [] }) {
  if (!capabilityData || capabilityData.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-xs text-[#79768D]">
        No capability scores recorded.
      </div>
    );
  }

  const center = 130;
  const numItems = capabilityData.length;
  const angleStep = 360 / numItems;

  const point = (index, value) => {
    const angle = ((-90 + index * angleStep) * Math.PI) / 180;
    const radius = value * 0.82;
    return `${center + Math.cos(angle) * radius},${center + Math.sin(angle) * radius}`;
  };

  const score = capabilityData
    .map((item, index) => point(index, item.score || 0))
    .join(' ');

  const benchmark = capabilityData
    .map((item, index) => point(index, item.benchmark || 0))
    .join(' ');

  return (
    <div className="h-[300px] w-full" aria-label="Capability radar chart">
      <svg viewBox="0 0 260 270" className="h-full w-full" role="img">
        {[20, 40, 60, 80, 100].map((value) => (
          <polygon
            key={value}
            points={capabilityData.map((_, index) => point(index, value)).join(' ')}
            fill="none"
            stroke="#E5E3ED"
          />
        ))}
        {capabilityData.map((_, index) => {
          const p = point(index, 100).split(',');
          return (
            <line
              key={index}
              x1={center}
              y1={center}
              x2={p[0]}
              y2={p[1]}
              stroke="#E5E3ED"
            />
          );
        })}
        <polygon
          points={benchmark}
          fill="none"
          stroke="#F59E0B"
          strokeWidth="2"
          strokeDasharray="5 4"
        />
        <polygon
          points={score}
          fill="#1F1F3B"
          fillOpacity="0.15"
          stroke="#1F1F3B"
          strokeWidth="2"
        />
        {capabilityData.map((item, index) => {
          const p = point(index, 116).split(',');
          return (
            <text
              key={item.capability || index}
              x={p[0]}
              y={p[1]}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#79768D"
              fontSize="10"
            >
              {item.capability}
            </text>
          );
        })}
        <g transform="translate(66 255)" fontSize="9" fill="#79768D">
          <circle cx="0" cy="-3" r="4" fill="#1F1F3B" />
          <text x="8">Current Score</text>
          <circle cx="85" cy="-3" r="4" fill="#F59E0B" />
          <text x="93">Benchmark</text>
        </g>
      </svg>
    </div>
  );
}

function DiscoveryUseCases({ discoveryUseCases = [] }) {
  if (!discoveryUseCases || discoveryUseCases.length === 0) {
    return (
      <div className="py-6 text-center text-xs text-[#79768D]">
        No discovery use cases recorded.
      </div>
    );
  }

  return (
    <div className="space-y-4 py-2" aria-label="Use cases summary">
      {discoveryUseCases.map((item) => (
        <div key={item.label || item.id}>
          <div className="mb-2 flex items-center justify-between gap-4 text-xs">
            <span className="font-medium text-[#1F1F3B]">{item.label}</span>
            <strong>{item.share}% mentioned</strong>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#EEEEF4]">
            <div
              className="h-full rounded-full bg-[#1F1F3B]"
              style={{ width: `${item.share}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function ChartHeading({ eyebrow, title, detail }) {
  return (
    <div className="mb-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-[#1F1F3B]">
        {eyebrow}
      </p>
      <h2
        className="mt-1 text-2xl font-normal text-[#1F1F3B]"
        style={{ fontFamily: "'Marcellus', serif" }}
      >
        {title}
      </h2>
      <p className="mt-1 text-sm leading-5 text-[#79768D]">{detail}</p>
    </div>
  );
}

export default function ExecutiveDashboardPage() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState({ email: '', role: '' });
  const [executiveSummary, setExecutiveSummary] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    departments: [],
    trendData: [],
    capabilityData: [],
    stageData: [],
    discoveryUseCases: [],
    attentionItems: [],
  });

  const view =
    searchParams.get('tab') === 'departments' ? 'departments' : 'overview';

  useEffect(() => {
    async function fetchDynamicData() {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

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

      const [
        { data: summary },
        { data: depts },
        { data: trends },
        { data: capabilities },
        { data: stages },
        { data: useCases },
        { data: attention },
      ] = await Promise.all([
        supabase.from('executive_summaries').select('*').maybeSingle(),
        supabase.from('departments').select('*'),
        supabase
          .from('adoption_trends')
          .select('*')
          .order('id', { ascending: true }),
        supabase.from('capability_scores').select('*'),
        supabase.from('adoption_stages').select('*'),
        supabase.from('discovery_use_cases').select('*'),
        supabase.from('attention_items').select('*'),
      ]);

      setExecutiveSummary(summary || null);
      setDashboardData({
        departments: depts || [],
        trendData: trends || [],
        capabilityData: capabilities || [],
        stageData: stages || [],
        discoveryUseCases: useCases || [],
        attentionItems: attention || [],
      });
      setLoading(false);
    }

    fetchDynamicData();
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center font-medium text-[#79768D] font-sans">
        Loading Executive Intelligence...
      </div>
    );
  }

  return (
    <PortalShell email={userProfile.email} role={userProfile.role}>
      {view === 'overview' && (
        <>
          <section id="overview" className="mb-8 scroll-mt-24">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1
                  className="mt-2 max-w-3xl text-4xl font-normal leading-tight text-[#1F1F3B] sm:text-5xl"
                  style={{ fontFamily: "'Marcellus', serif" }}
                >
                  {executiveSummary?.headline || 'Executive Overview'}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#79768D]">
                  {executiveSummary?.description ||
                    'Portfolio view across active operations and workflows.'}
                </p>
              </div>
              {executiveSummary?.next_review_date && (
                <div className="rounded-xl border border-[#E5E3ED] bg-white px-4 py-3 text-right shadow-xs">
                  <p className="text-xs font-medium text-[#79768D]">
                    Next leadership review
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#1F1F3B]">
                    {executiveSummary.next_review_date}
                  </p>
                </div>
              )}
            </div>
          </section>

          {executiveSummary && (
            <section
              aria-label="Organization summary"
              className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
            >
              <Stat
                label="Adoption Index"
                value={executiveSummary.adoption_index}
                sub={executiveSummary.adoption_sub}
                trend={executiveSummary.adoption_trend}
              />
              <Stat
                label="Verified Output"
                value={executiveSummary.verified_output}
                sub={executiveSummary.verified_sub}
                trend={executiveSummary.verified_trend}
              />
              <Stat
                label="Unlocked Capacity"
                value={executiveSummary.unlocked_capacity}
                sub={executiveSummary.capacity_sub}
                trend={executiveSummary.capacity_trend}
              />
              <Stat
                label="Value Realized"
                value={executiveSummary.value_realized}
                sub={executiveSummary.value_sub}
                trend={executiveSummary.value_trend}
              />
              <Stat
                label="Departments at Target"
                value={executiveSummary.depts_at_target}
                sub={executiveSummary.depts_target_sub}
              />
            </section>
          )}

          <section
            id="trends"
            className="mb-8 grid scroll-mt-24 gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.85fr)]"
          >
            <article className="min-w-0 p-5 sm:p-7 bg-white rounded-2xl border border-[#E5E3ED] shadow-xs">
              <ChartHeading
                eyebrow="Momentum"
                title="Adoption and verified output over time"
                detail="Usage trajectories compared against outcome targets."
              />
              <TrendChart trendData={dashboardData.trendData} />
            </article>

            <article className="min-w-0 p-5 sm:p-7 bg-white rounded-2xl border border-[#E5E3ED] shadow-xs">
              <ChartHeading
                eyebrow="Workforce"
                title="Adoption maturity"
                detail="Share of employees by behavior stage."
              />
              <MaturityDonut stageData={dashboardData.stageData} />
              <div className="grid grid-cols-2 gap-x-3 gap-y-2 border-t border-[#E5E3ED] pt-4">
                {dashboardData.stageData.map((stage) => (
                  <div
                    key={stage.name}
                    className="flex items-center justify-between gap-2 text-xs"
                  >
                    <span className="flex min-w-0 items-center gap-2 text-[#79768D]">
                      <span
                        className="h-2 w-2 shrink-0 rounded-sm"
                        style={{
                          backgroundColor: stage.fill || '#1F1F3B',
                        }}
                      />
                      {stage.name}
                    </span>
                    <strong className="text-[#1F1F3B]">{stage.value}%</strong>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="mb-8 grid gap-6 xl:grid-cols-2">
            <article className="min-w-0 p-5 sm:p-7 bg-white rounded-2xl border border-[#E5E3ED] shadow-xs">
              <ChartHeading
                eyebrow="Portfolio"
                title="Department adoption index"
                detail="A concise view of adoption by department."
              />
              {dashboardData.departments.length === 0 ? (
                <p className="text-xs text-[#79768D] py-6 text-center">
                  No departments found.
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {dashboardData.departments.map((department) => {
                    const indexVal =
                      department.index || department.adoption_index || 0;
                    const tone = performanceTone(indexVal);
                    return (
                      <div
                        key={department.name || department.id}
                        className={`rounded-lg border-l-4 p-4 ${tone.surface} ${tone.border} flex flex-col justify-between`}
                      >
                        <div className="flex items-start justify-between gap-3 text-[#1F1F3B]">
                          <span className="text-sm font-semibold">
                            {department.name}
                          </span>
                          <strong
                            className="text-2xl font-normal text-[#1F1F3B]"
                            style={{ fontFamily: "'Marcellus', serif" }}
                          >
                            {indexVal}
                          </strong>
                        </div>
                        <button
                          onClick={() => router.push('?tab=departments')}
                          className="mt-4 flex w-full items-center justify-between border-t border-[#E5E3ED] pt-3 text-xs font-semibold text-[#1F1F3B] cursor-pointer hover:text-[#4C4B64] transition-colors"
                        >
                          Learn more <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </article>

            <article className="min-w-0 p-5 sm:p-7 bg-white rounded-2xl border border-[#E5E3ED] shadow-xs">
              <ChartHeading
                eyebrow="Readiness"
                title="Enterprise capability profile"
                detail="Capabilities evaluated against target benchmark criteria."
              />
              <CapabilityRadar
                capabilityData={dashboardData.capabilityData}
              />
            </article>
          </section>

          <section
            id="attention"
            className="mb-8 grid scroll-mt-24 gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(310px,0.65fr)]"
          >
            <article className="p-5 sm:p-7 bg-white rounded-2xl border border-[#E5E3ED] shadow-xs">
              <ChartHeading
                eyebrow="Leadership attention"
                title="Key strategic priorities"
                detail="Action items prioritized from workflow and evidence evaluations."
              />
              {dashboardData.attentionItems.length === 0 ? (
                <p className="text-xs text-[#79768D] py-6 text-center">
                  No pending action items.
                </p>
              ) : (
                <div className="divide-y divide-[#E5E3ED]">
                  {dashboardData.attentionItems.map((item) => (
                    <div
                      key={item.title || item.id}
                      className="grid gap-3 py-4 first:pt-0 last:pb-0 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center"
                    >
                      <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-[#1F1F3B]">
                          {item.title}
                        </p>
                        <p className="mt-1 text-xs text-[#79768D]">
                          {item.detail}
                        </p>
                      </div>
                      {item.action && (
                        <span className="flex items-center gap-1 text-xs font-semibold text-[#1F1F3B] cursor-pointer hover:underline">
                          {item.action}
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </article>

            <article className="min-w-0 p-5 sm:p-7 bg-white rounded-2xl border border-[#E5E3ED] shadow-xs">
              <ChartHeading
                eyebrow="Discovery insights"
                title="Primary use cases"
                detail="Key operational categories identified from discovery responses."
              />
              <DiscoveryUseCases
                discoveryUseCases={dashboardData.discoveryUseCases}
              />
            </article>
          </section>
        </>
      )}

      {view === 'departments' && (
        <section id="departments" className="mb-10 scroll-mt-24">
          <div className="mb-7 border-b border-[#E5E3ED] pb-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#1F1F3B]">
                  Evidence explorer
                </p>
                <h2
                  className="mt-1 text-3xl font-normal text-[#1F1F3B]"
                  style={{ fontFamily: "'Marcellus', serif" }}
                >
                  Department breakdowns
                </h2>
                <p className="mt-2 text-sm text-[#79768D]">
                  Operational results and process detail by operational area.
                </p>
              </div>
              <button
                onClick={() => router.push('?tab=overview')}
                className="flex items-center gap-1 text-sm font-semibold text-[#1F1F3B] cursor-pointer hover:underline"
              >
                Back to overview
                <ChevronRight className="h-4 w-4 rotate-180" />
              </button>
            </div>
          </div>

          {dashboardData.departments.length === 0 ? (
            <div className="p-12 text-center text-sm text-[#79768D] bg-white rounded-2xl border border-[#E5E3ED]">
              No department records available.
            </div>
          ) : (
            <div className="space-y-6">
              {dashboardData.departments.map((department) => {
                const indexVal =
                  department.index || department.adoption_index || 0;
                const tone = performanceTone(indexVal);

                return (
                  <article
                    key={department.name || department.id}
                    className="scroll-mt-24 overflow-hidden bg-white rounded-2xl border border-[#E5E3ED] shadow-xs"
                  >
                    <div
                      className={`grid gap-5 border-b border-[#E5E3ED] p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_repeat(2,minmax(110px,auto))] lg:items-center ${tone.surface}`}
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h3
                            className="text-2xl font-normal text-[#1F1F3B]"
                            style={{ fontFamily: "'Marcellus', serif" }}
                          >
                            {department.name}
                          </h3>
                          <span
                            className={`rounded-md px-2.5 py-1 text-xs font-semibold ${tone.badge}`}
                          >
                            {indexVal} adoption index
                          </span>
                        </div>
                      </div>
                      <dl className="contents">
                        <div>
                          <dt className="text-xs text-[#79768D]">
                            Quality Score
                          </dt>
                          <dd className="mt-1 text-xl font-bold text-[#1F1F3B]">
                            {department.quality ||
                              department.quality_score ||
                              'N/A'}
                            /5
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-[#79768D]">
                            Turnaround Time
                          </dt>
                          <dd className="mt-1 text-xl font-bold text-[#1F1F3B]">
                            {department.turnaroundAfter ||
                            department.turnaround_days
                              ? `${department.turnaroundAfter || department.turnaround_days}d`
                              : 'N/A'}
                          </dd>
                        </div>
                      </dl>
                    </div>
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
      )}
    </PortalShell>
  );
}