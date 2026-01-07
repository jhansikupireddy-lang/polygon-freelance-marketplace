import React from 'react';

const PrivacyPolicy = ({ onBack }) => {
    return (
        <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto', padding: '40px' }}>
            <button onClick={onBack} className="btn-secondary" style={{ marginBottom: '20px' }}>← Back</button>
            <h1 style={{ marginBottom: '20px' }}>Privacy Policy</h1>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
                At PolyLance, we prioritize your privacy while operating on a public blockchain.
            </p>
            <h2 style={{ marginTop: '20px' }}>1. On-Chain Data</h2>
            <p style={{ color: 'var(--text-muted)' }}>
                Transaction data, wallet addresses, and job statuses are public and stored permanently on the Polygon blockchain.
            </p>
            <h2 style={{ marginTop: '20px' }}>2. Messaging</h2>
            <p style={{ color: 'var(--text-muted)' }}>
                Messages sent via XMTP are end-to-end encrypted. Only the sender and recipient can decrypt and read the contents.
            </p>
            <h2 style={{ marginTop: '20px' }}>3. Metadata</h2>
            <p style={{ color: 'var(--text-muted)' }}>
                Job descriptions and files stored on IPFS are public unless encrypted before upload. We recommend not sharing personally identifiable information (PII) in job descriptions.
            </p>
            <div style={{ marginTop: '40px', borderTop: '1px solid var(--glass-border)', paddingTop: '20px' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Last updated: January 2026</p>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
