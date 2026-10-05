'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Eye, EyeOff, X, CheckCircle2 } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const routeUserByRole = async (userEmail) => {
    const cleanEmail = userEmail.trim().toLowerCase();

    // Query 'profiles' table for user role & organization
    const { data: userData } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .ilike('email', cleanEmail)
      .maybeSingle();

    const normalizedRole = (userData?.role || '').toUpperCase().replace(/\s+/g, '');

    sessionStorage.setItem('portalMode', 'admin');
    sessionStorage.setItem('userRole', normalizedRole);

    if (userData?.organization_id) {
      sessionStorage.setItem('organizationId', userData.organization_id);
    }

    if (normalizedRole === 'EXECUTIVE') {
      router.push('/executive');
    } else if (normalizedRole === 'ADMIN') {
      router.push('/admin');
    } else if (normalizedRole === 'MANAGER') {
      router.push('/manager');
    } else {
      await supabase.auth.signOut();
      sessionStorage.clear();
      throw new Error('Access denied. Privileged privileges required.');
    }
  };

  useEffect(() => {
    let isSubscribed = true;
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email && isSubscribed) {
        try {
          await routeUserByRole(session.user.email);
        } catch {
          // Stay on page if unapproved
        }
      }
    };
    checkSession();
    return () => {
      isSubscribed = false;
    };
  }, [router, supabase]);

  const handleAdminSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const cleanEmail = formData.email.trim().toLowerCase();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: formData.password,
      });

      if (!error && data?.user) {
        await routeUserByRole(cleanEmail);
        return;
      }

      throw error || new Error('Invalid login credentials');

    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    const cleanEmail = formData.email.trim().toLowerCase();

    if (!cleanEmail) {
      setErrorMsg('Please enter your email address first.');
      return;
    }

    setResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      setSuccessMsg('An email has been sent with instructions to reset your password.');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to send reset email.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex text-[#1E293B] bg-white font-sans antialiased select-none">
      {/* LEFT SECTION: Hero Visual */}
      <div className="hidden lg:flex w-[50%] relative bg-[#1A508B] overflow-hidden flex-col justify-center p-16 text-white h-full">
        <div className="absolute inset-0 z-0">
          <Image
            src="/adminLogin.jpg"
            alt="Corporate Leadership Meeting"
            fill
            className="object-cover"
            priority
            />
        </div>
        
        <div className="absolute inset-0 z-1 pointer-events-none bg-gradient-to-r from-[#17467B]/95 via-[#184D87]/70 to-[#1C5493]/20" />
        
        <div className="relative z-10 max-w-xl space-y-6 pl-2">
            <h1 className="text-3xl xl:text-[40px] font-bold tracking-tight leading-[1.2]">
            Insights that shape leaders.{' '}
            <span className="font-normal">Decisions that shape organizations.</span>
            </h1>
            <div className="w-10 h-[3px] bg-slate-300/60 rounded-full" />
        </div>
        </div>

        {/* RIGHT SECTION: Form & Logo */}
        <div className="flex-1 flex flex-col justify-center items-center px-8 py-6 relative bg-white h-full overflow-y-auto lg:overflow-hidden">
        <div className="w-full max-w-[400px] space-y-8">
            
            {/* Company Brand Logo */}
            <div className="text-center space-y-3">
            <div className="flex justify-center mb-1">
                <Image
                src="/ivy-logo-dark.png"
                alt="IVY & COMPANY"
                width={160}
                height={45}
                className="object-contain"
                priority
                />
            </div>
            <p className="text-[10px] font-bold tracking-[0.25em] text-slate-400 uppercase">
                PORTAL LOGIN
            </p>
            <h2 className="text-xl font-bold text-[#0F172A] tracking-tight leading-snug px-2">
                Manage talent, assignments, and insights
            </h2>
        </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200/80 text-red-600 rounded-xl text-xs font-semibold flex items-center gap-2">
              <X className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200/80 text-emerald-700 rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleAdminSignIn} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                EMAIL ADDRESS
              </label>
              <input
                required
                type="email"
                placeholder="user@ivyandcompany.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 bg-[#F8FAFC] border border-slate-200/80 rounded-xl focus:outline-none focus:ring-1 text-xs text-slate-900 focus:bg-white focus:ring-slate-400 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  PASSWORD
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={resetLoading}
                  className="text-[11px] font-medium text-slate-400 hover:text-slate-700 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {resetLoading ? 'Sending link...' : 'Forgot password?'}
                </button>
              </div>
              <div className="relative">
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-4 pr-10 py-3 bg-[#F8FAFC] border border-slate-200/80 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#17467B] hover:bg-[#123864] text-white font-bold text-xs rounded-xl transition-all duration-200 cursor-pointer mt-2 shadow-xs"
            >
              {loading ? 'Authenticating...' : 'Log In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}