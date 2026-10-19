'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Marcellus, Inter } from 'next/font/google';
import { createClient } from '../../../../lib/supabase/client';
import { User, LogOut, TrendingUp, Building2 } from 'lucide-react';

const marcellus = Marcellus({ weight: '400', subsets: ['latin'] });
const inter = Inter({ subsets: ['latin'] });

const trendData = [
  { month: 'May', adoption: 39, verified: 24, target: 42 },
  { month: 'Jun', adoption: 45, verified: 30, target: 48 },
  { month: 'Jul', adoption: 51, verified: 37, target: 54 },
  { month: 'Aug', adoption: 58, verified: 44, target: 60 },
  { month: 'Sep', adoption: 65, verified: 51, target: 66 },
  { month: 'Oct', adoption: 73, verified: 58, target: 72 },
];

const capabilityData = [
  { capability: 'Usage', score: 74, benchmark: 70 },
  { capability: 'Skills', score: 61, benchmark: 70 },
  { capability: 'Quality', score: 90, benchmark: 80 },
  { capability: 'Governance', score: 67, benchmark: 75 },
  { capability: 'Scaling', score: 55, benchmark: 70 },
];

const stageData = [
  { name: 'Not started', value: 9, fill: '#E2E8F0' },
  { name: 'Exploring', value: 28, fill: '#F59E0B' },
  { name: 'Regular', value: 41, fill: '#1E2540' },
  { name: 'Scaling', value: 22, fill: '#10B981' },
];

