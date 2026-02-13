import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { MessageCircle, Search, Send, Paperclip, Sparkles } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface Conversation {
  id: string;
  name: string;
  role: string;
  lastMessage: string;
  timestamp: Date;
  unread: number;
}

export default function Messages() {
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: '1',
      name: 'LVMH Genius',
      role: 'Assistant IA',
      lastMessage: 'Comment puis-je vous aider aujourd\'hui?',
      timestamp: new Date(),
      unread: 0
    },
    {
      id: '2',
      name: 'Sophie Martin',
      role: 'Conseillère',
      lastMessage: 'Le client est très intéressé par la collection',
      timestamp: new Date(Date.now() - 3600000),
      unread: 2
    },
    {
      id: '3',
      name: 'Pierre Durand',
      role: 'Manager',
      lastMessage: 'Réunion à 15h pour discuter des performances',
      timestamp: new Date(Date.now() - 7200000),
      unread: 0
    }
  ]);

  const [activeConversation, setActiveConversation] = useState<Conversation>(conversations[0]);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Bonjour! Je suis LVMH Genius, votre assistant intelligent. Comment puis-je vous aider aujourd\'hui?',
      sender: 'ai',
      timestamp: new Date(Date.now() - 10000000)
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: newMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');

    if (activeConversation.id === '1') {
      setTimeout(() => {
        const aiResponse = generateAIResponse(newMessage);
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          content: aiResponse,
          sender: 'ai',
          timestamp: new Date()
        }]);
      }, 1000);
    }
  }

  function generateAIResponse(userMessage: string): string {
    const lowerMsg = userMessage.toLowerCase();
    
    if (lowerMsg.includes('performance') || lowerMsg.includes('statistique')) {
      return 'D\'après les données, vos performances ce mois-ci montrent une augmentation de 15% par rapport au mois dernier. Votre taux de conversion est de 23% et votre panier moyen est de €8,450.';
    }
    
    if (lowerMsg.includes('client') || lowerMsg.includes('lead')) {
      return 'Vous avez actuellement 47 clients actifs, dont 12 hot leads qui nécessitent une attention prioritaire. Je recommande de contacter Marie Dubois aujourd\'hui - elle n\'a pas eu d\'interaction depuis 5 jours.';
    }
    
    if (lowerMsg.includes('alerte') || lowerMsg.includes('urgent')) {
      return 'Il y a 3 alertes actives qui nécessitent votre attention : 2 clients avec baisse d\'engagement et 1 rendez-vous à confirmer pour demain.';
    }
    
    if (lowerMsg.includes('aide') || lowerMsg.includes('help')) {
      return 'Je peux vous aider à : \n• Analyser vos performances\n• Gérer vos clients et leads\n• Prioriser vos actions\n• Répondre à vos questions sur les produits\n• Générer des rapports\n\nQue souhaitez-vous faire?';
    }
    
    return 'Je suis là pour vous aider avec vos questions sur les clients, les performances, et les alertes. N\'hésitez pas à me poser des questions spécifiques!';
  }

  function switchConversation(conv: Conversation) {
    setActiveConversation(conv);
    
    if (conv.id === '1') {
      setMessages([
        {
          id: '1',
          content: 'Bonjour! Je suis LVMH Genius, votre assistant intelligent. Comment puis-je vous aider aujourd\'hui?',
          sender: 'ai',
          timestamp: new Date(Date.now() - 10000000)
        }
      ]);
    } else {
      setMessages([
        {
          id: '1',
          content: 'Bonjour! Comment allez-vous?',
          sender: 'user',
          timestamp: new Date(Date.now() - 10000000)
        },
        {
          id: '2',
          content: conv.lastMessage,
          sender: 'ai',
          timestamp: new Date(Date.now() - 5000000)
        }
      ]);
    }

    if (conv.unread > 0) {
      setConversations(prev => prev.map(c => 
        c.id === conv.id ? { ...c, unread: 0 } : c
      ));
    }
  }

  const filteredConversations = conversations.filter(conv =>
    conv.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <Head>
        <title>Messages - LVMH</title>
      </Head>
      <div className="seller-page">
        <div className="panel" style={{ display: 'flex', height: 'calc(100vh - 120px)', overflow: 'hidden' }}>
          {/* Conversations Sidebar */}
          <div style={{
            width: '350px',
            borderRight: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            background: '#fafafa'
          }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', background: 'white' }}>
              <h3 style={{ margin: '0 0 1rem', fontSize: '1.25rem', fontWeight: 600 }}>Messages</h3>
              <div style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher..."
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 3rem',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    outline: 'none',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {filteredConversations.map(conv => (
                <div
                  key={conv.id}
                  onClick={() => switchConversation(conv)}
                  style={{
                    padding: '1rem 1.5rem',
                    borderBottom: '1px solid #e0e0e0',
                    cursor: 'pointer',
                    background: activeConversation.id === conv.id ? 'white' : 'transparent',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={(e) => {
                    if (activeConversation.id !== conv.id) {
                      e.currentTarget.style.background = '#f5f5f5';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeConversation.id !== conv.id) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: conv.id === '1' ? 'linear-gradient(135deg, var(--color-accent), #7c3aed)' : 'var(--color-accent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '1rem',
                      flexShrink: 0
                    }}>
                      {conv.id === '1' ? <Sparkles size={24} /> : conv.name?.charAt(0) || 'N'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{conv.name || 'N/A'}</span>
                        {conv.unread > 0 && (
                          <span style={{
                            background: 'var(--color-accent)',
                            color: 'white',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            padding: '0.125rem 0.5rem',
                            borderRadius: '10px',
                            minWidth: '20px',
                            textAlign: 'center'
                          }}>
                            {conv.unread}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: '#999', marginBottom: '0.25rem' }}>{conv.role}</div>
                      <div style={{
                        fontSize: '0.875rem',
                        color: '#666',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {conv.lastMessage}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Messages Area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'white' }}>
            {/* Header */}
            <div style={{
              padding: '1.5rem 2rem',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              background: 'white'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: activeConversation.id === '1' ? 'linear-gradient(135deg, var(--color-accent), #7c3aed)' : 'var(--color-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 600,
                fontSize: '1rem'
              }}>
                {activeConversation.id === '1' ? <Sparkles size={24} /> : activeConversation.name?.charAt(0) || 'N'}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '1.125rem' }}>{activeConversation.name || 'N/A'}</div>
                <div style={{ fontSize: '0.875rem', color: '#999' }}>{activeConversation.role || ''}</div>
              </div>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              background: '#fafafa'
            }}>
              {messages.map(message => (
                <div
                  key={message.id}
                  style={{
                    display: 'flex',
                    justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div style={{
                    maxWidth: '70%',
                    padding: '1rem 1.25rem',
                    borderRadius: '16px',
                    background: message.sender === 'user' ? 'var(--color-accent)' : 'white',
                    color: message.sender === 'user' ? 'white' : '#333',
                    boxShadow: message.sender === 'ai' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    fontSize: '0.9375rem',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-line'
                  }}>
                    {message.content}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} style={{
              padding: '1.5rem 2rem',
              background: 'white',
              borderTop: '1px solid var(--color-border)',
              display: 'flex',
              gap: '1rem',
              alignItems: 'center'
            }}>
              <button type="button" style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer' }}>
                <Paperclip size={20} />
              </button>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={`Écrire à ${activeConversation.name}...`}
                style={{
                  flex: 1,
                  padding: '0.875rem 1.5rem',
                  borderRadius: '99px',
                  border: '1px solid #ddd',
                  outline: 'none',
                  fontFamily: 'var(--font-sans)'
                }}
              />
              <button type="submit" style={{
                width: '45px',
                height: '45px',
                borderRadius: '50%',
                background: 'var(--color-accent)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                cursor: 'pointer',
                transition: 'transform 0.1s'
              }}>
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
