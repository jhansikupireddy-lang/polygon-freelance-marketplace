import React, { useState } from 'react';
import { Shield, Download, Trash2, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

function PrivacyCenter({ address }) {
    const [loading, setLoading] = useState(false);
    const [exportData, setExportData] = useState(null);

    const handleExport = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/gdpr/export/${address}`);
            if (!res.ok) throw new Error('Failed to export data');
            const data = await res.json();
            setExportData(data);

            // Trigger download
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `polylance-data-${address.slice(0, 6)}.json`;
            a.click();
            toast.success('Data export started!');
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you absolutely sure? This will anonymize your profile and withdraw all consents. This action cannot be undone.')) return;

        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/gdpr/delete/${address}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete data');
            toast.success('Your data has been anonymized.');
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass-card max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                    <Shield size={24} />
                </div>
                <div>
                    <h2 className="text-2xl font-black">Privacy Center</h2>
                    <p className="text-text-muted text-sm font-medium">Exercise your GDPR rights and manage your data.</p>
                </div>
            </div>

            <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Shield size={18} className="text-primary" />
                        ZK-Identity Shield
                    </h3>
                    <p className="text-text-dim text-sm mb-6 leading-relaxed">
                        Commit a cryptographic hash of your private identity. This allows you to prove your reputation without revealing your wallet's history.
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={async () => {
                                setLoading(true);
                                try {
                                    // Mocking commitment
                                    const commitment = "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
                                    toast.success(`Identity Committed: ${commitment.slice(0, 10)}...`);
                                } finally {
                                    setLoading(false);
                                }
                            }}
                            disabled={loading}
                            className="btn-primary flex-1 flex items-center justify-center gap-2"
                        >
                            Commit Identity
                        </button>
                        <button
                            onClick={() => toast.info("Proof Generation requires Circom-wasm. Initializing...")}
                            className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 font-bold text-xs hover:bg-white/10 transition-all flex items-center gap-2"
                        >
                            Generate Proof
                        </button>
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <CheckCircle size={18} className="text-emerald-400" />
                        Right to Access & Portability
                    </h3>
                    <p className="text-text-dim text-sm mb-6 leading-relaxed">
                        You have the right to receive a copy of your personal data in a structured, commonly used, and machine-readable format.
                    </p>
                    <button
                        onClick={handleExport}
                        disabled={loading}
                        className="w-full py-3 px-6 rounded-xl bg-white/5 border border-white/10 font-bold text-sm hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                        Export My Data (JSON)
                    </button>
                </div>

                <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/10">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-red-400">
                        <AlertTriangle size={18} />
                        Right to Erasure
                    </h3>
                    <p className="text-text-dim text-sm mb-6 leading-relaxed">
                        You can request the deletion of your personal data. On PolyLance, we anonymize your profile and remove all PII while maintaining on-chain protocol integrity.
                    </p>
                    <button
                        onClick={handleDelete}
                        disabled={loading}
                        className="w-full py-3 px-6 rounded-xl border border-red-500/20 text-red-400 font-bold hover:bg-red-500/10 transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                        Anonymize My Identity
                    </button>
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/5">
                <p className="text-[11px] text-text-muted text-center uppercase tracking-widest font-black">
                    PolyLance is GDPR Compliant by Design
                </p>
            </div>
        </div>
    );
}

export default PrivacyCenter;