function TrendChart() {
  const points = trendData.map((item, idx) => `${28 + idx * 68},${190 - item.adoption * 1.55}`).join(' ');
  const verified = trendData.map((item, idx) => `${28 + idx * 68},${190 - item.verified * 1.55}`).join(' ');
  const target = trendData.map((item, idx) => `${28 + idx * 68},${190 - item.target * 1.55}`).join(' ');
  const area = `28,190 ${points} 368,190`;

  return (
    <div className="h-[280px] w-full">
      <svg viewBox="0 0 400 240" className="h-full w-full">
        {[35, 74, 113, 152, 190].map((y) => (
          <line key={y} x1="28" x2="368" y1={y} y2={y} stroke="#E2E8F0" strokeDasharray="3 3" />
        ))}
        <polygon points={area} fill="#1E2540" opacity="0.08" />
        <polyline points={target} fill="none" stroke="#94A3B8" strokeWidth="2" strokeDasharray="6 5" />
        <polyline points={verified} fill="none" stroke="#10B981" strokeWidth="3" strokeLinejoin="round" />
        <polyline points={points} fill="none" stroke="#1E2540" strokeWidth="3" strokeLinejoin="round" />
        {trendData.map((item, idx) => (
          <circle key={item.month} cx={28 + idx * 68} cy={190 - item.verified * 1.55} r="3" fill="#10B981" />
        ))}
        {trendData.map((item, idx) => (
          <text key={item.month} x={28 + idx * 68} y="212" textAnchor="middle" fill="#64748B" fontSize="11">
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

function MaturityDonut() {
  let offset = 0;
  return (
    <div className="relative mx-auto h-[200px] w-full max-w-[220px]">
      <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
        <circle cx="100" cy="100" r="67" fill="none" stroke="#F1F5F9" strokeWidth="26" />
        {stageData.map((stage) => {
          const dash = stage.value * 4.21;
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
        <span className={`text-3xl font-bold text-slate-900 ${marcellus.className}`}>63%</span>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Regular + Scaling</span>
      </div>
    </div>
  );
}

function CapabilityRadar() {
  const center = 120;
  const point = (idx, val) => {
    const angle = (-90 + idx * 72) * (Math.PI / 180);
    const radius = val * 0.75;
    return `${center + Math.cos(angle) * radius},${center + Math.sin(angle) * radius}`;
  };

  const score = capabilityData.map((item, idx) => point(idx, item.score)).join(' ');
  const benchmark = capabilityData.map((item, idx) => point(idx, item.benchmark)).join(' ');

  return (
    <div className="h-[260px] w-full">
      <svg viewBox="0 0 240 250" className="h-full w-full">
        {[20, 40, 60, 80, 100].map((val) => (
          <polygon key={val} points={capabilityData.map((_, idx) => point(idx, val)).join(' ')} fill="none" stroke="#E2E8F0" />
        ))}
        {capabilityData.map((_, idx) => {
          const p = point(idx, 100).split(',');
          return <line key={idx} x1={center} y1={center} x2={p[0]} y2={p[1]} stroke="#E2E8F0" />;
        })}
        <polygon points={benchmark} fill="none" stroke="#F59E0B" strokeWidth="2" strokeDasharray="5 4" />
        <polygon points={score} fill="#1E2540" fillOpacity="0.2" stroke="#1E2540" strokeWidth="2" />
        {capabilityData.map((item, idx) => {
          const p = point(idx, 114).split(',');
          return (
            <text key={item.capability} x={p[0]} y={p[1]} textAnchor="middle" dominantBaseline="middle" fill="#64748B" fontSize="10" fontWeight="600">
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

export default function TrendsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/admin-login');
      return;
    }

    const { data: profData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle();

    setProfile(profData || { email: session.user.email });
    setLoading(false);
  }, [supabase, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    sessionStorage.clear();
    router.push('/admin-login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E2540]" />
      </div>
    );
  }

  return (
    <div className={`${inter.className} min-h-screen bg-[#F8FAFC] text-[#1E293B] flex flex-col antialiased select-none`}>
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 px-8 py-3 flex items-center justify-between h-16 shadow-xs">
        <div className="flex items-center gap-4">
          <Image src="/ivy-logo-dark.png" alt="IVY & COMPANY" width={140} height={40} priority className="object-contain" />
          <span className="text-[10px] font-bold tracking-[0.18em] text-slate-400 uppercase border-l border-slate-200 pl-4 py-1">
            Executive Portal
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

      <div className="flex-1 w-full px-8 py-8 flex gap-8 items-start max-w-[1700px] mx-auto">
        <aside className="w-[230px] shrink-0 space-y-1.5 sticky top-24">
          <button onClick={() => router.push('/executive')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold cursor-pointer text-slate-600 hover:bg-slate-100/80">
            <TrendingUp className="w-4 h-4 shrink-0" />
            <span>Executive Intelligence</span>
          </button>
          <button onClick={() => router.push('/executive/departments')} className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold cursor-pointer text-slate-600 hover:bg-slate-100/80">
            <div className="flex items-center gap-3">
              <Building2 className="w-4 h-4 shrink-0" />
              <span>Evidence Explorer</span>
            </div>
          </button>
        </aside>

        <main className="flex-1 min-w-0 space-y-8">
          <div className="border-b border-slate-200/80 pb-6">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TRENDS & CAPABILITY</p>
            <h1 className={`text-3xl font-normal text-slate-900 mt-1 ${marcellus.className}`}>
              Adoption Trends & Capability Profiles
            </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">MOMENTUM</p>
                <h2 className={`text-xl font-normal text-slate-900 ${marcellus.className}`}>
                  Adoption and verified output over time
                </h2>
                <p className="text-xs text-slate-500 mt-1">Usage is above plan; verified outcomes remain the constraint on realized value.</p>
              </div>
              <TrendChart />
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">WORKFORCE</p>
                <h2 className={`text-xl font-normal text-slate-900 ${marcellus.className}`}>
                  Adoption maturity
                </h2>
                <p className="text-xs text-slate-500 mt-1">Share of employees by behavior stage.</p>
              </div>
              <MaturityDonut />
              <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-100 text-xs">
                {stageData.map((st) => (
                  <div key={st.name} className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: st.fill }} />
                      {st.name}
                    </span>
                    <span className="font-bold text-slate-800">{st.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 max-w-xl">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">READINESS</p>
              <h2 className={`text-xl font-normal text-slate-900 ${marcellus.className}`}>
                Enterprise capability profile
              </h2>
              <p className="text-xs text-slate-500 mt-1">Quality is strong; skills and scaling maturity require investment.</p>
            </div>
            <CapabilityRadar />
          </div>
        </main>
      </div>
    </div>
  );
}