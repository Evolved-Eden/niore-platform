import type { Metadata } from 'next'
import { Manrope, Italiana } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

const italiana = Italiana({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-display-face',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Evolved Eden - Registered Intelligence Systems',
  description: 'Registered Intelligence Systems. Build, deploy, and monetize AI twins.',
  icons: { icon: '/favicon.JPG' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${manrope.variable} ${italiana.variable}`}>
      <body className="bg-[#0A0A0B] text-white antialiased">
        {children}
        <Toaster
          theme="dark"
          toastOptions={{
            style: {
              background: '#141414',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#fff',
            },
          }}
        />
      </body>
    </html>
  )
}
