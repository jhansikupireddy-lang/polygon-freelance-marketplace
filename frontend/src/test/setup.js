import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock fetch
global.fetch = vi.fn();

// Mock wagmi hooks if needed globally
vi.mock('wagmi', () => ({
    useAccount: () => ({ address: '0x123', isConnected: true }),
    useReadContract: () => ({ data: null }),
    useWriteContract: () => ({ writeContract: vi.fn() }),
    useWaitForTransactionReceipt: () => ({ isLoading: false, isSuccess: false }),
    useSignMessage: () => ({ signMessageAsync: vi.fn() }),
}));
