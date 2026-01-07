import React from 'react';

const TermsOfService = ({ onBack }) => {
    return (
        <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto', padding: '40px' }}>
            <button onClick={onBack} className="btn-secondary" style={{ marginBottom: '20px' }}>← Back</button>
            <h1 style={{ marginBottom: '20px' }}>Terms of Service</h1>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
                Welcome to PolyLance. By using our platform, you agree to the following terms:
            </p>
            <h2 style={{ marginTop: '20px' }}>1. Escrow & Disputes</h2>
            <p style={{ color: 'var(--text-muted)' }}>
                All funds are held in a decentralized smart contract. PolyLance administrators can only arbitrate jobs in an 'Arbitration' state.
            </p>
            <h2 style={{ marginTop: '20px' }}>2. Fees</h2>
            <p style={{ color: 'var(--text-muted)' }}>
                A platform fee of 2.5% is applied to all successful job completions to maintain the protocol.
            </p>
            <h2 style={{ marginTop: '20px' }}>3. Reputation</h2>
            <p style={{ color: 'var(--text-muted)' }}>
                User reputation is tracked via non-transferable Soulbound Tokens (SBTs). Any attempt to manipulate reputation may result in a platform ban.
            </p>
            <div style={{ marginTop: '40px', borderTop: '1px solid var(--glass-border)', paddingTop: '20px' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Last updated: January 2026</p>
            </div>
        </div>
    );
};

export default TermsOfService;
