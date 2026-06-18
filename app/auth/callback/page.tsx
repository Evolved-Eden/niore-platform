"use client"

import { Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

function AuthCallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const code = searchParams.get("code")
  const type = searchParams.get("type")

  useEffect(() => {
    if (!code) {
      router.replace("/login?error=no_code")
      return
    }

    const exchange = async () => {
      const supabase = createClient()

      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error("auth callback exchange error:", error.message)
        router.replace(`/login?error=${encodeURIComponent(error.message)}`)
        return
      }

      // Successful exchange — redirect based on flow type
      if (type === "recovery") {
        router.replace("/reset-password")
      } else {
        router.replace("/dashboard")
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
