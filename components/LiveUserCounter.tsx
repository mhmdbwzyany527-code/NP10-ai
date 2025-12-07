
import React, { useState, useEffect } from 'react';
import { UsersIcon } from './Icons';

const LiveUserCounter: React.FC = () => {
    const [count, setCount] = useState(() => {
        try {
            const storedBase = localStorage.getItem('stenpan-ai-base-users');
            let base = storedBase ? parseInt(storedBase, 10) : Math.floor(Math.random() * (200 - 50 + 1) + 50);
            
            // Simulate growth since last visit
            base += Math.floor(Math.random() * 5); 
            localStorage.setItem('stenpan-ai-base-users', String(base));
            return base;
        } catch {
            return Math.floor(Math.random() * (200 - 50 + 1) + 50);
        }
    });
    const [change, setChange] = useState<number | null>(null);

    useEffect(() => {
        const interval = setInterval(() => {
            const diff = Math.floor(Math.random() * 9) - 4; // -4 to +4
            setCount(prev => {
                const newCount = Math.max(25, prev + diff);
                 try {
                    // Update the base count periodically
                    localStorage.setItem('stenpan-ai-base-users', String(newCount));
                 } catch {}
                return newCount;
            });
            setChange(diff);
            setTimeout(() => setChange(null), 500); // Reset animation class
        }, 3000); // Update every 3 seconds

        return () => clearInterval(interval);
    }, []);

    const changeClass = change !== null ? (change > 0 ? 'text-green-500 animate-fade-up' : 'text-red-500 animate-fade-down') : '';

    return (
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 relative">
            <style>
                {`
                @keyframes fade-up {
                    0% { opacity: 1; transform: translateY(0); }
                    100% { opacity: 0; transform: translateY(-10px); }
                }
                @keyframes fade-down {
                    0% { opacity: 1; transform: translateY(0); }
                    100% { opacity: 0; transform: translateY(10px); }
                }
                .animate-fade-up { animation: fade-up 0.5s ease-out forwards; }
                .animate-fade-down { animation: fade-down 0.5s ease-out forwards; }
                `}
            </style>
            <UsersIcon />
            <span className="font-semibold tabular-nums">{count}</span>
            {change !== null && (
                <span className={`absolute right-0 text-xs font-bold ${changeClass}`}>
                    {change > 0 ? `+${change}` : change}
                </span>
            )}
            <span className="hidden sm:inline">Online</span>
        </div>
    );
};

export default LiveUserCounter;
