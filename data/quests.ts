
import { Quest } from '../types';

export const DAILY_QUESTS: Quest[] = [
    {
        id: 'SEND_5_MESSAGES',
        title: 'Chatterbox',
        description: 'Send 5 messages to the AI.',
        goal: 5,
        action: 'sendMessage',
        reward: { type: 'xp', amount: 25 },
    },
    {
        id: 'GENERATE_1_IMAGE',
        title: 'Budding Artist',
        description: 'Generate 1 image using the AI.',
        goal: 1,
        action: 'generateImage',
        reward: { type: 'xp', amount: 20 },
    },
    {
        id: 'SUPPORT_10_CLICKS',
        title: 'Show Some Love',
        description: 'Use the Support Heart 10 times.',
        goal: 10,
        action: 'supportClick',
        reward: { type: 'gems', amount: 50 },
    },
    {
        id: 'SEND_20_MESSAGES',
        title: 'Conversationalist',
        description: 'Send 20 messages to the AI.',
        goal: 20,
        action: 'sendMessage',
        reward: { type: 'gems', amount: 100 },
    }
];
