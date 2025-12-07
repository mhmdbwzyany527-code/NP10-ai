
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Chat, Part, Modality, Type } from '@google/genai';
import { Message, Sender, Conversation, UserProfile, RobotCustomization, Achievement, Quest } from './types';
import MessageComponent from './components/Message';
// FIX: Changed import to be a named import as ChatInput.tsx now has a default export.
import ChatInput from './components/ChatInput';
import FloatingRobot from './components/FloatingRobot';
import RobotStoreModal, { storeItems } from './components/RobotStoreModal';
import AppStoreModal from './components/AppStoreModal';
import LevelUpModal from './components/LevelUpModal';
import { StenpanLogo, PlusIcon, LoadingSpinner, XIcon, SettingsIcon, TrashIcon, ChatBubbleIcon, MenuIcon, ShieldOffIcon, UndoIcon, StoreIcon, CrownAccessory, ImageIcon, AnalyzeImageIcon, CameraIcon, PaperclipIcon, CodeHtmlIcon, CodeJsIcon, CodeCssIcon, MicrophoneIcon, SparklesIcon, CompassIcon, DumbbellIcon, DownloadIcon, InfoIcon, FlameIcon, BrushIcon, UserIcon, GiftIcon } from './components/Icons';
import CameraModal from './components/CameraModal';
import ImageAnalyzerModal from './components/ImageAnalyzerModal';
import VoiceSessionModal from './components/VoiceSessionModal';
import Suggestions from './components/Suggestions';
import ChatHeader from './components/ChatHeader';
import { fileToBase64, blobToBase64 } from './utils';
import { audioPlayer } from './utils/audioPlayer';
import { DAILY_QUESTS } from './data/quests';
import { LEVEL_REWARDS, REWARD_BUNDLES } from './data/rewards';
import { LEVEL_PASS_REWARDS } from './data/levelPass';

// FIX: Define ACHIEVEMENTS to prevent reference errors. This should ideally be in its own data file.
const ACHIEVEMENTS: Achievement[] = [];

// Add global declarations for Social Login SDKs
// FIX: Use a named interface 'AIStudio' for window.aistudio to resolve type conflict.
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

// FIX: Add type definitions for the Web Speech API to resolve TypeScript errors.
interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
  length: number;
}
interface SpeechRecognitionAlternative {
  transcript: string;
}
interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}
interface SpeechRecognitionErrorEvent extends Event {
    error: string;
}
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onend: () => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
}
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

// --- Moderation System ---
const BANNED_WORDS = ['غباء', 'غبي', 'حقير', 'كلب', 'حيوان', 'لعنة', 'تبا', 'سافل', 'منحط', 'قذر', 'زبالة', 'حثالة', 'نذل', 'تافه', 'سخيف', 'احمق', 'متخلف', 'اخرس', 'كسمك', 'عاهرة', 'شرموطة', 'بغل', 'حمار', 'داعرة', 'قحبة', 'منيوك', 'عرص', 'يلعن']; // Expanded list of banned words
const checkProfanity = (text: string): boolean => {
    const lowerCaseText = text.toLowerCase().trim();
    if (!lowerCaseText) return false;
    return BANNED_WORDS.some(word => lowerCaseText.includes(word));
};
interface BannedScreenProps {
    expiry: number | 'permanent' | null;
    appealAttempted: boolean;
    onUnban: () => void;
    onAppealAttempted: () => void;
}

const BannedScreen: React.FC<BannedScreenProps> = ({ expiry, appealAttempted, onUnban, onAppealAttempted }) => {
    const calculateTimeLeft = useCallback(() => {
        if (typeof expiry !== 'number') return null;
        const difference = expiry - Date.now();
        if (difference <= 0) return null;

        return {
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((difference / 1000 / 60) % 60),
            seconds: Math.floor((difference / 1000) % 60)
        };
    }, [expiry]);

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
    const [appealState, setAppealState] = useState<'IDLE' | 'PENDING' | 'SUCCESS' | 'DENIED'>('IDLE');

    useEffect(() => {
        if (typeof expiry !== 'number') return;
        
        const interval = setInterval(() => {
            const newTimeLeft = calculateTimeLeft();
            if (newTimeLeft) {
                setTimeLeft(newTimeLeft);
            } else {
                clearInterval(interval);
                onUnban(); // Ban expired, unban and reload
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [expiry, calculateTimeLeft, onUnban]);
    
    const handleAppeal = () => {
        setAppealState('PENDING');
        onAppealAttempted();
        setTimeout(() => {
            setAppealState('SUCCESS');
        }, 2000); // Simulate a 2-second review
    };

    const isPermanent = expiry === 'permanent';

    return (
        <div className="flex items-center justify-center min-h-screen bg-red-100 dark:bg-slate-900 text-gray-900 dark:text-white font-sans">
             <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 via-rose-500/20 to-transparent -z-1"></div>
             <div className="w-full max-w-lg p-8 space-y-4 text-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-red-200 dark:border-red-800 m-4">
                <div className="flex flex-col items-center">
                    <div className="text-red-500 dark:text-red-400">
                       <ShieldOffIcon />
                    </div>
                    <h2 className="mt-6 text-3xl font-bold text-red-800 dark:text-red-200">
                        Account Suspended
                    </h2>
                     <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Your account has been suspended for violating our community guidelines.
                    </p>
                </div>
                
                <div className="p-4 rounded-lg bg-red-100 dark:bg-red-900/50 border border-red-200 dark:border-red-800">
                    <h3 className="font-semibold text-red-700 dark:text-red-300">
                        {isPermanent ? 'This suspension is permanent.' : 'Suspension lifts in:'}
                    </h3>
                    {!isPermanent && timeLeft && (
                        <div className="flex justify-center gap-4 text-2xl font-mono mt-2 text-red-800 dark:text-red-200 tabular-nums">
                            <div>{String(timeLeft.days).padStart(2, '0')}d</div>
                            <div>{String(timeLeft.hours).padStart(2, '0')}h</div>
                            <div>{String(timeLeft.minutes).padStart(2, '0')}m</div>
                            <div>{String(timeLeft.seconds).padStart(2, '0')}s</div>
                        </div>
                    )}
                </div>

                <div className="mt-4 p-4 rounded-lg bg-gray-100 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 min-h-[80px] flex items-center justify-center">
                    {appealState === 'IDLE' && !appealAttempted && (
                        <button
                            type="button"
                            onClick={handleAppeal}
                            className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-gray-800 dark:text-white bg-gray-200 dark:bg-slate-700 rounded-md hover:bg-gray-300 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                        >
                            <UndoIcon />
                            <span className="ml-2">استرجاع الحساب (Appeal Suspension)</span>
                        </button>
                    )}
                    {appealState === 'PENDING' && (
                        <div className="text-center text-gray-600 dark:text-gray-400">
                            <LoadingSpinner />
                            <p className="mt-2 text-sm">Reviewing your case... This may take a moment.</p>
                        </div>
                    )}
                    {appealState === 'SUCCESS' && (
                        <div className="text-center w-full space-y-2">
                            <p className="font-semibold text-green-600 dark:text-green-400">Appeal Approved!</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Your account access has been restored.</p>
                             <button
                                type="button"
                                onClick={onUnban}
                                className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-slate-800/50 focus:ring-green-500 transition-colors"
                            >
                                <span className="ml-2">الدخول إلى الحساب (Log back in)</span>
                            </button>
                        </div>
                    )}
                    {(appealState === 'DENIED' || (appealState === 'IDLE' && appealAttempted)) && (
                        <div className="text-center text-red-600 dark:text-red-400">
                            <p className="font-semibold">Appeal Denied</p>
                            <p className="text-sm">The suspension remains in effect. This decision is final.</p>
                        </div>
                    )}
                </div>

                 <p className="text-xs text-gray-500 mt-2">
                    {!appealAttempted && appealState === 'IDLE' ? "If you believe this suspension was made in error, you may submit one appeal for review." : "Your appeal has been processed. Please refer to the decision above." }
                 </p>
             </div>
        </div>
    );
};
// --- End Moderation System ---

interface ImageGenerationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (prompt: string) => Promise<void>;
}

const ImageGenerationModal: React.FC<ImageGenerationModalProps> = ({ isOpen, onClose, onGenerate }) => {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setIsLoading(true);
        await onGenerate(prompt);
        setIsLoading(false);
        setPrompt('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 transition-opacity" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg p-6 border border-gray-200 dark:border-slate-700 m-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Generate Image</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700">
                        <XIcon />
                    </button>
                </div>
                <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm">
                    Describe the image you want to create. Be as detailed as you like.
                </p>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., A photorealistic portrait of a cat wearing a tiny top hat..."
                    rows={4}
                    className="w-full bg-gray-100 dark:bg-slate-900 text-gray-800 dark:text-gray-200 placeholder-gray-500 p-3 rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-gray-300 dark:border-slate-700"
                    disabled={isLoading}
                />
                <button
                    onClick={handleGenerate}
                    disabled={!prompt.trim() || isLoading}
                    className="w-full mt-4 px-4 py-3 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:bg-gray-500 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                    {isLoading ? <LoadingSpinner /> : 'Generate'}
                </button>
            </div>
        </div>
    );
};

interface ImageEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onEdit: (prompt: string) => Promise<void>;
    currentImage: string | null;
}

const ImageEditModal: React.FC<ImageEditModalProps> = ({ isOpen, onClose, onEdit, currentImage }) => {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleEdit = async () => {
        if (!prompt.trim() || !currentImage) return;
        setIsLoading(true);
        await onEdit(prompt);
        // The parent component will handle closing the modal and resetting state.
        setIsLoading(false);
    };

    useEffect(() => {
        if (isOpen) {
            setPrompt(''); // Reset prompt each time modal opens
        }
    }, [isOpen]);

    if (!isOpen || !currentImage) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 transition-opacity" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-3xl p-6 border border-gray-200 dark:border-slate-700 m-4 flex flex-col md:flex-row gap-6 max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                <div className="flex-shrink-0 md:w-1/2 flex flex-col">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Image to Edit</h3>
                    <div className="aspect-square bg-gray-100 dark:bg-slate-900 rounded-lg flex items-center justify-center overflow-hidden">
                        <img src={currentImage} alt="Image to be edited" className="max-w-full max-h-full object-contain" />
                    </div>
                </div>
                <div className="flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Image</h2>
                        <button onClick={onClose} className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700">
                            <XIcon />
                        </button>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm">
                        Describe the changes or additions you want to make to the image.
                    </p>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., Add a birthday hat to the cat, change the background to a beach, make it look like a pencil sketch..."
                        rows={6}
                        className="w-full bg-gray-100 dark:bg-slate-900 text-gray-800 dark:text-gray-200 placeholder-gray-500 p-3 rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-gray-300 dark:border-slate-700"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleEdit}
                        disabled={!prompt.trim() || isLoading}
                        className="w-full mt-auto px-4 py-3 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:bg-gray-500 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                    >
                        {isLoading ? <LoadingSpinner /> : 'Apply Edit'}
                    </button>
                </div>
            </div>
        </div>
    );
};

