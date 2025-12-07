
export interface LevelPassReward {
    requiredXp: number;
    reward: {
        type: 'gems' | 'diamonds' | 'color' | 'accessory' | 'bundle';
        name: string;
        amount?: number;
        id?: string;
    };
}

export const LEVEL_PASS_REWARDS: LevelPassReward[] = [
    { requiredXp: 100, reward: { type: 'gems', name: 'Small Gem Pouch', amount: 50 } },
    { requiredXp: 250, reward: { type: 'color', name: 'Ice Color', id: 'color-ice' } },
    { requiredXp: 500, reward: { type: 'gems', name: 'Gem Stash', amount: 150 } },
    { requiredXp: 750, reward: { type: 'accessory', name: 'Scarf', id: 'accessory-scarf' } },
    { requiredXp: 1000, reward: { type: 'diamonds', name: 'Shiny Diamond', amount: 5 } },
    { requiredXp: 1500, reward: { type: 'gems', name: 'Large Gem Pouch', amount: 300 } },
    { requiredXp: 2000, reward: { type: 'color', name: 'Rose Color', id: 'color-rose' } },
    { requiredXp: 2500, reward: { type: 'accessory', name: 'Goggles', id: 'accessory-goggles' } },
    { requiredXp: 3500, reward: { type: 'gems', name: 'Gem Hoard', amount: 500 } },
    { requiredXp: 5000, reward: { type: 'bundle', name: 'Pass Champion', id: 'pass-champion' } },
];
