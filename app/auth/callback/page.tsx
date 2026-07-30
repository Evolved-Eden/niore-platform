"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types"

function AuthCallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const code = searchParams.get("code")
  const type = searchParams.get("type")
  const token = searchParams.get("token")
  const done = useRef(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (done.current) return

    // ── Direct recovery token flow (bypasses Kong) ──
    if (token && type === "recovery") {
      done.current = true
      // Exchange the recovery token for a session via our own API
      fetch("/api/auth/exchange-recovery-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            setError(data.error)
          } else {
            router.replace("/reset-password")
          }
        })
        .catch(() => setError("Failed to verify reset link"))
      return
    }

    // ── Original authorization code flow (Supabase standard) ──
    if (!code) {
      router.replace("/login?error=no_code")
      return
    }

    const exchange = async () => {
      try {
        // Exchange the auth code directly via Supabase Auth REST API.
        // We bypass @supabase/ssr's createBrowserClient because it hardcodes
        // flowType: "pkce" which causes "PKCE code verifier not found" errors
        // for recovery/callback flows that don't use PKCE.
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=authorization_code`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            },
            body: JSON.stringify({ code }),
          }
        )

        const data = await response.json()

        if (!response.ok || data.error) {
          console.error("auth callback exchange error:", data.error || data.msg || "unknown")
          router.replace(
            `/login?error=${encodeURIComponent(data.error_description || data.error || "exchange_failed")}`
          )
          return
        }

        // Store the session in cookies via @supabase/ssr's cookie storage
        const supabase = createBrowserClient<Database>(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            auth: {
              detectSessionInUrl: false,
              autoRefreshToken: true,
              persistSession: true,
            },
          }
        )

        await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        })

        done.current = true
        // For recovery (password reset), redirect to reset-password page
        if (type === "recovery") {
          router.replace("/reset-password")
        } else {
          router.replace("/dashboard")
        }
      } catch (err) {
        console.error("auth callback error:", err)
        router.replace(`/login?error=${encodeURIComponent("unexpected_error")}`)
      }
    }

    exchange()
  }, [code, type, token, router])

  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] text-white flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={() => router.replace("/login")}
            className="text-xs text-[#C6A664] hover:text-white transition-colors"
          >
            Back to login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#C6A664] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0A0A0B] text-white flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-[#C6A664] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AuthCallbackHandler />
    </Suspense>
  )
}