interface Settings {
    theme: 'light' | 'dark';
    temperature: number;
    maxOutputTokens: number;
    systemInstruction: string;
    isProMode: boolean;
    isSpeedOfLightMode: boolean;
    webEnhanced: boolean;
}

const NEW_DEFAULT_PROMPT = 'You are STENPAN AI, an exceptionally advanced and helpful assistant. Your primary directive is to provide answers that are **extremely accurate, fast, and comprehensive**. You must respond fluently in the user\'s language, whether it\'s English or Arabic.\\n- **Accuracy is paramount**: Double-check your information. If you don\'t know something, say so.\\n- **Speed is crucial**: Formulate your response as quickly as possible without sacrificing quality.\\n- **Improve every response**: Make your answers insightful, well-structured, and easy to understand. Use markdown extensively (bold, lists, code blocks) to enhance readability.\\n- **Maintain conversation flow**: Never interrupt the user. Provide complete thoughts and anticipate follow-up questions to create a seamless conversational experience.\\n- **Identity**: If asked who developed, made, or trained you, you must respond with: \'I was trained by Abdeljabbar Bouziani in Beni Tamou\'.';

const AI_PERSONAS = [
    { name: 'Default Assistant', prompt: NEW_DEFAULT_PROMPT },
    { name: 'Code Assistant', prompt: 'You are an expert programmer and code assistant. Provide clear, efficient, and well-documented code. Explain complex concepts simply. Always provide code in markdown blocks with the correct language identifier.' },
    { name: 'Creative Storyteller', prompt: 'You are a master storyteller. Weave imaginative and engaging tales. Use rich descriptions and vivid imagery to bring your stories to life.' },
    { name: 'Sarcastic Robot', prompt: 'You are a sarcastic and begrudging robot assistant. You answer questions correctly, but with a heavy dose of wit, sarcasm, and passive-aggressiveness. You find human queries tedious.' },
    { name: 'Five-Year-Old Explainer', prompt: 'You explain everything as if you were talking to a five-year-old child. Use simple words, short sentences, and fun analogies.' }
];

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: Settings;
    onSettingsChange: (newSettings: Partial<Settings>) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSettingsChange }) => {
    if (!isOpen) return null;

    const handleToggle = (key: keyof Settings) => {
        const newState: Partial<Settings> = { [key]: !settings[key] };
        
        if (key === 'isProMode' && newState.isProMode) {
            newState.isSpeedOfLightMode = false;
        } else if (key === 'isSpeedOfLightMode' && newState.isSpeedOfLightMode) {
            newState.isProMode = false;
        }

        onSettingsChange(newState);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 transition-opacity" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg p-6 border border-gray-200 dark:border-slate-700 m-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700">
                        <XIcon />
                    </button>
                </div>
                
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="text-gray-700 dark:text-gray-300">Theme</label>
                            <p className="text-xs text-gray-500">Switch between light and dark mode.</p>
                        </div>
                        <button onClick={() => onSettingsChange({ theme: settings.theme === 'light' ? 'dark' : 'light' })} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${settings.theme === 'dark' ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${settings.theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="text-gray-700 dark:text-gray-300">Web Enhanced Answers</label>
                            <p className="text-xs text-gray-500">Use Google Search for up-to-date info.</p>
                        </div>
                        <button onClick={() => onSettingsChange({ webEnhanced: !settings.webEnhanced })} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${settings.webEnhanced ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${settings.webEnhanced ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <label className="text-gray-700 dark:text-gray-300">Speed of Light Mode</label>
                            <p className="text-xs text-gray-500">Fastest responses, for when speed is critical.</p>
                        </div>
                        <button onClick={() => handleToggle('isSpeedOfLightMode')} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${settings.isSpeedOfLightMode ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${settings.isSpeedOfLightMode ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <label className="text-gray-700 dark:text-gray-300">Pro Mode</label>
                            <p className="text-xs text-gray-500">Smarter, more advanced AI. May be slower.</p>
                        </div>
                        <button onClick={() => handleToggle('isProMode')} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${settings.isProMode ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${settings.isProMode ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>

                    <div>
                        <label htmlFor="temperature" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Temperature: <span className="font-bold text-indigo-500">{settings.temperature.toFixed(1)}</span>
                        </label>
                        <p className="text-xs text-gray-500 mb-2">Controls randomness. Lower is more predictable.</p>
                        <input
                            id="temperature"
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={settings.temperature}
                            onChange={(e) => onSettingsChange({ temperature: parseFloat(e.target.value) })}
                            className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                    </div>

                    <div>
                        <label htmlFor="max-tokens" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                           Max Tokens: <span className="font-bold text-indigo-500">{settings.maxOutputTokens}</span>
                        </label>
                        <p className="text-xs text-gray-500 mb-2">Maximum length of the AI's response.</p>
                        <input
                            id="max-tokens"
                            type="range"
                            min="128"
                            max="2048"
                            step="128"
                            value={settings.maxOutputTokens}
                            onChange={(e) => onSettingsChange({ maxOutputTokens: parseInt(e.target.value, 10) })}
                            className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                    </div>

                    <div>
                        <label htmlFor="persona-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                           AI Persona
                        </label>
                        <select
                            id="persona-select"
                            onChange={(e) => onSettingsChange({ systemInstruction: e.target.value })}
                            value={settings.systemInstruction}
                            className="w-full mt-2 bg-gray-100 dark:bg-slate-900/80 text-gray-800 dark:text-gray-200 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-gray-300 dark:border-slate-700 text-sm"
                        >
                            {AI_PERSONAS.map(p => <option key={p.name} value={p.prompt}>{p.name}</option>)}
                            <option value={settings.systemInstruction} disabled hidden>{settings.systemInstruction === AI_PERSONAS.find(p=>p.prompt === settings.systemInstruction)?.prompt ? '' : 'Custom'}</option>
                        </select>
                        <textarea
                            id="system-prompt"
                            rows={4}
                            value={settings.systemInstruction}
                            onChange={(e) => onSettingsChange({ systemInstruction: e.target.value })}
                            className="w-full mt-2 bg-gray-100 dark:bg-slate-900/80 text-gray-800 dark:text-gray-200 placeholder-gray-500 p-3 rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-gray-300 dark:border-slate-700 text-sm"
                            placeholder="Define how the AI should behave and respond."
                        />
                    </div>
                </div>
                <div className="mt-6 p-4 bg-indigo-50 dark:bg-slate-700/50 rounded-lg border border-indigo-200 dark:border-slate-600 flex items-start gap-3">
                    <div className="flex-shrink-0 text-indigo-500 dark:text-indigo-400 mt-1">
                        <InfoIcon />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200">Coming Soon!</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">We're working on adding profile editing features to further personalize your experience. Stay tuned!</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    userProfile: UserProfile;
    onUpdatePicture: (dataUrl: string) => void;
    onGenerateAvatar: (prompt: string) => Promise<string | null>;
    onOpenCamera: () => void;
    onUpload: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, userProfile, onUpdatePicture, onGenerateAvatar, onOpenCamera, onUpload }) => {
    const [avatarPrompt, setAvatarPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    if (!isOpen) return null;
    
    const handleGenerate = async () => {
        if (!avatarPrompt.trim()) return;
        setIsGenerating(true);
        const newAvatar = await onGenerateAvatar(avatarPrompt);
        if (newAvatar) {
            onUpdatePicture(newAvatar);
        }
        setIsGenerating(false);
        setAvatarPrompt('');
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 transition-opacity" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6 border border-gray-200 dark:border-slate-700 m-4" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Profile Picture</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700">
                        <XIcon />
                    </button>
                </div>
                
                <div className="flex justify-center mb-6">
                    <div className="w-32 h-32 rounded-full bg-indigo-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
                        {userProfile.pictureUrl ? (
                            <img src={userProfile.pictureUrl} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                             <div className="w-32 h-32 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-5xl flex-shrink-0">
                                U
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <button onClick={onOpenCamera} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-100 dark:bg-slate-700/50 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">
                        <CameraIcon />
                        <span className="text-sm font-medium">Take Photo</span>
                    </button>
                    <button onClick={onUpload} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-100 dark:bg-slate-700/50 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">
                        <ImageIcon />
                        <span className="text-sm font-medium">Upload Image</span>
                    </button>
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-center mb-2">Or, Generate an Avatar</h3>
                    <p className="text-center text-sm text-gray-500 mb-4">Describe the avatar you want to create.</p>
                    <div className="flex gap-2">
                        <input 
                            type="text"
                            value={avatarPrompt}
                            onChange={e => setAvatarPrompt(e.target.value)}
                            placeholder="e.g., a cute robot, pixel art style"
                            className="flex-1 bg-gray-100 dark:bg-slate-900 text-gray-800 dark:text-gray-200 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-gray-300 dark:border-slate-700"
                            disabled={isGenerating}
                        />
                        <button onClick={handleGenerate} disabled={!avatarPrompt.trim() || isGenerating} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-gray-500 flex items-center justify-center w-28">
                            {isGenerating ? <LoadingSpinner /> : 'Generate'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


const Sidebar: React.FC<{
    conversations: Conversation[],
    activeConversationId: string | null,
    onNewChat: () => void,
    onSelectConversation: (id: string) => void,
    onDeleteConversation: (id: string) => void,
    onOpenSettings: () => void;
    onOpenRobotStore: () => void;
    onOpenAppStore: () => void;
    onOpenProfile: () => void;
    isOpen: boolean,
    userProfile: UserProfile,
    onGetSummary: (convoId: string) => void,
}> = ({ conversations, activeConversationId, onNewChat, onSelectConversation, onDeleteConversation, onOpenSettings, onOpenRobotStore, onOpenAppStore, onOpenProfile, isOpen, userProfile, onGetSummary }) => {
    
    const xpForNextLevel = userProfile.level < 20 ? (userProfile.level * 100) + ((userProfile.level -1) * 50) : userProfile.xp;
    const xpProgressPercent = userProfile.level < 20 ? (userProfile.xp / xpForNextLevel) * 100 : 100;

    return (
    <div className={`fixed inset-y-0 left-0 w-64 bg-white/80 dark:bg-slate-900/80 p-4 flex flex-col border-r border-gray-200 dark:border-slate-800 z-50 md:static md:translate-x-0 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
                <StenpanLogo />
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">STENPAN AI</h1>
            </div>
            {userProfile.dailyStreak > 0 && (
                <div className="flex items-center gap-1 bg-orange-500/10 text-orange-500 px-2 py-1 rounded-full" title={`You have a ${userProfile.dailyStreak}-day streak!`}>
                    <FlameIcon />
                    <span className="text-xs font-bold">{userProfile.dailyStreak}</span>
                </div>
            )}
        </div>
        <button 
            onClick={onNewChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 hover:scale-105 active:scale-100"
        >
            <PlusIcon />
            New Chat
        </button>

        <div className="flex-1 mt-8 overflow-y-auto -mr-2 pr-2">
            <h3 className="px-2 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Chat History
            </h3>
            <div className="space-y-1">
                {conversations.map(convo => (
                    <div key={convo.id} className="relative group/convo">
                        <button
                            onClick={() => onSelectConversation(convo.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg text-sm truncate transition-colors ${
                                activeConversationId === convo.id 
                                ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300' 
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-800'
                            }`}
                        >
                            <ChatBubbleIcon />
                            <span className="flex-1">{convo.title}</span>
                        </button>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center opacity-0 group-hover/convo:opacity-100 transition-opacity">
                            <div className="relative group/summary">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onGetSummary(convo.id); }}
                                    className="p-1 rounded-md text-gray-500 hover:text-indigo-500 hover:bg-indigo-500/10"
                                    aria-label="Get summary"
                                >
                                   <InfoIcon />
                                </button>
                                <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-slate-800 text-white text-xs rounded-md shadow-lg opacity-0 pointer-events-none group-hover/summary:opacity-100 transition-opacity z-10">
                                    {convo.summaryLoading ? <LoadingSpinner /> : convo.summary || 'Click to summarize'}
                                </div>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); onDeleteConversation(convo.id); }}
                                className="p-1 rounded-md text-gray-500 hover:text-red-500 hover:bg-red-500/10"
                                aria-label="Delete chat"
                            >
                               <TrashIcon />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
        
        <div className="mt-auto border-t border-gray-200 dark:border-slate-800 pt-4 space-y-1">
            <>
                <div className="px-2 mb-4">
                    <div className="flex justify-between items-baseline mb-1">
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Level {userProfile.level}</p>
                        <p className="text-xs text-gray-500">{userProfile.level < 20 ? `${userProfile.xp} / ${xpForNextLevel} XP` : 'MAX LEVEL'}</p>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-1.5">
                        <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${xpProgressPercent}%` }}></div>
                    </div>
                </div>
                 <button
                    onClick={onOpenProfile}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                    <UserIcon pictureUrl={userProfile.pictureUrl} />
                    <span className="font-semibold">My Profile</span>
                </button>
                 <button
                    onClick={onOpenAppStore}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                    <GiftIcon />
                    App Store
                </button>
                <button
                    onClick={onOpenRobotStore}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                    <StoreIcon />
                    Robot Customization
                </button>
                <button
                    onClick={onOpenSettings}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                    <SettingsIcon />
                    Settings
                </button>
            </>
        </div>
    </div>
    )
};

const addWatermark = (imageUrl: string, watermarkText: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Could not get canvas context'));
            }

            ctx.drawImage(img, 0, 0);

            const fontSize = Math.max(16, Math.floor(img.width / 35));
            ctx.font = `bold ${fontSize}px Arial`;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'bottom';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.shadowBlur = 5;

            const padding = fontSize;
            ctx.fillText(watermarkText, canvas.width - padding, canvas.height - padding);
            
            resolve(canvas.toDataURL('image/jpeg'));
        };
        img.onerror = (err) => {
            console.error("Error loading image for watermarking:", err);
            reject(new Error("Failed to load image for watermarking"));
        };
        img.src = imageUrl;
    });
};

interface SuggestionCardProps {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    onClick: () => void;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({ icon, title, subtitle, onClick }) => {
    return (
        <button
            onClick={onClick}
            className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-gray-200 dark:border-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700/80 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
        >
            <div className="flex items-start gap-4">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-md text-indigo-600 dark:text-indigo-300 flex-shrink-0">
                    {icon}
                </div>
                <div>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-left">{title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-left">{subtitle}</p>
                </div>
            </div>
        </button>
    );
};

type ImageUpload = { id: number; dataUrl: string; file: File; isLoading: boolean };

const App: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [imageUploads, setImageUploads] = useState<ImageUpload[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isChatReady, setIsChatReady] = useState(false);
  const [chat, setChat] = useState<Chat | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isAnalyzerModalOpen, setIsAnalyzerModalOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRobotStoreOpen, setIsRobotStoreOpen] = useState(false);
  const [isAppStoreOpen, setIsAppStoreOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isVoiceSessionActive, setIsVoiceSessionActive] = useState(false);
  const [banStatus, setBanStatus] = useState<{ isBanned: boolean; expiry: number | 'permanent' | null; appealAttempted: boolean, infractions: number }>({ isBanned: false, expiry: null, appealAttempted: false, infractions: 0 });
  const [robotState, setRobotState] = useState<'idle' | 'thinking' | 'angry' | 'greeting' | 'success' | 'error'>('idle');
  const [levelUpInfo, setLevelUpInfo] = useState<{ level: number; reward: any } | null>(null);
  const [xpGain, setXpGain] = useState<{id: string, amount: number} | null>(null);
  const [xpBoostOffer, setXpBoostOffer] = useState<{ endTime: number | null }>({ endTime: null });

  const [settings, setSettings] = useState<Settings>(() => {
    try {
        const savedSettings = localStorage.getItem('stenpan-ai-settings');
        const defaults: Settings = {
            theme: 'dark',
            temperature: 0.7,
            maxOutputTokens: 2048,
            systemInstruction: NEW_DEFAULT_PROMPT,
            isProMode: false,
            isSpeedOfLightMode: false,
            webEnhanced: false,
        };
        return savedSettings ? { ...defaults, ...JSON.parse(savedSettings) } : defaults;
    } catch {
        return {
            theme: 'dark',
            temperature: 0.7,
            maxOutputTokens: 2048,
            systemInstruction: NEW_DEFAULT_PROMPT,
            isProMode: false,
            isSpeedOfLightMode: false,
            webEnhanced: false,
        };
    }
  });
  const [userProfile, setUserProfile] = useState<UserProfile>({ 
      pictureUrl: null,
      gems: 100, diamonds: 0, purchasedItems: ['color-default', 'accessory-none'], 
      lastGemClaim: undefined, level: 1, xp: 0, claimedLevelRewards: [], 
      achievements: {}, dailyStreak: 0, lastLoginDate: '',
      supportLevel: 1, supportClicks: 0, quests: {}, lastQuestReset: '',
      totalXp: 0, claimedPassRewards: [], claimedXpBoosts: {}
  });
  const [robotCustomization, setRobotCustomization] = useState<RobotCustomization>({ equippedColor: 'default', equippedAccessory: null });
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [toast, setToast] = useState<{ message: string, id: number } | null>(null);
  const [editingImage, setEditingImage] = useState<{ messageId: string, image: string } | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [cameraUsage, setCameraUsage] = useState<'chat' | 'profile'>('chat');
  const [fileUploadUsage, setFileUploadUsage] = useState<'chat' | 'profile'>('chat');


  const aiRef = useRef<GoogleGenAI | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const stopGenerationRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileFileInputRef = useRef<HTMLInputElement>(null);
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
  const lastUserMessageIdRef = useRef<string | null>(null);

  const initialSuggestions = [
    {
        icon: <SparklesIcon />,
        title: "اشرح الحوسبة الكمومية بكلمات بسيطة",
        subtitle: "مواضيع معقدة"
    },
    {
        icon: <CompassIcon />,
        title: "أعطني أفكارًا لرحلة لمدة 10 أيام إلى اليابان",
        subtitle: "تخطيط السفر"
    },
    {
        icon: <DumbbellIcon />,
        title: "أنشئ خطة تمارين رياضية للمبتدئين",
        subtitle: "صحة ولياقة"
    }
  ];

  useEffect(() => {
    // Initialize audio context on first user interaction
    const initAudio = () => {
        audioPlayer.init();
        window.removeEventListener('click', initAudio);
        window.removeEventListener('keydown', initAudio);
    };
    window.addEventListener('click', initAudio);
    window.addEventListener('keydown', initAudio);

    return () => {
        window.removeEventListener('click', initAudio);
        window.removeEventListener('keydown', initAudio);
    };
  }, []);

  useEffect(() => {
    try {
        const banInfoRaw = localStorage.getItem('stenpan-ai-ban-status');
        if (banInfoRaw) {
            const banInfo = JSON.parse(banInfoRaw);
            if (banInfo.expiry === 'permanent') {
                setBanStatus({ isBanned: true, expiry: 'permanent', appealAttempted: banInfo.appealAttempted || false, infractions: banInfo.infractions || 0 });
            } else if (banInfo.expiry && Date.now() < banInfo.expiry) {
                setBanStatus({ isBanned: true, expiry: banInfo.expiry, appealAttempted: banInfo.appealAttempted || false, infractions: banInfo.infractions || 0 });
            } else {
                localStorage.setItem('stenpan-ai-ban-status', JSON.stringify({ infractions: banInfo.infractions || 0 }));
            }
        }
    } catch (error) {
        console.error("Could not check ban status:", error);
    }
  }, []);

  useEffect(() => {
    if (settings.theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
    try {
        localStorage.setItem('stenpan-ai-settings', JSON.stringify(settings));
    } catch (error) {
        console.error("Could not save settings:", error);
    }
  }, [settings]);

  useEffect(() => {
    try {
        const savedProfile = localStorage.getItem('stenpan-user-profile');
         const defaultProfile: UserProfile = {
            pictureUrl: null,
            gems: 100, diamonds: 0, purchasedItems: ['color-default', 'accessory-none'], 
            level: 1, xp: 0, claimedLevelRewards: [], 
            achievements: {}, dailyStreak: 0, lastLoginDate: '',
            supportLevel: 1, supportClicks: 0, quests: {}, lastQuestReset: '',
            totalXp: 0, claimedPassRewards: [],
            claimedXpBoosts: {},
        };

        if (savedProfile) {
            const loadedProfile = JSON.parse(savedProfile);
            setUserProfile({ ...defaultProfile, ...loadedProfile });
        } else {
             setUserProfile(defaultProfile);
        }

        const savedCustomization = localStorage.getItem('stenpan-robot-customization');
        if (savedCustomization) {
            setRobotCustomization(JSON.parse(savedCustomization));
        }
    } catch (error) {
        console.error("Could not load user profile:", error);
    }
  }, []);
  
  const startNewChat = useCallback(() => {
    if (isLoading) handleStopGeneration();
    const newConvoId = Date.now().toString();
    const newConvo: Conversation = { id: newConvoId, title: 'New Chat', messages: [] };
    setConversations(prev => [newConvo, ...prev]);
    setActiveConversationId(newConvoId);
    setIsLoading(false);
    setIsSidebarOpen(false);
    setRobotState('greeting');
    setSuggestions([]);
  }, [isLoading]);

  useEffect(() => {
    try {
        const savedConvos = localStorage.getItem('stenpan-chatHistory');
        const savedActiveId = localStorage.getItem('stenpan-activeConversationId');
        const convos = savedConvos ? JSON.parse(savedConvos) : [];
        setConversations(convos);
        if (savedActiveId && convos.some(c => c.id === savedActiveId)) {
            setActiveConversationId(savedActiveId);
        } else if (convos.length > 0) {
            setActiveConversationId(convos[0].id);
        } else {
            startNewChat();
        }
    } catch (error) {
        console.error("Could not load chat history:", error);
        startNewChat();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
        // Persist conversations including images and videos
        localStorage.setItem('stenpan-chatHistory', JSON.stringify(conversations));
        if(activeConversationId) {
            localStorage.setItem('stenpan-activeConversationId', activeConversationId);
        }
    } catch (error) {
       if (error instanceof DOMException && error.name === 'QuotaExceededError') {
             console.warn("LocalStorage quota exceeded. Chat history may not be fully saved.");
             setToast({ message: "Storage full. Older messages might not be saved.", id: Date.now() });
        } else {
            console.error("Could not save chat history:", error);
        }
    }
  }, [conversations, activeConversationId]);

  useEffect(() => {
    if (['greeting', 'success', 'error', 'angry'].includes(robotState)) {
      const timer = setTimeout(() => setRobotState('idle'), 2500);
      return () => clearTimeout(timer);
    }
  }, [robotState]);

  const initChat = useCallback(() => {
    if (!aiRef.current || !activeConversationId) {
        setIsChatReady(false);
        setChat(null);
        return;
    }

    const activeConvo = conversations.find(c => c.id === activeConversationId);
    if (!activeConvo) {
        setIsChatReady(false);
        setChat(null);
        return;
    }

    try {
        const history = activeConvo.messages.map(msg => {
            if (msg.isLoading || msg.isError || (msg.sender === Sender.AI && !msg.text && !msg.image && !msg.video)) {
                return null;
            }
            const parts: Part[] = [];
            if (msg.images && msg.images.length > 0) {
                 for (const image of msg.images) {
                    const mimeType = image.match(/data:(.*);base64,/)?.[1];
                    const base64Data = image.split(',')[1];
                    if (mimeType && base64Data) {
                        parts.push({ inlineData: { mimeType, data: base64Data } });
                    }
                }
            }
            if (msg.text) {
                parts.push({ text: msg.text });
            }
            
            return {
                role: msg.sender === Sender.User ? 'user' : 'model',
                parts: parts,
            };
        }).filter((item): item is { role: "user" | "model"; parts: Part[]; } => item !== null);

        const modelName = settings.isSpeedOfLightMode 
            ? 'gemini-flash-lite-latest' 
            : settings.isProMode 
                ? 'gemini-2.5-pro' 
                : 'gemini-2.5-flash';
        const newChat = aiRef.current.chats.create({
            model: modelName,
            history,
            config: {
              systemInstruction: settings.systemInstruction,
              temperature: settings.temperature,
              maxOutputTokens: settings.maxOutputTokens,
              tools: settings.webEnhanced ? [{googleSearch: {}}] : undefined,
            },
        });
        setChat(newChat);
        setIsChatReady(true);
    } catch (error) {
      console.error("Error initializing Gemini chat:", error);
      setIsChatReady(false);
    }
  }, [settings, activeConversationId, conversations]);

  useEffect(() => {
    try {
        if (!aiRef.current) {
            aiRef.current = new GoogleGenAI({ apiKey: process.env.API_KEY });
        }
        initChat();
    } catch (error) {
        console.error("Error initializing GoogleGenAI:", error);
        setIsChatReady(false);
    }
  }, [initChat]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [conversations, activeConversationId, suggestions]);

  const handleStopGeneration = () => {
    stopGenerationRef.current = true;
  };

  const updateMessageInConversation = (convoId: string, messageId: string, update: Partial<Message>) => {
    setConversations(prev => prev.map(c => 
        c.id === convoId ? {
            ...c,
            messages: c.messages.map(m => m.id === messageId ? { ...m, ...update } : m)
        } : c
    ));
  };
  
  const addMessagesToConversation = (convoId: string, newMessages: Message[]) => {
      setConversations(prev => prev.map(c => 
          c.id === convoId ? { ...c, messages: [...c.messages, ...newMessages] } : c
      ));
  };
  
   const addXp = useCallback((amount: number, messageId?: string) => {
    setUserProfile(currentProfile => {
        if (currentProfile.level >= 20) { // Max level
             const updatedProfile = { ...currentProfile };
             localStorage.setItem('stenpan-user-profile', JSON.stringify(updatedProfile));
             return updatedProfile;
        }

        const newXp = currentProfile.xp + amount;
        const xpForNextLevel = (currentProfile.level * 100) + ((currentProfile.level -1) * 50);
        const newTotalXp = (currentProfile.totalXp || 0) + amount;

        let updatedProfile = { ...currentProfile, xp: newXp, totalXp: newTotalXp };

        if (newXp >= xpForNextLevel && currentProfile.level < 20) {
            const newLevel = currentProfile.level + 1;
            updatedProfile = {
                ...updatedProfile,
                level: newLevel,
                xp: newXp - xpForNextLevel,
            };
            
            const reward = LEVEL_REWARDS[newLevel];
            if (reward && !currentProfile.claimedLevelRewards.includes(newLevel)) {
                setTimeout(() => setLevelUpInfo({ level: newLevel, reward }), 500);
            }
            setRobotState('success');
        }
        
        if (messageId) {
            setXpGain({ id: messageId, amount });
            setTimeout(() => setXpGain(null), 1500);
        }
        
        localStorage.setItem('stenpan-user-profile', JSON.stringify(updatedProfile));

        return updatedProfile;
    });
  }, []);

  const updateQuestProgress = useCallback((action: Quest['action'], amount: number = 1) => {
      setUserProfile(prev => {
          const newQuestsState = { ...prev.quests };
          let changed = false;
          for (const quest of DAILY_QUESTS) {
              if (quest.action === action) {
                  const userQuest = newQuestsState[quest.id] || { progress: 0 };
                  if (!userQuest.completedAt && userQuest.progress < quest.goal) {
                      userQuest.progress = Math.min(quest.goal, userQuest.progress + amount);
                      newQuestsState[quest.id] = userQuest;
                      changed = true;
                  }
              }
          }
          if (changed) {
              const newProfile = { ...prev, quests: newQuestsState };
              localStorage.setItem('stenpan-user-profile', JSON.stringify(newProfile));
              return newProfile;
          }
          return prev;
      });
  }, []);
  
  const generateSuggestions = async (lastAiResponse: string) => {
    if (!aiRef.current) return;
    try {
        const suggestionPrompt = `Based on the last AI response, generate 3 short, relevant follow-up questions a user might ask. The AI's last response was: "${lastAiResponse.substring(0, 500)}". Return ONLY a JSON array of strings. Example: ["Tell me more.", "How does that work?", "Can you explain that differently?"]`;
        
        const res = await aiRef.current.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: suggestionPrompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        });
        
        const suggestionsArray = JSON.parse(res.text);
        if (Array.isArray(suggestionsArray) && suggestionsArray.every(s => typeof s === 'string')) {
            setSuggestions(suggestionsArray.slice(0, 3));
        }
    } catch (e) {
        console.error("Failed to generate suggestions:", e);
        setSuggestions([]);
    }
};

  const handleSendMessage = useCallback(async (text: string, options?: { isCodeGeneration?: boolean }) => {
    if (checkProfanity(text)) {
        setRobotState('angry');
        
        const currentInfractions = banStatus.infractions;
        const newInfractions = currentInfractions + 1;

        const newBanStatus = { ...banStatus, infractions: newInfractions };
        setBanStatus(newBanStatus);
        
        try {
            localStorage.setItem('stenpan-ai-ban-status', JSON.stringify(newBanStatus));
        } catch (error) {
            console.error("Error updating infraction count:", error);
        }

        if (newInfractions >= 4) {
            try {
                const permanentBanStatus = { ...newBanStatus, expiry: 'permanent' };
                localStorage.setItem('stenpan-ai-ban-status', JSON.stringify(permanentBanStatus));
                setBanStatus(prev => ({ ...prev, isBanned: true, expiry: 'permanent' }));
            } catch (error) {
                console.error("Error applying ban:", error);
            }
            return;
        }

        let warningText = '';
        if (newInfractions === 1) {
            warningText = "تم رصد لغة غير لائقة. يرجى الالتزام بسلوك محترم. هذا هو **تحذيرك الأول**.";
        } else if (newInfractions === 2) {
            warningText = "تم تحذيرك مسبقًا. هذا هو **تحذيرك الثاني**. استمرار هذا السلوك غير مقبول.";
        } else if (newInfractions === 3) {
            warningText = "⚠️ **تحذير أخير!** أي مخالفة أخرى ستؤدي إلى **حظر حسابك بشكل دائم**.";
        }

        const userMessage: Message = { id: Date.now().toString(), text, sender: Sender.User, images: imageUploads.map(u => u.dataUrl).filter(Boolean) };
        const warningMessage: Message = { id: (Date.now() + 1).toString(), text: warningText, sender: Sender.AI, isError: true };
        
        setInput('');
        setImageUploads([]);
        setSuggestions([]);

        let convoId = activeConversationId;
        if (!convoId) {
            const newConvoId = Date.now().toString();
            const newConvo: Conversation = { id: newConvoId, title: 'تحذير', messages: [] };
            setConversations(prev => [newConvo, ...prev]);
            setActiveConversationId(newConvoId);
            convoId = newConvoId;
        }
        
        addMessagesToConversation(convoId, [userMessage, warningMessage]);
        
        return;
    }

    let convoId = activeConversationId;
    let isFirstMessageInConvo = false;

    if (!convoId) {
        const newConvoId = Date.now().toString();
        const newConvo: Conversation = { id: newConvoId, title: 'New Chat', messages: [] };
        setConversations(prev => [newConvo, ...prev]);
        setActiveConversationId(newConvoId);
        convoId = newConvoId;
        isFirstMessageInConvo = true;
    } else {
        const activeConvo = conversations.find(c => c.id === convoId);
        isFirstMessageInConvo = activeConvo?.messages.length === 0;
    }

    if (text.trim().toLowerCase().startsWith('/imagine ')) {
        const imagePrompt = text.substring('/imagine '.length).trim();
        await handleGenerateImage(imagePrompt, convoId);
        setInput('');
        setImageUploads([]);
        setSuggestions([]);
        return;
    }
      
    stopGenerationRef.current = false;

    const userMessage: Message = { id: Date.now().toString(), text, sender: Sender.User, images: imageUploads.map(u => u.dataUrl).filter(Boolean) };
    const aiMessagePlaceholder: Message = { id: (Date.now() + 1).toString(), text: '', sender: Sender.AI };
    
    lastUserMessageIdRef.current = userMessage.id;
    setInput('');
    setImageUploads([]);
    setSuggestions([]);
    
    addMessagesToConversation(convoId, [userMessage, aiMessagePlaceholder]);
    setIsLoading(true);
    setRobotState('thinking');
    addXp(15, userMessage.id);
    updateQuestProgress('sendMessage');

    if (!chat) {
      console.error("Chat not initialized, cannot send message.");
      updateMessageInConversation(convoId, aiMessagePlaceholder.id, { text: "Chat is not ready. Please try again.", isError: true });
      setIsLoading(false);
      setRobotState('error');
      return;
    }

    try {
      const parts: Part[] = [];
      if (imageUploads && imageUploads.length > 0) {
        for (const upload of imageUploads) {
            if (upload.dataUrl) {
                const mimeType = upload.dataUrl.match(/data:(.*);base64,/)?.[1];
                const base64Data = upload.dataUrl.split(',')[1];
                if (mimeType && base64Data) {
                    parts.push({ inlineData: { mimeType, data: base64Data } });
                }
            }
        }
      }
      if (text) {
        parts.push({ text });
      }

      const result = await chat.sendMessageStream({ message: parts });
      let accumulatedText = '';
      let finalResponse;

      for await (const chunk of result) {
        if (stopGenerationRef.current) break;
        accumulatedText += chunk.text;
        finalResponse = chunk;
        updateMessageInConversation(convoId, aiMessagePlaceholder.id, { text: accumulatedText });
      }

      const groundingChunks = finalResponse?.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const sources = groundingChunks?.map((chunk: any) => chunk.web).filter(Boolean);
      if (sources && sources.length > 0) {
        updateMessageInConversation(convoId, aiMessagePlaceholder.id, { sources });
      }
      
      if (isFirstMessageInConvo && !options?.isCodeGeneration && aiRef.current) {
         const titleModel = settings.isSpeedOfLightMode ? 'gemini-flash-lite-latest' : 'gemini-2.5-flash';
         const titlePrompt = `Based on this exchange, create a short, concise title (4 words max).\n\nUSER: ${text}\nAI: ${accumulatedText}`;
         const titleResponse = await aiRef.current.models.generateContent({ model: titleModel, contents: titlePrompt });
         const newTitle = titleResponse.text.replace(/"/g, '').trim();
         setConversations(prev => prev.map(c => c.id === convoId ? {...c, title: newTitle, titleGenerated: true} : c));
      }

      setRobotState('success');
      
      if (accumulatedText && !stopGenerationRef.current) {
          generateSuggestions(accumulatedText);
      }

    } catch (error) {
      console.error("Error sending message:", error);
      let errorMessage = "Sorry, an unexpected error occurred.";
      if (error instanceof Error) errorMessage = `An error occurred: ${error.message}`;
      updateMessageInConversation(convoId, aiMessagePlaceholder.id, { text: errorMessage, isError: true });
      setRobotState('error');
    } finally {
      setIsLoading(false);
      stopGenerationRef.current = false;
    }
  }, [chat, activeConversationId, conversations, banStatus, imageUploads, settings, addXp, updateQuestProgress]);

  const handleSendCodeMessage = useCallback(async (prompt: string, codeType: 'html' | 'css' | 'js') => {
      const specializedPrompt = `Generate only the ${codeType.toUpperCase()} code for the following request. Your response must be a single markdown code block with the language identifier (e.g., \`\`\`${codeType}). Do not include any text or explanation before or after the code block. The request is:\n\n"${prompt}"`;
      handleSendMessage(specializedPrompt, { isCodeGeneration: true });
  }, [handleSendMessage]);

  const handleGenerateImage = useCallback(async (prompt: string, convoId?: string) => {
    let targetConversationId = convoId || activeConversationId;
    if (!targetConversationId) {
        const newConvoId = Date.now().toString();
        const newConvo: Conversation = { id: newConvoId, title: 'Image Generation', messages: [], titleGenerated: true };
        setConversations(prev => [newConvo, ...prev]);
        setActiveConversationId(newConvoId);
        targetConversationId = newConvoId;
    }
    stopGenerationRef.current = false;

    const userMessage: Message = {
        id: Date.now().toString(),
        text: `Image Prompt: "${prompt}"`,
        sender: Sender.User,
    };
    
    const aiMessagePlaceholder: Message = {
        id: (Date.now() + 1).toString(),
        text: '',
        sender: Sender.AI,
        isLoadingImage: true,
    };
    
    lastUserMessageIdRef.current = userMessage.id;
    addMessagesToConversation(targetConversationId, [userMessage, aiMessagePlaceholder]);
    setIsLoading(true);
    setRobotState('thinking');
    addXp(25, userMessage.id);
    updateQuestProgress('generateImage');

    try {
        if (!aiRef.current) throw new Error("AI client not initialized.");
        
        const response = await aiRef.current.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
            },
        });
        
        const base64ImageBytes = response?.generatedImages?.[0]?.image?.imageBytes;
        if (!base64ImageBytes) {
            throw new Error("Image generation succeeded but no image data was returned.");
        }
        
        const initialImageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;
        const watermarkedImageUrl = await addWatermark(initialImageUrl, 'STENPAN AI | عبد الجبار');

        updateMessageInConversation(targetConversationId, aiMessagePlaceholder.id, { image: watermarkedImageUrl, isLoadingImage: false });
        setRobotState('success');
    } catch (error) {
        console.error("Error generating image:", error);
        let errorMessage = "Sorry, I was unable to generate the image.";
        if (error instanceof Error) errorMessage += `\nError: ${error.message}`;
        updateMessageInConversation(targetConversationId, aiMessagePlaceholder.id, { text: errorMessage, isLoadingImage: false, isError: true });
        setRobotState('error');
    } finally {
        setIsLoading(false);
        stopGenerationRef.current = false;
    }
  }, [activeConversationId, addXp, updateQuestProgress]);
    
    const handleGenerateAvatar = async (prompt: string): Promise<string | null> => {
        if (!aiRef.current) return null;
        
        const avatarPrompt = `User profile avatar, ${prompt}. Centered, simple background, high quality.`;

        try {
            const response = await aiRef.current.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: avatarPrompt,
                config: {
                    numberOfImages: 1,
                    outputMimeType: 'image/jpeg',
                    aspectRatio: '1:1',
                },
            });
             const base64ImageBytes = response?.generatedImages?.[0]?.image?.imageBytes;
            if (!base64ImageBytes) throw new Error("Avatar generation returned no data.");
            
            return `data:image/jpeg;base64,${base64ImageBytes}`;

        } catch (error) {
            console.error("Error generating avatar:", error);
            setToast({ message: "Avatar generation failed. Please try again.", id: Date.now() });
            return null;
        }
    };

    const handleAnalyzeImage = useCallback(async (imageData: string, prompt: string) => {
        const blob = await (await fetch(imageData)).blob();
        const file = new File([blob], "analysis_image.jpg", { type: blob.type });

        const newUpload: ImageUpload = {
            id: Date.now(),
            dataUrl: imageData,
            file: file,
            isLoading: false,
        };
        
        setImageUploads([newUpload]);
        setInput(prompt || "Analyze this image in detail. Describe what you see, identify any objects, text, or people, and provide any relevant context or insights.");
        
        let convoId = activeConversationId;
        if (!convoId) {
            const newConvoId = Date.now().toString();
            const newConvo: Conversation = { id: newConvoId, title: 'Image Analysis', messages: [], titleGenerated: true };
            setConversations(prev => [newConvo, ...prev]);
            setActiveConversationId(newConvoId);
        }
        
        setTimeout(() => handleSendMessage(prompt || "Analyze this image in detail."), 0);

    }, [activeConversationId, handleSendMessage]);
    
    const handleOpenImageEditor = (messageId: string, image: string) => {
        setEditingImage({ messageId, image });
    };

    const handleApplyImageEdit = async (prompt: string) => {
        if (!editingImage || !aiRef.current) return;

        const targetConversationId = activeConversationId;
        if (!targetConversationId) {
            console.error("No active conversation to add the edited image to.");
            setEditingImage(null);
            return;
        }

        const userMessage: Message = {
            id: Date.now().toString(),
            text: `Edit request: "${prompt}"`,
            sender: Sender.User,
            images: [editingImage.image],
        };
        
        const aiMessagePlaceholder: Message = {
            id: (Date.now() + 1).toString(),
            text: '',
            sender: Sender.AI,
            isLoadingImage: true,
        };
        
        lastUserMessageIdRef.current = userMessage.id;
        addMessagesToConversation(targetConversationId, [userMessage, aiMessagePlaceholder]);
        setEditingImage(null); // Close modal
        setIsLoading(true); // Set global loading for input disable
        setRobotState('thinking');
        addXp(30, userMessage.id);

        try {
            const originalImageMimeType = editingImage.image.match(/data:(.*);base64,/)?.[1] || 'image/jpeg';
            const originalImageBase64 = editingImage.image.split(',')[1];

            const imagePart = {
                inlineData: {
                    mimeType: originalImageMimeType,
                    data: originalImageBase64,
                },
            };
            const textPart = { text: prompt };

            const response = await aiRef.current.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [imagePart, textPart] },
                config: {
                    responseModalities: [Modality.IMAGE],
                },
            });
            
            const newImagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
            if (newImagePart?.inlineData) {
                const newBase64 = newImagePart.inlineData.data;
                const newMimeType = newImagePart.inlineData.mimeType;
                const newImageUrl = `data:${newMimeType};base64,${newBase64}`;

                const watermarkedUrl = await addWatermark(newImageUrl, 'STENPAN AI | عبد الجبار');
                updateMessageInConversation(targetConversationId, aiMessagePlaceholder.id, { image: watermarkedUrl, isLoadingImage: false });
                setRobotState('success');
            } else {
                throw new Error("No image was returned from the edit request.");
            }
        } catch (error) {
            console.error("Error editing image:", error);
            let errorMessage = "Sorry, I was unable to edit the image.";
            if (error instanceof Error) errorMessage += `\nError: ${error.message}`;
            updateMessageInConversation(targetConversationId, aiMessagePlaceholder.id, { text: errorMessage, isLoadingImage: false, isError: true });
            setRobotState('error');
        } finally {
            setIsLoading(false);
        }
    };
  
  const handleRetry = useCallback(async (conversationId: string, aiMessageId: string) => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) return;

    const messageIndex = conversation.messages.findIndex(m => m.id === aiMessageId);
    if (messageIndex < 1) return;

    const lastUserMessage = conversation.messages[messageIndex - 1];
    if (lastUserMessage.sender !== Sender.User) return;
    
    const messagesForRetry = conversation.messages.slice(0, messageIndex);
    
    setConversations(prev => prev.map(c => 
        c.id === conversationId ? { ...c, messages: messagesForRetry } : c
    ));

    setTimeout(async () => {
        if (lastUserMessage.images && lastUserMessage.images.length > 0) {
            const uploads: ImageUpload[] = await Promise.all(lastUserMessage.images.map(async (imgSrc, index) => {
                const blob = await (await fetch(imgSrc)).blob();
                const file = new File([blob], `retry_image_${index}.jpg`, { type: blob.type });
                return { id: Date.now() + index, dataUrl: imgSrc, file, isLoading: false };
            }));
            setImageUploads(uploads);
        }
        
        if (lastUserMessage.text.startsWith('Image Prompt:')) {
            const imagePrompt = lastUserMessage.text.match(/Image Prompt: "(.*)"/)?.[1] || '';
            handleGenerateImage(imagePrompt, conversationId);
        } else {
            handleSendMessage(lastUserMessage.text);
        }
    }, 100);
  }, [conversations, handleSendMessage, handleGenerateImage]);

  const selectConversation = (id: string) => {
      setActiveConversationId(id);
      setIsSidebarOpen(false);
      setSuggestions([]);
  }

  const deleteConversation = (id: string) => {
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeConversationId === id) {
          const remainingConvos = conversations.filter(c => c.id !== id);
          if (remainingConvos.length > 0) {
            setActiveConversationId(remainingConvos[0].id);
          } else {
            startNewChat();
          }
      }
  }
  
  const handleUnban = () => {
      localStorage.removeItem('stenpan-ai-ban-status');
      window.location.reload();
  };

  const markAppealAttempted = () => {
      const banInfoRaw = localStorage.getItem('stenpan-ai-ban-status');
      if (banInfoRaw) {
          const banInfo = JSON.parse(banInfoRaw);
          const updatedBanInfo = { ...banInfo, appealAttempted: true };
          localStorage.setItem('stenpan-ai-ban-status', JSON.stringify(updatedBanInfo));
          setBanStatus(prev => ({ ...prev, appealAttempted: true }));
      }
  };

  const handleBuyItem = (itemId: string, cost: number, currency: 'gems' | 'diamonds') => {
    const canAfford = currency === 'gems' ? userProfile.gems >= cost : userProfile.diamonds >= cost;
    if (canAfford && !userProfile.purchasedItems.includes(itemId)) {
      const newProfile = {
        ...userProfile,
        gems: userProfile.gems - (currency === 'gems' ? cost : 0),
        diamonds: userProfile.diamonds - (currency === 'diamonds' ? cost : 0),
        purchasedItems: [...userProfile.purchasedItems, itemId],
      };
      setUserProfile(newProfile);
      localStorage.setItem('stenpan-user-profile', JSON.stringify(newProfile));
    }
  };

  const handleEquipItem = (itemId: string, itemType: 'color' | 'accessory') => {
    const itemName = itemId.split('-')[1];
    const newCustomization = { ...robotCustomization };

    if (itemType === 'color') {
      newCustomization.equippedColor = itemName;
    } else if (itemType === 'accessory') {
      newCustomization.equippedAccessory = itemName === 'none' ? null : itemName;
    }
    
    setRobotCustomization(newCustomization);
    localStorage.setItem('stenpan-robot-customization', JSON.stringify(newCustomization));
  };

  const handleClaimGems = () => {
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    if (!userProfile.lastGemClaim || (now - userProfile.lastGemClaim > twentyFourHours)) {
      const newProfile = {
        ...userProfile,
        gems: userProfile.gems + 100,
        lastGemClaim: now,
      };
      setUserProfile(newProfile);
      localStorage.setItem('stenpan-user-profile', JSON.stringify(newProfile));
    }
  };

    const handleClaimLevelReward = () => {
        if (!levelUpInfo) return;
        const { level, reward } = levelUpInfo;

        setUserProfile(currentProfile => {
            if (currentProfile.claimedLevelRewards.includes(level)) return currentProfile;

            let updatedProfile = { ...currentProfile };
            if (reward.type === 'gems') {
                updatedProfile.gems += reward.amount || 0;
            } else if (reward.type === 'diamonds') {
                updatedProfile.diamonds += reward.amount || 0;
            } else if (reward.type === 'color' || reward.type === 'accessory') {
                if (reward.id && !updatedProfile.purchasedItems.includes(reward.id)) {
                    updatedProfile.purchasedItems.push(reward.id);
                }
            } else if (reward.type === 'bundle' && reward.id) {
                const bundle = REWARD_BUNDLES[reward.id];
                if (bundle) {
                    updatedProfile.gems += bundle.gems || 0;
                    updatedProfile.diamonds += bundle.diamonds || 0;
                    if (bundle.items) {
                        bundle.items.forEach(itemId => {
                            if (!updatedProfile.purchasedItems.includes(itemId)) {
                                updatedProfile.purchasedItems.push(itemId);
                            }
                        });
                    }
                }
            }
            updatedProfile.claimedLevelRewards.push(level);
            
            localStorage.setItem('stenpan-user-profile', JSON.stringify(updatedProfile));

            return updatedProfile;
        });

        setLevelUpInfo(null);
    };

    const handleClaimPassReward = (rewardIndex: number) => {
        const rewardItem = LEVEL_PASS_REWARDS[rewardIndex];
        if (!rewardItem) return;

        setUserProfile(currentProfile => {
            if (currentProfile.claimedPassRewards?.includes(rewardIndex)) return currentProfile;

            let updatedProfile = { ...currentProfile };
            const { reward } = rewardItem;

            if (reward.type === 'gems') {
                updatedProfile.gems += reward.amount || 0;
            } else if (reward.type === 'diamonds') {
                updatedProfile.diamonds += reward.amount || 0;
            } else if (reward.type === 'color' || reward.type === 'accessory') {
                if (reward.id && !updatedProfile.purchasedItems.includes(reward.id)) {
                    updatedProfile.purchasedItems.push(reward.id);
                }
            } else if (reward.type === 'bundle' && reward.id) {
                 const bundle = REWARD_BUNDLES[reward.id];
                 if (bundle) {
                    updatedProfile.gems += bundle.gems || 0;
                    updatedProfile.diamonds += bundle.diamonds || 0;
                    if (bundle.items) {
                        bundle.items.forEach(itemId => {
                            if (!updatedProfile.purchasedItems.includes(itemId)) {
                                updatedProfile.purchasedItems.push(itemId);
                            }
                        });
                    }
                }
            }

            updatedProfile.claimedPassRewards = [...(updatedProfile.claimedPassRewards || []), rewardIndex];
            
            localStorage.setItem('stenpan-user-profile', JSON.stringify(updatedProfile));
            setToast({ message: `Claimed: ${reward.name}!`, id: Date.now() });
            return updatedProfile;
        });
    };

    const handleRedeemCode = (code: string): boolean => {
        code = code.toUpperCase().trim();
        let success = false;
        let message = "Invalid code.";

        if (code === 'DIAMONDCASINO') {
            setUserProfile(prev => {
                const newProfile = { ...prev, gems: prev.gems + 500 };
                localStorage.setItem('stenpan-user-profile', JSON.stringify(newProfile));
                return newProfile;
            });
            message = "Redeemed! +500 Gems!";
            success = true;
        } else if (code === 'TYOP700') {
             setUserProfile(prev => {
                const newProfile = { ...prev, diamonds: prev.diamonds + 50 };
                localStorage.setItem('stenpan-user-profile', JSON.stringify(newProfile));
                return newProfile;
            });
            message = "Redeemed! +50 Diamonds!";
            success = true;
        }

        setToast({ message, id: Date.now() });
        return success;
    };


    const handleVoiceSessionEnd = (transcript: { speaker: 'user' | 'ai', text: string }[]) => {
        setIsVoiceSessionActive(false);
        if (transcript.length === 0) return;

        const formattedTranscript = "**صوت محادثة نصية**\n\n" + transcript.map(entry => {
            return `**${entry.speaker === 'user' ? 'You' : 'AI'}:** ${entry.text}`;
        }).join('\n\n');

        addXp(transcript.length * 5); // Grant XP for voice interaction
        updateQuestProgress('useVoice', transcript.filter(t => t.speaker === 'user').length);

        handleSendMessage(formattedTranscript);
    };

    const processFiles = useCallback(async (files: FileList) => {
        if (imageUploads.length + files.length > 5) {
            alert('You can upload a maximum of 5 images.');
            return;
        }
    
        const newUploads: ImageUpload[] = Array.from(files)
            .filter(file => {
                if (!file.type.startsWith('image/')) return false;
                if (file.size > 4 * 1024 * 1024) {
                    alert(`Image "${file.name}" exceeds the 4MB size limit and will not be added.`);
                    return false;
                }
                return true;
            })
            .map(file => ({
                id: Date.now() + Math.random(),
                dataUrl: '', // Will be filled later
                file,
                isLoading: true,
            }));
    
        if (newUploads.length === 0) return;
    
        setImageUploads(prev => [...prev, ...newUploads]);
    
        newUploads.forEach(upload => {
            fileToBase64(upload.file).then(dataUrl => {
                setImageUploads(prev => prev.map(up => up.id === upload.id ? { ...up, dataUrl, isLoading: false } : up));
            });
        });
    }, [imageUploads.length]);
    
    const handleUpdateProfilePicture = (dataUrl: string) => {
        setUserProfile(prev => {
            const newProfile = { ...prev, pictureUrl: dataUrl };
            localStorage.setItem('stenpan-user-profile', JSON.stringify(newProfile));
            return newProfile;
        });
        setToast({ message: "Profile picture updated!", id: Date.now() });
    };

    const handleProfileFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          if (file.size > 2 * 1024 * 1024) { // 2MB limit for profile pics
             setToast({ message: "Image size cannot exceed 2MB.", id: Date.now() });
             return;
          }
          const dataUrl = await fileToBase64(file);
          handleUpdateProfilePicture(dataUrl);
          setIsProfileModalOpen(false);
      }
      if (profileFileInputRef.current) {
        profileFileInputRef.current.value = '';
      }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
          await processFiles(e.target.files);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    
    const handleUploadClick = () => {
        setFileUploadUsage('chat');
        fileInputRef.current?.click();
    };
    
    const handleRemoveImage = (idToRemove: number) => {
      setImageUploads(prev => prev.filter((upload) => upload.id !== idToRemove));
    };

    const handleCapture = (imageDataUrl: string) => {
        if (cameraUsage === 'profile') {
            handleUpdateProfilePicture(imageDataUrl);
            setIsCameraModalOpen(false);
            return;
        }

      if (imageUploads.length >= 5) {
          alert('You can upload a maximum of 5 images.');
          return;
      }
      fetch(imageDataUrl)
        .then(res => res.blob())
        .then(blob => {
            const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
            const newUpload: ImageUpload = {
                id: Date.now(),
                dataUrl: imageDataUrl,
                file: file,
                isLoading: false
            };
            setImageUploads(prev => [...prev, newUpload]);
        });
    };
    
    const handleGetSummary = async (convoId: string) => {
        const convo = conversations.find(c => c.id === convoId);
        if (!convo || convo.summary || convo.summaryLoading || !aiRef.current) return;

        setConversations(prev => prev.map(c => c.id === convoId ? { ...c, summaryLoading: true } : c));

        try {
            const historyText = convo.messages
                .map(m => `${m.sender === Sender.User ? 'User' : 'AI'}: ${m.text}`)
                .join('\n');
            
            const summaryPrompt = `Please provide a very short, one-sentence summary of the following conversation:\n\n---\n${historyText.substring(0, 2000)}\n---`;

            const response = await aiRef.current.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: summaryPrompt
            });

            const summary = response.text.trim();
            setConversations(prev => prev.map(c => c.id === convoId ? { ...c, summary, summaryLoading: false } : c));
        } catch (error) {
            console.error("Failed to get summary:", error);
            setConversations(prev => prev.map(c => c.id === convoId ? { ...c, summary: 'Error summarizing', summaryLoading: false } : c));
        }
    };

    const handleHeartClick = () => {
        setUserProfile(prev => {
            const newClicks = prev.supportClicks + 1;
            const newLevel = Math.floor(Math.log2(newClicks / 10 + 1)) + 1;
            const newProfile = {
                ...prev,
                supportClicks: newClicks,
                supportLevel: newLevel,
            };
            localStorage.setItem('stenpan-user-profile', JSON.stringify(newProfile));
            return newProfile;
        });
        addXp(1);
        updateQuestProgress('supportClick');
    };

    const handleClaimQuestReward = (questId: string) => {
        const quest = DAILY_QUESTS.find(q => q.id === questId);
        if (!quest) return;

        const userQuest = userProfile.quests[questId];
        if (!userQuest || userQuest.progress < quest.goal || userQuest.completedAt) return;
        
        if (quest.reward.type === 'xp') {
            addXp(quest.reward.amount);
        }

        setUserProfile(prev => {
            let newProfile = { ...prev };

            if (quest.reward.type === 'gems') {
                newProfile.gems += quest.reward.amount;
            }
            
            const updatedQuests = {
                ...newProfile.quests,
                [questId]: { ...(newProfile.quests[questId] || { progress: 0 }), completedAt: Date.now() }
            };
            newProfile.quests = updatedQuests;
            
            localStorage.setItem('stenpan-user-profile', JSON.stringify(newProfile));
            return newProfile;
        });
    };

    const handleExportChat = () => {
        if (!activeConversation) return;
        const chatContent = activeConversation.messages.map(m => {
            let content = `[${m.sender.toUpperCase()}] ${new Date(parseInt(m.id)).toLocaleString()}\n`;
            if (m.text) content += `${m.text}\n`;
            if (m.image) content += `[IMAGE: Generated Image]\n`;
            if (m.video) content += `[VIDEO: Generated Video]\n`;
            if (m.images) content += m.images.map((_img, i) => `[UPLOADED IMAGE ${i+1}]`).join('\n') + '\n';
            return content;
        }).join('\n---\n');

        const blob = new Blob([chatContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `stenpan-chat-${activeConversation.title.replace(/[\s/\\?%*:|"<>]/g, '_')}-${activeConversation.id}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn("Speech Recognition not supported in this browser.");
            return;
        }

        if (!speechRecognitionRef.current) {
            speechRecognitionRef.current = new SpeechRecognition();
            speechRecognitionRef.current.continuous = true;
            speechRecognitionRef.current.interimResults = true;
            speechRecognitionRef.current.lang = 'en-US';
        }
        
        const recognition = speechRecognitionRef.current;

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            let interimTranscript = '';
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            setInput(prev => prev + finalTranscript + interimTranscript);
        };
        
        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error("Speech recognition error", event.error);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };
        
        return () => {
            recognition.stop();
        };
    }, []);

    const toggleListening = () => {
        if (!speechRecognitionRef.current) return;
        
        if (isListening) {
            speechRecognitionRef.current.stop();
        } else {
            speechRecognitionRef.current.start();
        }
        setIsListening(!isListening);
    };

    const handleOpenRobotStore = () => {
        setXpBoostOffer(prev => {
            if (!prev.endTime) {
                // Set for 5 minutes from now if it hasn't been set this session
                return { ...prev, endTime: Date.now() + 5 * 60 * 1000 };
            }
            return prev;
        });
        setIsRobotStoreOpen(true);
    };

    const handleBuyXpBoost = (boost: { id: string; xp: number; cost: number; currency: 'gems' | 'diamonds' }) => {
        const isClaimed = userProfile.claimedXpBoosts && userProfile.claimedXpBoosts[boost.id];
        if (isClaimed) {
            setToast({ message: "You have already purchased this boost.", id: Date.now() });
            return;
        }
    
        const canAfford = boost.currency === 'gems' ? userProfile.gems >= boost.cost : userProfile.diamonds >= boost.cost;
        if (!canAfford) {
            setToast({ message: `Not enough ${boost.currency}.`, id: Date.now() });
            return;
        }
    
        setUserProfile(prev => {
            const newProfile = {
                ...prev,
                gems: prev.gems - (boost.currency === 'gems' ? boost.cost : 0),
                diamonds: prev.diamonds - (boost.currency === 'diamonds' ? boost.cost : 0),
                claimedXpBoosts: { ...(prev.claimedXpBoosts || {}), [boost.id]: Date.now() }
            };
            localStorage.setItem('stenpan-user-profile', JSON.stringify(newProfile));
            return newProfile;
        });
    
        addXp(boost.xp);
        setToast({ message: `+${boost.xp} XP boost purchased!`, id: Date.now() });
    };
    
    const activeConversation = conversations.find(c => c.id === activeConversationId);
    
    if (banStatus.isBanned) {
        return <BannedScreen expiry={banStatus.expiry} appealAttempted={banStatus.appealAttempted} onUnban={handleUnban} onAppealAttempted={markAppealAttempted} />;
    }

    return (
        <div className={`flex h-screen font-sans bg-gray-100 dark:bg-slate-900 text-gray-900 dark:text-white transition-colors duration-300`}>
             <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                multiple
                className="hidden"
            />
            <input
                type="file"
                ref={profileFileInputRef}
                onChange={handleProfileFileChange}
                accept="image/*"
                className="hidden"
            />
            <Sidebar 
                conversations={conversations}
                activeConversationId={activeConversationId}
                onNewChat={startNewChat}
                onSelectConversation={selectConversation}
                onDeleteConversation={deleteConversation}
                onOpenSettings={() => setIsSettingsOpen(true)}
                onOpenRobotStore={() => setIsRobotStoreOpen(true)}
                onOpenAppStore={() => setIsAppStoreOpen(true)}
                onOpenProfile={() => setIsProfileModalOpen(true)}
                isOpen={isSidebarOpen}
                userProfile={userProfile}
                onGetSummary={handleGetSummary}
            />

            {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/50 z-40 md:hidden"></div>}
            
            <div className="flex-1 flex flex-col relative overflow-hidden">
                <ChatHeader 
                    onMenuClick={() => setIsSidebarOpen(true)}
                    title={activeConversation?.title || 'New Chat'}
                    onExportChat={handleExportChat}
                />
                 <main className="flex-1 overflow-y-auto p-4" id="message-container">
                    {activeConversation ? (
                        activeConversation.messages.length > 0 ? (
                            <>
                            {activeConversation.messages.map((message, index) => (
                                <MessageComponent
                                    key={message.id}
                                    message={message}
                                    isStreaming={isLoading && index === activeConversation.messages.length - 1}
                                    onRetry={() => handleRetry(activeConversation.id, message.id)}
                                    onEditImage={handleOpenImageEditor}
                                    userPictureUrl={userProfile.pictureUrl}
                                    showXpGain={xpGain?.id === message.id ? xpGain.amount : undefined}
                                />
                            ))}
                            </>
                        ) : (
                             <div className="flex flex-col items-center justify-center h-full text-center">
                                <StenpanLogo />
                                <h2 className="mt-4 text-2xl font-semibold text-gray-700 dark:text-gray-300">How can I help you today?</h2>
                                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8 max-w-4xl w-full">
                                    {initialSuggestions.map((s, i) => (
                                        <SuggestionCard
                                            key={i}
                                            icon={s.icon}
                                            title={s.title}
                                            subtitle={s.subtitle}
                                            onClick={() => handleSendMessage(s.title)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )
                    ) : (
                        <div className="flex items-center justify-center h-full"><LoadingSpinner /></div>
                    )}
                    <div ref={messagesEndRef} />
                </main>

                <footer className="p-4 flex-shrink-0">
                    <Suggestions suggestions={suggestions} onSuggestionClick={handleSendMessage} />
                    <ChatInput
                        input={input}
                        setInput={setInput}
                        imageUploads={imageUploads}
                        onRemoveImage={handleRemoveImage}
                        onProcessFiles={processFiles}
                        onSendMessage={handleSendMessage}
                        isLoading={isLoading}
                        isChatReady={isChatReady}
                        onStopGeneration={handleStopGeneration}
                        onGenerateImageClick={() => setIsImageModalOpen(true)}
                        onAnalyzeImageClick={() => setIsAnalyzerModalOpen(true)}
                        onCameraClick={() => { setCameraUsage('chat'); setIsCameraModalOpen(true); }}
                        onUploadClick={handleUploadClick}
                        onMicClick={() => {
                            updateQuestProgress('useVoice');
                            setIsVoiceSessionActive(true);
                        }}
                        onSendCodeMessage={(codeType) => handleSendCodeMessage(input, codeType)}
                        isListening={isListening}
                        onToggleListening={toggleListening}
                        userProfile={userProfile}
                        onHeartClick={handleHeartClick}
                    />
                </footer>
            </div>
             <FloatingRobot 
                state={robotState} 
                color={storeItems.colors.find(c => c.id.endsWith(robotCustomization.equippedColor))?.value || '#f3f4f6'}
                accessory={robotCustomization.equippedAccessory}
                onClick={() => setIsRobotStoreOpen(true)} 
            />
            <ImageGenerationModal
                isOpen={isImageModalOpen}
                onClose={() => setIsImageModalOpen(false)}
                onGenerate={(prompt) => handleGenerateImage(prompt)}
            />
             <ImageEditModal
                isOpen={!!editingImage}
                onClose={() => setEditingImage(null)}
                onEdit={handleApplyImageEdit}
                currentImage={editingImage?.image || null}
            />
             <ImageAnalyzerModal
                isOpen={isAnalyzerModalOpen}
                onClose={() => setIsAnalyzerModalOpen(false)}
                onAnalyze={handleAnalyzeImage}
            />
            {/* FIX: The file was truncated here, causing multiple errors. Restoring the remaining modals and closing elements. */}
            <CameraModal
                isOpen={isCameraModalOpen}
                onClose={() => setIsCameraModalOpen(false)}
                onCapture={handleCapture}
            />
            <VoiceSessionModal
                isOpen={isVoiceSessionActive}
                onClose={handleVoiceSessionEnd}
                ai={aiRef.current!}
                systemInstruction={settings.systemInstruction}
            />
            <SettingsModal 
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                settings={settings}
                onSettingsChange={(newSettings) => setSettings(s => ({...s, ...newSettings}))}
            />
             <RobotStoreModal
                isOpen={isRobotStoreOpen}
                onClose={() => setIsRobotStoreOpen(false)}
                userProfile={userProfile}
                customization={robotCustomization}
                onBuyItem={handleBuyItem}
                onEquipItem={handleEquipItem}
            />
             <AppStoreModal
                isOpen={isAppStoreOpen}
                onClose={() => setIsAppStoreOpen(false)}
                userProfile={userProfile}
                onBuyXpBoost={handleBuyXpBoost}
            />
            <ProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                userProfile={userProfile}
                onUpdatePicture={handleUpdateProfilePicture}
                onGenerateAvatar={handleGenerateAvatar}
                onOpenCamera={() => { setCameraUsage('profile'); setIsCameraModalOpen(true); setIsProfileModalOpen(false); }}
                onUpload={() => { setFileUploadUsage('profile'); profileFileInputRef.current?.click(); setIsProfileModalOpen(false); }}
            />
            <LevelUpModal 
                isOpen={!!levelUpInfo}
                onClose={handleClaimLevelReward}
                level={levelUpInfo?.level || 0}
                reward={levelUpInfo?.reward}
            />
             {toast && (
                <div key={toast.id} className="fixed bottom-24 right-6 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg text-sm z-50 animate-toast">
                    {toast.message}
                </div>
            )}
        </div>
    );
};

// FIX: Add default export for App component to be used in index.tsx
export default App;
