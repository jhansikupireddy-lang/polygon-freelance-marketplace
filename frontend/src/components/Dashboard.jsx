import React from 'react';
import { useAccount, useReadContract, useSignMessage } from 'wagmi';
import { Wallet, Briefcase, CheckCircle, Clock, Save, User } from 'lucide-react';
import FreelanceEscrowABI from '../contracts/FreelanceEscrow.json';
import { CONTRACT_ADDRESS } from '../constants';
import { api } from '../services/api';

function Dashboard() {
    const { address, isConnected } = useAccount();
    const [profile, setProfile] = React.useState({ name: '', bio: '', skills: '' });
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
        }
    }, [isConnected, address]);

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            // 1. Get Nonce
            const { nonce } = await api.getNonce(address);
            if (!nonce) throw new Error('Could not get nonce');

            // 2. Sign Message
            const message = `Login to PolyLance: ${nonce}`;
            const signature = await signMessageAsync({ message });

            // 3. Update Profile with Signature
            await api.updateProfile({ address, ...profile, signature });
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
            <div className="glass-card" style={{ textAlign: 'center', marginTop: '100px' }}>
                <Wallet size={48} style={{ marginBottom: '20px', color: 'var(--primary)' }} />
                <h2>Connect your wallet to get started</h2>
                <p style={{ color: 'var(--text-muted)', marginTop: '10px' }}>
                    Manage your freelance jobs on Polygon with low fees and NFT proof-of-work.
                </p>
            </div>
        );
    }

    return (
        <div>
            <h1 style={{ marginBottom: '30px' }}>Dashboard</h1>

            <div className="grid">
                <div className="glass-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ color: 'var(--text-muted)' }}>Total Jobs</p>
                            <h2 style={{ fontSize: '2rem' }}>{jobCount?.toString() || '0'}</h2>
                        </div>
                        <Briefcase size={32} color="var(--primary)" />
                    </div>
                </div>

                <div className="glass-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ color: 'var(--text-muted)' }}>Active Jobs</p>
                            <h2 style={{ fontSize: '2rem' }}>0</h2>
                        </div>
                        <Clock size={32} color="#f59e0b" />
                    </div>
                </div>

                <div className="glass-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ color: 'var(--text-muted)' }}>Completed</p>
                            <h2 style={{ fontSize: '2rem' }}>0</h2>
                        </div>
                        <CheckCircle size={32} color="#10b981" />
                    </div>
                </div>
            </div>

            <div className="grid" style={{ marginTop: '40px' }}>
                <div className="glass-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                        <User size={24} color="var(--primary)" />
                        <h3 style={{ margin: 0 }}>My Profile</h3>
                    </div>
                    <form onSubmit={handleSaveProfile}>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Display Name</label>
                            <input
                                type="text"
                                className="input-field"
                                value={profile.name}
                                onChange={e => setProfile({ ...profile, name: e.target.value })}
                                placeholder="Your Name"
                            />
                        </div>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Expertise / Skills</label>
                            <input
                                type="text"
                                className="input-field"
                                value={profile.skills}
                                onChange={e => setProfile({ ...profile, skills: e.target.value })}
                                placeholder="Solidity, React, UI/UX"
                            />
                        </div>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Bio</label>
                            <textarea
                                className="input-field"
                                style={{ minHeight: '80px' }}
                                value={profile.bio}
                                onChange={e => setProfile({ ...profile, bio: e.target.value })}
                                placeholder="Tell clients about yourself..."
                            />
                        </div>
                        <button type="submit" className="btn-primary" disabled={isSaving} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Save size={18} /> {isSaving ? 'Saving...' : 'Save Profile'}
                        </button>
                    </form>
                </div>

                <div className="glass-card">
                    <h3>Recent Activity</h3>
                    <p style={{ color: 'var(--text-muted)', marginTop: '20px' }}>No recent activity found.</p>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
