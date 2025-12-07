
import React, { useState } from 'react';
import { XIcon, GemIcon, BlueDiamondIcon, CheckIcon } from './Icons';
import { UserProfile } from '../types';

interface XpBoost {
    id: string;
    xp: number;
    cost: number;
    currency: 'gems' | 'diamonds';
    title: string;
}

const xpBoosts: XpBoost[] = [
    { id: 'XP50_BOOST', xp: 50, cost: 500, currency: 'gems', title: 'XP50' },
    { id: 'XP100_BOOST', xp: 100, cost: 900, currency: 'gems', title: 'XP100' },
    { id: 'XP500_BOOST', xp: 500, cost: 20, currency: 'diamonds', title: 'XP500' },
    { id: 'XP1000_BOOST', xp: 1000, cost: 35, currency: 'diamonds', title: 'XP1000' },
];

interface AppStoreModalProps {
    isOpen: boolean;
    onClose: () => void;
    userProfile: UserProfile;
    onBuyXpBoost: (boost: XpBoost) => void;
}

const AppStoreModal: React.FC<AppStoreModalProps> = ({ isOpen, onClose, userProfile, onBuyXpBoost }) => {
    const [activeTab, setActiveTab] = useState<'boosts'>('boosts');

    if (!isOpen) return null;

    const TabButton: React.FC<{ tabId: any, children: React.ReactNode }> = ({ tabId, children }) => (
        <button onClick={() => setActiveTab(tabId)} className={`px-4 py-2 text-sm font-medium rounded-t-lg ${activeTab === tabId ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>
           {children}
       </button>
   );

    const renderBoosts = () => {
        return (
            <div>
                <h3 className="text-xl font-bold text-center mb-2 text-gray-800 dark:text-gray-200">Rank Up Rewards</h3>
                <p className="text-sm text-gray-500 text-center mb-6">Purchase a one-time XP boost to level up faster.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {xpBoosts.map(boost => {
                        const isClaimed = userProfile.claimedXpBoosts && userProfile.claimedXpBoosts[boost.id];
                        const canAfford = boost.currency === 'gems' ? userProfile.gems >= boost.cost : userProfile.diamonds >= boost.cost;

                        return (
                            <div key={boost.id} className="flex flex-col gap-4">
                                <div className="xp-reward-card">
                                    <h3 className="xp-reward-card-title !text-5xl !font-black">{boost.title}</h3>
                                    <p className="xp-reward-card-subtitle !mt-1">RANK UP REWARD</p>
                                </div>
                                <div className="text-center">
                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        {boost.currency === 'gems' ? <GemIcon /> : <BlueDiamondIcon />}
                                        <span className="font-bold text-lg text-gray-800 dark:text-gray-200">{boost.cost}</span>
                                    </div>
                                    {isClaimed ? (
                                        <button disabled className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-md bg-green-600/80 text-white cursor-default text-sm font-semibold">
                                            <CheckIcon /> Purchased
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => onBuyXpBoost(boost)}
                                            disabled={!canAfford}
                                            className="w-full px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-500 transition-colors disabled:bg-slate-600 disabled:text-gray-400 disabled:cursor-not-allowed text-sm font-semibold"
                                        >
                                            Purchase
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 transition-opacity" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col border border-gray-200 dark:border-slate-700 m-4" onClick={(e) => e.stopPropagation()}>
                <header className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-slate-700 flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">App Store</h2>
                        <p className="text-sm text-gray-500">Quests, rewards, and special items!</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-sky-400/10 border border-sky-400/20 rounded-full">
                            <BlueDiamondIcon />
                            <span className="font-bold text-sky-400">{userProfile.diamonds}</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-400/10 border border-yellow-400/20 rounded-full">
                            <GemIcon />
                            <span className="font-bold text-yellow-500">{userProfile.gems}</span>
                        </div>
                        <button onClick={onClose} className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700">
                            <XIcon />
                        </button>
                    </div>
                </header>
                <main className="flex-1 p-6 overflow-y-auto">
                    <div className="flex-shrink-0 mb-4 border-b border-gray-200 dark:border-slate-700">
                        <nav className="flex space-x-4 -mb-px">
                            <TabButton tabId="boosts">Boosts</TabButton>
                            {/* Future tabs can be added here */}
                        </nav>
                    </div>
                    <div className="flex-1">
                        {activeTab === 'boosts' && renderBoosts()}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AppStoreModal;
