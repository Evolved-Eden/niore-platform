import Link from 'next/link'
import Image from 'next/image'
import { EXTERNAL_LINKS } from '@/lib/constants'

const footerLinks = [
  { label: 'Define Intelligence', href: '/define-intelligence' },
  { label: 'Demo', href: '/demo' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Take the Blueprint', href: '/intake' },
  { label: 'Services', href: EXTERNAL_LINKS.SERVICES, external: true },
  { label: 'Exchange', href: EXTERNAL_LINKS.EXCHANGE, external: true },
]

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[#0b0b14]">
      <div className="mx-auto max-w-7xl px-5 py-12 md:px-8">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row">
          <div>
            <Link href="/" className="inline-block">
              <Image src="/logo.JPG" alt="Evolved Eden" width={140} height={32} className="object-contain" />
            </Link>
            <p className="mt-2 max-w-xs text-sm text-white/40">
              Registered Intelligence Systems. Build, deploy, and monetize AI twins.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            {footerLinks.map((link) =>
              link.external ? (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener"
                  className="text-sm text-white/40 transition-colors hover:text-white"
                >
                  {link.label}
                </a>
              ) : (
                <Link key={link.label} href={link.href} className="text-sm text-white/40 transition-colors hover:text-white">
                  {link.label}
                </Link>
              )
            )}
          </div>
        </div>
        <div className="mt-10 border-t border-white/5 pt-6 text-center text-xs text-white/30">
          &copy; {new Date().getFullYear()} Evolved Eden. Registered Intelligence Systems.
        </div>
      </div>
    </footer>
  )
}
