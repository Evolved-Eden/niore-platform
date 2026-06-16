'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/login?error=reset_link_expired')
      } else {
        setChecking(false)
      }
    })
  }, [router])

  const handleReset = async () => {
    setError('')
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (updateError) {
      setError(updateError.message)
    } else {
      setSuccess(true)
      setTimeout(() => router.push('/login'), 3000)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-[#080810] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#c8ff00] border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#080810] flex items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Reset Password</h1>
          <p className="text-sm text-white/40 mt-2">Choose a new password for your account</p>
        </div>

        {success ? (
          <div className="rounded-sm border border-green-500/20 bg-green-500/10 px-4 py-8 text-center">
            <p className="text-green-400 font-medium">Password updated successfully</p>
            <p className="text-xs text-green-400/60 mt-2">Redirecting to login...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <div className="rounded-sm border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <input
              type="password"
              placeholder="New password (min 6 chars)"
              minLength={6}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/10 rounded-sm px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#c8ff00]/40"
            />

            <input
              type="password"
              placeholder="Confirm new password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/10 rounded-sm px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#c8ff00]/40"
            />

            <button
              onClick={handleReset}
              disabled={loading}
              className="w-full py-3 bg-[#c8ff00] text-black text-sm font-bold rounded-sm hover:bg-white transition-all disabled:opacity-40"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
