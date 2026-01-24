import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import UserLink from './UserLink';
import { api } from '../services/api';

// Mock api
vi.mock('../services/api', () => ({
    api: {
        getProfile: vi.fn(),
    },
}));

describe('UserLink Component', () => {
    const testAddress = '0x1234567890123456789012345678901234567890';

    it('displays truncated address when no name is found', async () => {
        api.getProfile.mockResolvedValue({});
        render(<UserLink address={testAddress} />);

        await waitFor(() => {
            expect(screen.getByText(/0x1234...7890/)).toBeInTheDocument();
        });
    });

    it('displays name when found in profile', async () => {
        api.getProfile.mockResolvedValue({ address: testAddress, name: 'Alice' });
        render(<UserLink address={testAddress} />);

        await waitFor(() => {
            expect(screen.getByText('Alice')).toBeInTheDocument();
        });
    });
});
