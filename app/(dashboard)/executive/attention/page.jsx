'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Marcellus, Inter } from 'next/font/google';
import { createClient } from '../../../../lib/supabase/client';
import {
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
  Clock3,
  CircleCheck,
  User,
  LogOut,
  TrendingUp,
  Building2,
} from 'lucide-react';

const marcellus = Marcellus({ weight: '400', subsets: ['latin'] });
const inter = Inter({ subsets: ['latin'] });

const attentionItems = [
  {
    icon: AlertTriangle,
    tone: 'text-amber-500',
    title: 'HR adoption has stalled',
    detail: '44 index · only +1 point this month',
    action: 'Sponsor skills sprint',
  },
  {
    icon: ShieldCheck,
    tone: 'text-amber-500',
    title: '42% of AI output remains unverified',
    detail: 'Quality gate is limiting released capacity',
    action: 'Expand reviewer coverage',
  },
  {
    icon: Clock3,
    tone: 'text-amber-500',
    title: 'Operations turnaround is off target',
    detail: '5.9 days current · 4.8 day target',
    action: 'Review two bottlenecks',
  },
  {
    icon: CircleCheck,
    tone: 'text-emerald-600',
    title: 'Finance playbook is ready to scale',
    detail: '81 index · 4.7 quality · 63% faster',
    action: 'Replicate in Sales',
  },
];

const discoveryUseCases = [
  { label: 'Research', share: 72 },
  { label: 'Writing', share: 64 },
  { label: 'Analysis', share: 49 },
  { label: 'Planning', share: 38 },
  { label: 'Automation', share: 24 },
];

export default function AttentionPage() {
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
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ACTION CENTER</p>
            <h1 className={`text-3xl font-normal text-slate-900 mt-1 ${marcellus.className}`}>
              Leadership Attention & Discovery
            </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">LEADERSHIP ATTENTION</p>
                <h2 className={`text-xl font-normal text-slate-900 ${marcellus.className}`}>
                  Where intervention will change the trajectory
                </h2>
              </div>
              <div className="divide-y divide-slate-100">
                {attentionItems.map((item) => (
                  <div key={item.title} className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">DISCOVERY INSIGHTS</p>
                <h2 className={`text-xl font-normal text-slate-900 ${marcellus.className}`}>
                  Most common AI use cases
                </h2>
              </div>
              <div className="space-y-3 text-xs">
                {discoveryUseCases.map((uc) => (
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
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}