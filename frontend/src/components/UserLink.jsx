import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

export function UserLink({ address, style }) {
    const [name, setName] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!address) return;
        const fetchProfile = async () => {
            try {
                const profile = await api.getProfile(address);
                if (profile && profile.name) {
                    setName(profile.name);
                }
            } catch (err) {
                console.error('Failed to fetch profile:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [address]);

    const display = name || `${address.slice(0, 6)}...${address.slice(-4)}`;

    return (
        <span
            title={address}
            style={{
                fontWeight: name ? '600' : '400',
                color: name ? 'var(--primary)' : 'inherit',
                cursor: 'pointer',
                ...style
            }}
        >
            {display}
        </span>
    );
}

export default UserLink;
