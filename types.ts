
export enum Sender {
  User = 'user',
  AI = 'ai',
}

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  /** For AI-generated image */
  image?: string;
  /** For AI-generated video */
  video?: string;
  /** For user-uploaded images */
  images?: string[];
  isLoadingImage?: boolean;
  /** Generic loading state for long processes like video generation */
  isLoading?: boolean;
  /** For the new Canvas feature */
  isLoadingCanvas?: boolean;
  canvasCode?: string;
  loadingText?: string;
  isError?: boolean;
  sources?: { title: string; uri: string }[]; // For Search Grounding
  suggestions?: string[]; // For Smart Replies
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  titleGenerated?: boolean;
  summary?: string; // For Summarization
  summaryLoading?: boolean; // To show loading state for summary
}

export interface Achievement {
    id: string;
    name: string;
    description: string;
    reward: { type: 'gems' | 'color' | 'accessory'; amount?: number; itemId?: string };
    criteria: (profile: UserProfile, conversations: Conversation[]) => boolean;
}

export interface QuestReward {
    type: 'gems' | 'xp';
    amount: number;
}

export interface Quest {
    id: string;
    title: string;
    description: string;
    goal: number;
    reward: QuestReward;
    action: 'sendMessage' | 'generateImage' | 'useVoice' | 'supportClick';
}

export interface UserProfile {
  pictureUrl: string | null;
  gems: number;
  diamonds: number; // New premium currency
  purchasedItems: string[]; // e.g., ['color-gold', 'accessory-hat']
  lastGemClaim?: number; // Timestamp of the last claim
  level: number;
  xp: number;
  claimedLevelRewards: number[]; // e.g., [2, 3] for claimed rewards for level 2 and 3
  achievements: { [id: string]: number }; // id: timestamp of unlock
  dailyStreak: number;
  lastLoginDate: string; // YYYY-MM-DD

  // New gamification features
  supportLevel: number;
  supportClicks: number;
  quests: { [id: string]: { progress: number; completedAt?: number } }; // questId: { progress, completed_timestamp }
  lastQuestReset: string; // YYYY-MM-DD
  
  // New fields for Level Pass
  totalXp: number;
  claimedPassRewards: number[]; // Array of reward indices
  claimedXpBoosts?: { [id: string]: number }; // id: timestamp
}

export interface RobotCustomization {
  equippedColor: string; // e.g., 'gold'
  equippedAccessory: string | null; // e.g., 'hat'
}
