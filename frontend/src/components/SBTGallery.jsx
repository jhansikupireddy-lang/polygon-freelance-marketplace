import React, { useState, useEffect } from 'react';
import { Award, Shield, CheckCircle, ExternalLink, Cpu, Zap, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useReadContract } from 'wagmi';
import { FREELANCE_SBT_ADDRESS, COMPLETION_SBT_ADDRESS } from '../constants';
import { api } from '../services/api';

const SBT_ABI = [
    {
        "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }],
        "name": "balanceOf",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "address", "name": "owner", "type": "address" },
            { "internalType": "uint256", "name": "index", "type": "uint256" }
        ],
        "name": "tokenOfOwnerByIndex",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
        "name": "tokenURI",
        "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
        "stateMutability": "view",
        "type": "function"
    }
];

function SBTGallery({ address: propAddress }) {
    const { address: wagmiAddress } = useAccount();
    const address = propAddress || wagmiAddress;

    const [tokens, setTokens] = useState([]);
    const [loading, setLoading] = useState(true);

    // This is a simplified fetcher. In production, we'd use a subgraph.
    useEffect(() => {
        if (address) {
            fetchTokens();
        }
    }, [address]);

    const fetchTokens = async () => {
        setLoading(true);
        try {
            // Mocking for now since fetching list from contract without subgraph is tedious
            // In a real app, we'd query The Graph
            const mockTokens = [
                {
                    id: 1,
                    type: 'Completion',
                    title: 'Smart Contract Auditor',
                    category: 'Development',
                    rating: 5,
                    date: '2026-02-10',
                    txHash: '0x123...'
                },
                {
                    id: 2,
                    type: 'Reputation',
                    title: 'Top 10% Contributor',
                    category: 'Core Protocol',
                    rating: 5,
                    date: '2026-02-12',
                    txHash: '0x456...'
                }
            ];

            // Artificial delay for zenith feel
            await new Promise(r => setTimeout(r, 1000));
            setTokens(mockTokens);
        } catch (error) {
            console.error("Failed to fetch SBTs:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black tracking-tight mb-2">Soulbound <span className="text-primary italic">Vault</span></h2>
                    <p className="text-text-muted font-medium">Your non-transferable proof of excellence on the Zenith Protocol.</p>
                </div>
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-text-dim">Verified Credentials</span>
                        <span className="text-xl font-black">{tokens.length}</span>
                    </div>
                    <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30">
                        <Award size={20} className="text-primary" />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="glass-card h-64 animate-pulse bg-white/5" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <AnimatePresence>
                        {tokens.map((token, index) => (
                            <motion.div
                                key={`${token.type}-${token.id}`}
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="glass-card group hover:border-primary/50 transition-all cursor-pointer relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-4">
                                    <div className={`p-2 rounded-xl ${token.type === 'Completion' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-primary/10 text-primary'} border border-white/5`}>
                                        {token.type === 'Completion' ? <CheckCircle size={16} /> : <Zap size={16} />}
                                    </div>
                                </div>

                                <div className="flex flex-col h-full">
                                    <div className="mb-6">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-dim mb-1 block">
                                            {token.category}
                                        </span>
                                        <h3 className="text-xl font-black tracking-tight group-hover:text-primary transition-colors">
                                            {token.title}
                                        </h3>
                                    </div>

                                    <div className="mt-auto space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        size={12}
                                                        className={i < token.rating ? "text-amber-400 fill-amber-400" : "text-white/10"}
                                                    />
                                                ))}
                                            </div>
                                            <span className="text-[10px] font-bold text-text-muted">{token.date}</span>
                                        </div>

                                        <div className="flex items-center gap-2 pt-4 border-t border-white/5">
                                            <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center">
                                                <Cpu size={12} className="text-text-dim" />
                                            </div>
                                            <span className="text-[10px] font-mono text-text-dim truncate flex-1">
                                                {token.txHash}
                                            </span>
                                            <ExternalLink size={12} className="text-text-dim group-hover:text-white" />
                                        </div>
                                    </div>
                                </div>

                                <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Empty Slot / Action */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="glass-card border-dashed border-white/10 flex flex-col items-center justify-center text-center p-8 group hover:border-primary/30 transition-all"
                    >
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                            <Star size={24} className="text-text-dim group-hover:text-primary" />
                        </div>
                        <h4 className="text-sm font-bold mb-2">Build Your Legacy</h4>
                        <p className="text-[11px] text-text-muted leading-relaxed">
                            Complete jobs with high ratings to earn Soulbound contribution certificates.
                        </p>
                    </motion.div>
                </div>
            )}
        </div>
    );
}

export default SBTGallery;
