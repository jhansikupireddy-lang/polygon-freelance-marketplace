import React, { useState, useMemo } from 'react';
import '@rainbow-me/rainbowkit/styles.css';
import {
    getDefaultConfig,
    RainbowKitProvider,
    RainbowKitAuthenticationProvider,
    createAuthenticationAdapter,
    darkTheme,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider, http } from 'wagmi';
import { polygon, polygonAmoy, hardhat } from 'wagmi/chains';
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { SiweMessage } from 'siwe';

const API_URL = 'http://localhost:3001/api';
const queryClient = new QueryClient();

export function Web3Provider({ children }) {
    const [authStatus, setAuthStatus] = useState('unauthenticated');

    const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '65a5f1dd3b7df21cef34448cac019cd5';

    // Using getDefaultConfig for stability in Wagmi v2
    const config = useMemo(() => getDefaultConfig({
        appName: 'PolyLance',
        projectId,
        chains: [polygon, polygonAmoy, hardhat],
        transports: {
            [polygon.id]: http(),
            [polygonAmoy.id]: http('https://rpc-amoy.polygon.technology'),
            [hardhat.id]: http(),
        },
        ssr: true,
    }), [projectId]);

    const authAdapter = useMemo(() => createAuthenticationAdapter({
        getNonce: async () => {
            const response = await fetch(`${API_URL}/auth/nonce/default`);
            const { nonce } = await response.json();
            return nonce;
        },

        createMessage: ({ nonce, address, chainId }) => {
            return new SiweMessage({
                domain: window.location.host,
                address,
                statement: 'Sign in with Ethereum to PolyLance.',
                uri: window.location.origin,
                version: '1',
                chainId,
                nonce,
            });
        },

        getMessageBody: ({ message }) => {
            return message.prepareMessage();
        },

        verify: async ({ message, signature }) => {
            const verifyRes = await fetch(`${API_URL}/profiles`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    address: message.address,
                    signature,
                    name: '',
                    bio: '',
                    skills: ''
                }),
            });

            const data = await verifyRes.json();
            const ok = !!data.address;
            if (ok) {
                setAuthStatus('authenticated');
            }
            return ok;
        },

        signOut: async () => {
            setAuthStatus('unauthenticated');
        },
    }), []);

    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitAuthenticationProvider
                    adapter={authAdapter}
                    status={authStatus}
                >
                    <RainbowKitProvider theme={darkTheme({
                        accentColor: '#8a2be2',
                        accentColorForeground: 'white',
                        borderRadius: 'medium',
                        overlayBlur: 'small',
                    })}>
                        {children}
                    </RainbowKitProvider>
                </RainbowKitAuthenticationProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}
