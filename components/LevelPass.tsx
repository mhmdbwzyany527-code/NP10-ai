
import React from 'react';
import { UserProfile } from '../types';
import { LEVEL_PASS_REWARDS, LevelPassReward } from '../data/levelPass';
import { GemIcon, BlueDiamondIcon, CheckIcon, BrushIcon } from './Icons';

interface LevelPassProps {
    userProfile: UserProfile;
    onClaim: (rewardIndex: number) => void;
}

const LevelPass: React.FC<LevelPassProps> = ({ userProfile, onClaim }) => {
    const totalXp = userProfile.totalXp || 0;
    const maxPassXp = LEVEL_PASS_REWARDS[LEVEL_PASS_REWARDS.length - 1].requiredXp;
    const progressPercent = Math.min((totalXp / maxPassXp) * 100, 100);

    const getRewardIcon = (reward: LevelPassReward['reward']) => {
        if (reward.type === 'gems') return <GemIcon />;
        if (reward.type === 'diamonds') return <BlueDiamondIcon />;
        if (reward.type === 'color') return <BrushIcon />;
        if (reward.type === 'accessory' || reward.type === 'bundle') return <span className="text-xl">🎁</span>;
        return null;
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-center mb-4">LVL BASS</h3>
            <div className="relative w-full h-8 bg-gray-200 dark:bg-slate-700 rounded-full p-1 shadow-inner">
                <div className="absolute top-1 left-1 bottom-1 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full" style={{ width: `calc(${progressPercent}% - 8px)` }}></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-bold text-sm text-white drop-shadow-md">{totalXp} / {maxPassXp} XP</span>
                </div>
            </div>

            <div className="space-y-3 max-h-[22rem] overflow-y-auto pr-2">
                {LEVEL_PASS_REWARDS.map((item, index) => {
                    const isUnlocked = totalXp >= item.requiredXp;
                    const isClaimed = userProfile.claimedPassRewards?.includes(index);

                    return (
                        <div key={index} className={`flex items-center gap-4 p-3 rounded-lg border transition-all ${isClaimed ? 'bg-green-500/10 border-green-500/20 opacity-70' : isUnlocked ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-gray-50 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700'}`}>
                            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold ${isUnlocked || isClaimed ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-500' : 'bg-gray-200 dark:bg-slate-700 text-gray-500'}`}>
                                {getRewardIcon(item.reward)}
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-gray-800 dark:text-gray-200">{item.reward.name}</p>
                                <p className="text-xs text-gray-500">Requires {item.requiredXp} XP</p>
                            </div>
                            <div className="w-28 text-right">
                                {isClaimed ? (
                                    <button disabled className="flex items-center justify-center gap-1 text-sm font-semibold text-green-600">
                                        <CheckIcon /> Claimed
                                    </button>
                                ) : isUnlocked ? (
                                    <button onClick={() => onClaim(index)} className="px-4 py-1.5 text-sm rounded-md bg-yellow-500 text-white hover:bg-yellow-400">
                                        Claim
                                    </button>
                                ) : (
                                    <span className="text-xs text-gray-500">Locked</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default LevelPass;
