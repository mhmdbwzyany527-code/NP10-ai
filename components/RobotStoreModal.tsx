
import React, { useState, useEffect } from 'react';
import { XIcon, GemIcon, CheckIcon, TopHatAccessory, SunglassesAccessory, BowTieAccessory, PropellerHatAccessory, BlueDiamondIcon, CrownAccessory, GoldenMonocleAccessory, HolographicVisorAccessory, SecurityVisorAccessory, ShoulderBeaconAccessory, ModeratorBadgeAccessory, AntennaeAccessory, GogglesAccessory, EarMuffsAccessory, ScarfAccessory } from './Icons';
import { UserProfile, RobotCustomization } from '../types';

interface RobotStoreModalProps {
    isOpen: boolean;
    onClose: () => void;
    userProfile: UserProfile;
    customization: RobotCustomization;
    onBuyItem: (itemId: string, cost: number, currency: 'gems' | 'diamonds') => void;
    onEquipItem: (itemId: string, itemType: 'color' | 'accessory') => void;
}

// FIX: Export storeItems to be used in other components like App.tsx
export const storeItems = {
  colors: [
    { id: 'color-default', name: 'Default', price: 0, value: '#f3f4f6', description: 'Classic and clean.' },
    { id: 'color-ice', name: 'Ice', price: 10, value: 'linear-gradient(135deg, #e0f2fe, #a5f3fc)', description: 'A cool, frosty look.' },
    { id: 'color-graphite', name: 'Graphite', price: 100, value: '#374151', description: 'Sleek and professional.' },
    { id: 'color-gold', name: 'Gold', price: 500, value: '#fBBF24', description: 'Luxurious and bold.' },
    { id: 'color-indigo', name: 'Indigo', price: 250, value: '#6366f1', description: 'Vibrant and creative.' },
    { id: 'color-rose', name: 'Rose', price: 250, value: '#f43f5e', description: 'Playful and energetic.' },
    { id: 'color-ocean', name: 'Ocean', price: 350, value: '#14b8a6', description: 'Calm and refreshing.' },
    { id: 'color-cosmic', name: 'Cosmic', price: 1000, value: 'linear-gradient(135deg, #4f46e5, #c026d3)', description: 'A glimpse into the void.' },
    { id: 'color-deep-purple', name: 'Deep Purple', price: 750, value: '#581c87', description: 'From Abdelhak\'s Collection.', featuredIn: 'abdelhak' },
    { id: 'color-cyber-green', name: 'Cyber Green', price: 750, value: '#65a30d', description: 'From Abdeljabbar\'s Collection.', featuredIn: 'abdeljabbar' },
    { id: 'color-holographic', name: 'Holographic Blue', price: 20, value: 'linear-gradient(135deg, #0ea5e9, #6366f1)', description: 'A futuristic sheen.', currency: 'diamonds' },
    { id: 'color-moderator-red', name: 'Moderator Red', price: 600, value: '#ef4444', description: 'Enforce the rules in style.', featuredIn: 'moderator' },
    { id: 'color-stealth-black', name: 'Stealth Black', price: 600, value: '#111827', description: 'For covert operations.', featuredIn: 'moderator' },
  ],
  accessories: [
    { id: 'accessory-none', name: 'None', price: 0, Icon: null, description: 'Au naturel.' },
    { id: 'accessory-top-hat', name: 'Top Hat', price: 300, Icon: TopHatAccessory, description: 'For a distinguished bot.' },
    { id: 'accessory-sunglasses', name: 'Sunglasses', price: 200, Icon: SunglassesAccessory, description: 'Stay cool under pressure.' },
    { id: 'accessory-bow-tie', name: 'Bow Tie', price: 150, Icon: BowTieAccessory, description: 'Bow ties are cool.' },
    { id: 'accessory-propeller-hat', name: 'Propeller Hat', price: 400, Icon: PropellerHatAccessory, description: 'Ready for takeoff!' },
    { id: 'accessory-crown', name: 'Crown', price: 50, Icon: CrownAccessory, description: 'For the true AI royalty.', currency: 'diamonds' },
    { id: 'accessory-monocle', name: 'Golden Monocle', price: 600, Icon: GoldenMonocleAccessory, description: 'See the world wisely.', featuredIn: 'abdelhak' },
    { id: 'accessory-visor', name: 'Holographic Visor', price: 600, Icon: HolographicVisorAccessory, description: 'Future-proof your vision.', featuredIn: 'abdeljabbar' },
    { id: 'accessory-earmuffs', name: 'Ear Muffs', price: 250, Icon: EarMuffsAccessory, description: 'Block out the noise.' },
    { id: 'accessory-goggles', name: 'Goggles', price: 350, Icon: GogglesAccessory, description: 'For hazardous chats.' },
    { id: 'accessory-scarf', name: 'Scarf', price: 150, Icon: ScarfAccessory, description: 'Cozy and stylish.' },
    { id: 'accessory-antennae', name: 'Antennae', price: 400, Icon: AntennaeAccessory, description: 'Enhanced signal reception.' },
    { id: 'accessory-security-visor', name: 'Security Visor', price: 500, Icon: SecurityVisorAccessory, description: 'Identify rule-breakers.', featuredIn: 'moderator' },
    { id: 'accessory-shoulder-beacon', name: 'Shoulder Beacon', price: 500, Icon: ShoulderBeaconAccessory, description: 'A warning light.', featuredIn: 'moderator' },
    { id: 'accessory-moderator-badge', name: 'Moderator Badge', price: 500, Icon: ModeratorBadgeAccessory, description: 'Official business.', featuredIn: 'moderator' },
  ],
};

