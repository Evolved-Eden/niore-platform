"use client"

import { Suspense, useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"

function ResetPasswordForm() {
  const supabase = createClient()
  const router = useRouter()

  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    // Verify user has an active session (auth code was exchanged in callback)
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace("/login?error=invalid_reset_link")
        return
      }
      setCheckingSession(false)
    })
  }, [supabase, router])

  async function handleReset() {
    if (!password.trim()) {
      setError("Password is required")
      return
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }
    if (password !== confirm) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)
    setError(null)

    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setTimeout(() => router.push("/login"), 3000)
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-[#080810] text-white flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#c8ff00] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[#080810] text-white flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="font-display text-lg font-semibold tracking-wide">
            EVOLVED <span className="text-[#c8ff00]">EDEN</span>
          </Link>
        </div>

        <div className="glass rounded-sm p-8 border border-white/[0.06]">
          <h1 className="font-display text-xl font-bold mb-1">Reset Password</h1>
          <p className="text-sm text-white/40 mb-6">Choose a new password for your account.</p>

          {error && (
            <div className="mb-4 p-3 rounded-sm bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {success ? (
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-[#c8ff00]/10 border-2 border-[#c8ff00]/30 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-[#c8ff00]">✓</span>
              </div>
              <p className="text-sm text-white/70 mb-2">Password updated successfully!</p>
              <p className="text-xs text-white/30">Redirecting to login...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-white/30 mb-1.5 tracking-wider uppercase">New Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full bg-white/[0.04] border border-white/10 rounded-sm px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#c8ff00]/40 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs text-white/30 mb-1.5 tracking-wider uppercase">Confirm Password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat your password"
                  className="w-full bg-white/[0.04] border border-white/10 rounded-sm px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#c8ff00]/40 transition-all"
                />
              </div>
              <button
                onClick={handleReset}
                disabled={loading || !password || !confirm}
                className="w-full py-3 bg-[#c8ff00] text-black text-sm font-bold rounded-sm hover:bg-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? "Updating..." : "Update Password"}
              </button>
            </div>
          )}
        </div>

        <p className="text-xs text-white/20 text-center mt-6">
          <Link href="/login" className="hover:text-white/40 transition-colors">Back to login</Link>
        </p>
      </div>
    </main>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#080810] text-white flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#c8ff00] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
