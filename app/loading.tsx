export default function RootLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-800 border-t-emerald-500" />
        <p className="text-sm text-zinc-500">Loading...</p>
      </div>
    </div>
  )
}
