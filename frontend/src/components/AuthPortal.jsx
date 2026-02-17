import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Wallet, ShieldCheck, Sparkles, Globe, Zap, Cpu } from 'lucide-react';
import { useConnectModal } from '@rainbow-me/rainbowkit';

const AuthPortal = ({ onSocialLogin, isLoggingIn }) => {
    const { openConnectModal } = useConnectModal();

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-20 lg:py-0">
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="max-w-6xl w-full"
            >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    {/* Left: Branding & Value Prop */}
                    <div className="text-left space-y-10 order-2 lg:order-1">
                        <div>
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 }}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20 mb-8"
                            >
                                <Sparkles size={16} className="text-primary animate-pulse" />
                                <span className="text-xs font-black uppercase tracking-[0.2em] text-primary">Zenith Protocol v1.2</span>
                            </motion.div>
                            <h1 className="text-6xl lg:text-8xl font-black leading-[0.9] tracking-tighter mb-8 italic uppercase">
                                Enter the <br />
                                <span className="gradient-text">Supreme</span> <br />
                                Economy.
                            </h1>
                            <p className="text-xl text-text-muted font-medium leading-relaxed max-w-md opacity-80">
                                Secure your professional future with agentic arbitration, quantum gas relays, and global cross-chain payouts.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-4">
                            <div className="flex items-center gap-4 group">
                                <div className="p-3 bg-white/5 rounded-2xl border border-white/10 group-hover:border-primary/50 transition-all">
                                    <ShieldCheck size={24} className="text-primary" />
                                </div>
                                <div>
                                    <div className="text-xs font-black text-text-dim uppercase tracking-widest mb-1">Privacy Level</div>
                                    <div className="text-sm font-bold text-white">Neural Cryptography</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 group">
                                <div className="p-3 bg-white/5 rounded-2xl border border-white/10 group-hover:border-secondary/50 transition-all">
                                    <Globe size={24} className="text-secondary" />
                                </div>
                                <div>
                                    <div className="text-xs font-black text-text-dim uppercase tracking-widest mb-1">Market Scope</div>
                                    <div className="text-sm font-bold text-white">Global Edge Nodes</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Auth Card */}
                    <div className="lg:order-2 order-1">
                        <div className="glass-card !p-12 relative group overflow-visible">
                            {/* Decorative background effects */}
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 blur-[80px] rounded-full pointer-events-none" />
                            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-secondary/20 blur-[80px] rounded-full pointer-events-none" />

                            <div className="relative z-10 space-y-10">
                                <div className="text-center lg:text-left">
                                    <h3 className="text-3xl font-black mb-3 tracking-tight italic">Initialize Connection</h3>
                                    <p className="text-[10px] text-text-muted font-black uppercase tracking-[0.3em]">Access the decentralized grid</p>
                                </div>

                                <div className="space-y-6">
                                    <motion.button
                                        whileHover={{ scale: 1.02, y: -4 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={onSocialLogin}
                                        disabled={isLoggingIn}
                                        className="w-full flex items-center justify-between p-6 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/50 rounded-[2.5rem] transition-all group relative overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="flex items-center gap-5 relative z-10">
                                            <div className="p-4 bg-primary/20 rounded-2xl group-hover:scale-110 transition-transform border border-primary/20 shadow-lg shadow-primary/10">
                                                {isLoggingIn ? <div className="loading-spinner h-6 w-6" /> : <Mail size={24} className="text-primary" />}
                                            </div>
                                            <div className="text-left">
                                                <div className="text-sm font-black uppercase tracking-widest text-white mb-0.5">Google & Email</div>
                                                <div className="text-[10px] font-bold text-text-dim italic">Supreme Social Bridge • Zero Gas</div>
                                            </div>
                                        </div>
                                        <Zap size={20} className="text-primary opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 relative z-10" />
                                    </motion.button>

                                    <motion.button
                                        whileHover={{ scale: 1.02, y: -4 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={openConnectModal}
                                        className="w-full flex items-center justify-between p-6 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-secondary/50 rounded-[2.5rem] transition-all group relative overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="flex items-center gap-5 relative z-10">
                                            <div className="p-4 bg-secondary/20 rounded-2xl group-hover:scale-110 transition-transform border border-secondary/20 shadow-lg shadow-secondary/10">
                                                <Wallet size={24} className="text-secondary" />
                                            </div>
                                            <div className="text-left">
                                                <div className="text-sm font-black uppercase tracking-widest text-white mb-0.5">Native Wallet</div>
                                                <div className="text-[10px] font-bold text-text-dim italic">Metamask • Ledger • Phantom</div>
                                            </div>
                                        </div>
                                        <Cpu size={20} className="text-secondary opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 relative z-10" />
                                    </motion.button>
                                </div>

                                <div className="pt-10 border-t border-white/5 text-center flex flex-col items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-dim">Node Status: Operational</span>
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-text-dim/40 max-w-[200px]">
                                        Validated by <span className="text-primary">PolyShield</span> AI Orchestration
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default AuthPortal;
