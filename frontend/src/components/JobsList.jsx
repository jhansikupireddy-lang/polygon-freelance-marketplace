import React from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Briefcase, CheckCircle, ExternalLink, RefreshCcw } from 'lucide-react';
import FreelanceEscrowABI from '../contracts/FreelanceEscrow.json';
import { formatEther } from 'viem';
import { CONTRACT_ADDRESS } from '../constants';
import { api } from '../services/api';
import UserLink from './UserLink';


function JobsList() {
    const { address } = useAccount();
    const [filter, setFilter] = React.useState('All');
    const { data: jobCount } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: FreelanceEscrowABI.abi,
        functionName: 'jobCount',
    });

    const count = jobCount ? Number(jobCount) : 0;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1>Manage Jobs</h1>
                <div style={{ display: 'flex', gap: '15px' }}>
                    <select
                        className="input-field"
                        style={{ width: '150px', margin: 0 }}
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    >
                        <option>All</option>
                        <option>Development</option>
                        <option>Design</option>
                        <option>Marketing</option>
                        <option>Writing</option>
                    </select>
                </div>
            </div>

            <div className="grid">
                {count === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>No jobs found on this contract.</p>
                ) : (
                    Array.from({ length: count }).map((_, i) => (
                        <JobCard key={i + 1} jobId={i + 1} categoryFilter={filter} />
                    ))
                )}
            </div>
        </div>
    );
}

function JobCard({ jobId, categoryFilter }) {
    const { address } = useAccount();
    const [metadata, setMetadata] = React.useState(null);
    const { data: job, refetch } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: FreelanceEscrowABI.abi,
        functionName: 'jobs',
        args: [BigInt(jobId)],
    });

    const { data: hash, writeContract, isPending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    React.useEffect(() => {
        if (isSuccess) refetch();
    }, [isSuccess]);

    React.useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const data = await api.getJobMetadata(jobId);
                setMetadata(data);
            } catch (err) {
                console.error('Failed to fetch metadata:', err);
            }
        };
        fetchMetadata();
    }, [jobId]);

    if (!job) return null;

    const [id, client, freelancer, amount, status, resultUri, paid] = job;

    // Filter logic
    if (categoryFilter !== 'All' && metadata?.category !== categoryFilter) {
        return null;
    }
    const statusLabels = ['Created', 'Ongoing', 'Completed', 'Disputed', 'Cancelled'];

    const isClient = address?.toLowerCase() === client.toLowerCase();
    const isFreelancer = address?.toLowerCase() === freelancer.toLowerCase();

    const handleRelease = () => {
        writeContract({
            address: CONTRACT_ADDRESS,
            abi: FreelanceEscrowABI.abi,
            functionName: 'releaseFunds',
            args: [BigInt(jobId)],
        });
    };

    const handleSubmit = () => {
        const uri = prompt('Enter your work result URI (IPFS link):');
        if (!uri) return;
        writeContract({
            address: CONTRACT_ADDRESS,
            abi: FreelanceEscrowABI.abi,
            functionName: 'submitWork',
            args: [BigInt(jobId), uri],
        });
    };

    return (
        <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <span className="badge">{statusLabels[status]}</span>
                <span style={{ fontWeight: '600' }}>{formatEther(amount)} MATIC</span>
            </div>

            <h3 style={{ marginBottom: '5px' }}>{metadata?.title || `Job #${jobId}`}</h3>
            {metadata?.category && (
                <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '600', display: 'block', marginBottom: '10px' }}>
                    {metadata.category}
                </span>
            )}

            <p style={{ fontSize: '0.9rem', marginBottom: '15px', color: 'var(--text)' }}>
                {metadata?.description || 'No description provided.'}
            </p>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '15px' }}>
                <p>Client: <UserLink address={client} /></p>
                <p>Freelancer: <UserLink address={freelancer} /></p>
            </div>

            {resultUri && (
                <a
                    href={resultUri}
                    target="_blank"
                    rel="noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--primary)', marginBottom: '20px', textDecoration: 'none', fontSize: '0.9rem' }}
                >
                    <ExternalLink size={14} /> View Work Submission
                </a>
            )
            }

            <div style={{ display: 'flex', gap: '10px' }}>
                {isFreelancer && status < 2 && (
                    <button
                        onClick={handleSubmit}
                        className="btn-primary"
                        style={{ flex: 1 }}
                        disabled={isPending || isConfirming}
                    >
                        {isPending || isConfirming ? 'Processing...' : 'Submit Work'}
                    </button>
                )}

                {isClient && status === 1 && (
                    <button
                        onClick={handleRelease}
                        className="btn-primary"
                        style={{ flex: 1, background: 'linear-gradient(135deg, #10b981, #059669)' }}
                        disabled={isPending || isConfirming}
                    >
                        {isPending || isConfirming ? 'Releasing...' : 'Approve & Pay'}
                    </button>
                )}
            </div>

            {
                status === 2 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#10b981', marginTop: '10px' }}>
                        <CheckCircle size={18} />
                        <span>Payment Released & NFT Minted</span>
                    </div>
                )
            }
        </div >
    );
}

export default JobsList;
