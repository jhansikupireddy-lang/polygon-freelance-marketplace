const API_URL = 'http://localhost:3001/api';

export const api = {
    getProfile: async (address) => {
        const response = await fetch(`${API_URL}/profiles/${address}`);
        return response.json();
    },

    getNonce: async (address) => {
        const response = await fetch(`${API_URL}/auth/nonce/${address}`);
        return response.json();
    },

    updateProfile: async (profileData) => {
        const response = await fetch(`${API_URL}/profiles`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profileData),
        });
        return response.json();
    },

    getJobsMetadata: async () => {
        const response = await fetch(`${API_URL}/jobs`);
        return response.json();
    },

    getJobMetadata: async (jobId) => {
        const response = await fetch(`${API_URL}/jobs/${jobId}`);
        return response.json();
    },

    saveJobMetadata: async (jobMetadata) => {
        const response = await fetch(`${API_URL}/jobs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(jobMetadata),
        });
        return response.json();
    },
};
