'use client'

import { useState } from 'react'

/**
 * Displays a shareable URL with a one-click copy button. Client component
 * because it uses navigator.clipboard; used from server components (e.g. the
 * affiliate dashboard).
 */
export default function CopyLink({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers / non-secure contexts
      const el = document.createElement('textarea')
      el.value = value
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="glass rounded-sm p-5 mb-6 border border-[#C6A664]/20">
      {label && (
        <div className="text-xs text-[#C9974A] tracking-widest uppercase font-medium mb-3">
          {label}
        </div>
      )}
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-white/[0.04] border border-white/10 rounded-sm px-4 py-3 text-sm text-white/80 font-mono truncate">
          {value}
        </div>
        <button
          onClick={handleCopy}
          className="px-5 py-3 bg-[#C6A664] text-black text-sm font-bold rounded-sm hover:bg-white transition-colors flex-shrink-0"
        >
          {copied ? 'Copied ✓' : 'Copy'}
        </button>
      </div>
      <p className="text-xs text-white/30 mt-3">
        Share this link — when someone signs up through it, you earn commission on their plan.
      </p>
    </div>
  )
}
