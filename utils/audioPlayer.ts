
// All audio functionality has been disabled as per user request to fix errors.
import { sounds } from '../assets/sounds';

class AudioPlayer {
    private static instance: AudioPlayer;
    private constructor() {}

    public static getInstance(): AudioPlayer {
        if (!AudioPlayer.instance) {
            AudioPlayer.instance = new AudioPlayer();
        }
        return AudioPlayer.instance;
    }

    public init() {}

    public async play(audioBytes: Uint8Array, onEnded?: () => void): Promise<void> { 
        onEnded?.();
    }
    
    public stop() {}

    public async playSound(soundName: keyof typeof sounds) {}
}

export const audioPlayer = AudioPlayer.getInstance();
