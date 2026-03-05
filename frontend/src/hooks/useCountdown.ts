import { useState, useEffect } from 'react';

export const useCountdown = (expiresAt: string | null) => {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        if (!expiresAt) return;
        const interval = setInterval(() => setNow(Date.now()), 1000);

        return () => clearInterval(interval);
    }, [expiresAt]);

    const targetTime = expiresAt ? new Date(expiresAt).getTime() : 0;
    const timeLeft = expiresAt ? Math.max(0, targetTime - now) : 0;

    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);
    const isExpired = timeLeft === 0 && !!expiresAt;

    return { timeLeft, minutes, seconds, isExpired };
};
