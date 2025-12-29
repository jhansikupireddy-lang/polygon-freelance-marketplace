import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

// Use vi.mock at the top level with a factory function
vi.mock('@prisma/client', () => {
    const PrismaClient = vi.fn(() => ({
        profile: {
            findUnique: vi.fn(),
            upsert: vi.fn(),
            update: vi.fn(),
        },
        jobMetadata: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
        },
        $disconnect: vi.fn(),
    }));
    return { PrismaClient };
});

// Import app after mocking PrismaClient
import { app, prisma } from './server.js';

describe('API Endpoints (Mocked Prisma)', () => {
    const testAddress = '0x1234567890123456789012345678901234567890';

    it('GET /api/profiles/:address should return profile if found', async () => {
        prisma.profile.findUnique.mockResolvedValue({ address: testAddress, name: 'Alice' });
        const res = await request(app).get(`/api/profiles/${testAddress}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body.name).toBe('Alice');
    });

    it('GET /api/auth/nonce/:address should return a nonce', async () => {
        prisma.profile.upsert.mockResolvedValue({ nonce: 'test-nonce' });
        const res = await request(app).get(`/api/auth/nonce/${testAddress}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('nonce');
    });
});
