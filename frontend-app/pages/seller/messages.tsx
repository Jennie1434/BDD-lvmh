import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { CockpitLayout } from '../../components/layout/CockpitLayout';
import { Send, Bot, User, Paperclip, MoreHorizontal, Search, Users, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../components/ui/Button';
import { useSupabase } from '../../hooks/useSupabase';

// Static Bot Contact
const botContact = {
    id: 'bot',
    name: 'Assistant LVMH',
    role: 'IA Intégrée',
    type: 'bot',
    status: 'online',
    avatar: 'IA'
};

export default function MessagesPage() {
    const { user, colleagues } = useSupabase();
    const [selectedContactId, setSelectedContactId] = useState<string>('');
    const [inputValue, setInputValue] = useState("");

    // Transform colleagues to contact format
    const colleagueContacts = colleagues.map(c => ({
        id: c.id,
        name: `${c.first_name} ${c.last_name || ''}`,
        role: c.role ? (c.role.charAt(0).toUpperCase() + c.role.slice(1)) : 'Conseiller',
        type: 'colleague',
        status: Math.random() > 0.5 ? 'online' : 'busy', // Mock status for liveliness
        avatar: `${c.first_name?.[0] || ''}${c.last_name?.[0] || ''}`.toUpperCase()
    }));

    const allContacts = [...colleagueContacts, botContact];

    // Mock Conversations - key by ID
    const [msgs, setMsgs] = useState<any>({
        'bot': [
            { id: 1, sender: 'bot', text: "Bonjour ! Je suis l'assistant virtuel LVMH. Comment puis-je vous aider aujourd'hui ?", timestamp: '09:41' },
        ]
    });

    // Select first contact on load
    useEffect(() => {
        if (colleagueContacts.length > 0 && !selectedContactId) {
            setSelectedContactId(colleagueContacts[0].id);
        } else if (!selectedContactId) {
            setSelectedContactId('bot');
        }
    }, [colleagueContacts, selectedContactId]);

    const currentContact = allContacts.find(c => c.id === selectedContactId) || botContact;
    const currentMessages = msgs[selectedContactId] || [];

    const handleSendMessage = () => {
        if (!inputValue.trim()) return;
        const newMsg = { id: Date.now(), sender: 'user', text: inputValue, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };

        setMsgs((prev: any) => ({
            ...prev,
            [selectedContactId]: [...(prev[selectedContactId] || []), newMsg]
        }));
        setInputValue("");

        // Mock response if bot
        if (currentContact.type === 'bot') {
            setTimeout(() => {
                const botResponse = {
                    id: Date.now() + 1,
                    sender: 'bot',
                    text: "Je traite votre demande...",
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
                setMsgs((prev: any) => ({
                    ...prev,
                    [selectedContactId]: [...(prev[selectedContactId] || []), botResponse]
                }));
            }, 1000);
        }
    };

    return (
        <CockpitLayout>
            <Head>
                <title>LVMH - Messagerie</title>
            </Head>

            <div className="max-w-7xl mx-auto h-[calc(100vh-100px)] flex gap-6 p-6">

                {/* Sidebar: Contacts */}
                <div className="w-80 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-xl font-serif font-bold mb-4">Messages</h2>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Rechercher un collègue..."
                                className="w-full bg-gray-50 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        <h3 className="text-xs uppercase font-bold text-gray-400 px-2 mb-2">Collègues</h3>
                        {colleagueContacts.length > 0 ? colleagueContacts.map(contact => (
                            <div
                                key={contact.id}
                                onClick={() => setSelectedContactId(contact.id)}
                                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${selectedContactId === contact.id ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                            >
                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600 relative">
                                    {contact.avatar}
                                    {contact.status === 'online' && <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className={`text-sm font-medium truncate ${selectedContactId === contact.id ? 'text-black' : 'text-gray-700'}`}>{contact.name}</h4>
                                    <p className="text-xs text-gray-500 truncate">{contact.role}</p>
                                </div>
                            </div>
                        )) : (
                            <p className="text-xs text-gray-400 px-2 italic">Aucun collègue trouvé.</p>
                        )}

                        <h3 className="text-xs uppercase font-bold text-gray-400 px-2 mt-6 mb-2">Assistants</h3>
                        <div
                            onClick={() => setSelectedContactId(botContact.id)}
                            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${selectedContactId === botContact.id ? 'bg-black text-white' : 'hover:bg-gray-50'}`}
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold relative ${selectedContactId === botContact.id ? 'bg-white text-black' : 'bg-black text-white'}`}>
                                <Bot size={18} />
                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium truncate">{botContact.name}</h4>
                                <p className={`text-xs truncate ${selectedContactId === botContact.id ? 'text-gray-300' : 'text-gray-500'}`}>{botContact.role}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white z-10">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentContact.type === 'bot' ? 'bg-black text-white' : 'bg-gray-200 text-gray-700'}`}>
                                {currentContact.type === 'bot' ? <Bot size={20} /> : <span className="font-bold">{currentContact.avatar}</span>}
                            </div>
                            <div>
                                <h2 className="font-bold text-sm">{currentContact.name}</h2>
                                <span className={`flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide ${currentContact.status === 'online' ? 'text-green-500' : 'text-gray-400'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${currentContact.status === 'online' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                    {currentContact.status === 'online' ? 'En ligne' : 'Occupé'}
                                </span>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm"><MoreHorizontal size={20} /></Button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
                        {currentMessages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                <Users size={48} className="mb-4 opacity-20" />
                                <p>Démarrez une nouvelle conversation avec {currentContact.name}</p>
                            </div>
                        ) : (
                            currentMessages.map((msg: any) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${msg.sender === 'user'
                                        ? 'bg-black text-white rounded-br-none'
                                        : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'
                                        }`}>
                                        <p className="text-sm leading-relaxed">{msg.text}</p>
                                        <span className="text-[10px] block mt-2 text-gray-400 opacity-70">{msg.timestamp}</span>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>

                    {/* Input */}
                    <div className="p-4 bg-white border-t border-gray-100">
                        <div className="relative flex items-center gap-2">
                            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-black">
                                <Paperclip size={20} />
                            </Button>
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder={`Écrire à ${currentContact.name}...`}
                                className="flex-1 bg-gray-100 rounded-full px-6 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                            />
                            <Button
                                onClick={handleSendMessage}
                                className={`rounded-full w-10 h-10 p-0 flex items-center justify-center transition-all ${inputValue.trim() ? 'bg-black text-white' : 'bg-gray-200 text-gray-400'}`}
                            >
                                <Send size={18} />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </CockpitLayout>
    );
}
