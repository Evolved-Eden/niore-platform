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

    // Use implicit flow (not PKCE) for the callback exchange.
    // The recovery email flow doesn't store a PKCE code verifier,
    // so PKCE would fail with "PKCE code verifier not found in storage".
    const supabase = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          flowType: "implicit",
          detectSessionInUrl: false,
          autoRefreshToken: true,
          persistSession: true,
        },
      }
    )

    const exchange = async () => {
      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error("auth callback exchange error:", error.message)
        router.replace(`/login?error=${encodeURIComponent(error.message)}`)
        return
      }

      done.current = true
      router.replace(type === "recovery" ? "/reset-password" : "/dashboard")
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
