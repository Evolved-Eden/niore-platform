'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'

const STONE = '#A8A29A'
const GOLD = '#C6A664'

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 backdrop-blur" style={{ backgroundColor: "rgba(10,10,11,0.88)", borderBottom: "1px solid #2A2A2A" }}>
      <div className="max-w-6xl mx-auto px-6 md:px-10 h-20 flex items-center justify-between">
        <Link href="/" className="font-display text-xl tracking-widest text-white">
          EVOLVED EDEN
        </Link>

        <nav className="hidden lg:flex items-center gap-7 text-sm tracking-wide" style={{ color: STONE }}>
          <Link href="/services" className="hover:text-white transition-colors">Services</Link>
          <Link href="/define-intelligence" className="hover:text-white transition-colors">Define Intelligence</Link>
          <Link href="/define-os" className="hover:text-white transition-colors">Define OS</Link>
          <Link href="/intelligence-exchange" className="hover:text-white transition-colors">Exchange</Link>
          <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
          <Link href="/demo" className="hover:text-white transition-colors">Demos</Link>
        </nav>

        <div className="hidden md:flex items-center gap-5">
          <Link href="/pricing" className="lg:hidden text-sm tracking-wide hover:text-white transition-colors" style={{ color: STONE }}>Pricing</Link>
          <Link
            href="/define-intelligence"
            className="px-6 py-2.5 text-sm font-bold tracking-wide transition-transform hover:scale-[1.02] inline-block"
            style={{ backgroundColor: GOLD, color: '#0A0A0B' }}
          >
            Enter Platform
          </Link>
        </div>

        <button className="lg:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu" style={{ color: STONE }}>
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden px-6 pb-6 flex flex-col gap-4 text-sm" style={{ color: STONE }}>
          <Link href="/services" onClick={() => setOpen(false)}>Services</Link>
          <Link href="/define-intelligence" onClick={() => setOpen(false)}>Define Intelligence</Link>
          <Link href="/define-os" onClick={() => setOpen(false)}>Define OS</Link>
          <Link href="/intelligence-exchange" onClick={() => setOpen(false)}>Exchange</Link>
          <Link href="/pricing" onClick={() => setOpen(false)}>Pricing</Link>
          <Link href="/demo" onClick={() => setOpen(false)}>Demos</Link>
          <Link
            href="/define-intelligence"
            onClick={() => setOpen(false)}
            className="mt-2 w-full text-center px-6 py-2.5 text-sm font-bold tracking-wide"
            style={{ backgroundColor: GOLD, color: '#0A0A0B' }}
          >
            Enter Platform
          </Link>
        </div>
      )}
    </header>
  )
}
