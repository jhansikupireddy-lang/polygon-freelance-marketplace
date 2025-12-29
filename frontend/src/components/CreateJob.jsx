import React, { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseEther } from 'viem';
import { Send, Loader2 } from 'lucide-react';
import FreelanceEscrowABI from '../contracts/FreelanceEscrow.json';
import { CONTRACT_ADDRESS } from '../constants';
import { api } from '../services/api';


function CreateJob({ onJobCreated }) {
    const [freelancer, setFreelancer] = useState('');
    const [amount, setAmount] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Development');
    const [milestones, setMilestones] = useState([{ amount: '', description: '' }]);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!freelancer || !amount || !title) return;

        if (milestones.length > 1 || (milestones[0].amount && milestones[0].description)) {
            // Milestone flow
            const milestoneAmounts = milestones.map(m => parseEther(m.amount));
            const milestoneDescs = milestones.map(m => m.description);
            writeContract({
                address: CONTRACT_ADDRESS,
                abi: FreelanceEscrowABI.abi,
                functionName: 'createJobWithMilestones',
                args: [freelancer, description, milestoneAmounts, milestoneDescs],
                value: parseEther(amount),
            });
        } else {
            // Standard flow
            writeContract({
                address: CONTRACT_ADDRESS,
                abi: FreelanceEscrowABI.abi,
                functionName: 'createJob',
                args: [freelancer, description],
                value: parseEther(amount),
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

                <div style={{ marginBottom: '20px' }}>
                    <label>Budget (MATIC)</label>
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
        </div>
    );
}

export default CreateJob;
