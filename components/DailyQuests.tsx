
import React from 'react';
import { UserProfile, Quest } from '../types';
import { TargetIcon, CheckIcon, GemIcon } from './Icons';

interface DailyQuestsProps {
    quests: Quest[];
    userProfile: UserProfile;
    onClaim: (questId: string) => void;
}

const DailyQuests: React.FC<DailyQuestsProps> = ({ quests, userProfile, onClaim }) => {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-center mb-4">Daily Quests</h3>
            {quests.map(quest => {
                const userQuest = userProfile.quests[quest.id] || { progress: 0 };
                const isComplete = userQuest.progress >= quest.goal;
                const isClaimed = !!userQuest.completedAt;
                const progressPercent = Math.min((userQuest.progress / quest.goal) * 100, 100);

                return (
                    <div key={quest.id} className={`p-4 rounded-lg border flex flex-col sm:flex-row items-center gap-4 ${isClaimed ? 'bg-green-500/10 border-green-500/20 opacity-70' : 'bg-gray-50 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700'}`}>
                        <div className={`p-2 rounded-full ${isComplete ? 'text-indigo-500' : 'text-gray-400 dark:text-slate-500'}`}>
                            <TargetIcon />
                        </div>
                        <div className="flex-1 text-center sm:text-left">
                            <p className="font-semibold text-gray-800 dark:text-gray-200">{quest.title}</p>
                            <p className="text-xs text-gray-500">{quest.description}</p>
                            <div className="mt-2 w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                                <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${progressPercent}%` }}></div>
                            </div>
                        </div>
                        <div className="flex-shrink-0 w-full sm:w-auto">
                            {isClaimed ? (
                                <button disabled className="w-full sm:w-auto flex items-center justify-center gap-1.5 text-sm px-4 py-2 rounded-md bg-gray-500 text-white cursor-default">
                                    <CheckIcon /> Claimed
                                </button>
                            ) : (
                                <button
                                    onClick={() => onClaim(quest.id)}
                                    disabled={!isComplete}
                                    className="w-full sm:w-auto text-sm px-4 py-2 rounded-md bg-yellow-500 text-white hover:bg-yellow-400 transition-colors disabled:bg-slate-600 disabled:text-gray-400 disabled:cursor-not-allowed"
                                >
                                    Claim <span className="font-bold ml-1">+{quest.reward.amount}</span> {quest.reward.type === 'gems' ? <GemIcon /> : 'XP'}
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default DailyQuests;
