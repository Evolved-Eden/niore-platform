export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-6">
      <h1 className="text-4xl font-bold">Hoodacity</h1>
      <p className="text-zinc-400">Your AI command center</p>

      <button className="px-6 py-3 bg-white text-black rounded-xl">
        Enter Dashboard
      </button>
    </main>
  );
}