import React from 'react';
import { Outlet } from 'react-router-dom';
import { NavLink } from 'react-router-dom';

const sections = [
    { to: '/', label: 'Accueil', index: '01' },
    { to: '/advisors', label: 'Vendeurs', index: '02' },
    { to: '/alerts', label: 'Alertes', index: '03' },
    { to: '/reattribution', label: 'Réattribution', index: '04' },
    { to: '/messages', label: 'Messages', index: '05' },
];

export default function Layout() {
    return (
        <div className="layout layout-editorial">
            <main className="main-content main-content-editorial">
                <nav className="editorial-nav" aria-label="Navigation principale">
                    <p className="editorial-nav-label">Sections stratégiques</p>
                    <div className="editorial-nav-track">
                        {sections.map((section) => (
                            <NavLink
                                key={section.to}
                                to={section.to}
                                end={section.to === '/'}
                                className={({ isActive }) => `editorial-nav-link ${isActive ? 'is-active' : ''}`}
                            >
                                <span className="editorial-nav-index">{section.index}</span>
                                <span className="editorial-nav-name">{section.label}</span>
                            </NavLink>
                        ))}
                    </div>
                </nav>
                <Outlet />
            </main>
        </div>
    );
}
