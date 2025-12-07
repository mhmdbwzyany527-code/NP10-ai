
// Define Level Rewards
export const LEVEL_REWARDS: { [level: number]: { type: string; name: string; amount?: number; id?: string } } = {
    2: { type: 'gems', name: 'Bonus Gems', amount: 100 },
    3: { type: 'color', name: 'Graphite Color', id: 'color-graphite' },
    4: { type: 'gems', name: 'Bonus Gems', amount: 200 },
    5: { type: 'accessory', name: 'Bow Tie', id: 'accessory-bow-tie' },
    6: { type: 'gems', name: 'Bonus Gems', amount: 300 },
    7: { type: 'color', name: 'Indigo Color', id: 'color-indigo' },
    8: { type: 'gems', name: 'Bonus Gems', amount: 400 },
    9: { type: 'accessory', name: 'Sunglasses', id: 'accessory-sunglasses' },
    10: { type: 'bundle', name: 'Decade Prize!', id: 'decade-prize' }, // 500 gems + Ocean Color
    11: { type: 'gems', name: 'Bonus Gems', amount: 600 },
    12: { type: 'accessory', name: 'Top Hat', id: 'accessory-top-hat' },
    13: { type: 'gems', name: 'Bonus Gems', amount: 750 },
    14: { type: 'accessory', name: 'Propeller Hat', id: 'accessory-propeller-hat' },
    15: { type: 'bundle', name: 'Grand Prize!', id: 'grand-prize' }, // 1000 gems + Cosmic Color
    16: { type: 'gems', name: 'Bonus Gems', amount: 1200 },
    17: { type: 'color', name: 'Rose Color', id: 'color-rose' },
    18: { type: 'gems', name: 'Bonus Gems', amount: 1500 },
    19: { type: 'diamonds', name: 'Premium Diamonds', amount: 10 },
    20: { type: 'bundle', name: 'Ultimate Reward', id: 'ultimate-reward' }, // 2000 gems + Crown
    21: { type: 'diamonds', name: 'Premium Diamonds', amount: 20 },
    22: { type: 'gems', name: 'Bonus Gems', amount: 2000 },
    23: { type: 'bundle', name: 'Abdelhak\'s Pick', id: 'abdelhak-pick'},
    24: { type: 'gems', name: 'Bonus Gems', amount: 2500 },
    25: { type: 'bundle', name: 'Abdeljabbar\'s Pick', id: 'abdeljabbar-pick'},
};

// For composite rewards
export const REWARD_BUNDLES: { [id: string]: { gems?: number; diamonds?: number; items?: string[] } } = {
    'decade-prize': { gems: 500, items: ['color-ocean'] },
    'grand-prize': { gems: 1000, items: ['color-cosmic'] },
    'ultimate-reward': { gems: 2000, items: ['accessory-crown'] },
    'abdelhak-pick': { gems: 500, items: ['color-deep-purple', 'accessory-monocle'] },
    'abdeljabbar-pick': { gems: 500, items: ['color-cyber-green', 'accessory-visor'] },
    'pass-champion': { diamonds: 25, items: ['accessory-earmuffs'] }, // New bundle for level pass
};
