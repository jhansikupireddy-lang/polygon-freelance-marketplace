import { useWatchContractEvent, useAccount } from 'wagmi';
import { toast } from 'react-toastify';
import FreelanceEscrowABI from '../contracts/FreelanceEscrow.json';
import { CONTRACT_ADDRESS } from '../constants';
import { useQueryClient } from '@tanstack/react-query';

export function NotificationManager() {
    const { address } = useAccount();
    const queryClient = useQueryClient();

    // Helper to refresh all contract related data
    const refreshData = () => {
        queryClient.invalidateQueries();
    };

    // Watch JobCreated
    useWatchContractEvent({
        address: CONTRACT_ADDRESS,
        abi: FreelanceEscrowABI.abi,
        eventName: 'JobCreated',
        onLogs(logs) {
            logs.forEach((log) => {
                const { client, freelancer, amount } = log.args;
                if (address && (address.toLowerCase() === client.toLowerCase() || address.toLowerCase() === freelancer.toLowerCase())) {
                    toast.success('New Job Created! 💼', {
                        autoClose: 5000,
                    });
                }
                refreshData();
            });
        },
    });

    // Watch JobAccepted
    useWatchContractEvent({
        address: CONTRACT_ADDRESS,
        abi: FreelanceEscrowABI.abi,
        eventName: 'JobAccepted',
        onLogs(logs) {
            logs.forEach(() => {
                toast.success('Job Accepted & Stake Secured! 🛡️', {
                    autoClose: 5000,
                });
                refreshData();
            });
        },
    });

    // Watch WorkSubmitted
    useWatchContractEvent({
        address: CONTRACT_ADDRESS,
        abi: FreelanceEscrowABI.abi,
        eventName: 'WorkSubmitted',
        onLogs(logs) {
            logs.forEach((log) => {
                toast.info('Work has been submitted! 📑', {
                    autoClose: 5000,
                });
                refreshData();
            });
        },
    });

    // Watch FundsReleased
    useWatchContractEvent({
        address: CONTRACT_ADDRESS,
        abi: FreelanceEscrowABI.abi,
        eventName: 'FundsReleased',
        onLogs(logs) {
            logs.forEach((log) => {
                const { freelancer } = log.args;
                if (address && address.toLowerCase() === freelancer.toLowerCase()) {
                    toast.success('Funds Received & NFT Minted! 💰', {
                        autoClose: 6000,
                    });
                } else {
                    toast.success('Funds have been released! ✅');
                }
                refreshData();
            });
        },
    });

    // Watch JobDisputed
    useWatchContractEvent({
        address: CONTRACT_ADDRESS,
        abi: FreelanceEscrowABI.abi,
        eventName: 'JobDisputed',
        onLogs(logs) {
            logs.forEach(() => {
                toast.error('A job has been disputed! ⚖️');
                refreshData();
            });
        },
    });

    return null;
}
