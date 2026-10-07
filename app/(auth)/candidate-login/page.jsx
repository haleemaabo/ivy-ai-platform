'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '../../../lib/supabase/client';
import { Eye, EyeOff, Check, X, CheckCircle2 } from 'lucide-react';

export default function CandidateLoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'signup'
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modals & UI States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // Password Requirement Checks
  const hasMinLength = formData.password.length >= 8;
  const hasUpper = /[A-Z]/.test(formData.password);
  const hasLower = /[a-z]/.test(formData.password);
  const hasNumber = /[0-9]/.test(formData.password);
  const hasSpecial = /[^A-Za-z0-9]/.test(formData.password);

  const passedCriteriaCount = [hasMinLength, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;

  const getStrengthPercent = () => {
    if (!formData.password) return 0;
    return (passedCriteriaCount / 5) * 100;
  };

  const getStrengthColor = () => {
    if (passedCriteriaCount <= 2) return 'bg-red-500';
    if (passedCriteriaCount <= 4) return 'bg-amber-400';
    return 'bg-emerald-500';
  };

  const getStrengthLabel = () => {
    if (!formData.password) return '';
    if (passedCriteriaCount <= 2) return 'Weak Password';
    if (passedCriteriaCount <= 4) return 'Moderate Strength';
    return 'Strong Password';
  };

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle();

        const role = profile?.role?.toLowerCase() || 'employee';
        router.push(`/${role}`);
      }
    };
    checkSession();
  }, [router, supabase]);

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
        redirectTo: `${window.location.origin}/forgot-password`,
      });

      if (error) throw error;

      setSuccessMsg('An email has been sent with instructions to reset your password.');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to send reset email.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const cleanEmail = formData.email.trim().toLowerCase();

      if (activeTab === 'signup') {
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match.');
        }

        if (passedCriteriaCount < 5) {
          throw new Error('Please fulfill all password requirements before continuing.');
        }

        // 1. Verify if email exists in Supabase profiles table (Pre-approved by Admin)
        const { data: existingProfile, error: profileCheckError } = await supabase
          .from('profiles')
          .select('*')
          .ilike('email', cleanEmail)
          .maybeSingle();

        if (profileCheckError) throw profileCheckError;

        if (!existingProfile) {
          throw new Error('Sign up failed: Your email was not pre-approved by an administrator.');
        }

        // 2. Perform Supabase Sign Up
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: cleanEmail,
          password: formData.password,
          options: {
            data: { full_name: formData.fullName || existingProfile.full_name },
          },
        });

        if (signUpError) throw signUpError;

        // 3. Link profile with newly generated Auth ID
        if (authData?.user) {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ 
              id: authData.user.id,
              full_name: formData.fullName || existingProfile.full_name 
            })
            .ilike('email', cleanEmail);

          if (updateError) {
            console.warn('Profile sync warning:', updateError.message);
          }

          setShowConfirmationModal(true);
        }
      } else {
        // Log In Flow
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: formData.password,
        });

        if (error) throw error;

        if (data?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .maybeSingle();

          const role = profile?.role?.toLowerCase() || 'employee';
          router.push(`/${role}`);
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowConfirmationModal(false);
    setActiveTab('login');
    setFormData({
      fullName: '',
      email: formData.email,
      password: '',
      confirmPassword: '',
    });
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex text-[#1E293B] bg-white font-sans antialiased select-none">
      
      {/* Confirmation Account Created Modal */}
      {showConfirmationModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center space-y-5">
            <div className="w-14 h-14 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900">Sign Up Complete</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Your account for <span className="font-semibold text-slate-800">{formData.email}</span> has been successfully created. You can now log in with your credentials.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCloseModal}
              className="w-full py-3 bg-[#1D2543] text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-colors cursor-pointer shadow-md"
            >
              Proceed to Log In
            </button>
          </div>
        </div>
      )}

      {/* LEFT SECTION: Hero Visual */}
      <div className="hidden lg:flex w-[50%] relative bg-[#1D2543] overflow-hidden flex-col justify-center p-16 text-white h-full">
        <div className="absolute inset-0 z-0">
          <Image
            src="/candidateLogin.jpg"
            alt="Business Team Meeting"
            fill
            className="object-cover"
            priority
          />
        </div>

        <div className="absolute inset-0 z-1 pointer-events-none bg-gradient-to-r from-[#1B2544]/95 via-[#1B2544]/70 to-[#1B2544]/20" />

        <div className="relative z-10 max-w-xl space-y-6 pl-2">
          <h1 className="text-3xl xl:text-[38px] font-bold tracking-tight leading-[1.25]">
            Empower your organization <span className="font-normal">to lead with clarity, confidence, and purpose.</span>
          </h1>
          <div className="w-10 h-[3px] bg-slate-300/60 rounded-full" />
        </div>
      </div>

      {/* RIGHT SECTION: Form & Logo */}
      <div className="flex-1 flex flex-col justify-center items-center px-8 py-6 relative bg-white h-full overflow-y-auto lg:overflow-hidden">
        <div className="w-full max-w-[420px] space-y-6">
          
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
              PERSONAL DEVELOPMENT PORTAL
            </p>
            <h2 className="text-lg font-bold text-[#0F172A] tracking-tight leading-snug px-2">
              Start your growth journey with clear, actionable insights
            </h2>
          </div>

          <div className="bg-[#F3F5F9] p-1.5 rounded-2xl flex items-center border border-slate-200/60 shadow-xs">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-[#1D2543] text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('signup');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
                activeTab === 'signup'
                  ? 'bg-[#1D2543] text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Sign Up
            </button>
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

          <form onSubmit={handleSubmit} className="space-y-4">
            {activeTab === 'signup' && (
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  FULL NAME
                </label>
                <input
                  required
                  type="text"
                  placeholder="Jane Doe"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-4 py-3 bg-[#F8FAFC] border border-slate-200/80 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 transition-all"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                ASSIGNED EMAIL
              </label>
              <input
                required
                type="email"
                placeholder="candidate@gmail.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 bg-[#F8FAFC] border border-slate-200/80 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  PASSWORD
                </label>
                {activeTab === 'login' && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={resetLoading}
                    className="text-[11px] font-medium text-slate-400 hover:text-slate-700 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {resetLoading ? 'Sending link...' : 'Forgot password?'}
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
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

            {activeTab === 'signup' && formData.password.length > 0 && (
              <div className="space-y-1.5 p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                <div className="flex justify-between items-center text-[9px] font-bold">
                  <span className="text-slate-500">PASSWORD STRENGTH</span>
                  <span className={passedCriteriaCount === 5 ? 'text-emerald-600' : 'text-slate-600'}>
                    {getStrengthLabel()}
                  </span>
                </div>
                <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                    style={{ width: `${getStrengthPercent()}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                  <div className={`flex items-center gap-1 ${hasMinLength ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                    {hasMinLength ? <Check className="w-3 h-3 stroke-[3]" /> : <div className="w-1 h-1 rounded-full bg-slate-300 ml-1 mr-0.5" />}
                    <span>8+ characters</span>
                  </div>
                  <div className={`flex items-center gap-1 ${hasUpper ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                    {hasUpper ? <Check className="w-3 h-3 stroke-[3]" /> : <div className="w-1 h-1 rounded-full bg-slate-300 ml-1 mr-0.5" />}
                    <span>1 uppercase</span>
                  </div>
                  <div className={`flex items-center gap-1 ${hasLower ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                    {hasLower ? <Check className="w-3 h-3 stroke-[3]" /> : <div className="w-1 h-1 rounded-full bg-slate-300 ml-1 mr-0.5" />}
                    <span>1 lowercase</span>
                  </div>
                  <div className={`flex items-center gap-1 ${hasNumber ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                    {hasNumber ? <Check className="w-3 h-3 stroke-[3]" /> : <div className="w-1 h-1 rounded-full bg-slate-300 ml-1 mr-0.5" />}
                    <span>1 number</span>
                  </div>
                  <div className={`flex items-center gap-1 ${hasSpecial ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                    {hasSpecial ? <Check className="w-3 h-3 stroke-[3]" /> : <div className="w-1 h-1 rounded-full bg-slate-300 ml-1 mr-0.5" />}
                    <span>1 special char</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'signup' && (
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  CONFIRM PASSWORD
                </label>
                <div className="relative">
                  <input
                    required
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
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
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#1D2543] hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all duration-200 cursor-pointer mt-1 shadow-xs"
            >
              {loading ? 'Processing...' : activeTab === 'signup' ? 'Create Account' : 'Log In'}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}