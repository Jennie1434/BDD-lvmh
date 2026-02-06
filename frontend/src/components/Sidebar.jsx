import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, UserCheck, MessageSquare, LogOut, LogIn } from 'lucide-react';

export default function Sidebar() {
    const [isLoggedIn, setIsLoggedIn] = useState(true); // Mock login state for demo

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                LVMH <span style={{ fontSize: '0.5em', display: 'block', letterSpacing: '0.2em', marginTop: '5px', opacity: 0.7 }}>CLIENTELING</span>
            </div>

            <nav style={{ flex: 1 }}>
                <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    <LayoutDashboard size={20} />
                    <span>Accueil</span>
                </NavLink>

                <NavLink to="/advisors" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    <Users size={20} />
                    <span>Vendeurs</span>
                </NavLink>

                <NavLink to="/reattribution" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    <UserCheck size={20} />
                    <span>Réattribution</span>
                </NavLink>

                {/* Messaging - Conditional Rendering */}
                {isLoggedIn && (
                    <NavLink to="/messages" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} style={{ marginTop: '2rem' }}>
                        <div style={{ position: 'relative' }}>
                            <MessageSquare size={20} />
                            <div style={{
                                position: 'absolute', top: '-4px', right: '-4px', width: '8px', height: '8px',
                                background: 'var(--color-warning)', borderRadius: '50%', border: '1px solid var(--color-primary)'
                            }}></div>
                        </div>
                        <span>Messagerie</span>
                    </NavLink>
                )}
            </nav>

            {/* Session Control Mock */}
            <div style={{ marginBottom: '2rem', padding: '0 1rem' }}>
                <button
                    onClick={() => setIsLoggedIn(!isLoggedIn)}
                    style={{
                        background: 'rgba(255,255,255,0.05)', border: 'none', color: '#ccc',
                        width: '100%', padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '10px',
                        cursor: 'pointer', borderRadius: '4px', fontSize: '0.85rem'
                    }}
                >
                    {isLoggedIn ? <LogOut size={16} /> : <LogIn size={16} />}
                    {isLoggedIn ? "Se déconnecter" : "Connexion"}
                </button>
            </div>

            <div style={{ marginTop: 'auto', fontSize: '0.75rem', opacity: 0.5, textAlign: 'center' }}>
                © 2026 LVMH
            </div>
        </aside>
    );
}
