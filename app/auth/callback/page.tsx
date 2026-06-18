"use client"

import { Suspense, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types"

function AuthCallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const code = searchParams.get("code")
  const type = searchParams.get("type")
  const done = useRef(false)

  useEffect(() => {
    if (done.current) return
    if (!code) {
      router.replace("/login?error=no_code")
      return
    }

    const exchange = async () => {
      try {
        // Exchange the auth code directly via Supabase Auth REST API.
        // We bypass @supabase/ssr's createBrowserClient because it hardcodes
        // flowType: "pkce" (see node_modules/@supabase/ssr/dist/module/createBrowserClient.js:37),
        // which causes "PKCE code verifier not found in storage" errors
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
        router.replace(type === "recovery" ? "/reset-password" : "/dashboard")
      } catch (err) {
        console.error("auth callback error:", err)
        router.replace(`/login?error=${encodeURIComponent("unexpected_error")}`)
      }
    }

    exchange()
  }, [code, type, router])

  return (
    <div className="min-h-screen bg-[#080810] text-white flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#c8ff00] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#080810] text-white flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-[#c8ff00] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AuthCallbackHandler />
    </Suspense>
  )
}
