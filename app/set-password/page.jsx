'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function SetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    // Check if Supabase has successfully established the session from the URL token
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setSessionReady(true);
      }
    };

    checkSession();

    // Listen for auth state changes (handles implicit token swaps)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || session) {
        setSessionReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleSetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    } else {
      router.push('/employee');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <form onSubmit={handleSetPassword} className="bg-white p-6 rounded-2xl shadow-md max-w-sm w-full space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Set Your Password</h2>
        
        {errorMsg && <p className="text-xs text-red-500">{errorMsg}</p>}
        
        {!sessionReady && (
          <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
            Authenticating link... If this takes too long, your invite link may have expired.
          </p>
        )}

        <input
          type="password"
          required
          placeholder="New Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 border rounded-xl text-xs"
        />
        
        <button
          type="submit"
          disabled={loading || !sessionReady}
          className="w-full py-3 bg-[#1D2543] text-white rounded-xl text-xs font-bold disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Password & Continue'}
        </button>
      </form>
    </div>
  );
}