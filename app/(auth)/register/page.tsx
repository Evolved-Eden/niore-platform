"use client";

import { Suspense, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function RegisterForm() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const pathParam = searchParams.get("path") || "";
  const initialRole = ["client", "creator", "personal", "affiliate"].includes(pathParam) ? pathParam : "client";
  const [role, setRole] = useState(initialRole);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const planTier = searchParams.get("tier") || searchParams.get("plan") || "";
  const selectedAddons = searchParams.get("addons") || "";
  const selectedAgentIds = searchParams.get("agent_ids") || "";
  const selectedVertical = searchParams.get("vertical") || "";
  const isCheckoutFlow = searchParams.get("checkout") === "1";
  const redirectTo = searchParams.get("redirect") || "";

  // If already logged in, redirect
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;

      // If checkout flow, create Stripe session immediately
      if (isCheckoutFlow && planTier) {
        try {
          const addonsList = selectedAddons
            ? selectedAddons.split(",").filter(Boolean).map(id => ({ id, name: id.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) }))
            : [];
          const agentIds = selectedAgentIds ? JSON.parse(decodeURIComponent(selectedAgentIds)) : [];

          const res = await fetch("/api/stripe/checkout-flow", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tier: planTier,
              path: initialRole,
              addons: addonsList,
              agent_ids: agentIds,
              vertical: selectedVertical,
            }),
          });

          const d = await res.json();
          if (d.url) {
            window.location.href = d.url;
            return;
          }
        } catch {}
        // fallback
        router.replace(`/pricing/${initialRole}`);
        return;
      }

      if (planTier) {
        router.replace(`/onboarding?tier=${encodeURIComponent(planTier)}&path=${encodeURIComponent(initialRole)}`);
      } else if (user) {
        router.replace('/dashboard');
      }
    });
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signUpError, data } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (!data.user) {
      setError("Failed to create account. Please try again.");
      setLoading(false);
      return;
    }

    // Create profile via onSignup — await before navigating
    try {
      const res = await fetch("/api/auth/onSignup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: data.user.id,
          email,
          full_name: fullName,
          phone: phone || null,
          role,
          plan_tier_key: planTier || null,
          path: role,
          addons: selectedAddons ? selectedAddons.split(",").filter(Boolean) : [],
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const message = body?.error || 'Failed to save profile'
        setError(message)
        setLoading(false)
        return
      }
    } catch (err) {
      console.error("onSignup network error:", err);
      setError('Network error during signup. Please try again.')
      setLoading(false)
      return
    }

    let target = "/pricing?reason=select_plan";

    // ── If checkout flow, create Stripe session and redirect ──
    if (isCheckoutFlow && planTier) {
      try {
        const addonsList = selectedAddons
          ? selectedAddons.split(",").filter(Boolean).map(id => ({ id, name: id.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) }))
          : [];
        const agentIds = selectedAgentIds ? JSON.parse(decodeURIComponent(selectedAgentIds)) : [];

        const res = await fetch("/api/stripe/checkout-flow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tier: planTier,
            path: role,
            addons: addonsList,
            agent_ids: agentIds,
            vertical: selectedVertical,
          }),
        });

        const d = await res.json();
        if (d.url) {
          window.location.href = d.url;
          return;
        }

        // Fallback if checkout fails
        target = `/pricing/${role}`;
      } catch {
        target = `/pricing/${role}`;
      }
      router.push(target);
      return;
    }
    if (redirectTo) {
      target = redirectTo
    } else if (planTier) {
      target = `/onboarding?tier=${encodeURIComponent(planTier)}&path=${encodeURIComponent(role)}`
    }
    router.push(target);
  };

  return (
    <div className="min-h-screen bg-[#080810] text-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <form onSubmit={handleSignup} className="space-y-6">
          {/* Brand */}
          <div className="text-center mb-2">
            <div className="w-12 h-12 rounded-full bg-[#c8ff00]/10 border border-[#c8ff00]/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-[#c8ff00]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight">
              Evolve Your <span className="text-[#c8ff00]">Intelligence</span>
            </h1>
            <p className="text-white/40 text-sm mt-1">
              Create your account and begin your blueprint
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-sm bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-white/30 mb-1.5 tracking-wider uppercase">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
                className="w-full bg-white/[0.04] border border-white/10 rounded-sm px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#c8ff00]/40 focus:bg-white/[0.06] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs text-white/30 mb-1.5 tracking-wider uppercase">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full bg-white/[0.04] border border-white/10 rounded-sm px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#c8ff00]/40 focus:bg-white/[0.06] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs text-white/30 mb-1.5 tracking-wider uppercase">
                Phone <span className="text-white/20 normal-case">(optional)</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full bg-white/[0.04] border border-white/10 rounded-sm px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#c8ff00]/40 focus:bg-white/[0.06] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs text-white/30 mb-1.5 tracking-wider uppercase">
                I am a...
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['client', 'creator', 'personal', 'affiliate'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`py-2.5 rounded-sm text-xs font-medium border transition-all ${
                      role === r
                        ? 'bg-[#c8ff00]/10 border-[#c8ff00]/40 text-[#c8ff00]'
                        : 'bg-white/[0.03] border-white/10 text-white/40 hover:border-white/20 hover:text-white/60'
                    }`}
                  >
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-white/30 mb-1.5 tracking-wider uppercase">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                required
                minLength={6}
                className="w-full bg-white/[0.04] border border-white/10 rounded-sm px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#c8ff00]/40 focus:bg-white/[0.06] transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password || !fullName}
              className="w-full py-3.5 bg-[#c8ff00] text-black font-bold text-sm rounded-sm hover:bg-white transition-all disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </div>
        </form>

        {/* Links */}
        <div className="text-center text-sm text-white/30 mt-6">
          Already have an account?{" "}
          <Link
            href={planTier ? `/login?tier=${planTier}` : "/login"}
            className="text-[#c8ff00] hover:text-white transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#080810] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#c8ff00] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
