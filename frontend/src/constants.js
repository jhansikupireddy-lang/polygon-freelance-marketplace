export const CONTRACT_ADDRESS = '0x38c76A767d45Fc390160449948aF80569E2C4217';

export const SUPPORTED_TOKENS = [
    { symbol: 'MATIC', address: '0x0000000000000000000000000000000000000000', decimals: 18 },
    { symbol: 'USDC', address: '0x41e94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582', decimals: 6 },
    { symbol: 'DAI', address: '0x001B68356E62095104ee17672f101d2959E73fF3', decimals: 18 },
];

export const CHAINLINK_PRICE_FEEDS = {
    MATIC: '0x001382149eBa3441043c1c66972b4772963f5D43', // Amoy MATIC/USD
};

export const PRICE_FEED_ABI = [
    {
        "inputs": [],
        "name": "latestRoundData",
        "outputs": [
            { "internalType": "uint80", "name": "roundId", "type": "uint80" },
            { "internalType": "int256", "name": "answer", "type": "int256" },
            { "internalType": "uint256", "name": "startedAt", "type": "uint256" },
            { "internalType": "uint256", "name": "updatedAt", "type": "uint256" },
            { "internalType": "uint80", "name": "answeredInRound", "type": "uint80" }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

export const POLY_TOKEN_ADDRESS = '0xd3b893cd083f07Fe371c1a87393576e7B01C52C6';
export const STREAMING_ESCROW_ADDRESS = '0xfc073209b7936A771F77F63D42019a3a93311869';
export const GOVERNANCE_ADDRESS = '0x4653251486a57f90Ee89F9f34E098b9218659b83';
export const REPUTATION_ADDRESS = '0xDC57724Ea354ec925BaFfCA0cCf8A1248a8E5CF1';
export const CROSS_CHAIN_GOVERNOR_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3'; // Hub address from sim