const RobotPreview: React.FC<{ color: string, accessory: string | null }> = ({ color, accessory }) => {
    const AccessoryComponent = accessory ? {
        'top-hat': TopHatAccessory,
        'sunglasses': SunglassesAccessory,
        'bow-tie': BowTieAccessory,
        'propeller-hat': PropellerHatAccessory,
        'crown': CrownAccessory,
        'monocle': GoldenMonocleAccessory,
        'visor': HolographicVisorAccessory,
        'security-visor': SecurityVisorAccessory,
        'shoulder-beacon': ShoulderBeaconAccessory,
        'moderator-badge': ModeratorBadgeAccessory,
        'antennae': AntennaeAccessory,
        'goggles': GogglesAccessory,
        'earmuffs': EarMuffsAccessory,
        'scarf': ScarfAccessory,
    }[accessory] : null;

    const isGradient = color.includes('gradient');
    let fillValue = color;
    // FIX: Removed unused backgroundStyle variable which caused a type error.
    if (isGradient) {
        fillValue = `url(#${color.substring(color.indexOf('(') + 1, color.indexOf(','))}-gradient)`;
    }

    return (
        <div className="w-40 h-40 mx-auto">
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="cosmic-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{stopColor: '#4f46e5'}} />
                        <stop offset="100%" style={{stopColor: '#c026d3'}} />
                    </linearGradient>
                    <linearGradient id="ice-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{stopColor: '#e0f2fe'}} />
                        <stop offset="100%" style={{stopColor: '#a5f3fc'}} />
                    </linearGradient>
                     <linearGradient id="holographic-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{stopColor: '#0ea5e9'}} />
                        <stop offset="100%" style={{stopColor: '#6366f1'}} />
                    </linearGradient>
                </defs>
                <rect x="30" y="15" width="40" height="30" rx="8" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="2" />
                <circle cx="42" cy="30" r="5" fill="#3b82f6" />
                <circle cx="58" cy="30" r="5" fill="#3b82f6" />
                <rect x="25" y="45" width="50" height="40" rx="10" fill={fillValue} stroke="#9ca3af" strokeWidth="2" className="transition-colors duration-200" />
                <rect x="40" y="55" width="20" height="15" rx="3" fill="#d1d5db" />
                {AccessoryComponent && <g className="text-slate-800">{AccessoryComponent()}</g>}
            </svg>
        </div>
    );
};

