import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center h-screen bg-black text-white gap-6">
      <h1 className="text-4xl font-bold tracking-tight">BizzAR</h1>
      <p className="text-zinc-400 text-lg">Business cards that come alive in AR</p>
      <Link
        href="/ar"
        className="px-6 py-3 bg-white text-black rounded-full font-semibold hover:bg-zinc-200 transition-colors"
      >
        Open AR Experience →
      </Link>
      <p className="text-zinc-600 text-sm mt-4">Open on mobile and point at your business card</p>
    </main>
  )
}
