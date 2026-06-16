import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 px-4">
      <div className="mx-auto max-w-lg text-center">
        <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 ring-1 ring-amber-500/20">
          <svg className="h-8 w-8 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m6 4.125 2.25 2.25m0 0 2.25 2.25M12 11.625l2.25-2.25M12 11.625l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">
          Page not found
        </h1>
        <p className="mt-3 text-sm leading-6 text-zinc-400">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            href="/"
            className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-500"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  )
}
