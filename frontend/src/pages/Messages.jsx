import React, { useState, useEffect, useRef } from 'react';
import { Search, Send, Paperclip, MoreVertical, Phone, Bot } from 'lucide-react';

const mockConversations = [
    { id: 99, name: "LVMH Genius", role: "AI Assistant", pfp: <Bot size={20} />, lastMsg: "Je peux vous aider ?", time: "Maintenant", unread: 0, status: 'online' },
    { id: 1, name: "Julie Martin", role: "Vendeur", pfp: "JM", lastMsg: "La cliente arrive à 14h.", time: "10:30", unread: 2, status: 'online' },
    { id: 2, name: "Support IT", role: "Admin", pfp: "IT", lastMsg: "Maintenance prévue ce soir.", time: "Hier", unread: 0, status: 'busy' },
    { id: 3, name: "Direction Régionale", role: "Management", pfp: "DR", lastMsg: "Bravo pour les résultats !", time: "Lun", unread: 0, status: 'offline' },
    { id: 4, name: "Thomas Dubois", role: "Vendeur", pfp: "TD", lastMsg: "As-tu le dossier de M. Bernard ?", time: "Lun", unread: 0, status: 'online' },
];

const mockMessages = [
    { id: 1, sender: 'them', text: "Bonjour, as-tu bien reçu la fiche de Mme Laurent ?", time: "10:00" },
    { id: 2, sender: 'me', text: "Oui, je suis en train d'analyser ses préférences.", time: "10:05" },
    { id: 3, sender: 'them', text: "Super ! Elle hésite entre le marron et le cognac pour le sac.", time: "10:15" },
    { id: 4, sender: 'them', text: "La cliente arrive à 14h.", time: "10:30" },
];

