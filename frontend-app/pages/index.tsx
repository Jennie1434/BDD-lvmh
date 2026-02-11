import Head from 'next/head'
import Link from 'next/link'

export default function Home() {
    return (
        <main className="min-h-screen bg-[#0C0B0A] text-white flex items-center justify-center">
            <Head>
                <title>LVMH - Manager Console</title>
                <meta name="description" content="Accès rapide à la console manager." />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <div className="text-center space-y-5">
                <p className="text-xs uppercase tracking-[0.4em] text-[#C9A664]">Manager Console</p>
                <h1 className="text-4xl font-semibold">Accès Admin</h1>
                <p className="text-sm text-white/70">Ouvrir la console manager pour piloter la boutique.</p>
                <div className="flex justify-center gap-3">
                    <Link
                        href="/admin"
                        className="rounded-full bg-[#C9A664] px-6 py-2 text-xs uppercase tracking-[0.3em] text-black"
                    >
                        Ouvrir la console
                    </Link>
                    <Link
                        href="/landing"
                        className="rounded-full border border-white/10 px-6 py-2 text-xs uppercase tracking-[0.3em] text-white/70"
                    >
                        Landing
                    </Link>
                </div>
            </div>
        </main>
    )
}
