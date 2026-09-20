'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

const LOGO_MARK = '/logos/logo mark.png';
const LOGO_WORDMARK = '/logos/KanakkuX logo.png';

export default function LoginPage() {
  const supabase = useMemo(() => createClient(), []);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<'INR' | 'USD' | 'EUR' | 'GBP'>('INR');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    // If a session already exists, redirect immediately to dashboard
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        window.location.href = '/dashboard';
      }
    });

    // Listen for OAuth sign-in completion
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        window.location.href = '/dashboard';
      }
    });

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const err = params.get('error') || params.get('error_description');
      if (err) {
        if (err === 'auth_callback_failed' || err === 'no_code_received') {
          setErrorMsg('Authentication could not be completed. Please try again.');
        } else if (err === 'access_denied') {
          setErrorMsg('Google login was cancelled.');
        } else {
          setErrorMsg(decodeURIComponent(err));
        }
      }
    }

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  const passwordStrength = useMemo(() => {
    if (!password) return { level: 0, text: '', color: 'bg-surface-container-high' };
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (score <= 1) return { level: 1, text: 'Weak', color: 'bg-red-500' };
    if (score <= 2) return { level: 2, text: 'Fair', color: 'bg-amber-400' };
    if (score <= 3) return { level: 3, text: 'Good', color: 'bg-teal-400' };
    return { level: 4, text: 'Strong', color: 'bg-primary' };
  }, [password]);

  const mapErr = (raw: string): string => {
    const m = (raw || '').toLowerCase();
    if (m.includes('invalid login credentials') || m.includes('invalid credentials'))
      return 'No account found with this email, or the password is incorrect.';
    if (m.includes('email not confirmed'))
      return 'Email not verified. Check your inbox and click the verification link.';
    if (m.includes('user already registered') || m.includes('already exists'))
      return 'An account already exists with this email. Please sign in instead.';
    if (m.includes('password should be') || m.includes('at least 6'))
      return 'Password must be at least 6 characters.';
    if (m.includes('provider') && m.includes('not enabled'))
      return 'Google sign-in is not configured. Use email/password instead.';
    if (m.includes('network') || m.includes('fetch failed'))
      return 'Network error. Check your connection and try again.';
    return raw || 'Something went wrong. Please try again.';
  };

  const handleGoogleAuth = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setGoogleLoading(true);
    try {
      let origin = window.location.origin;
      if (origin.includes('0.0.0.0')) {
        origin = origin.replace('0.0.0.0', 'localhost');
      }
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback`,
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      });
      if (error) { setErrorMsg(mapErr(error.message)); setGoogleLoading(false); return; }
      if (data?.url) {
        window.location.href = data.url;
      } else {
        setErrorMsg('Could not start Google sign-in. Please try again.');
        setGoogleLoading(false);
      }
    } catch (err: any) {
      setErrorMsg(mapErr(err?.message || 'Failed to connect with Google.'));
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) { setErrorMsg('Please enter both email and password.'); return; }
    if (!trimmedEmail.includes('@')) { setErrorMsg('Please enter a valid email address.'); return; }
    if (mode === 'signup' && !agreeTerms) { setErrorMsg('Please agree to the terms to continue.'); return; }
    if (mode === 'signup' && password.length < 6) { setErrorMsg('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      if (mode === 'signin') {
        const { data, error } = await supabase.auth.signInWithPassword({ email: trimmedEmail, password });
        if (error) { setErrorMsg(mapErr(error.message)); setLoading(false); return; }
        if (data?.session) { window.location.href = '/dashboard'; }
        else { setErrorMsg('Could not start a session. Please try again.'); setLoading(false); }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail, password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
            data: { full_name: fullName.trim() || undefined, preferred_currency: selectedCurrency },
          },
        });
        if (error) { setErrorMsg(mapErr(error.message)); setLoading(false); return; }
        if (data?.session) { window.location.href = '/dashboard'; return; }
        setSuccessMsg(`Check your inbox at ${trimmedEmail} for a verification link, then sign in.`);
        setMode('signin');
        setPassword('');
        setLoading(false);
      }
    } catch (err: any) {
      setErrorMsg(mapErr(err?.message || 'An unexpected error occurred.'));
      setLoading(false);
    }
  };

  const switchMode = (m: 'signin' | 'signup') => { setMode(m); setErrorMsg(''); setSuccessMsg(''); };

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col selection:bg-primary selection:text-on-primary">
      <header className="w-full max-w-md mx-auto pt-6 pb-2 px-5 flex items-center justify-center">
        <div className="flex items-center gap-2.5">
          <img src={LOGO_WORDMARK} alt="KanakkuX" className="h-8 object-contain max-w-[180px]" />
        </div>
      </header>

      <main className="w-full max-w-md mx-auto px-5 py-4 flex-1 flex flex-col justify-center gap-5">
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-1 drop-shadow-xl">
            <img src={LOGO_MARK} alt="KanakkuX" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-on-surface tracking-tight">
            {mode === 'signin' ? 'Welcome back' : 'Create account'}
          </h1>
          <p className="text-sm text-on-surface-variant max-w-[280px]">
            {mode === 'signin' ? 'Sign in to continue to your ledger.' : 'Start tracking your money in seconds.'}
          </p>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl shadow-md border border-surface-container/60 p-5 flex flex-col gap-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] text-red-500 shrink-0 mt-0.5">error</span>
              <span className="leading-relaxed font-medium">{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] text-emerald-600 shrink-0 mt-0.5">check_circle</span>
              <span className="leading-relaxed font-medium">{successMsg}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={googleLoading || loading}
            className="w-full h-12 px-4 rounded-xl bg-surface-container-low hover:bg-surface-container border border-surface-container shadow-sm flex items-center justify-center gap-3 transition-all active:scale-[0.985] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {googleLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-on-surface-variant/40 border-t-on-surface-variant rounded-full animate-spin"/>
                <span className="font-semibold text-on-surface text-sm">Redirecting to Google...</span>
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908C16.658 14.013 17.64 11.705 17.64 9.2z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                  <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
                <span className="font-semibold text-on-surface text-sm">Continue with Google</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-surface-container"/>
            <span className="text-xs text-on-surface-variant">or with email</span>
            <div className="flex-1 h-px bg-surface-container"/>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
            {mode === 'signup' && (
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant pointer-events-none">person</span>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Full name (optional)"
                  className="w-full h-12 pl-11 pr-4 bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/50 rounded-xl text-sm focus:outline-none focus:shadow-[0_0_0_2px_#0f766e] transition-all"/>
              </div>
            )}

            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant pointer-events-none">mail</span>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address"
                autoComplete="email" inputMode="email"
                className="w-full h-12 pl-11 pr-4 bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/50 rounded-xl text-sm focus:outline-none focus:shadow-[0_0_0_2px_#0f766e] transition-all"/>
            </div>

            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant pointer-events-none">lock</span>
              <input type={showPassword ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)}
                placeholder={mode === 'signin' ? 'Password' : 'Create password (min 6 chars)'}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                className="w-full h-12 pl-11 pr-11 bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/50 rounded-xl text-sm focus:outline-none focus:shadow-[0_0_0_2px_#0f766e] transition-all"/>
              <button type="button" onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-on-surface-variant" aria-label="Toggle password">
                <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>

            {mode === 'signup' && password.length > 0 && (
              <div className="flex items-center gap-1.5 -mt-1">
                {[1,2,3,4].map(i => <div key={i} className={`h-1 flex-1 rounded-full transition-all ${passwordStrength.level >= i ? passwordStrength.color : 'bg-surface-container-high'}`}/>)}
                <span className="text-xs text-on-surface-variant ml-1">{passwordStrength.text}</span>
              </div>
            )}

            {mode === 'signup' && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-on-surface ml-0.5">Default Currency</label>
                  <div className="grid grid-cols-4 gap-2">
                    {([{code:'INR',symbol:'\u20B9'},{code:'USD',symbol:'$'},{code:'EUR',symbol:'\u20AC'},{code:'GBP',symbol:'\u00A3'}] as const).map(item => (
                      <button key={item.code} type="button" onClick={() => setSelectedCurrency(item.code)}
                        className={`h-10 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all active:scale-95 ${selectedCurrency === item.code ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container-low text-on-surface border border-surface-container'}`}>
                        <span>{item.symbol}</span><span>{item.code}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input type="checkbox" checked={agreeTerms} onChange={e => setAgreeTerms(e.target.checked)} className="sr-only peer"/>
                  <div className="w-5 h-5 rounded-md bg-surface-container-high peer-checked:bg-primary transition-colors flex items-center justify-center mt-0.5 shrink-0">
                    <span className="material-symbols-outlined text-[13px] text-on-primary opacity-0 peer-checked:opacity-100 transition-opacity font-bold">check</span>
                  </div>
                  <span className="text-xs text-on-surface-variant leading-relaxed">I agree to the terms of service and privacy policy.</span>
                </label>
              </>
            )}

            <button type="submit" disabled={loading || googleLoading}
              className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-on-primary font-semibold text-sm shadow-md shadow-primary/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] mt-1 disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? (
                <><div className="w-4 h-4 border-2 border-on-primary/40 border-t-on-primary rounded-full animate-spin"/><span>{mode === 'signin' ? 'Signing in...' : 'Creating Account...'}</span></>
              ) : (
                <><span>{mode === 'signin' ? 'Sign In' : 'Create Free Account'}</span><span className="material-symbols-outlined text-[18px]">arrow_forward</span></>
              )}
            </button>
          </form>
        </div>

        <div className="text-center text-sm text-on-surface-variant pb-4">
          {mode === 'signin' ? (
            <>Don&apos;t have an account?{' '}<button type="button" onClick={() => switchMode('signup')} className="text-primary font-semibold hover:underline ml-1">Create one</button></>
          ) : (
            <>Already have an account?{' '}<button type="button" onClick={() => switchMode('signin')} className="text-primary font-semibold hover:underline ml-1">Sign in</button></>
          )}
        </div>
      </main>
    </div>
  );
}