const aiGreeting = [
    { id: 1, sender: 'them', text: "Bonjour ! Je suis LVMH Genius, votre assistant personnel. Je peux récupérer des infos clients, rédiger des invitations ou analyser des préférences. Comment puis-je vous aider ?", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
];

export default function Messages() {
    const [activeChat, setActiveChat] = useState(mockConversations[0]);
    // Use distinct message lists per chat for a better demo feel
    const [chatHistories, setChatHistories] = useState({
        1: mockMessages,
        99: aiGreeting,
        // others empty for now
    });
    const [newMessage, setNewMessage] = useState("");
    const messagesEndRef = useRef(null);

    const currentMessages = chatHistories[activeChat.id] || [];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [currentMessages, activeChat]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const userMsg = { id: Date.now(), sender: 'me', text: newMessage, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };

        // Update local state
        setChatHistories(prev => ({
            ...prev,
            [activeChat.id]: [...(prev[activeChat.id] || []), userMsg]
        }));

        setNewMessage("");

        // Simulate AI Response
        if (activeChat.id === 99) {
            setTimeout(() => {
                let aiText = "Je n'ai pas compris votre demande.";
                const lowerMsg = userMsg.text.toLowerCase();

                if (lowerMsg.includes("laurent") || lowerMsg.includes("fiche")) {
                    aiText = "Voici les infos sur **Mme Laurent** :\n- **Intérêt** : Maroquinerie (Portefeuille vs Sac Weekend)\n- **Budget** : 3-4K€\n- **Occasion** : Anniversaire 50 ans (Fin mars)\n- **Action** : Préparer la collection capsule.";
                } else if (lowerMsg.includes("invitation") || lowerMsg.includes("mail")) {
                    aiText = "Voici une proposition d'email :\n\n'Chère Mme Laurent,\n\nPour célébrer votre anniversaire à venir, nous avons sélectionné quelques pièces de notre collection capsule printanière qui s'accorderaient parfaitement avec vos goûts pour les cuirs naturels.\n\nSeriez-vous disponible la semaine prochaine pour une découverte privée ?\n\nBien à vous,'";
                } else if (lowerMsg.includes("merci")) {
                    aiText = "Je vous en prie. N'hésitez pas si vous avez besoin d'autre chose.";
                } else {
                    aiText = "Je peux vous aider sur les profils clients (ex: 'Mme Laurent') ou la rédaction de messages. Dites-moi ce dont vous avez besoin.";
                }

                const aiMsg = { id: Date.now() + 1, sender: 'them', text: aiText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };

                setChatHistories(prev => ({
                    ...prev,
                    [activeChat.id]: [...(prev[activeChat.id] || []), aiMsg]
                }));
            }, 1000);
        }
    };

    return (
        <div style={{ height: 'calc(100vh - 4rem)', display: 'flex', gap: '0', background: '#fff', border: '1px solid var(--color-border)' }}>
            {/* List Sidebar */}
            <div style={{ width: '320px', borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
                    <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: '1rem' }}>Messagerie</h2>
                    <div style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            style={{
                                width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                                border: '1px solid #eee', background: '#F8F8F8', outline: 'none',
                                fontFamily: 'var(--font-sans)', fontSize: '0.875rem'
                            }}
                        />
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {mockConversations.map(chat => (
                        <div
                            key={chat.id}
                            onClick={() => setActiveChat(chat)}
                            style={{
                                padding: '1rem 1.5rem',
                                cursor: 'pointer',
                                background: activeChat.id === chat.id ? '#F8F8F8' : 'white',
                                borderLeft: activeChat.id === chat.id ? '3px solid var(--color-accent)' : '3px solid transparent',
                                borderBottom: '1px solid #f0f0f0',
                                transition: 'all 0.2s',
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                <span style={{ fontWeight: activeChat.id === chat.id || chat.unread > 0 ? '600' : '400', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {chat.name}
                                    {chat.id === 99 && <span style={{ fontSize: '0.6rem', background: 'var(--color-primary)', color: 'white', padding: '2px 6px', borderRadius: '99px' }}>AI</span>}
                                </span>
                                <span style={{ fontSize: '0.75rem', color: '#999' }}>{chat.time}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{
                                    fontSize: '0.8rem', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px',
                                    fontWeight: chat.unread > 0 ? '600' : '400'
                                }}>
                                    {chat.lastMsg}
                                </div>
                                {chat.unread > 0 && (
                                    <div style={{
                                        background: 'var(--color-primary)', color: 'white', fontSize: '0.7rem',
                                        width: '18px', height: '18px', borderRadius: '50%',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        {chat.unread}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#FAFAFA' }}>
                {/* Header */}
                <div style={{
                    padding: '1rem 2rem', background: 'white', borderBottom: '1px solid var(--color-border)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '50%', background: activeChat.id === 99 ? 'var(--color-accent)' : '#1A1A1A', color: 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem'
                        }}>
                            {activeChat.pfp === "JM" || activeChat.pfp === "IT" || activeChat.pfp === "DR" || activeChat.pfp === "TD" ? activeChat.pfp : <Bot size={24} />}
                        </div>
                        <div>
                            <div style={{ fontWeight: '600' }}>{activeChat.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }}></div>
                                {activeChat.status === 'online' ? 'En ligne' : 'Absent'}
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', color: '#666' }}>
                        <Phone size={20} style={{ cursor: 'pointer' }} />
                        <MoreVertical size={20} style={{ cursor: 'pointer' }} />
                    </div>
                </div>

                {/* Messages */}
                <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {currentMessages.map((msg, idx) => (
                        <div key={idx} style={{
                            alignSelf: msg.sender === 'me' ? 'flex-end' : 'flex-start',
                            maxWidth: '60%',
                        }}>
                            <div style={{
                                padding: '1rem 1.5rem',
                                background: msg.sender === 'me' ? 'var(--color-primary)' : 'white',
                                color: msg.sender === 'me' ? 'white' : 'var(--color-text)',
                                borderRadius: msg.sender === 'me' ? '12px 12px 0 12px' : '12px 12px 12px 0',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                fontSize: '0.95rem',
                                lineHeight: '1.5',
                                whiteSpace: 'pre-line' // Handle newlines in AI response
                            }}>
                                {msg.text}
                            </div>
                            <div style={{
                                fontSize: '0.7rem', color: '#999', marginTop: '0.5rem',
                                textAlign: msg.sender === 'me' ? 'right' : 'left'
                            }}>
                                {msg.time}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSend} style={{
                    padding: '1.5rem 2rem', background: 'white', borderTop: '1px solid var(--color-border)',
                    display: 'flex', gap: '1rem', alignItems: 'center'
                }}>
                    <button type="button" style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer' }}>
                        <Paperclip size={20} />
                    </button>
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={`Écrire à ${activeChat.name}...`}
                        style={{
                            flex: 1, padding: '0.875rem 1.5rem', borderRadius: '99px',
                            border: '1px solid #ddd', outline: 'none', fontFamily: 'var(--font-sans)'
                        }}
                    />
                    <button type="submit" style={{
                        width: '45px', height: '45px', borderRadius: '50%', background: 'var(--color-accent)',
                        border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                        transition: 'transform 0.1s'
                    }}>
                        <Send size={18} />
                    </button>
                </form>
            </div>
        </div>
    );
}
