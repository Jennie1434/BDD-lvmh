import React from 'react';
import { Mail, Phone, Star } from 'lucide-react';

const AdvisorCard = ({ name, store, clients, sales, rating, img }) => (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#eee', marginBottom: '1rem', overflow: 'hidden' }}>
            <img src={`https://ui-avatars.com/api/?name=${name}&background=1A1A1A&color=fff`} alt={name} style={{ width: '100%', height: '100%' }} />
        </div>
        <h3 style={{ fontSize: '1.125rem', marginBottom: '0.25rem' }}>{name}</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>{store}</p>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', width: '100%', justifyContent: 'center' }}>
            <div>
                <div style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)' }}>{clients}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Clients</div>
            </div>
            <div>
                <div style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)' }}>{sales}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Ventes (k€)</div>
            </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
            <button className="btn btn-outline" style={{ padding: '0.5rem' }}><Mail size={16} /></button>
            <button className="btn btn-outline" style={{ padding: '0.5rem' }}><Phone size={16} /></button>
        </div>
    </div>
);

export default function Advisors() {
    const advisors = [
        { name: "Julie Martin", store: "Champs-Élysées", clients: 145, sales: 850, rating: 4.9 },
        { name: "Thomas Dubois", store: "Montaigne", clients: 112, sales: 720, rating: 4.8 },
        { name: "Sarah Cohen", store: "Vendôme", clients: 98, sales: 940, rating: 5.0 },
        { name: "Marc Levy", store: "Le Bon Marché", clients: 130, sales: 680, rating: 4.7 },
        { name: "Elise Faure", store: "Samaritaine", clients: 85, sales: 510, rating: 4.6 },
        { name: "Jean Renard", store: "Champs-Élysées", clients: 160, sales: 890, rating: 4.9 },
    ];

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Nos Vendeurs</h1>
                    <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>Performance et gestion des Client Advisors.</p>
                </div>
                <button className="btn">Ajouter Vendeur</button>
            </div>

            <div className="grid-3">
                {advisors.map((adv, i) => (
                    <AdvisorCard key={i} {...adv} />
                ))}
            </div>
        </div>
    );
}
