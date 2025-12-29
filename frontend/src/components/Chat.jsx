import React, { useState, useEffect } from 'react';
import { useClient, useConversations, useMessages, useSendMessage, useStreamMessages } from '@xmtp/react-sdk';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { useAccount } from 'wagmi';
import { MessageSquare, Send, User, Loader2 } from 'lucide-react';

export default function Chat() {
    const { address } = useAccount();
    const signer = useEthersSigner();
    const { client, initialize, error, isLoading: isInitializing } = useClient();
    const { conversations } = useConversations();
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [peerAddress, setPeerAddress] = useState('');

    const handleInitialize = async () => {
        if (signer) {
            await initialize({ signer });
        }
    };

    if (!client) {
        return (
            <div className="glass-card" style={{ textAlign: 'center', padding: '50px' }}>
                <MessageSquare size={48} style={{ marginBottom: '20px', color: 'var(--primary)' }} />
                <h3>Enable Decentralized Messaging</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
                    Messages are encrypted and stored off-chain using the XMTP protocol.
                </p>
                <button
                    onClick={handleInitialize}
                    className="btn-primary"
                    disabled={isInitializing || !signer}
                >
                    {isInitializing ? <Loader2 className="animate-spin" /> : signer ? 'Connect to XMTP' : 'Connect Wallet First'}
                </button>
                {!signer && (
                    <p style={{ color: '#f59e0b', marginTop: '10px', fontSize: '0.9rem' }}>
                        Please connect your wallet in the dashboard to enable messaging.
                    </p>
                )}
                {error && <p style={{ color: '#ef4444', marginTop: '10px' }}>{error.message}</p>}
            </div>
        );
    }

    return (
        <div className="grid" style={{ gridTemplateColumns: '300px 1fr', height: '70vh', gap: '20px' }}>
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <h3>Conversations</h3>
                <div style={{ display: 'flex', gap: '5px' }}>
                    <input
                        type="text"
                        placeholder="Wallet Address"
                        value={peerAddress}
                        onChange={(e) => setPeerAddress(e.target.value)}
                        style={{ flex: 1, padding: '8px' }}
                    />
                    <button
                        className="btn-primary"
                        style={{ padding: '8px 12px' }}
                        onClick={() => {
                            if (peerAddress) {
                                setSelectedConversation({ peerAddress });
                                setPeerAddress('');
                            }
                        }}
                    >
                        +
                    </button>
                </div>
                <div style={{ overflowY: 'auto', flex: 1 }}>
                    {conversations.map((conv) => (
                        <div
                            key={conv.peerAddress}
                            onClick={() => setSelectedConversation(conv)}
                            style={{
                                padding: '10px',
                                marginBottom: '5px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                background: selectedConversation?.peerAddress === conv.peerAddress ? 'rgba(138, 43, 226, 0.2)' : 'rgba(255,255,255,0.05)',
                                color: selectedConversation?.peerAddress === conv.peerAddress ? 'var(--primary)' : 'inherit'
                            }}
                        >
                            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                                {conv.peerAddress.slice(0, 6)}...{conv.peerAddress.slice(-4)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', padding: 0 }}>
                {selectedConversation ? (
                    <MessageContainer conversation={selectedConversation} />
                ) : (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                        Select a conversation to start chatting
                    </div>
                )}
            </div>
        </div>
    );
}

function MessageContainer({ conversation }) {
    const { messages } = useMessages(conversation);
    const { sendMessage } = useSendMessage();
    const [inputValue, setInputValue] = useState('');
    const { address } = useAccount();

    useStreamMessages(conversation);

    const handleSend = async (e) => {
        e.preventDefault();
        if (inputValue.trim()) {
            await sendMessage(conversation, inputValue);
            setInputValue('');
        }
    };

    return (
        <>
            <div style={{ padding: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}>
                <strong>Chat with {conversation.peerAddress.slice(0, 6)}...{conversation.peerAddress.slice(-4)}</strong>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {messages.map((msg) => {
                    const isMe = msg.senderAddress.toLowerCase() === address.toLowerCase();
                    return (
                        <div
                            key={msg.id}
                            style={{
                                alignSelf: isMe ? 'flex-end' : 'flex-start',
                                background: isMe ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                                padding: '10px 15px',
                                borderRadius: isMe ? '15px 15px 0 15px' : '15px 15px 15px 0',
                                maxWidth: '70%',
                                fontSize: '0.9rem'
                            }}
                        >
                            {msg.content}
                        </div>
                    );
                })}
            </div>
            <form onSubmit={handleSend} style={{ padding: '15px', display: 'flex', gap: '10px' }}>
                <input
                    type="text"
                    placeholder="Type a message..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    style={{ flex: 1, padding: '10px 15px', borderRadius: '20px' }}
                />
                <button
                    type="submit"
                    className="btn-primary"
                    style={{ borderRadius: '50%', width: '40px', height: '40px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <Send size={18} />
                </button>
            </form>
        </>
    );
}
