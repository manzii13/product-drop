import { useEffect, useRef } from 'react';
import { useCountdown } from '../hooks/useCountdown';

interface Props {
    expiresAt: string;
    onExpire: () => void;
}

export const CountdownTimer = ({ expiresAt, onExpire }: Props) => {
    const { minutes, seconds, isExpired } = useCountdown(expiresAt);
    const hasNotifiedRef = useRef(false);

    useEffect(() => {
        if (isExpired && !hasNotifiedRef.current) {
            hasNotifiedRef.current = true;
            onExpire();
        }

        if (!isExpired) {
            hasNotifiedRef.current = false;
        }
    }, [isExpired, onExpire]);

    if (isExpired) {
        return <p className="text-red-500 font-bold">Reservation expired!</p>;
    }

    const urgent = minutes === 0 && seconds < 30;

    return (
        <div className={`text-center p-3 rounded-lg ${urgent ? 'bg-red-100' : 'bg-yellow-100'}`}>
            <p className="text-sm text-gray-600">Reservation expires in:</p>
            <p className={`text-3xl font-mono font-bold ${urgent ? 'text-red-600' : 'text-yellow-600'}`}>
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </p>
        </div>
    );
};
