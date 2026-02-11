import Head from 'next/head'
import Link from 'next/link'

const kpis = [
    { label: 'Vendeurs actifs', value: '12', delta: '+2', tone: 'good' },
    { label: 'Vendeurs inactifs', value: '3', delta: '-1', tone: 'neutral' },
    { label: 'Clients actifs', value: '428', delta: '+18', tone: 'good' },
    { label: 'Intentions HOT', value: '64', delta: '+9', tone: 'hot' },
    { label: 'Pipeline estimé', value: '€2.4M', delta: '+6%', tone: 'good' },
    { label: 'Alertes critiques', value: '7', delta: '+3', tone: 'alert' },
]

const alerts = [
    {
        title: 'HOT sans suivi',
        detail: '8 clients n’ont pas eu de rappel depuis 72h.',
        badge: '🔥 Prioritaire',
    },
    {
        title: 'Surcharge vendeur',
        detail: '2 vendeurs dépassent 45 clients actifs.',
        badge: '⚖️ Rééquilibrer',
    },
    {
        title: 'Chute conversion',
        detail: 'Conversion -12% sur les 14 derniers jours.',
        badge: '📉 Audit',
    },
    {
        title: 'Clients oubliés',
        detail: '11 clients WARM sans interaction depuis 30j.',
        badge: '🧊 Relancer',
    },
]

const teamSnapshot = [
    { name: 'Alicia Morand', status: 'Active', clients: 48, hot: 9, score: 92 },
    { name: 'Hugo Bernard', status: 'Active', clients: 39, hot: 6, score: 87 },
    { name: 'Yasmin Costa', status: 'Inactive', clients: 27, hot: 4, score: 74 },
]

export default function AdminHome() {
    return (
        <main className="min-h-screen bg-[#0C0B0A] text-white">
            <Head>
                <title>Manager Console | LVMH</title>
                <meta
                    name="description"
                    content="Vue manager: boutique, vendeurs, alertes et pipeline."
                />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <div className="relative overflow-hidden">
                <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(201,166,100,0.25),rgba(12,11,10,0))]" />
                <div className="pointer-events-none absolute -right-32 top-20 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(91,86,74,0.35),rgba(12,11,10,0))]" />
                <div className="pointer-events-none absolute bottom-0 left-0 h-[220px] w-full bg-[linear-gradient(180deg,rgba(12,11,10,0),rgba(12,11,10,0.95))]" />

                <div className="mx-auto max-w-6xl px-6 pb-20 pt-14">
                    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="text-xs uppercase tracking-[0.4em] text-[#C9A664]">
                                Manager Console
                            </p>
                            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white md:text-5xl">
                                Maison Montaigne
                            </h1>
                            <p className="mt-3 max-w-xl text-sm text-white/70">
                                Vue synthèse: vendeurs, clients et alertes critiques pour piloter la
                                boutique en 5 secondes.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Link
                                href="/admin/reassign"
                                className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-xs uppercase tracking-[0.3em] text-white/80 transition hover:border-[#C9A664]/60 hover:text-white"
                            >
                                Clients à réassigner
                            </Link>
                            <Link
                                href="/admin/alerts"
                                className="rounded-full bg-[#C9A664] px-5 py-2 text-xs uppercase tracking-[0.3em] text-black transition hover:brightness-110"
                            >
                                Voir alertes
                            </Link>
                        </div>
                    </div>

                    <div className="mt-12 grid gap-4 md:grid-cols-3">
                        {kpis.map((kpi) => (
                            <div
                                key={kpi.label}
                                className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm"
                            >
                                <p className="text-[11px] uppercase tracking-[0.3em] text-white/50">
                                    {kpi.label}
                                </p>
                                <div className="mt-4 flex items-end justify-between">
                                    <p className="text-3xl font-semibold">{kpi.value}</p>
                                    <span
                                        className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] ${kpi.tone === 'alert'
                                            ? 'bg-red-500/20 text-red-200'
                                            : kpi.tone === 'hot'
                                                ? 'bg-orange-400/20 text-orange-200'
                                                : 'bg-emerald-400/15 text-emerald-200'
                                            }`}
                                    >
                                        {kpi.delta}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold">Pulse Boutique</h2>
                                <span className="text-xs uppercase tracking-[0.3em] text-white/50">
                                    7 derniers jours
                                </span>
                            </div>
                            <div className="mt-6 grid gap-4 md:grid-cols-2">
                                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                                    <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                                        Conversion
                                    </p>
                                    <p className="mt-3 text-3xl font-semibold">18.4%</p>
                                    <p className="mt-2 text-xs text-white/60">
                                        +2.1 pts vs. semaine dernière
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                                    <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                                        Panier moyen
                                    </p>
                                    <p className="mt-3 text-3xl font-semibold">€6.8K</p>
                                    <p className="mt-2 text-xs text-white/60">
                                        3 closings > €20K cette semaine
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 md:col-span-2">
                                    <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                                        Répartition clients
                                    </p>
                                    <div className="mt-4 flex flex-wrap gap-3 text-xs uppercase tracking-[0.3em]">
                                        <span className="rounded-full bg-orange-400/20 px-4 py-2 text-orange-200">
                                            HOT 64
                                        </span>
                                        <span className="rounded-full bg-sky-300/20 px-4 py-2 text-sky-100">
                                            WARM 197
                                        </span>
                                        <span className="rounded-full bg-slate-400/20 px-4 py-2 text-slate-100">
                                            COLD 167
                                        </span>
                                    </div>
                                    <p className="mt-3 text-xs text-white/60">
                                        24 nouveaux clients depuis 14 jours
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold">Alertes prioritaires</h2>
                                <span className="text-xs uppercase tracking-[0.3em] text-white/50">
                                    À traiter
                                </span>
                            </div>
                            <div className="mt-6 space-y-4">
                                {alerts.map((alert) => (
                                    <div
                                        key={alert.title}
                                        className="rounded-2xl border border-white/10 bg-white/5 p-4"
                                    >
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-semibold">{alert.title}</p>
                                            <span className="text-[10px] uppercase tracking-[0.2em] text-[#C9A664]">
                                                {alert.badge}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-xs text-white/60">{alert.detail}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    <section className="mt-10 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold">Instantané vendeurs</h2>
                            <Link
                                href="/admin/sellers"
                                className="text-xs uppercase tracking-[0.3em] text-[#C9A664]"
                            >
                                Voir liste complète
                            </Link>
                        </div>
                        <div className="mt-6 grid gap-4 md:grid-cols-3">
                            {teamSnapshot.map((seller) => (
                                <div
                                    key={seller.name}
                                    className="rounded-2xl border border-white/10 bg-white/5 p-5"
                                >
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-semibold">{seller.name}</p>
                                        <span
                                            className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] ${seller.status === 'Active'
                                                ? 'bg-emerald-400/15 text-emerald-200'
                                                : 'bg-slate-400/20 text-slate-200'
                                                }`}
                                        >
                                            {seller.status}
                                        </span>
                                    </div>
                                    <div className="mt-4 text-xs text-white/60">
                                        <p>{seller.clients} clients</p>
                                        <p>{seller.hot} clients HOT</p>
                                    </div>
                                    <div className="mt-4 flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/50">
                                        <span>Score</span>
                                        <span className="text-white">{seller.score}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>

            <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Marcellus&family=Manrope:wght@300;400;500;600;700&display=swap');
        body {
          font-family: 'Manrope', sans-serif;
          background: #0c0b0a;
        }
        h1, h2 {
          font-family: 'Marcellus', serif;
          letter-spacing: 0.01em;
        }
      `}</style>
        </main>
    )
}
