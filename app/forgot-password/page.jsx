'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/app/lib/supabase';
import { X, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSendResetEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // 1. Sends the reset email and tells Supabase where to redirect the user
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'http://localhost:3000/reset-password',
      });

      if (error) throw error;

      setSuccessMsg('Reset link sent! Please check your email inbox.');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to send reset link.');
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
          <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">Forgot Password</h1>
          <p className="text-xs text-slate-500">
            Enter your email address below to receive a password reset link.
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

        <form onSubmit={handleSendResetEmail} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              EMAIL ADDRESS
            </label>
            <input
              required
              type="email"
              placeholder="admin@ivy-company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-[#F8FAFC] border border-slate-200/80 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#17467B] hover:bg-[#123864] text-white font-bold text-xs rounded-xl transition-all duration-200 cursor-pointer shadow-xs"
          >
            {loading ? 'Sending Link...' : 'Send Reset Link'}
          </button>
        </form>

      </div>
    </div>
  );
}