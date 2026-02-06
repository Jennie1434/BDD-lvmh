import React, { useState } from 'react';
import { User, ArrowRight, CheckCircle } from 'lucide-react';

export default function Reattribution() {
    const [clients, setClients] = useState([
        { id: 1, name: "Mme Laurent", category: "VIP", lastPurchase: "2 jours", oldAdvisor: "Julie Martin" },
        { id: 2, name: "M. Sophie", category: "Occasionnel", lastPurchase: "3 mois", oldAdvisor: "Thomas Dubois" },
        { id: 3, name: "Mr. Bernard", category: "Potentiel", lastPurchase: "1 semaine", oldAdvisor: "Julie Martin" },
    ]);

    const [selectedClients, setSelectedClients] = useState([]);

    const toggleSelect = (id) => {
        if (selectedClients.includes(id)) {
            setSelectedClients(selectedClients.filter(c => c !== id));
        } else {
            setSelectedClients([...selectedClients, id]);
        }
    };

    const [targetAdvisor, setTargetAdvisor] = useState("");

    const handleReassign = () => {
        if (!targetAdvisor || selectedClients.length === 0) return;
        alert(`Réattribution de ${selectedClients.length} clients vers ${targetAdvisor} effectuée.`);
        // Reset simulation
        setClients(clients.filter(c => !selectedClients.includes(c.id)));
        setSelectedClients([]);
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Réattribution Clients</h1>
                    <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>Gérer le portefeuille client et les transferts.</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>

                {/* Left: Client List */}
                <div className="card">
                    <h3 style={{ marginBottom: '1.5rem', fontFamily: 'var(--font-serif)' }}>Clients à Réattribuer</h3>
                    <table className="table">
                        <thead>
                            <tr>
                                <th style={{ width: '40px' }}></th>
                                <th>Client</th>
                                <th>Ancien Vendeur</th>
                                <th>Segment</th>
                                <th>Dernier Achat</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clients.map(client => (
                                <tr key={client.id}
                                    onClick={() => toggleSelect(client.id)}
                                    style={{ cursor: 'pointer', background: selectedClients.includes(client.id) ? '#F5F5F5' : 'transparent' }}>
                                    <td>
                                        <div style={{
                                            width: '18px', height: '18px', border: '1px solid #ccc',
                                            background: selectedClients.includes(client.id) ? 'var(--color-primary)' : 'white'
                                        }}></div>
                                    </td>
                                    <td><strong>{client.name}</strong></td>
                                    <td style={{ color: 'var(--color-text-muted)' }}>{client.oldAdvisor}</td>
                                    <td><span className="status-badge">{client.category}</span></td>
                                    <td>{client.lastPurchase}</td>
                                </tr>
                            ))}
                            {clients.length === 0 && (
                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Aucun client en attente.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Right: Action Panel */}
                <div className="card" style={{ height: 'fit-content' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontFamily: 'var(--font-serif)' }}>Action</h3>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>MOUVEMENT</label>
                        <div style={{ padding: '1rem', background: '#F8F8F8', border: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ fontWeight: 'bold' }}>{selectedClients.length} Clients</div>
                            <ArrowRight size={16} />
                            <div style={{ fontWeight: 'bold', color: targetAdvisor ? 'var(--color-primary)' : '#ccc' }}>
                                {targetAdvisor || "?"}
                            </div>
                        </div>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>NOUVEAU VENDEUR</label>
                        <select
                            style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', fontFamily: 'var(--font-sans)' }}
                            onChange={(e) => setTargetAdvisor(e.target.value)}
                            value={targetAdvisor}
                        >
                            <option value="">Sélectionner un vendeur...</option>
                            <option value="Sarah Cohen">Sarah Cohen (Vendôme)</option>
                            <option value="Marc Levy">Marc Levy (Le Bon Marché)</option>
                            <option value="Elise Faure">Elise Faure (Samaritaine)</option>
                        </select>
                    </div>

                    <button className="btn" style={{ width: '100%' }} onClick={handleReassign} disabled={!targetAdvisor || selectedClients.length === 0}>
                        Confirmer le transfert
                    </button>
                </div>

            </div>
        </div>
    );
}
