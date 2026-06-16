"use client";

import { Suspense, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginForm() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const redirectTo = searchParams.get("redirect") || "/dashboard";
  const planTier = searchParams.get("tier") || "";
  const path = searchParams.get("path") || "";

  const handleLogin = async () => {
    setLoading(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push(planTier ? `/onboarding?tier=${encodeURIComponent(planTier)}${path ? `&path=${encodeURIComponent(path)}` : ""}` : redirectTo);
    router.refresh();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) handleLogin();
  };

  return (
    <div className="min-h-screen bg-[#080810] text-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Brand */}
        <div className="text-center mb-2">
          <div className="w-12 h-12 rounded-full bg-[#c8ff00]/10 border border-[#c8ff00]/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-[#c8ff00]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Welcome back
          </h1>
          <p className="text-white/40 text-sm mt-1">
            Sign in to your intelligence system
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 rounded-sm bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-white/30 mb-1.5 tracking-wider uppercase">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="you@example.com"
              className="w-full bg-white/[0.04] border border-white/10 rounded-sm px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#c8ff00]/40 focus:bg-white/[0.06] transition-all"
            />
          </div>

            <div>
              <label className="block text-xs text-white/30 mb-1.5 tracking-wider uppercase">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter your password"
                className="w-full bg-white/[0.04] border border-white/10 rounded-sm px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#c8ff00]/40 focus:bg-white/[0.06] transition-all"
              />
            </div>

            {/* Forgot Password */}
            <div className="flex justify-end -mt-2">
              <button
                type="button"
                onClick={() => setResetMode(true)}
                className="text-xs text-white/30 hover:text-[#c8ff00] transition-colors"
              >
                Forgot password?
              </button>
            </div>

          <button
            onClick={handleLogin}
            disabled={loading || !email || !password}
            className="w-full py-3.5 bg-[#c8ff00] text-black font-bold text-sm rounded-sm hover:bg-white transition-all disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </div>

        {/* Links */}
        <div className="text-center text-sm text-white/30">
          Don&apos;t have an account?{" "}
          <Link
            href={planTier
              ? `/register?tier=${planTier}${path ? `&path=${path}` : ""}${redirectTo ? `&redirect=${encodeURIComponent(redirectTo)}` : ""}`
              : `/register${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}
            className="text-[#c8ff00] hover:text-white transition-colors"
          >
            Create one
          </Link>
        </div>
      </div>

      {/* ── Forgot Password Overlay ── */}
      {resetMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-[#080810] border border-white/[0.08] rounded-xl p-6 w-full max-w-sm">
            <h2 className="font-display text-lg font-bold mb-2">Reset Password</h2>
            <p className="text-xs text-white/40 mb-4">
              Enter your email and we'll send you a reset link.
            </p>

            {resetSent ? (
              <div className="text-center py-6">
                <div className="w-10 h-10 rounded-full bg-[#c8ff00]/10 border border-[#c8ff00]/20 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-5 h-5 text-[#c8ff00]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <p className="text-sm text-white/70 font-medium">Check your email</p>
                <p className="text-xs text-white/40 mt-1">Reset link sent to <span className="text-white/60">{email}</span></p>
                {typeof window !== 'undefined' && window.location.hostname === 'localhost' && (
                  <p className="mt-3 text-[10px] text-white/20">
                    Local dev: check Supabase Studio → Authentication → Emails, or Inbucket at{' '}
                    <a href="http://localhost:54324" target="_blank" className="text-[#c8ff00]/50 hover:text-[#c8ff00] underline">
                      http://localhost:54324
                    </a>
                  </p>
                )}
                <button
                  onClick={() => { setResetMode(false); setResetSent(false) }}
                  className="mt-4 text-xs text-[#c8ff00] hover:text-white transition-colors"
                >
                  Back to sign in
                </button>
              </div>
            ) : (
              <>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-white/[0.04] border border-white/10 rounded-sm px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#c8ff00]/40 transition-all mb-4"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setResetMode(false)}
                    className="flex-1 py-2.5 text-xs text-white/40 border border-white/10 rounded-sm hover:text-white hover:border-white/30 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (!email.trim()) return
                      setLoading(true)
                      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
                        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
                      })
                      setLoading(false)
                      if (resetError) {
                        setError(resetError.message)
                      } else {
                        setResetSent(true)
                      }
                    }}
                    disabled={loading || !email.trim()}
                    className="flex-1 py-2.5 bg-[#c8ff00] text-black text-xs font-bold rounded-sm hover:bg-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {loading ? "Sending..." : "Send Reset Link"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#080810] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#c8ff00] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
