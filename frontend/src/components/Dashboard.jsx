import React, { useEffect } from 'react';
import { useAccount, useReadContract, useSignMessage } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { Wallet, Briefcase, CheckCircle, Clock, Save, User, Award, PlusCircle } from 'lucide-react';
import FreelanceEscrowABI from '../contracts/FreelanceEscrow.json';
import { CONTRACT_ADDRESS } from '../constants';
import { api } from '../services/api';
import LiveJobFeed from './LiveJobFeed';

function Dashboard() {
    const { address, isConnected } = useAccount();
    const { openConnectModal } = useConnectModal();

    useEffect(() => {
        console.log('[DASHBOARD] Account State:', { address, isConnected });
    }, [address, isConnected]);
    const [profile, setProfile] = React.useState({ name: '', bio: '', skills: '', category: 'Development' });
    const [analytics, setAnalytics] = React.useState({ totalJobs: 0, totalVolume: 0, totalUsers: 0 });
    const [isSaving, setIsSaving] = React.useState(false);
    const { signMessageAsync } = useSignMessage();

    const { data: jobCount } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: FreelanceEscrowABI.abi,
        functionName: 'jobCount',
    });

    React.useEffect(() => {
        if (isConnected && address) {
            api.getProfile(address).then(data => {
                if (data.address) setProfile(data);
            });
            api.getAnalytics().then(data => {
                if (data && data.totalJobs !== undefined) setAnalytics(data);
            });
        }
    }, [isConnected, address]);

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const { nonce } = await api.getNonce(address);
            if (!nonce) throw new Error('Could not get nonce');
            const message = `Login to PolyLance: ${nonce}`;
            const signature = await signMessageAsync({ message });
            await api.updateProfile({ address, ...profile, signature, message });
            alert('Profile updated securely!');
        } catch (err) {
            console.error(err);
            alert('Failed to update profile: ' + (err.shortMessage || err.message));
        } finally {
            setIsSaving(false);
        }
    };

    if (!isConnected) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade">
                <div className="glass-card max-w-lg p-12">
                    <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
                        <Wallet size={40} className="text-primary" />
                    </div>
                    <h2 className="text-3xl font-bold mb-4">Connect to the Future</h2>
                    <p className="text-text-muted text-lg mb-8 leading-relaxed">
                        PolyLance is for the bold. Connect your wallet to manage your decentralized career, track earnings, and explore global opportunities.
                    </p>
                    <button
                        onClick={openConnectModal}
                        className="btn-primary"
                    >
                        Get Started Now
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade">
            <header className="mb-16">
                <div className="flex items-center gap-4 mb-6">
                    <span className="badge badge-info shadow-lg shadow-primary/10">
                        {profile.skills ? 'Certified Talent' : 'Employer'}
                    </span>
                    {profile.reputationScore > 500 && (
                        <span className="badge badge-warning shadow-lg shadow-warning/10">
                            ✨ Elite Freelancer
                        </span>
                    )}
                </div>
                <h1 className="text-6xl font-black mb-6 leading-[1.1] tracking-tight">
                    Welcome back, <span className="gradient-text">{profile.name || 'Pioneer'}</span>
                </h1>
                <p className="text-text-muted text-xl max-w-2xl leading-relaxed font-medium">
                    The decentralized workforce is at your fingertips. Monitor your contracts, analyze your growth, and stay ahead of the curve.
                </p>
            </header>

            <div className="grid grid-marketplace mb-16">
                <div className="glass-card group border-t-2 border-primary">
                    <div className="flex justify-between items-start mb-6">
                        <span className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em]">Active Contracts</span>
                        <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                            <Briefcase size={20} />
                        </div>
                    </div>
                    <div className="text-5xl font-black mb-2 tracking-tighter">
                        {jobCount?.toString() || '0'}
                    </div>
                    <div className="text-xs font-bold text-primary/60 uppercase tracking-widest">Total Job History</div>
                </div>

                <div className="glass-card group border-t-2 border-warning">
                    <div className="flex justify-between items-start mb-6">
                        <span className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em]">Reputation Rank</span>
                        <div className="p-2 rounded-lg bg-warning/10 text-warning group-hover:scale-110 transition-transform">
                            <Award size={20} />
                        </div>
                    </div>
                    <div className="text-5xl font-black mb-2 tracking-tighter">
                        {profile.reputationScore || 0}
                    </div>
                    <div className="text-xs font-bold text-warning/60 uppercase tracking-widest">
                        Top {profile.reputationScore > 500 ? '1%' : '10%'} World Rank
                    </div>
                </div>

                <div className="glass-card group border-t-2 border-accent">
                    <div className="flex justify-between items-start mb-6">
                        <span className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em]">Aggregate Earnings</span>
                        <div className="p-2 rounded-lg bg-accent/10 text-accent group-hover:scale-110 transition-transform">
                            <CheckCircle size={20} />
                        </div>
                    </div>
                    <div className="text-5xl font-black mb-2 tracking-tighter">
                        {profile.totalEarned?.toFixed(2) || '0.00'}
                        <span className="text-sm font-bold text-text-dim ml-3 tracking-normal">MATIC</span>
                    </div>
                    <div className="text-xs font-bold text-accent/60 uppercase tracking-widest">Secured via Smart Escrow</div>
                </div>
            </div>

            <div className="glass-panel mb-16 flex flex-wrap gap-10 items-center justify-between border-white/5">
                <div className="flex gap-16">
                    <div>
                        <p className="text-[10px] font-black text-text-dim uppercase tracking-[0.15em] mb-2">Global Volume</p>
                        <p className="text-xl font-black tracking-tight">{(analytics.totalVolume || 0).toFixed(2)} <span className="text-xs text-text-dim">MATIC</span></p>
                    </div>
                    <div className="w-px h-12 bg-white/5" />
                    <div>
                        <p className="text-[10px] font-black text-text-dim uppercase tracking-[0.15em] mb-2">Ecosystem Jobs</p>
                        <p className="text-xl font-black tracking-tight">{analytics.totalJobs || 0}</p>
                    </div>
                    <div className="w-px h-12 bg-white/5" />
                    <div>
                        <p className="text-[10px] font-black text-text-dim uppercase tracking-[0.15em] mb-2">Platform Users</p>
                        <p className="text-xl font-black tracking-tight">{analytics.totalUsers || 0}</p>
                    </div>
                </div>

                <div className="flex gap-4">
                    <button onClick={() => setPortfolioAddress(address)} className="btn-ghost !py-3 !px-6 flex items-center gap-3">
                        <User size={18} /> My Portfolio
                    </button>
                    <button className="btn-primary !py-3 !px-6">
                        <PlusCircle size={18} /> New Job
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 glass-card">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                            <User size={20} className="text-primary" />
                        </div>
                        <h3 className="text-xl font-bold">Identity & Credentials</h3>
                    </div>

                    <form onSubmit={handleSaveProfile} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="input-group">
                                <label className="input-label">Public Alias</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={profile.name}
                                    onChange={e => setProfile({ ...profile, name: e.target.value })}
                                    placeholder="Enter your professional name"
                                />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Core Specialization</label>
                                <select
                                    className="input-field"
                                    value={profile.category}
                                    onChange={e => setProfile({ ...profile, category: e.target.value })}
                                >
                                    <option>Development</option>
                                    <option>Design</option>
                                    <option>Marketing</option>
                                    <option>Writing</option>
                                    <option>AI Services</option>
                                </select>
                            </div>
                        </div>

                        <div className="input-group">
                            <label className="input-label">Professional Bio</label>
                            <textarea
                                className="input-field min-h-[140px]"
                                value={profile.bio}
                                onChange={e => setProfile({ ...profile, bio: e.target.value })}
                                placeholder="Highlight your expertise and career achievements..."
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Skillset Matrix (Comma Separated)</label>
                            <input
                                type="text"
                                className="input-field"
                                value={profile.skills}
                                onChange={e => setProfile({ ...profile, skills: e.target.value })}
                                placeholder="e.g. Solidity, React, Rust, UI/UX"
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn-primary w-full md:w-auto"
                            disabled={isSaving}
                        >
                            <Save size={18} /> {isSaving ? 'Syncing to Blockchain...' : 'Update On-chain Profile'}
                        </button>
                    </form>
                </div>

                <div className="lg:col-span-1">
                    <div className="sticky top-24">
                        <h3 className="text-lg font-bold mb-4 opacity-60 uppercase tracking-widest text-center">Live Opportunity Flow</h3>
                        <LiveJobFeed />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
