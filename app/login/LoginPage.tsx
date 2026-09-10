'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Wallet, Mail, Eye, EyeOff, Chrome, ArrowRight, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const supabase = createClient();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = '/dashboard';
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccess('Check your email to confirm your account!');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) { setError(error.message); setGoogleLoading(false); }
  };

  return (
    <div className="min-h-dvh bg-bg flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full bg-indigo-600/8 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
            <Wallet className="w-7 h-7 text-primary-light" />
          </div>
          <h1 className="text-2xl font-bold text-tx tracking-tight">LedgerFlow</h1>
          <p className="text-tx-2 text-sm mt-1">Your personal finance tracker</p>
        </div>

        {/* Card */}
        <div className="glass p-6">
          {/* Google */}
          <button
            id="btn-google-login"
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 bg-surface-2 hover:bg-surface-3 border border-border-light hover:border-border text-tx font-medium rounded-xl px-4 py-3 transition-all disabled:opacity-60"
          >
            {googleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Chrome className="w-4 h-4" />
            )}
            Continue with Google
          </button>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-tx-3 text-xs font-medium">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Mode toggle */}
          <div className="flex rounded-xl bg-surface-2 p-1 mb-5">
            {(['login', 'signup'] as const).map((m) => (
              <button
                key={m}
                id={`btn-mode-${m}`}
                onClick={() => { setMode(m); setError(''); setSuccess(''); }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                  mode === m ? 'bg-primary text-white shadow' : 'text-tx-2 hover:text-tx'
                }`}
              >
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-tx-2 text-xs font-semibold mb-1.5 uppercase tracking-wide">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tx-3" />
                <input
                  id="input-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-2 border border-border focus:border-primary focus:ring-1 focus:ring-primary/30 text-tx placeholder-tx-3 text-sm outline-none transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-tx-2 text-xs font-semibold mb-1.5 uppercase tracking-wide">Password</label>
              <div className="relative">
                <input
                  id="input-password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="w-full pl-4 pr-10 py-3 rounded-xl bg-surface-2 border border-border focus:border-primary focus:ring-1 focus:ring-primary/30 text-tx placeholder-tx-3 text-sm outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-tx-3 hover:text-tx-2 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error / Success */}
            {error && (
              <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
                {error}
              </div>
            )}
            {success && (
              <div className="text-green-400 text-sm bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2.5">
                {success}
              </div>
            )}

            <button
              id="btn-submit-auth"
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl py-3 transition-all shadow-lg shadow-primary/25 disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {mode === 'login' ? 'Sign In' : 'Create Account'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        </div>

        <p className="text-center text-tx-3 text-xs mt-6">
          By continuing you agree to our Terms of Service
        </p>
      </div>
    </div>
  );
}
