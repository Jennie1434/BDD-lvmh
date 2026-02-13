import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, User, MapPin, BadgeCheck } from 'lucide-react';
import { useSeller } from '../../context/SellerContext';
import { Button } from '../ui/Button';

interface SellerProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SellerProfileModal = ({ isOpen, onClose }: SellerProfileModalProps) => {
    const { seller, updateSeller } = useSeller();
    const [formData, setFormData] = useState(seller);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setFormData(seller);
        }
    }, [isOpen, seller]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            await updateSeller({
                name: formData.name,
                role: formData.role,
                boutique: formData.boutique,
            });
            onClose();
        } catch (e) {
            setError('Impossible de sauvegarder.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        className="fixed top-24 right-8 z-[70] w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
                    >
                        <div className="p-6 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-serif font-bold text-lg">Profil Vendeur</h3>
                            <button onClick={onClose} className="text-gray-400 hover:text-black transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">

                            <div className="flex justify-center mb-6">
                                <div className="w-20 h-20 rounded-full bg-black text-white flex items-center justify-center font-serif text-2xl border-4 border-gray-100">
                                    {formData.avatarInitials}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                                    <User size={14} /> Nom Complet
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-black focus:ring-black transition-colors"
                                    placeholder="Ex: Aurélien V."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                                    <BadgeCheck size={14} /> Rôle / Expertises
                                </label>
                                <input
                                    type="text"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-black focus:ring-black transition-colors"
                                    placeholder="Ex: Expert Maroquinerie"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                                    <MapPin size={14} /> Boutique
                                </label>
                                <input
                                    type="text"
                                    value={formData.boutique}
                                    onChange={(e) => setFormData({ ...formData, boutique: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-black focus:ring-black transition-colors"
                                    placeholder="Ex: Paris Montaigne"
                                />
                            </div>

                            <div className="pt-4">
                                {error ? (
                                    <p className="text-sm text-red-500 mb-3">{error}</p>
                                ) : null}
                                <Button type="submit" className="w-full bg-black text-white py-3" disabled={saving}>
                                    <Save size={16} className="mr-2" /> {saving ? 'Sauvegarde...' : 'Enregistrer les modifications'}
                                </Button>
                            </div>

                        </form>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
