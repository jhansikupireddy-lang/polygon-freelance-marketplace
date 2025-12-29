import { createPublicClient, http, parseAbiItem } from 'viem';
import { localhost } from 'viem/chains';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { JobMetadata } from './models/JobMetadata.js';
import { Profile } from './models/Profile.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONTRACT_ADDRESS = '0x25F6C8ed995C811E6c0ADb1D66A60830E8115e9A';

// Load ABI
const abiPath = path.join(__dirname, 'contracts', 'FreelanceEscrow.json');
const contractData = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
const abi = contractData.abi;

const client = createPublicClient({
    chain: localhost,
    transport: http(),
});

export async function startSyncer() {
    console.log('Starting blockchain event syncer...');

    // Watch for JobCreated events
    client.watchEvent({
        address: CONTRACT_ADDRESS,
        event: parseAbiItem('event JobCreated(uint256 indexed jobId, address indexed client, address indexed freelancer, uint256 amount)'),
        onLogs: async (logs) => {
            for (const log of logs) {
                const { jobId, client: clientAddr, freelancer, amount } = log.args;
                console.log(`New Job Created On-Chain: ID ${jobId}, Client ${clientAddr}`);

                try {
                    const existing = await JobMetadata.findOne({ jobId: Number(jobId) });

                    if (!existing) {
                        console.log(`Job ${jobId} not found in DB, creating placeholder...`);
                        await JobMetadata.create({
                            jobId: Number(jobId),
                            title: `Job #${jobId} (On-chain)`,
                            description: 'Metadata sync pending...',
                            category: 'General',
                        });
                    }
                } catch (error) {
                    console.error(`Error syncing job ${jobId}:`, error);
                }
            }
        },
    });

    // Watch for FundsReleased (Reputation update)
    client.watchEvent({
        address: CONTRACT_ADDRESS,
        event: parseAbiItem('event FundsReleased(uint256 indexed jobId, address indexed freelancer, uint256 amount, uint256 nftId)'),
        onLogs: async (logs) => {
            for (const log of logs) {
                try {
                    const { freelancer, amount } = log.args;
                    const maticAmount = Number(amount) / 1e18;
                    console.log(`Job Completed! Updating reputation for ${freelancer}: +${maticAmount} MATIC`);

                    await Profile.findOneAndUpdate(
                        { address: freelancer.toLowerCase() },
                        {
                            $inc: { totalEarned: maticAmount, completedJobs: 1 }
                        },
                        { upsert: true, new: true }
                    );
                } catch (error) {
                    console.error('Error handling FundsReleased:', error);
                }
            }
        }
    });

    // Watch for JobDisputed
    client.watchEvent({
        address: CONTRACT_ADDRESS,
        event: parseAbiItem('event JobDisputed(uint256 indexed jobId)'),
        onLogs: async (logs) => {
            for (const log of logs) {
                try {
                    const { jobId } = log.args;
                    console.log(`Dispute Signal: Job ${jobId} enters dispute phase.`);
                } catch (error) {
                    console.error('Error handling JobDisputed:', error);
                }
            }
        }
    });

    // Watch for ReviewSubmitted
    client.watchEvent({
        address: CONTRACT_ADDRESS,
        event: parseAbiItem('event ReviewSubmitted(uint256 indexed jobId, address indexed reviewer, uint8 rating, string comment)'),
        onLogs: async (logs) => {
            for (const log of logs) {
                try {
                    const { jobId, rating, comment } = log.args;
                    console.log(`New Review for Job ${jobId}: ${rating} stars`);
                    await JobMetadata.findOneAndUpdate(
                        { jobId: Number(jobId) },
                        { rating: Number(rating), review: comment },
                        { upsert: true }
                    );
                } catch (error) {
                    console.error('Error handling ReviewSubmitted:', error);
                }
            }
        }
    });

    console.log(`Watching events for contract at ${CONTRACT_ADDRESS}`);
}
