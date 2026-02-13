import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const onSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (signInError) {
            setError('Connexion échouée. Vérifie email/mot de passe.');
        } else {
            setSuccess('Connecté. Tu peux ouvrir /admin.');
        }

        setLoading(false);
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <p className="login-eyebrow">Manager Access</p>
                <h1 className="login-title">Connexion</h1>
                <p className="login-subtitle">Utilise le compte manager créé dans Supabase.</p>

                <form onSubmit={onSubmit} className="login-form">
                    <label>
                        Email
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </label>
                    <label>
                        Mot de passe
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </label>
                    <button className="btn btn-gold" type="submit" disabled={loading}>
                        {loading ? 'Connexion...' : 'Se connecter'}
                    </button>
                </form>

                {error && <p className="login-error">{error}</p>}
                {success && <p className="login-success">{success}</p>}
            </div>
        </div>
    );
}
