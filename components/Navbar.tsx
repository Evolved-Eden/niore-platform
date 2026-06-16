import Link from 'next/link'
import Image from 'next/image'
import { EXTERNAL_LINKS } from '@/lib/constants'

const navLinks = [
  { label: 'Services', href: EXTERNAL_LINKS.SERVICES, external: true },
  { label: 'Paths', href: '#paths', external: false },
  { label: 'Exchange', href: EXTERNAL_LINKS.EXCHANGE, external: true },
  { label: 'Join as a Client', href: '/define-intelligence/client', external: false },
  { label: 'Demos', href: '/demo', external: false },
]

export default function Navbar() {
  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-white/5 bg-[#080810]/88 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.JPG" alt="Evolved Eden" width={120} height={28} className="object-contain" />
        </Link>
        <div className="hidden items-center gap-6 text-sm text-white/50 md:flex">
          {navLinks.map((link) =>
            link.external ? (
              <a
                key={link.label}
                href={link.href}
                className="transition-colors hover:text-white"
                target="_blank"
                rel="noopener"
              >
                {link.label}
              </a>
            ) : (
              <Link key={link.label} href={link.href} className="transition-colors hover:text-white">
                {link.label}
              </Link>
            )
          )}
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden text-sm text-white/50 transition-colors hover:text-white sm:inline">
            Sign In
          </Link>
          <Link
            href="/pricing"
            className="rounded-sm bg-[#c8ff00] px-4 py-2 text-xs font-bold text-black transition-colors hover:bg-white"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  )
}
