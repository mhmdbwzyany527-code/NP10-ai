
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Blob as GenAI_Blob } from '@google/genai';
import { PhoneOffIcon, LoadingSpinner, MicrophoneIcon, UserIcon, AiIcon } from './Icons';

// FIX: Add type definition for window.webkitAudioContext to support older browsers and resolve TypeScript errors.
declare global {
    interface Window {
        webkitAudioContext: typeof AudioContext;
    }
}

type TranscriptEntry = {
    speaker: 'user' | 'ai';
    text: string;
};

interface VoiceSessionModalProps {
    isOpen: boolean;
    onClose: (transcript: TranscriptEntry[]) => void;
    ai: GoogleGenAI;
    systemInstruction: string;
}

// --- Audio Encoding/Decoding Utilities ---

function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function createBlob(data: Float32Array): GenAI_Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

// --- Component ---

const VoiceSessionModal: React.FC<VoiceSessionModalProps> = ({ isOpen, onClose, ai, systemInstruction }) => {
    const [status, setStatus] = useState<'IDLE' | 'CONNECTING' | 'CONNECTED' | 'ERROR'>('IDLE');
    const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
    const [currentInput, setCurrentInput] = useState('');
    const [currentOutput, setCurrentOutput] = useState('');
    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const nextStartTimeRef = useRef(0);
    const transcriptEndRef = useRef<HTMLDivElement>(null);
    const [isSpeaking, setIsSpeaking] = useState(false);
    
    const cleanup = useCallback(() => {
        streamRef.current?.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        
        inputAudioContextRef.current?.close();
        inputAudioContextRef.current = null;

        sourcesRef.current.forEach(source => source.stop());
        sourcesRef.current.clear();
    }, []);

    const handleClose = useCallback(() => {
        sessionPromiseRef.current?.then(session => session.close());
        cleanup();
        const finalTranscript = [...transcript];
        if (currentInput.trim()) finalTranscript.push({ speaker: 'user', text: currentInput.trim() });
        if (currentOutput.trim()) finalTranscript.push({ speaker: 'ai', text: currentOutput.trim() });
        onClose(finalTranscript);
        // Reset state for next open
        setTranscript([]);
        setCurrentInput('');
        setCurrentOutput('');
        setStatus('IDLE');
    }, [onClose, cleanup, transcript, currentInput, currentOutput]);

    useEffect(() => {
        if (!isOpen) {
            handleClose();
            return;
        }

        setStatus('CONNECTING');
        
        const setupAudio = async () => {
             // --- Output Audio ---
            const outputAudioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
            outputAudioContextRef.current = outputAudioContext;
            const outputNode = outputAudioContext.createGain();
            outputNode.connect(outputAudioContext.destination);

            // --- Input Audio ---
            const inputAudioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
            inputAudioContextRef.current = inputAudioContext;

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const source = inputAudioContext.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                const pcmBlob = createBlob(inputData);
                sessionPromiseRef.current?.then((session) => {
                    session.sendRealtimeInput({ media: pcmBlob });
                });
                
                // Simple speaking detection
                const max = Math.max(...inputData);
                setIsSpeaking(max > 0.05);
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContext.destination);

        };

        const sessionPromise = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            callbacks: {
                onopen: async () => {
                    try {
                        await setupAudio();
                        setStatus('CONNECTED');
                    } catch (error) {
                        console.error("Error setting up audio:", error);
                        setStatus('ERROR');
                    }
                },
                onmessage: async (message: LiveServerMessage) => {
                    // Handle Transcription
                    if (message.serverContent?.inputTranscription) {
                        setCurrentInput(prev => prev + message.serverContent.inputTranscription.text);
                    }
                    if (message.serverContent?.outputTranscription) {
                        setCurrentOutput(prev => prev + message.serverContent.outputTranscription.text);
                    }
                    if (message.serverContent?.turnComplete) {
                        setTranscript(prev => {
                            const newTranscript = [...prev];
                            const finalInput = currentInput.trim();
                            const finalOutput = currentOutput.trim();
                            if (finalInput) newTranscript.push({ speaker: 'user', text: finalInput });
                            if (finalOutput) newTranscript.push({ speaker: 'ai', text: finalOutput });
                            return newTranscript;
                        });
                        setCurrentInput('');
                        setCurrentOutput('');
                    }

                    // Handle Audio Output
                    const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
                    if (base64Audio && outputAudioContextRef.current) {
                        const outputAudioContext = outputAudioContextRef.current;
                        nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContext.currentTime);

                        const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
                        const source = outputAudioContext.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(outputAudioContext.destination);
                        source.addEventListener('ended', () => sourcesRef.current.delete(source));

                        source.start(nextStartTimeRef.current);
                        nextStartTimeRef.current += audioBuffer.duration;
                        sourcesRef.current.add(source);
                    }
                },
                onerror: (e: ErrorEvent) => {
                    console.error('Live session error:', e);
                    setStatus('ERROR');
                },
                onclose: () => {
                    // This might be called on server-side close.
                },
            },
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' }}},
                systemInstruction: systemInstruction,
                outputAudioTranscription: {},
                inputAudioTranscription: {},
            },
        });
        sessionPromiseRef.current = sessionPromise;

        return () => {
            handleClose();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcript, currentInput, currentOutput]);

    if (!isOpen) return null;

    const renderStatus = () => {
        switch (status) {
            case 'CONNECTING': return 'Connecting...';
            case 'CONNECTED': return 'Connected. Start speaking.';
            case 'ERROR': return 'Connection failed. Please try again.';
            default: return 'Initializing...';
        }
    }

    return (
        <div className="fixed inset-0 bg-slate-900/90 flex flex-col items-center justify-between z-[100] p-4 sm:p-8" onClick={(e) => e.stopPropagation()}>
            <div className="w-full text-center">
                <p className="text-sm text-gray-400">{renderStatus()}</p>
            </div>
            
            <div className="flex flex-col items-center justify-center gap-4">
                 <div className={`relative w-32 h-32 rounded-full bg-indigo-500/20 flex items-center justify-center transition-all duration-200 ${isSpeaking ? 'scale-110' : 'scale-100'}`}>
                    <div className={`w-full h-full rounded-full bg-indigo-500/30 animate-pulse-slow ${isSpeaking ? 'scale-125' : ''}`}></div>
                    <div className="absolute text-indigo-300">
                       <MicrophoneIcon />
                    </div>
                </div>
            </div>

            <div className="w-full max-w-4xl h-1/3 overflow-y-auto p-4 space-y-4">
                {transcript.map((entry, index) => (
                    <div key={index} className={`flex items-start gap-3 ${entry.speaker === 'user' ? 'justify-end' : ''}`}>
                         {entry.speaker === 'ai' && <AiIcon />}
                         <p className={`px-4 py-2 rounded-2xl max-w-lg ${entry.speaker === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-700 text-gray-200 rounded-bl-none'}`}>{entry.text}</p>
                         {entry.speaker === 'user' && <UserIcon />}
                    </div>
                ))}
                 {currentInput && (
                    <div className="flex items-start gap-3 justify-end">
                        <p className="px-4 py-2 rounded-2xl max-w-lg bg-indigo-600 text-white/70 rounded-br-none">{currentInput}</p>
                        <UserIcon />
                    </div>
                )}
                 {currentOutput && (
                     <div className="flex items-start gap-3">
                         <AiIcon />
                         <p className="px-4 py-2 rounded-2xl max-w-lg bg-slate-700 text-gray-200/70 rounded-bl-none">{currentOutput}</p>
                    </div>
                 )}
                 <div ref={transcriptEndRef} />
            </div>

            <button 
                onClick={handleClose}
                className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-red-700 transition-colors"
                aria-label="End voice session"
            >
                <PhoneOffIcon />
            </button>
        </div>
    );
};

export default VoiceSessionModal;