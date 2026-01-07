import axios from 'axios';

const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY;
const PINATA_API_SECRET = import.meta.env.VITE_PINATA_API_SECRET;

/**
 * Uploads a JSON object to IPFS via Pinata.
 * @param {Object} data - The JSON data to upload.
 * @returns {Promise<string>} - The IPFS hash (CID).
 */
export const uploadJSONToIPFS = async (data) => {
    if (!PINATA_API_KEY || !PINATA_API_SECRET) {
        console.warn('Pinata API keys missing. Metadata will not be pinned.');
        return '';
    }

    try {
        const response = await axios.post('https://api.pinata.cloud/pinning/pinJSONToIPFS', data, {
            headers: {
                'Content-Type': 'application/json',
                pinata_api_key: PINATA_API_KEY,
                pinata_secret_api_key: PINATA_API_SECRET,
            },
        });
        return response.data.IpfsHash;
    } catch (error) {
        console.error('Error uploading to IPFS:', error);
        throw error;
    }
};

/**
 * Uploads a file to IPFS via Pinata.
 * @param {File} file - The file to upload.
 * @returns {Promise<string>} - The IPFS hash (CID).
 */
export const uploadFileToIPFS = async (file) => {
    if (!PINATA_API_KEY || !PINATA_API_SECRET) {
        throw new Error('Pinata API keys missing');
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
            headers: {
                'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
                pinata_api_key: PINATA_API_KEY,
                pinata_secret_api_key: PINATA_API_SECRET,
            },
        });
        return response.data.IpfsHash;
    } catch (error) {
        console.error('Error uploading file to IPFS:', error);
        throw error;
    }
};

export const getIPFSUrl = (hash) => {
    if (!hash) return '';
    return `https://gateway.pinata.cloud/ipfs/${hash}`;
};
