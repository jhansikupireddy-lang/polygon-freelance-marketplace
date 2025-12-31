import React, { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount } from 'wagmi';
import { parseEther, parseUnits, erc20Abi } from 'viem';
import { Send, Loader2, Info, CreditCard } from 'lucide-react';
import StripeOnrampModal from './StripeOnrampModal';
import FreelanceEscrowABI from '../contracts/FreelanceEscrow.json';
import { CONTRACT_ADDRESS, SUPPORTED_TOKENS } from '../constants';
import { api } from '../services/api';


function CreateJob({ onJobCreated }) {
    const [freelancer, setFreelancer] = useState('');
    const [amount, setAmount] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Development');
    const [selectedToken, setSelectedToken] = useState(SUPPORTED_TOKENS[0]);
    const [milestones, setMilestones] = useState([{ amount: '', description: '' }]);
    const [isApproving, setIsApproving] = useState(false);
    const [isStripeModalOpen, setIsStripeModalOpen] = useState(false);
    const { address } = useAccount();

    const { data: hash, writeContract, isPending, error } = useWriteContract();
    const { data: jobCount } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: FreelanceEscrowABI.abi,
        functionName: 'jobCount',
    });

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    const handleAddMilestone = () => {
        setMilestones([...milestones, { amount: '', description: '' }]);
    };

    const handleMilestoneChange = (index, field, value) => {
        const newMilestones = [...milestones];
        newMilestones[index][field] = value;
        setMilestones(newMilestones);
    };

    const handleApprove = async () => {
        if (selectedToken.address === '0x0000000000000000000000000000000000000000') return;
        setIsApproving(true);
        try {
            const rawAmount = parseUnits(amount, selectedToken.decimals);
            await writeContract({
                address: selectedToken.address,
                abi: erc20Abi,
                functionName: 'approve',
                args: [CONTRACT_ADDRESS, rawAmount],
            });
            alert('Approval transaction sent!');
        } catch (err) {
            console.error(err);
        } finally {
            setIsApproving(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!freelancer || !amount || !title) return;

        const rawAmount = parseUnits(amount, selectedToken.decimals);

        if (milestones.length > 1 || (milestones[0].amount && milestones[0].description)) {
            // Milestone flow
            const milestoneAmounts = milestones.map(m => parseUnits(m.amount, selectedToken.decimals));
            const milestoneDescs = milestones.map(m => m.description);
            writeContract({
                address: CONTRACT_ADDRESS,
                abi: FreelanceEscrowABI.abi,
                functionName: 'createJobWithMilestones',
                args: [freelancer, selectedToken.address, rawAmount, description, milestoneAmounts, milestoneDescs],
                value: selectedToken.address === '0x0000000000000000000000000000000000000000' ? rawAmount : 0n,
            });
        } else {
            // Standard flow
            writeContract({
                address: CONTRACT_ADDRESS,
                abi: FreelanceEscrowABI.abi,
                functionName: 'createJob',
                args: [freelancer, selectedToken.address, rawAmount, description],
                value: selectedToken.address === '0x0000000000000000000000000000000000000000' ? rawAmount : 0n,
            });
        }
    };

    React.useEffect(() => {
        const syncMetadata = async () => {
            if (isSuccess && jobCount !== undefined) {
                try {
                    const nextJobId = Number(jobCount);
                    await api.saveJobMetadata({
                        jobId: nextJobId,
                        title,
                        description,
                        category,
                    });
                    alert('Job created and metadata saved!');
                    onJobCreated();
                } catch (err) {
                    console.error('Failed to save metadata:', err);
                    alert('Job created but metadata failed to save.');
                    onJobCreated();
                }
            }
        };
        syncMetadata();
    }, [isSuccess, jobCount]);

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h1 style={{ marginBottom: '30px' }}>Post a New Job</h1>
            <form onSubmit={handleSubmit} className="glass-card">
                <div style={{ marginBottom: '20px' }}>
                    <label>Job Title</label>
                    <input
                        type="text"
                        placeholder="e.g. Build a DeFi Dashboard"
                        className="input-field"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label>Category</label>
                    <select
                        className="input-field"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                    >
                        <option>Development</option>
                        <option>Design</option>
                        <option>Marketing</option>
                        <option>Writing</option>
                    </select>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label>Freelancer Address</label>
                    <input
                        type="text"
                        placeholder="0x..."
                        className="input-field"
                        value={freelancer}
                        onChange={(e) => setFreelancer(e.target.value)}
                        required
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '20px' }}>
                    <div>
                        <label>Budget</label>
                        <input
                            type="number"
                            step="0.01"
                            placeholder="0.5"
                            className="input-field"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label>Currency</label>
                        <select
                            className="input-field"
                            value={selectedToken.symbol}
                            onChange={(e) => setSelectedToken(SUPPORTED_TOKENS.find(t => t.symbol === e.target.value))}
                        >
                            {SUPPORTED_TOKENS.map(t => <option key={t.symbol}>{t.symbol}</option>)}
                        </select>
                    </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <button
                        type="button"
                        className="btn-secondary"
                        style={{
                            width: '100%',
                            borderStyle: 'dashed',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            background: 'rgba(99, 102, 241, 0.05)',
                            borderColor: 'rgba(99, 102, 241, 0.3)',
                            color: '#818cf8'
                        }}
                        onClick={() => setIsStripeModalOpen(true)}
                    >
                        <CreditCard size={18} /> Buy Crypto with Card (Stripe Onramp)
                    </button>
                </div>

                {selectedToken.address !== '0x0000000000000000000000000000000000000000' && (
                    <div className="glass-card" style={{ padding: '15px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid #3b82f6', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                            <Info size={18} color="#3b82f6" />
                            <p style={{ fontSize: '0.85rem', color: '#3b82f6', margin: 0 }}>
                                ERC20 token requires approval before escrowing.
                            </p>
                        </div>
                        <button type="button" onClick={handleApprove} className="btn-secondary" style={{ width: '100%', borderColor: '#3b82f6', color: '#3b82f6' }} disabled={isApproving}>
                            {isApproving ? 'Approving...' : `Approve ${selectedToken.symbol}`}
                        </button>
                    </div>
                )}

                <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <label style={{ margin: 0 }}>Milestones (Optional)</label>
                        <button type="button" onClick={handleAddMilestone} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.8rem' }}>
                            + Add Milestone
                        </button>
                    </div>
                    {milestones.map((m, index) => (
                        <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px', marginBottom: '10px' }}>
                            <input
                                type="number"
                                placeholder="Amount"
                                className="input-field"
                                style={{ margin: 0 }}
                                value={m.amount}
                                onChange={(e) => handleMilestoneChange(index, 'amount', e.target.value)}
                            />
                            <input
                                type="text"
                                placeholder="Description"
                                className="input-field"
                                style={{ margin: 0 }}
                                value={m.description}
                                onChange={(e) => handleMilestoneChange(index, 'description', e.target.value)}
                            />
                        </div>
                    ))}
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        If milestones are provided, they must sum up to the total budget.
                    </p>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label>Detailed Description (IPFS Metadata)</label>
                    <textarea
                        placeholder="Provide detailed requirements for the freelancer..."
                        className="input-field"
                        style={{ minHeight: '120px' }}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>

                {error && (
                    <p style={{ color: '#ef4444', marginBottom: '20px', fontSize: '0.9rem' }}>
                        Error: {error.shortMessage || error.message}
                    </p>
                )}

                <button
                    type="submit"
                    className="btn-primary"
                    style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}
                    disabled={isPending || isConfirming}
                >
                    {isPending || isConfirming ? (
                        <><Loader2 className="animate-spin" size={20} /> Processing...</>
                    ) : (
                        <><Send size={20} /> Create Job & Escrow Funds</>
                    )}
                </button>
            </form>

            <StripeOnrampModal
                address={address}
                isOpen={isStripeModalOpen}
                onClose={() => setIsStripeModalOpen(false)}
            />
        </div>
    );
}

export default CreateJob;
