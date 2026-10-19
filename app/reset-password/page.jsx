'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '../../lib/supabase/client';
import { Eye, EyeOff, X, CheckCircle2 } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setErrorMsg('');
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [supabase]);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      setLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      setLoading(false);
      return;
    }

    try {
      // 1. Update user password in Supabase Auth
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setSuccessMsg('Your password has been updated successfully! Redirecting...');

      // 2. Fetch role to determine where to redirect user
      let targetLogin = '/candidate-login';
      if (data?.user?.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .maybeSingle();

        const role = (profile?.role || '').trim().toUpperCase();
        if (role === 'ADMIN' || role === 'EXECUTIVE') {
          targetLogin = '/admin-login';
        }
      }

      setTimeout(() => {
        router.push(targetLogin);
      }, 2000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update password. Link may be expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#F8FAFC] flex flex-col justify-center items-center px-6 font-sans text-[#1E293B]">
      <div className="w-full max-w-[400px] bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm space-y-6">
        
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <Image
              src="/ivy-logo-dark.png"
              alt="IVY & COMPANY"
              width={140}
              height={40}
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">
            Create New Password
          </h1>
          <p className="text-xs text-slate-500">
            Enter your new password below to update your account credentials.
          </p>
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

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              NEW PASSWORD
            </label>
            <div className="relative">
              <input
                required
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
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

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              CONFIRM NEW PASSWORD
            </label>
            <div className="relative">
              <input
                required
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-4 pr-10 py-3 bg-[#F8FAFC] border border-slate-200/80 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#17467B] hover:bg-[#123864] text-white font-bold text-xs rounded-xl transition-all duration-200 cursor-pointer shadow-xs"
          >
            {loading ? 'Updating Password...' : 'Update Password'}
          </button>
        </form>

      </div>
    </div>
  );
}