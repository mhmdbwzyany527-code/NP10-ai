
import React, { useState, useCallback } from 'react';
import { HeartIcon } from './Icons';

interface SupportHeartProps {
    level: number;
    clicks: number;
    onClick: () => void;
}

const SupportHeart: React.FC<SupportHeartProps> = ({ level, clicks, onClick }) => {
    const [particles, setParticles] = useState<{ id: number; x: number; y: number; }[]>([]);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        onClick();
        
        // Particle effect
        const rect = e.currentTarget.getBoundingClientRect();
        const newParticles = Array.from({ length: 5 }).map((_, i) => ({
            id: Date.now() + i,
            x: (Math.random() - 0.5) * 80, // Spread horizontally
            y: (Math.random() * -80) - 20, // Spread upwards
        }));
        setParticles(prev => [...prev, ...newParticles]);

        // Clean up particles after animation
        setTimeout(() => {
            setParticles([]);
        }, 800);
    };

    return (
        <div className="relative group flex-shrink-0">
            <button
                onClick={handleClick}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-pink-100 dark:bg-pink-900/50 text-pink-500 dark:text-pink-400 hover:bg-pink-200 dark:hover:bg-pink-800/70 transition-all duration-200 hover:scale-110 active:scale-95"
                aria-label="Support the AI"
            >
                <HeartIcon />
                {particles.map(p => (
                    <div 
                        key={p.id}
                        className="heart-particle text-pink-500" 
                        style={{ transform: `translate(${p.x}px, ${p.y}px) rotate(${Math.random() * 360}deg)` }}
                    >
                        <HeartIcon />
                    </div>
                ))}
            </button>
             <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-3 py-1.5 bg-gray-800 text-white text-xs font-semibold rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Support Level: {level} ({clicks} clicks)
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800"></div>
            </div>
        </div>
    );
};

export default SupportHeart;
