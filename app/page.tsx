export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-6">
      <h1 className="text-4xl font-bold">Hoodacity</h1>
      <p className="text-zinc-400">Your AI command center</p>

      <button className="px-6 py-3 bg-white text-black rounded-xl">
        Enter Dashboard
      </button>
    </main>

import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-24">
      
      <h1 className="text-5xl font-bold mb-6">
        Hoodacity ⚡ Intelligence Infrastructure
      </h1>

      <p className="text-gray-400 max-w-xl mb-10">
        Build, deploy, and scale AI-powered Registered Intelligences across your business,
        clients, and marketplace.
      </p>

      <div className="flex gap-4">
        <Link href="/register">
          <button className="bg-white text-black px-6 py-3 rounded-lg font-semibold">
            Get Started
          </button>
        </Link>

        <Link href="/dashboard">
          <button className="border border-gray-600 px-6 py-3 rounded-lg">
            Dashboard
          </button>
        </Link>
      </div>

      {/* ENTERPRISE CTA */}
      <div className="mt-20 border border-gray-800 p-10 rounded-xl max-w-2xl">
        <h2 className="text-2xl font-bold mb-4">
          Enterprise Intelligence Systems
        </h2>
        <p className="text-gray-400 mb-6">
          Custom AI infrastructure, automation pipelines, and multi-agent orchestration.
        </p>

        <button className="bg-indigo-600 px-6 py-3 rounded-lg font-semibold">
          Request Concierge Setup
        </button>
      </div>
    </div>
>>>>>>> 4bc5fce (local progress before sync)
  );
}