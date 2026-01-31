export const GOVERNANCE_ABI = [
    {
        "inputs": [],
        "name": "proposalCount",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "name": "proposals",
        "outputs": [
            { "internalType": "uint256", "name": "id", "type": "uint256" },
            { "internalType": "address", "name": "proposer", "type": "address" },
            { "internalType": "string", "name": "description", "type": "string" },
            { "internalType": "uint256", "name": "forVotes", "type": "uint256" },
            { "internalType": "uint256", "name": "againstVotes", "type": "uint256" },
            { "internalType": "uint256", "name": "startTime", "type": "uint256" },
            { "internalType": "uint256", "name": "endTime", "type": "uint256" },
            { "internalType": "bool", "name": "executed", "type": "bool" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "uint256", "name": "proposalId", "type": "uint256" },
            { "internalType": "bool", "name": "support", "type": "bool" }
        ],
        "name": "vote",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "string", "name": "description", "type": "string" },
            { "internalType": "bool", "name": "useQuadratic", "type": "bool" },
            { "internalType": "bool", "name": "isOptimistic", "type": "bool" },
            { "internalType": "bool", "name": "isSecret", "type": "bool" },
            { "internalType": "bool", "name": "isConviction", "type": "bool" },
            { "internalType": "bool", "name": "isZK", "type": "bool" },
            { "internalType": "uint256", "name": "threshold", "type": "uint256" },
            { "internalType": "address", "name": "target", "type": "address" },
            { "internalType": "bytes", "name": "data", "type": "bytes" }
        ],
        "name": "createProposal",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "uint256", "name": "proposalId", "type": "uint256" }
        ],
        "name": "disputeProposal",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "string", "name": "channelId", "type": "string" }
        ],
        "name": "registerNotificationChannel",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "uint256", "name": "proposalId", "type": "uint256" },
            { "internalType": "bool", "name": "support", "type": "bool" },
            { "internalType": "bytes32", "name": "nullifier", "type": "bytes32" },
            { "internalType": "bytes", "name": "zkProof", "type": "bytes" }
        ],
        "name": "anonymousVote",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "uint256", "name": "proposalId", "type": "uint256" },
            { "internalType": "bytes32", "name": "hashedVote", "type": "bytes32" }
        ],
        "name": "commitVote",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "uint256", "name": "proposalId", "type": "uint256" },
            { "internalType": "bool", "name": "support", "type": "bool" },
            { "internalType": "string", "name": "salt", "type": "string" }
        ],
        "name": "revealVote",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "address", "name": "delegatee", "type": "address" }],
        "name": "delegate",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

export const CROSS_CHAIN_GOVERNOR_ABI = [
    {
        "inputs": [
            { "internalType": "uint32", "name": "_dstEid", "type": "uint32" },
            { "internalType": "uint256", "name": "_proposalId", "type": "uint256" },
            { "internalType": "bool", "name": "_support", "type": "bool" }
        ],
        "name": "castVoteCrossChain",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "uint256", "name": "", "type": "uint256" },
            { "internalType": "bool", "name": "", "type": "bool" }
        ],
        "name": "proposalVotes",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": false, "internalType": "uint32", "name": "srcEid", "type": "uint32" },
            { "indexed": false, "internalType": "bytes32", "name": "guid", "type": "bytes32" },
            { "indexed": false, "internalType": "address", "name": "target", "type": "address" },
            { "indexed": false, "internalType": "bytes", "name": "data", "type": "bytes" }
        ],
        "name": "RemoteActionExecuted",
        "type": "event"
    }
];

export const REPUTATION_ABI = [
    {
        "inputs": [
            { "internalType": "address", "name": "account", "type": "address" },
            { "internalType": "uint256", "name": "id", "type": "uint256" }
        ],
        "name": "balanceOf",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "KARMA_ID",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    }
];