const RobotStoreModal: React.FC<RobotStoreModalProps> = ({ isOpen, onClose, userProfile, customization, onBuyItem, onEquipItem }) => {
    const [activeTab, setActiveTab] = useState<'colors' | 'accessories' | 'featured_stores'>('colors');
    const [feedback, setFeedback] = useState<{message: string, type: 'success' | 'error'} | null>(null);

    const showFeedback = (message: string, type: 'success' | 'error' = 'success') => {
        setFeedback({ message, type });
        setTimeout(() => setFeedback(null), 3000);
    };

    if (!isOpen) return null;

    const isPurchased = (id: string) => userProfile.purchasedItems.includes(id);

    const isEquipped = (id: string, type: 'color' | 'accessory') => {
        const name = id.split('-')[1];
        if (type === 'color') return customization.equippedColor === name;
        if (type === 'accessory') return customization.equippedAccessory === (name === 'none' ? null : name);
        return false;
    };

    const handleBuy = (item: { id: string, price: number, name: string, currency?: 'gems' | 'diamonds' }) => {
        onBuyItem(item.id, item.price, item.currency || 'gems');
        showFeedback(`${item.name} purchased!`);
    };

    const handleEquip = (item: { id: string, name: string }, type: 'color' | 'accessory') => {
        onEquipItem(item.id, type);
        showFeedback(`${item.name} equipped!`);
    };
    
    const renderItemButton = (item: { id: string, price: number, name: string, currency?: 'gems' | 'diamonds' }, type: 'color' | 'accessory') => {
        const purchased = isPurchased(item.id);
        const equipped = isEquipped(item.id, type);

        if (equipped) {
            return <button disabled className="w-full flex items-center justify-center gap-1.5 text-sm px-3 py-1.5 rounded-md bg-green-600/80 text-white cursor-default"><CheckIcon /> Equipped</button>;
        }
        if (purchased) {
            return <button onClick={() => handleEquip(item, type)} className="w-full text-sm px-3 py-1.5 rounded-md bg-indigo-600 text-white hover:bg-indigo-500 transition-colors">Equip</button>;
        }
        
        const currency = item.currency || 'gems';
        const canAfford = currency === 'gems' 
            ? userProfile.gems >= item.price 
            : userProfile.diamonds >= item.price;

        return (
            <button 
                onClick={() => handleBuy(item)} 
                disabled={!canAfford}
                className="w-full text-sm px-3 py-1.5 rounded-md bg-slate-600 text-white hover:bg-slate-500 transition-colors disabled:bg-slate-700 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
                Buy
            </button>
        );
    };

    const ItemCard: React.FC<{ item: any, type: 'color' | 'accessory', children: React.ReactNode }> = ({ item, type, children }) => {
        return (
            <div className="relative p-3 border border-gray-200 dark:border-slate-700 rounded-lg flex flex-col items-center justify-between gap-2 bg-gray-50 dark:bg-slate-800/50 transition-transform hover:scale-[1.03]">
                {children}
                <div className="text-center w-full">
                    <p className="text-sm font-semibold">{item.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 h-8">{item.description}</p>
                    {!isPurchased(item.id) && item.price > 0 && (
                        <div className="flex items-center justify-center gap-1 text-xs mt-1">
                            {item.currency === 'diamonds' ? <BlueDiamondIcon /> : <GemIcon />}
                            <span className={item.currency === 'diamonds' ? 'text-sky-400' : 'text-yellow-500'}>{item.price}</span>
                        </div>
                    )}
                </div>
                <div className="w-full mt-auto pt-2">
                    {renderItemButton(item, type)}
                </div>
            </div>
        );
    };
    
    const TabButton: React.FC<{ tabId: any, children: React.ReactNode }> = ({ tabId, children }) => (
         <button onClick={() => setActiveTab(tabId)} className={`px-3 py-2 text-sm font-medium rounded-t-lg ${activeTab === tabId ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>
            {children}
        </button>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 transition-opacity" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-gray-200 dark:border-slate-700 m-4" onClick={(e) => e.stopPropagation()}>
                <header className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-slate-700 flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Robot Customization</h2>
                        <p className="text-sm text-gray-500">Personalize your AI assistant!</p>
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
                
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                    <aside className="w-full md:w-1/3 flex flex-col p-4 bg-gray-100 dark:bg-slate-900/50 border-b md:border-b-0 md:border-r border-gray-200 dark:border-slate-700/50">
                        <h3 className="font-semibold text-center text-lg mb-2">Your Robot</h3>
                        <RobotPreview color={storeItems.colors.find(c => c.id.endsWith(customization.equippedColor))?.value || '#f3f4f6'} accessory={customization.equippedAccessory} />
                    </aside>

                    <main className="flex-1 flex flex-col p-6 overflow-y-auto">
                        <div className="flex-shrink-0 mb-4 border-b border-gray-200 dark:border-slate-700">
                            <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto -mb-px">
                               <TabButton tabId="colors">Colors</TabButton>
                               <TabButton tabId="accessories">Accessories</TabButton>
                               <TabButton tabId="featured_stores">Featured</TabButton>
                            </nav>
                        </div>
                        <div className="flex-1">
                            {activeTab === 'colors' && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {storeItems.colors.filter(c => !(c as any).featuredIn).map(color => (
                                        <ItemCard key={color.id} item={color} type="color">
                                            <div className="w-16 h-16 rounded-full" style={{ background: color.value, border: '3px solid rgba(128,128,128,0.2)' }}></div>
                                        </ItemCard>
                                    ))}
                                </div>
                            )}
                            {activeTab === 'accessories' && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {storeItems.accessories.filter(a => !(a as any).featuredIn).map(acc => (
                                        <ItemCard key={acc.id} item={acc} type="accessory">
                                                <div className="w-16 h-16 flex items-center justify-center text-slate-600 dark:text-slate-400">
                                                {acc.Icon ? <div className="scale-[2]"><acc.Icon /></div> : <div className="text-sm text-gray-400">None</div>}
                                            </div>
                                        </ItemCard>
                                    ))}
                                </div>
                            )}
                            {activeTab === 'featured_stores' && (
                                <div className="space-y-8">
                                    <div>
                                        <h3 className="text-xl font-bold text-center mb-4 text-gray-800 dark:text-gray-200" dir="rtl">متجر روبوتات الحظر</h3>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                            {storeItems.colors.filter(c => (c as any).featuredIn === 'moderator').map(color => (
                                                <ItemCard key={color.id} item={color} type="color">
                                                    <div className="w-16 h-16 rounded-full" style={{ background: color.value, border: '3px solid rgba(128,128,128,0.2)' }}></div>
                                                </ItemCard>
                                            ))}
                                            {storeItems.accessories.filter(a => (a as any).featuredIn === 'moderator').map(acc => (
                                                <ItemCard key={acc.id} item={acc} type="accessory">
                                                    <div className="w-16 h-16 flex items-center justify-center text-slate-600 dark:text-slate-400">
                                                        {acc.Icon ? <div className="scale-[2]"><acc.Icon /></div> : <div className="text-sm text-gray-400">None</div>}
                                                    </div>
                                                </ItemCard>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-center mb-4 text-gray-800 dark:text-gray-200" dir="rtl">متجر عبد الحق بوزياني</h3>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                            {storeItems.colors.filter(c => (c as any).featuredIn === 'abdelhak').map(color => (
                                                <ItemCard key={color.id} item={color} type="color">
                                                    <div className="w-16 h-16 rounded-full" style={{ background: color.value, border: '3px solid rgba(128,128,128,0.2)' }}></div>
                                                </ItemCard>
                                            ))}
                                            {storeItems.accessories.filter(a => (a as any).featuredIn === 'abdelhak').map(acc => (
                                                <ItemCard key={acc.id} item={acc} type="accessory">
                                                    <div className="w-16 h-16 flex items-center justify-center text-slate-600 dark:text-slate-400">
                                                        {acc.Icon ? <div className="scale-[2]"><acc.Icon /></div> : <div className="text-sm text-gray-400">None</div>}
                                                    </div>
                                                </ItemCard>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-center mb-4 text-gray-800 dark:text-gray-200" dir="rtl">متجر عبد الجبار بوزياني</h3>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                            {storeItems.colors.filter(c => (c as any).featuredIn === 'abdeljabbar').map(color => (
                                                <ItemCard key={color.id} item={color} type="color">
                                                    <div className="w-16 h-16 rounded-full" style={{ background: color.value, border: '3px solid rgba(128,128,128,0.2)' }}></div>
                                                </ItemCard>
                                            ))}
                                            {storeItems.accessories.filter(a => (a as any).featuredIn === 'abdeljabbar').map(acc => (
                                                <ItemCard key={acc.id} item={acc} type="accessory">
                                                    <div className="w-16 h-16 flex items-center justify-center text-slate-600 dark:text-slate-400">
                                                        {acc.Icon ? <div className="scale-[2]"><acc.Icon /></div> : <div className="text-sm text-gray-400">None</div>}
                                                    </div>
                                                </ItemCard>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </main>
                </div>

                 {feedback && <div className={`absolute bottom-4 right-4 text-white px-4 py-2 rounded-lg shadow-lg text-sm fade-in ${feedback.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>{feedback.message}</div>}
            </div>
        </div>
    );
};

export default RobotStoreModal;
