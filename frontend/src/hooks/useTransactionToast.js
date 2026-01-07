import { useEffect, useRef } from 'react';
import { toast } from 'react-toastify';

export function useTransactionToast(hash, isPending, isConfirming, isSuccess, error) {
    const toastId = useRef(null);

    useEffect(() => {
        if (isPending && !toastId.current) {
            toastId.current = toast.loading('Sending transaction...', {
                theme: 'dark'
            });
        }

        if (isConfirming) {
            if (toastId.current) {
                toast.update(toastId.current, {
                    render: 'Confirming on Polygon...',
                    type: 'info',
                    isLoading: true
                });
            } else {
                toastId.current = toast.loading('Confirming on Polygon...', { theme: 'dark' });
            }
        }

        if (isSuccess) {
            if (toastId.current) {
                toast.update(toastId.current, {
                    render: 'Transaction Confirmed! ✅',
                    type: 'success',
                    isLoading: false,
                    autoClose: 5000
                });
                toastId.current = null;
            }
        }

        if (error) {
            const errorMsg = error.shortMessage || error.message || 'Transaction Failed';
            if (toastId.current) {
                toast.update(toastId.current, {
                    render: `Failed: ${errorMsg}`,
                    type: 'error',
                    isLoading: false,
                    autoClose: 5000
                });
                toastId.current = null;
            } else {
                toast.error(`Failed: ${errorMsg}`);
            }
        }
    }, [hash, isPending, isConfirming, isSuccess, error]);
}
