import React from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { motion } from 'framer-motion';
import { Briefcase, CheckCircle, ExternalLink, RefreshCcw } from 'lucide-react';
import FreelanceEscrowABI from '../contracts/FreelanceEscrow.json';
import { formatEther, formatUnits, parseUnits, erc20Abi } from 'viem';
import { CONTRACT_ADDRESS, SUPPORTED_TOKENS } from '../constants';
import { api } from '../services/api';
import UserLink from './UserLink';


const statusLabels = ['Created', 'Accepted', 'Ongoing', 'Disputed', 'Completed', 'Cancelled'];

function JobsList({ onUserClick }) {
    const { address } = useAccount();
    const [filter, setFilter] = React.useState('All');
    const [searchQuery, setSearchQuery] = React.useState('');
    const [minBudget, setMinBudget] = React.useState('');
    const { data: jobCount } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: FreelanceEscrowABI.abi,
        functionName: 'jobCount',
    });

    const count = jobCount ? Number(jobCount) : 0;

    return (
        <div>
            <div className="glass-card" style={{ marginBottom: '30px', padding: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 150px 150px', gap: '20px' }}>
                    <input
                        type="text"
                        placeholder="Search jobs by title or description..."
                        className="input-field"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ margin: 0 }}
                    />
                    <select
                        className="input-field"
                        style={{ margin: 0 }}
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    >
                        <option>All Categories</option>
                        <option>Development</option>
                        <option>Design</option>
                        <option>Marketing</option>
                        <option>Writing</option>
                    </select>
                    <input
                        type="number"
                        placeholder="Min MATIC"
                        className="input-field"
                        value={minBudget}
                        onChange={(e) => setMinBudget(e.target.value)}
                        style={{ margin: 0 }}
                    />
                </div>
            </div>

            <div className="grid">
                {count === 0 ? (
                    <div className="glass-card" style={{ textAlign: 'center', padding: '60px', gridColumn: '1 / -1' }}>
                        <Briefcase size={48} style={{ color: 'var(--text-muted)', marginBottom: '20px', opacity: 0.5 }} />
                        <h3 style={{ color: 'var(--text-muted)' }}>No jobs published yet</h3>
                        <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Be the first to post a new gig on the marketplace.</p>
                    </div>
                ) : (
                    Array.from({ length: count }).map((_, i) => (
                        <motion.div
                            key={i + 1}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <JobCard
                                jobId={i + 1}
                                categoryFilter={filter}
                                searchQuery={searchQuery}
                                minBudget={minBudget}
                                onUserClick={onUserClick}
                            />
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}

function JobCard({ jobId, categoryFilter, searchQuery, minBudget, onUserClick }) {
    const { address } = useAccount();
    const [metadata, setMetadata] = React.useState(null);
    const [matchScore, setMatchScore] = React.useState(null);
    const [isApproving, setIsApproving] = React.useState(false);
    const { data: job, refetch } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: FreelanceEscrowABI.abi,
        functionName: 'jobs',
        args: [BigInt(jobId)],
    });

    const { data: arbitrator } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: FreelanceEscrowABI.abi,
        functionName: 'arbitrator',
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

                if (address) {
                    const matches = await api.getJobMatches(jobId);
                    const myMatch = matches.find(m => m.address.toLowerCase() === address.toLowerCase());
                    if (myMatch) setMatchScore(myMatch.matchScore);
                }
            } catch (err) {
                console.error('Failed to fetch job metadata/matches:', err);
            }
        };
        fetchMetadata();
    }, [jobId, address]);

    if (!job) return null;

    const [id, client, freelancer, token, amount, freelancerStake, totalPaidOut, status, resultUri, paid, milestoneCount] = job;
    const tokenInfo = SUPPORTED_TOKENS.find(t => t.address.toLowerCase() === token.toLowerCase()) || SUPPORTED_TOKENS[0];
    const currency = tokenInfo.symbol;
    const decimals = tokenInfo.decimals;

    const { data: review } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: FreelanceEscrowABI.abi,
        functionName: 'reviews',
        args: [BigInt(jobId)],
    });

    // Filter logic
    const matchesCategory = categoryFilter === 'All Categories' || categoryFilter === 'All' || metadata?.category === categoryFilter;
    const matchesSearch = !searchQuery ||
        metadata?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        metadata?.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBudget = !minBudget || Number(formatUnits(amount, decimals)) >= Number(minBudget);

    if (!matchesCategory || !matchesSearch || !matchesBudget) {
        return null;
    }

    const isClient = address?.toLowerCase() === client.toLowerCase();
    const isFreelancer = address?.toLowerCase() === freelancer.toLowerCase();
    const isArbitrator = address?.toLowerCase() === arbitrator?.toLowerCase();

    const handleApproveStake = async () => {
        if (token === '0x0000000000000000000000000000000000000000') return;
        setIsApproving(true);
        try {
            const requiredStake = (amount * 10n) / 100n;
            await writeContract({
                address: token,
                abi: erc20Abi,
                functionName: 'approve',
                args: [CONTRACT_ADDRESS, requiredStake],
            });
            alert('Stake approval sent!');
        } catch (err) {
            console.error(err);
        } finally {
            setIsApproving(false);
        }
    };

    const handleAccept = () => {
        const requiredStake = (amount * 10n) / 100n;
        writeContract({
            address: CONTRACT_ADDRESS,
            abi: FreelanceEscrowABI.abi,
            functionName: 'acceptJob',
            args: [BigInt(jobId)],
            value: token === '0x0000000000000000000000000000000000000000' ? requiredStake : 0n,
        });
    };

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

    const handleResolve = (winnerAddr) => {
        const freelancerPay = winnerAddr.toLowerCase() === freelancer.toLowerCase() ? (amount + freelancerStake) : 0n;
        writeContract({
            address: CONTRACT_ADDRESS,
            abi: FreelanceEscrowABI.abi,
            functionName: 'resolveDispute',
            args: [BigInt(jobId), winnerAddr, freelancerPay],
        });
    };

    const handleDispute = () => {
        writeContract({
            address: CONTRACT_ADDRESS,
            abi: FreelanceEscrowABI.abi,
            functionName: 'dispute',
            args: [BigInt(jobId)],
        });
    };

    const handleReleaseMilestone = (mId) => {
        writeContract({
            address: CONTRACT_ADDRESS,
            abi: FreelanceEscrowABI.abi,
            functionName: 'releaseMilestone',
            args: [BigInt(jobId), BigInt(mId)],
        });
    };

    const handleReview = () => {
        const rating = prompt('Enter rating (1-5):');
        const comment = prompt('Enter your feedback:');
        if (!rating || !comment) return;
        writeContract({
            address: CONTRACT_ADDRESS,
            abi: FreelanceEscrowABI.abi,
            functionName: 'submitReview',
            args: [BigInt(jobId), parseInt(rating), comment],
        });
    };

    const getMatchColor = (score) => {
        if (score > 0.8) return '#10b981';
        if (score > 0.5) return '#f59e0b';
        return 'var(--text-muted)';
    };

    return (
        <div className="glass-card" style={{ position: 'relative' }}>
            {matchScore !== null && status === 0 && (
                <div style={{
                    position: 'absolute',
                    top: '-10px',
                    right: '10px',
                    background: getMatchColor(matchScore),
                    color: 'white',
                    fontSize: '0.7rem',
                    padding: '4px 8px',
                    borderRadius: '20px',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    zIndex: 10
                }}>
                    ✨ AI Match: {Math.round(matchScore * 100)}%
                </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <div className={`badge ${status === 3 ? 'dispute-badge' : ''}`}>{statusLabels[status]}</div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderColor: '#10b981', border: '1px solid' }}>🛡️ Insured</span>
                    <span style={{ fontWeight: '600' }}>{formatUnits(amount, decimals)} {currency}</span>
                </div>
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
                <p style={{ cursor: 'pointer' }} onClick={() => onUserClick(client)}>Client: <UserLink address={client} /></p>
                <p style={{ cursor: 'pointer' }} onClick={() => onUserClick(freelancer)}>Freelancer: <UserLink address={freelancer} /></p>
            </div>

            {resultUri && (
                <a
                    href={resultUri}
                    target="_blank"
                    rel="noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--primary)', marginBottom: '15px', textDecoration: 'none', fontSize: '0.9rem' }}
                >
                    <ExternalLink size={14} /> View Work Submission
                </a>
            )}

            {Number(milestoneCount) > 0 && (
                <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(0,0,0,0.05)', borderRadius: '8px' }}>
                    <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px' }}>Milestones</h4>
                    {Array.from({ length: Number(milestoneCount) }).map((_, idx) => (
                        <MilestoneRow key={idx} jobId={jobId} mId={idx} isClient={isClient} tokenInfo={tokenInfo} onRelease={handleReleaseMilestone} />
                    ))}
                    <div style={{ fontSize: '0.8rem', marginTop: '10px', fontWeight: '600' }}>
                        Paid: {formatUnits(totalPaidOut, decimals)} / {formatUnits(amount, decimals)} {currency}
                    </div>
                </div>
            )}

            {review && review[2] !== '0x0000000000000000000000000000000000000000' && (
                <div style={{ padding: '15px', borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '15px' }}>
                    <div style={{ display: 'flex', gap: '5px', color: '#fbbf24', marginBottom: '5px' }}>
                        {'★'.repeat(review[0])}{'☆'.repeat(5 - review[0])}
                    </div>
                    <p style={{ fontSize: '0.85rem', fontStyle: 'italic' }}>"{review[1]}"</p>
                </div>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {isFreelancer && status === 0 && (
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {token !== '0x0000000000000000000000000000000000000000' && (
                            <button onClick={handleApproveStake} className="btn-secondary" style={{ flex: 1 }} disabled={isPending || isConfirming || isApproving}>
                                {isApproving ? 'Approving Stake...' : `Approve Stake (10% ${currency})`}
                            </button>
                        )}
                        <button onClick={handleAccept} className="btn-primary" style={{ flex: 1 }} disabled={isPending || isConfirming || isApproving}>
                            {isPending || isConfirming ? 'Staking...' : `Accept & Stake (10% ${currency})`}
                        </button>
                    </div>
                )}

                {isFreelancer && (status === 1 || status === 2) && (
                    <button onClick={handleSubmit} className="btn-primary" style={{ flex: 1 }} disabled={isPending || isConfirming}>
                        {isPending || isConfirming ? 'Processing...' : 'Submit Work'}
                    </button>
                )}

                {isClient && status === 2 && (
                    <button onClick={handleRelease} className="btn-primary" style={{ flex: 1, background: 'linear-gradient(135deg, #10b981, #059669)' }} disabled={isPending || isConfirming}>
                        {isPending || isConfirming ? 'Releasing...' : 'Approve & Pay'}
                    </button>
                )}

                {(isClient || isFreelancer) && (status === 1 || status === 2) && (
                    <button onClick={handleDispute} className="btn-secondary" style={{ flex: 1, borderColor: '#ef4444', color: '#ef4444' }} disabled={isPending || isConfirming}>
                        Open Dispute
                    </button>
                )}

                {isArbitrator && status === 3 && (
                    <div style={{ width: '100%', display: 'flex', gap: '10px', marginTop: '10px' }}>
                        <button onClick={() => handleResolve(client)} className="btn-secondary" style={{ flex: 1 }}>Refund Client</button>
                        <button onClick={() => handleResolve(freelancer)} className="btn-primary" style={{ flex: 1 }}>Pay Freelancer</button>
                    </div>
                )}
            </div>

            {isClient && status === 4 && (
                <button onClick={handleReview} className="btn-secondary" style={{ width: '100%', marginTop: '15px' }}>
                    Leave a Review
                </button>
            )}

            {status === 4 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#10b981', marginTop: '10px' }}>
                    <CheckCircle size={18} />
                    <span>Success: Funds & Stake Distributed</span>
                </div>
            )}
        </div>
    );
}

function MilestoneRow({ jobId, mId, isClient, tokenInfo, onRelease }) {
    const { data: milestone } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: FreelanceEscrowABI.abi,
        functionName: 'jobMilestones',
        args: [BigInt(jobId), BigInt(mId)],
    });

    if (!milestone) return null;
    const [amt, desc, isReleased] = milestone;

    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', marginBottom: '8px' }}>
            <span>{desc} ({formatUnits(amt, tokenInfo.decimals)} {tokenInfo.symbol})</span>
            {isReleased ? (
                <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle size={14} /> Released
                </span>
            ) : (
                isClient && (
                    <button
                        onClick={() => onRelease(mId)}
                        className="btn-secondary"
                        style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                    >
                        Release
                    </button>
                )
            )}
        </div>
    );
}

export default JobsList;
