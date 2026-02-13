import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const sections = [
    { href: '/admin', label: 'Accueil', index: '01' },
    { href: '/admin/advisors', label: 'Vendeurs', index: '02' },
    { href: '/admin/alerts', label: 'Alertes', index: '03' },
    { href: '/admin/reattribution', label: 'Réattribution', index: '04' },
    { href: '/admin/messages', label: 'Messages', index: '05' },
];

interface AdminLayoutProps {
    children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const router = useRouter();

    const isActive = (href: string) => {
        if (href === '/admin') {
            return router.pathname === '/admin';
        }
        return router.pathname.startsWith(href);
    };

    return (
        <div className="layout layout-editorial">
            <main className="main-content main-content-editorial">
                <div className="editorial-top-band">
                    <span className="editorial-top-band-brand">LVMH</span>
                </div>
                <nav className="editorial-nav" aria-label="Navigation principale">
                    <p className="editorial-nav-label">Sections stratégiques</p>
                    <div className="editorial-nav-track">
                        {sections.map((section) => (
                            <Link
                                key={section.href}
                                href={section.href}
                                className={`editorial-nav-link ${isActive(section.href) ? 'is-active' : ''}`}
                            >
                                <span className="editorial-nav-index">{section.index}</span>
                                <span className="editorial-nav-name">{section.label}</span>
                            </Link>
                        ))}
                    </div>
                </nav>
                {children}
            </main>
        </div>
    );
}
