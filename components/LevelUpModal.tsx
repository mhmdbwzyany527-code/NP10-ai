
import React from 'react';
import { XIcon, GemIcon, SparklesIcon, TopHatAccessory, SunglassesAccessory, BowTieAccessory, PropellerHatAccessory, CrownAccessory } from './Icons';

interface LevelUpModalProps {
    isOpen: boolean;
    onClose: () => void;
    level: number;
    reward: { type: string; name: string; amount?: number; id?: string };
}

const accessoryIcons: { [key: string]: React.FC } = {
  'accessory-top-hat': TopHatAccessory,
  'accessory-sunglasses': SunglassesAccessory,
  'accessory-bow-tie': BowTieAccessory,
  'accessory-propeller-hat': PropellerHatAccessory,
  'accessory-crown': CrownAccessory,
};

const colorStyles: { [key: string]: string } = {
    'color-graphite': '#374151',
    'color-indigo': '#6366f1',
    'color-rose': '#f43f5e',
    'color-ocean': '#14b8a6',
    'color-cosmic': 'linear-gradient(135deg, #4f46e5, #c026d3)',
};

const RewardDisplay: React.FC<{ reward: LevelUpModalProps['reward'] }> = ({ reward }) => {
    switch (reward.type) {
        case 'gems':
            return (
                <div className="flex flex-col items-center gap-2">
                    <div className="scale-150"><GemIcon /></div>
                    <span className="text-lg font-bold text-yellow-400 mt-2">+{reward.amount} Gems</span>
                    <span className="text-sm text-gray-400">{reward.name}</span>
                </div>
            );
        case 'color':
            return (
                <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-full" style={{ background: colorStyles[reward.id!] || '#ccc' }}></div>
                    <span className="text-lg font-bold">{reward.name}</span>
                    <span className="text-sm text-gray-400">New Robot Color Unlocked!</span>
                </div>
            );
        case 'accessory':
            const Icon = accessoryIcons[reward.id!];
            return (
                 <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 flex items-center justify-center text-slate-400 scale-150">
                        {Icon && <Icon />}
                    </div>
                    <span className="text-lg font-bold">{reward.name}</span>
                    <span className="text-sm text-gray-400">New Robot Accessory Unlocked!</span>
                </div>
            );
        case 'bundle':
             return (
                <div className="flex flex-col items-center gap-2">
                     <div className="text-yellow-400"><SparklesIcon /></div>
                    <span className="text-lg font-bold">{reward.name}</span>
                    <span className="text-sm text-gray-400">Grand Prize Unlocked!</span>
                </div>
            )
        default:
            return null;
    }
};

const LevelUpModal: React.FC<LevelUpModalProps> = ({ isOpen, onClose, level, reward }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 transition-opacity" style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <div 
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm p-6 border border-indigo-500/30 m-4 text-center relative overflow-hidden transform-style-3d transition-transform duration-500 hover:rotate-y-3"
                style={{ animation: 'scaleIn 0.3s ease-out forwards', perspective: '1000px' }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-500 animate-glow"></div>
                <div className="text-yellow-400 inline-block"><SparklesIcon /></div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">Level Up!</h2>
                <p className="text-5xl font-bold my-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-indigo-500">{level}</p>
                <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm">
                    You've reached a new level! Here is your reward:
                </p>

                <div className="bg-gray-100 dark:bg-slate-900/50 rounded-lg p-6 my-4 min-h-[150px] flex items-center justify-center">
                   <RewardDisplay reward={reward} />
                </div>

                <button
                    onClick={onClose}
                    className="w-full mt-4 px-4 py-3 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 transition-colors flex items-center justify-center"
                >
                    Awesome!
                </button>
            </div>
        </div>
    );
};

export default LevelUpModal;
