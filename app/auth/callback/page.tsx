"use client"

import { Suspense, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

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

    const supabase = createClient()

    // The browser client auto-detects the code in the URL and exchanges it
    // (detectSessionInUrl defaults to true). We listen for the result.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "SIGNED_IN") {
        done.current = true
        router.replace(type === "recovery" ? "/reset-password" : "/dashboard")
      }
    })

    // Fallback: if auto-detect doesn't fire within 2s, try manual exchange
    const fallback = setTimeout(async () => {
      if (done.current) return

      // Check if auto-exchange already succeeded
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session) {
        done.current = true
        subscription.unsubscribe()
        router.replace(type === "recovery" ? "/reset-password" : "/dashboard")
        return
      }

      // Manual exchange
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) {
        console.error("auth callback exchange error:", error.message)
        router.replace(`/login?error=${encodeURIComponent(error.message)}`)
        return
      }

      done.current = true
      router.replace(type === "recovery" ? "/reset-password" : "/dashboard")
    }, 2000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(fallback)
    }
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
