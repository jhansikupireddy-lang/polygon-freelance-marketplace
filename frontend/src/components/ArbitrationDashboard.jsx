import React, { useState, useEffect } from 'react';
import { Gavel, AlertTriangle, ShieldCheck, Scale, Cpu, Search, FileText, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useWriteContract, useReadContract } from 'wagmi';
import FreelanceEscrowABI from '../contracts/FreelanceEscrow.json';
import CrossChainEscrowManagerABI from '../contracts/CrossChainEscrowManager.json';
import { CONTRACT_ADDRESS, CROSS_CHAIN_ESCROW_MANAGER_ADDRESS } from '../constants';
import { api } from '../services/api';
import { toast } from 'react-toastify';

const ArbitrationDashboard = () => {
    const { address } = useAccount();
    const [disputes, setDisputes] = useState([]);
    const [selectedJob, setSelectedJob] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [loading, setLoading] = useState(true);

    const { data: arbitratorRole } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: FreelanceEscrowABI.abi,
        functionName: 'hasRole',
        args: ['0x17766724054c72d2309727cfce08d551ff57400bc9f493926b6e319c54095112', address], // ARBITRATOR_ROLE
    });

    const isAdmin = arbitratorRole || false;

    const { writeContract } = useWriteContract();

    useEffect(() => {
        fetchDisputes();
    }, []);

    const fetchDisputes = async () => {
        try {
            const data = await api.getDisputes();
            setDisputes(data);
        } catch (err) {
            console.error('Failed to fetch disputes:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAnalyze = async (jobId) => {
        setIsAnalyzing(true);
        try {
            const analysis = await api.analyzeDispute(jobId);
            setSelectedJob(prev => ({ ...prev, disputeData: analysis }));
            toast.success("AI Arbitration Analysis Complete");
        } catch (err) {
            toast.error("AI Analysis Failed");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleResolution = async (jobId, bps, isCrossChain = false) => {
        try {
            const ruling = bps === 100 ? 2 : (bps === 0 ? 1 : 3); // 1: Client, 2: Freelancer, 3: Split

            if (isCrossChain) {
                writeContract({
                    address: CROSS_CHAIN_ESCROW_MANAGER_ADDRESS,
                    abi: CrossChainEscrowManagerABI.abi,
                    functionName: 'resolveCrossChainDispute',
                    args: [BigInt(jobId), BigInt(ruling)],
                }, {
                    onSuccess: async () => {
                        await api.resolveDispute(jobId, { ruling, reasoning: selectedJob.disputeData?.reasoning || 'Manual Resolution' });
                        toast.success("Cross-Chain Dispute Resolved");
                        fetchDisputes();
                    }
                });
            } else {
                writeContract({
                    address: CONTRACT_ADDRESS,
                    abi: FreelanceEscrowABI.abi,
                    functionName: 'resolveDisputeManual',
                    args: [BigInt(jobId), BigInt(bps * 100)],
                }, {
                    onSuccess: async () => {
                        await api.resolveDispute(jobId, { ruling, reasoning: selectedJob.disputeData?.reasoning || 'Manual Resolution' });
                        toast.success("Dispute Resolved Successfully");
                        fetchDisputes();
                    }
                });
            }
        } catch (err) {
            toast.error("Resolution Failed: " + err.message);
        }
    };

    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <ShieldCheck size={80} className="text-white/10 mb-6" />
                <h2 className="text-3xl font-black mb-2 uppercase tracking-tighter">Access <span className="text-rose-500">Denied</span></h2>
                <p className="text-text-muted max-w-md font-medium">
                    Only verified Protocol Arbitrators are authorized to access the Justice Module.
                    Stake $PLN to apply for a community jury position.
                </p>
            </div>
        );
    }

    return (
        <div className="container !p-0">
            <header className="mb-12">
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-500">
                        <Gavel size={32} />
                    </div>
                    <div>
                        <h1 className="text-5xl font-black tracking-tighter uppercase italic">Zenith <span className="text-rose-500">Justice</span></h1>
                        <p className="text-text-muted font-bold tracking-widest text-[10px] uppercase">Decentralized Court & AI Arbitration</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Dispute List */}
                <div className="lg:col-span-1 space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-text-dim mb-6">Active Cases ({disputes.length})</h3>
                    {loading ? (
                        <div className="skeleton h-60 w-full rounded-3xl" />
                    ) : disputes.length === 0 ? (
                        <div className="glass-card !bg-white/5 border-dashed border-white/10 p-12 text-center text-text-dim">
                            <Scale size={40} className="mx-auto mb-4 opacity-20" />
                            <p className="font-bold text-sm">Perfect Compliance: No Active Disputes</p>
                        </div>
                    ) : (
                        disputes.map(job => (
                            <motion.div
                                key={job.jobId}
                                whileHover={{ x: 5 }}
                                onClick={() => setSelectedJob(job)}
                                className={`glass-card !p-5 cursor-pointer transition-all border-white/5 ${selectedJob?.jobId === job.jobId ? '!border-rose-500/50 bg-rose-500/5' : ''}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] font-black p-1 bg-rose-500/20 text-rose-500 rounded uppercase">Case #{job.jobId}</span>
                                    <AlertTriangle size={14} className="text-rose-500" />
                                </div>
                                <h4 className="font-bold text-sm mb-1">{job.title}</h4>
                                <div className="flex items-center justify-between mt-4">
                                    <span className="text-[10px] text-text-dim font-bold uppercase tracking-widest">Budget: {job.amount || '0'}</span>
                                    <ChevronRight size={14} className="text-text-dim" />
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>

                {/* Case Details & AI Analysis */}
                <div className="lg:col-span-2">
                    <AnimatePresence mode="wait">
                        {selectedJob ? (
                            <motion.div
                                key={selectedJob.jobId}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="glass-card !p-8"
                            >
                                <div className="flex justify-between items-center mb-8 pb-6 border-b border-white/5">
                                    <div>
                                        <h2 className="text-2xl font-black mb-1">{selectedJob.title}</h2>
                                        <p className="text-xs text-text-muted">Parties: <span className="text-white">{selectedJob.client}</span> ↔ <span className="text-white">{selectedJob.freelancer}</span></p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-black text-text-dim uppercase tracking-widest mb-1">External Court</div>
                                        <span className="badge badge-info !bg-blue-500/20 !text-blue-400">Kleros Layer Waiting</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                                    <div className="space-y-6">
                                        <div>
                                            <h4 className="text-xs font-black uppercase tracking-widest text-text-dim mb-3 flex items-center gap-2">
                                                <FileText size={14} /> Claim Description
                                            </h4>
                                            <p className="text-sm leading-relaxed opacity-80">{selectedJob.description}</p>
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-black uppercase tracking-widest text-text-dim mb-3 flex items-center gap-2">
                                                <Search size={14} /> Evidence Log ({selectedJob.evidence?.length || 0})
                                            </h4>
                                            <div className="space-y-2">
                                                {selectedJob.evidence?.map((e, i) => (
                                                    <a href={`https://gateway.pinata.cloud/ipfs/${e.hash}`} target="_blank" rel="noreferrer" key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-primary/50 transition-all text-xs">
                                                        <span className="font-bold truncate max-w-[150px]">{e.hash}</span>
                                                        <span className="text-[9px] uppercase font-black opacity-40">{e.party === selectedJob.client ? 'Client' : 'Freelancer'}</span>
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* AI Agent Analysis */}
                                    <div className="glass-card !bg-primary/10 border-primary/20 p-6 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                            <Cpu size={60} />
                                        </div>
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4 flex items-center gap-2">
                                            <Cpu size={14} /> Gemini 2.0 Verdict
                                        </h4>

                                        {selectedJob.disputeData?.aiVerdict ? (
                                            <div className="space-y-4">
                                                <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                                                    <p className="text-xs font-medium leading-relaxed italic mb-4">"{selectedJob.disputeData.reasoning}"</p>
                                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                                        <span>Suggested Split:</span>
                                                        <span className="text-primary">{selectedJob.disputeData.aiSplit}% Freelancer</span>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <button onClick={() => handleResolution(selectedJob.jobId, selectedJob.disputeData.aiSplit)} className="btn-primary !py-2 text-[10px] !bg-primary/20">Accept AI Split</button>
                                                    <button onClick={() => handleAnalyze(selectedJob.jobId)} className="btn-ghost !py-2 text-[10px]">Re-Analyze</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="py-8 text-center">
                                                <p className="text-xs text-text-muted mb-6">Neural analysis required to determine fair split.</p>
                                                <button
                                                    onClick={() => handleAnalyze(selectedJob.jobId)}
                                                    disabled={isAnalyzing}
                                                    className="btn-primary flex items-center gap-2 mx-auto"
                                                >
                                                    {isAnalyzing ? <span className="animate-pulse">Analyzing...</span> : <><Cpu size={16} /> Run Neural Audit</>}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="border-t border-white/5 pt-8">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-text-dim mb-6">Manual Overwrite</h4>
                                    <div className="grid grid-cols-3 gap-4">
                                        <button onClick={() => handleResolution(selectedJob.jobId, 0, selectedJob.isCrossChain)} className="btn-ghost !bg-rose-500/10 !text-rose-500 border-rose-500/20 hover:!bg-rose-500 hover:!text-white">Rule for Client</button>
                                        <button onClick={() => handleResolution(selectedJob.jobId, 50, selectedJob.isCrossChain)} className="btn-ghost border-white/10">Split 50/50</button>
                                        <button onClick={() => handleResolution(selectedJob.jobId, 100, selectedJob.isCrossChain)} className="btn-ghost !bg-emerald-500/10 !text-emerald-500 border-emerald-500/20 hover:!bg-emerald-500 hover:!text-white">Rule for Freelancer</button>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-40 border-2 border-dashed border-white/5 rounded-[40px] text-text-dim">
                                <Scale size={60} className="mb-6 opacity-10" />
                                <p className="font-bold text-sm uppercase tracking-widest">Select a case to begin arbitration</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default ArbitrationDashboard;
