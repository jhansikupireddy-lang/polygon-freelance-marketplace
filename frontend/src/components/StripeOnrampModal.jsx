import React, { useEffect, useRef, useState } from 'react';
import { loadStripeOnramp } from '@stripe/crypto';
import { X } from 'lucide-react';
import { api } from '../services/api';

const StripeOnrampModal = ({ address, isOpen, onClose }) => {
    const [onramp, setOnramp] = useState(null);
    const [session, setSession] = useState(null);
    const containerRef = useRef(null);

    useEffect(() => {
        if (isOpen && address) {
            const initOnramp = async () => {
                try {
                    const data = await api.createStripeOnrampSession(address);
                    setSession(data);

                    const stripeOnramp = await loadStripeOnramp(
                        import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_6pdw996D1u3729eY9ueJ008D' // Placeholder for UI demos
                    );
                    setOnramp(stripeOnramp);
                } catch (error) {
                    console.error('Failed to init Stripe Onramp:', error);
                }
            };
            initOnramp();
        } else {
            setSession(null);
            setOnramp(null);
        }
    }, [isOpen, address]);

    useEffect(() => {
        if (onramp && session && containerRef.current) {
            const onrampSession = onramp.createSession({
                clientSecret: session.client_secret,
            });
            onrampSession.mount(containerRef.current);

            return () => {
                onrampSession.unmount();
            };
        }
    }, [onramp, session]);

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            backdropFilter: 'blur(8px)',
            padding: '20px'
        }}>
            <div className="glass-card" style={{
                position: 'relative',
                width: '100%',
                maxHeight: '90vh',
                maxWidth: '500px',
                padding: '40px 20px 20px 20px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.1)'
            }}>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '15px',
                        right: '15px',
                        background: 'rgba(255,255,255,0.05)',
                        border: 'none',
                        color: 'var(--text)',
                        cursor: 'pointer',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
                    onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                >
                    <X size={18} />
                </button>

                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>Fiat-to-Crypto Onramp</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '5px' }}>Powered by Stripe</p>
                </div>

                <div
                    ref={containerRef}
                    style={{
                        flex: 1,
                        minHeight: '450px',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        background: 'rgba(0,0,0,0.2)',
                        border: '1px solid rgba(255,255,255,0.05)'
                    }}
                >
                    {!session && (
                        <div style={{
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '15px'
                        }}>
                            <div className="spinner" style={{
                                width: '30px',
                                height: '30px',
                                border: '3px solid rgba(255,255,255,0.1)',
                                borderTopColor: 'var(--primary)',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite'
                            }} />
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Securing payment session...</p>
                        </div>
                    )}
                </div>

                <p style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    textAlign: 'center',
                    marginTop: '15px',
                    lineHeight: '1.4'
                }}>
                    Transactions are handled securely by Stripe. Funds will be deposited directly to your connected wallet address:
                    <br />
                    <span style={{ color: 'var(--primary)', fontFamily: 'monospace' }}>{address.slice(0, 6)}...{address.slice(-4)}</span>
                </p>
            </div>

            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default StripeOnrampModal;
