'use client';

import React, { useEffect, useMemo, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/auth/SupabaseProvider';
import { Gamepad2, LogIn, ShieldCheck, Mail, KeyRound, ArrowLeft, UserRound } from 'lucide-react';

function LoginForm(): React.ReactElement {
  const router = useRouter();
  const search = useSearchParams();
  const redirectTo = useMemo(() => search.get('redirect') ?? '/play', [search]);

  const { session, loading } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && session) router.replace(redirectTo);
  }, [loading, session, router, redirectTo]);

  const show = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2400); };

  async function onSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return show('Email & password required');
    try {
      setBusy(true);
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/login?redirect=${encodeURIComponent(redirectTo)}` }
      });
      if (error) throw error;
      show('Account created. Check your email to confirm.');
    } catch {
      show('Sign up failed.');
    } finally { setBusy(false); }
  }

  async function onSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return show('Email & password required');
    try {
      setBusy(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.replace(redirectTo);
    } catch {
      show('Invalid credentials.');
    } finally { setBusy(false); }
  }

  async function onReset(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return show('Enter your email');
    try {
      setBusy(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login?redirect=${encodeURIComponent(redirectTo)}`
      });
      if (error) throw error;
      show('Password reset email sent.');
      setMode('signin');
    } catch {
      show('Could not send reset email.');
    } finally { setBusy(false); }
  }

  function continueAsGuest() {
    localStorage.setItem('nb_guest', '1');
    router.replace(redirectTo);
  }

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#070b16] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,229,255,0.10),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(255,215,0,0.08),transparent_60%)]" />

      <header className="relative z-10 mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-6">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-white">
          <ArrowLeft size={16} /> Back
        </Link>
        <div className="inline-flex items-center gap-2 text-white/90">
          <Gamepad2 size={18} />
          <span className="font-bold tracking-tight">Neon Blobs</span>
        </div>
        <div className="w-16" />
      </header>

      <main className="relative z-10 mx-auto grid w-full max-w-5xl grid-cols-1 gap-6 px-5 pb-16 lg:grid-cols-2">
        <section className="hidden lg:flex">
          <div className="relative w-full overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300 ring-1 ring-cyan-400/30">
              <ShieldCheck size={14} /> Secure email login
            </div>
            <h1 className="mb-3 text-3xl font-extrabold tracking-tight">
              Log in fast. <span className="text-cyan-300">No distractions.</span>
            </h1>
            <p className="mb-8 max-w-md text-white/70">
              Use email & password. We’ll sync cosmetics, shards and progress to your account.
              Prefer to try first? Continue as guest and upgrade later.
            </p>
          </div>
        </section>

        <section className="w-full">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-amber-300" />

            <div className="space-y-5 p-6 sm:p-8">
              <div className="flex gap-2 rounded-xl bg-white/5 p-1 ring-1 ring-white/10">
                <button onClick={() => setMode('signin')}
                        className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold ${mode==='signin'?'bg-white/15':''}`}>
                  Sign in
                </button>
                <button onClick={() => setMode('signup')}
                        className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold ${mode==='signup'?'bg-white/15':''}`}>
                  Create account
                </button>
                <button onClick={() => setMode('reset')}
                        className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold ${mode==='reset'?'bg-white/15':''}`}>
                  Reset password
                </button>
              </div>

              {/* Form */}
              <form
                onSubmit={(e) => {
                  if (mode === 'signin') return onSignIn(e);
                  if (mode === 'signup') return onSignUp(e);
                  return onReset(e);
                }}
                className="space-y-3"
              >
                <label className="block text-xs font-semibold text-white/70">Email</label>
                <div className="flex items-center gap-2 rounded-xl bg-black/30 px-3 ring-1 ring-white/10 focus-within:ring-white/20">
                  <Mail size={16} className="text-white/50" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-transparent py-2 text-sm text-white placeholder-white/40 outline-none"
                  />
                </div>

                {mode !== 'reset' && (
                  <>
                    <label className="block text-xs font-semibold text-white/70">Password</label>
                    <div className="flex items-center gap-2 rounded-xl bg-black/30 px-3 ring-1 ring-white/10 focus-within:ring-white/20">
                      <KeyRound size={16} className="text-white/50" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-transparent py-2 text-sm text-white placeholder-white/40 outline-none"
                      />
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={busy || loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 font-semibold text-white ring-1 ring-cyan-400/30 hover:bg-cyan-500 disabled:opacity-50"
                >
                  <LogIn size={16} />
                  {mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset email'}
                </button>
              </form>

              {/* Guest mode */}
              <div className="pt-2">
                <div className="mb-2 text-center text-xs text-white/50">Prefer not to create an account yet?</div>
                <button
                  onClick={continueAsGuest}
                  disabled={busy || loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-2 font-semibold text-white ring-1 ring-white/15 hover:bg-white/15 disabled:opacity-50"
                >
                  <UserRound size={16} />
                  Continue as Guest
                </button>
                <p className="mt-2 text-center text-[11px] leading-5 text-white/50">
                  Guest progress is stored locally. You can sign in later to sync your cosmetics and shards.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center gap-4 text-[11px] text-white/50">
            <Link href="/terms" className="hover:text-white/80">Terms</Link>
            <span>•</span>
            <Link href="/privacy" className="hover:text-white/80">Privacy</Link>
          </div>
        </section>
      </main>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transform">
          <div className="flex items-center gap-2 rounded-xl bg-black/70 px-4 py-2 text-sm shadow-2xl ring-1 ring-white/10">
            <span>{toast}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage(): React.ReactElement {
  return (
    <Suspense fallback={
      <div className="min-h-[100dvh] bg-[#070b16] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
