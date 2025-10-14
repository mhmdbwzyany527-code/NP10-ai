import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Chat, Part } from '@google/genai';
import { Message, Sender } from './types';
import MessageComponent from './components/Message';
import ChatInput from './components/ChatInput';
import { Np10Logo, PlusIcon, LoadingSpinner, LogoutIcon, AiIcon, XIcon } from './components/Icons';


interface LoginProps {
    onLoginSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            setError('Please enter both email and password.');
            return;
        }
        setError('');
        onLoginSuccess();
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white font-sans">
            <div className="w-full max-w-md p-8 space-y-6 bg-gray-950 rounded-2xl shadow-xl border border-gray-800">
                <div className="flex flex-col items-center">
                    <Np10Logo />
                    <h2 className="mt-6 text-3xl font-bold text-center text-gray-100">
                        Sign in to NP10 AI
                    </h2>
                    <p className="mt-2 text-sm text-center text-gray-400">
                        Enter your credentials or continue as a guest.
                    </p>
                </div>
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4 rounded-md shadow-sm">
                        <div>
                            <label htmlFor="email-address" className="sr-only">Email address</label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="relative block w-full px-3 py-3 text-white bg-gray-800 border border-gray-700 rounded-md appearance-none placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="Email address"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">Password</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="relative block w-full px-3 py-3 text-white bg-gray-800 border border-gray-700 rounded-md appearance-none placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="Password"
                            />
                        </div>
                    </div>

                    {error && (
                        <p className="text-sm text-center text-red-400">{error}</p>
                    )}

                    <div>
                        <button
                            type="submit"
                            className="relative flex justify-center w-full px-4 py-3 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md group hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 transition-colors"
                        >
                            Sign In
                        </button>
                    </div>
                </form>
                
                <div className="relative flex items-center justify-center my-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-700"></div>
                  </div>
                  <div className="relative px-2 bg-gray-950 text-sm text-gray-500">
                    OR
                  </div>
                </div>

                <div>
                    <button
                        type="button"
                        onClick={onLoginSuccess}
                        className="relative flex justify-center w-full px-4 py-3 text-sm font-medium text-white bg-gray-700 border border-transparent rounded-md group hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-gray-500 transition-colors"
                    >
                        Continue as Guest
                    </button>
                </div>

                 <p className="text-xs text-center text-gray-500">
                    For demo purposes, you can enter any email/password or log in as a guest.
                 </p>
            </div>
        </div>
    );
};

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
            <div className="bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg p-6 border border-gray-700 m-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-white">Generate Image</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-700">
                        <XIcon />
                    </button>
                </div>
                <p className="text-gray-400 mb-4 text-sm">
                    Describe the image you want to create. Be as detailed as you like.
                </p>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., A photorealistic portrait of a cat wearing a tiny top hat..."
                    rows={4}
                    className="w-full bg-gray-900 text-gray-200 placeholder-gray-500 p-3 rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-gray-700"
                    disabled={isLoading}
                />
                <button
                    onClick={handleGenerate}
                    disabled={!prompt.trim() || isLoading}
                    className="w-full mt-4 px-4 py-3 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                    {isLoading ? <LoadingSpinner /> : 'Generate'}
                </button>
            </div>
        </div>
    );
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


const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chat, setChat] = useState<Chat | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const aiRef = useRef<GoogleGenAI | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const stopGenerationRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    setIsAuthenticated(loggedIn);
    setIsAuthLoading(false);
  }, []);

  // Load chat history from localStorage
  useEffect(() => {
    if (isAuthenticated) {
        try {
            const savedMessages = localStorage.getItem('chatHistory');
            if (savedMessages) {
                setMessages(JSON.parse(savedMessages));
            }
        } catch (error) {
            console.error("Could not load chat history:", error);
        }
    }
  }, [isAuthenticated]);

  // Save chat history to localStorage
  useEffect(() => {
    if (isAuthenticated && messages.length > 0) {
        try {
            localStorage.setItem('chatHistory', JSON.stringify(messages));
        } catch (error) {
            console.error("Could not save chat history:", error);
        }
    }
  }, [messages, isAuthenticated]);

  const initChat = useCallback(() => {
    if (!aiRef.current) {
      console.error("AI client not initialized.");
      setMessages([{
        id: 'init-error',
        text: 'AI client failed to initialize.',
        sender: Sender.AI
      }]);
      return;
    }
    try {
      const newChat = aiRef.current.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: 'You are NP10 AI, a helpful and friendly assistant created by an expert developer. Provide clear, concise, and well-formatted answers using markdown for things like bold, italics, and lists.',
        },
      });
      setChat(newChat);
    } catch (error) {
      console.error("Error initializing Gemini chat:", error);
       setMessages([{
            id: 'init-error',
            text: 'Failed to initialize the AI model. Please check the console for errors.',
            sender: Sender.AI
          }]);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
        try {
            if (!process.env.API_KEY) {
                console.error("API_KEY environment variable not set.");
                setMessages([{
                    id: 'api-key-error',
                    text: 'Error: API key is not configured. Please set the API_KEY environment variable.',
                    sender: Sender.AI
                }]);
                return;
            }
            if (!aiRef.current) {
                aiRef.current = new GoogleGenAI({ apiKey: process.env.API_KEY });
            }
            initChat();
        } catch (error) {
            console.error("Error initializing GoogleGenAI:", error);
            setMessages([{
                id: 'init-error',
                text: 'Failed to initialize the AI model. Please check the console for errors.',
                sender: Sender.AI
            }]);
        }
    }
}, [isAuthenticated, initChat]);


  const startTimer = useCallback(() => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    setElapsedTime(0);
    timerRef.current = window.setInterval(() => {
        setElapsedTime(prevTime => prevTime + 1);
    }, 1000);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
        startTimer();
    }
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [isAuthenticated, startTimer]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleStopGeneration = () => {
    stopGenerationRef.current = true;
  };

  const handleGenerateImage = useCallback(async (prompt: string) => {
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

    setMessages(prev => [...prev, userMessage, aiMessagePlaceholder]);
    setIsLoading(true);

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
        
        if (stopGenerationRef.current) {
            setMessages(prev => prev.filter(p => p.id !== userMessage.id && p.id !== aiMessagePlaceholder.id));
            return;
        }
        
        const base64ImageBytes = response.generatedImages[0].image.imageBytes;
        const initialImageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;
        const watermarkedImageUrl = await addWatermark(initialImageUrl, 'Chat عبد الجبار');

        setMessages(prev =>
            prev.map(msg =>
                msg.id === aiMessagePlaceholder.id
                ? { ...msg, text: '', image: watermarkedImageUrl, isLoadingImage: false }
                : msg
            )
        );
    } catch (error) {
        console.error("Error generating image:", error);
        let errorMessage = "Sorry, I was unable to generate the image. Please try another prompt.";
        if (error instanceof Error && error.message.toLowerCase().includes('blocked')) {
            errorMessage = "The image generation was blocked due to safety policies. Please try a different prompt.";
        }
        setMessages(prev =>
            prev.map(msg =>
                msg.id === aiMessagePlaceholder.id
                ? { ...msg, text: errorMessage, isLoadingImage: false }
                : msg
            )
        );
    } finally {
        setIsLoading(false);
        stopGenerationRef.current = false;
    }
  }, []);


  const handleSendMessage = useCallback(async (text: string, image?: string) => {
    if (text.trim().toLowerCase().startsWith('/imagine ')) {
        const imagePrompt = text.substring('/imagine '.length).trim();
        await handleGenerateImage(imagePrompt);
        return;
    }
      
    stopGenerationRef.current = false;

    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: Sender.User,
      image,
    };
    
    const aiMessagePlaceholder: Message = {
      id: (Date.now() + 1).toString(),
      text: '',
      sender: Sender.AI,
    };

    setMessages(prev => [...prev, userMessage, aiMessagePlaceholder]);
    setIsLoading(true);

    if (!chat) return;

    try {
      const parts: Part[] = [];
      if (image) {
          const mimeType = image.match(/data:(.*);base64,/)?.[1];
          const base64Data = image.split(',')[1];
          if (mimeType && base64Data) {
              parts.push({
                  inlineData: {
                      mimeType,
                      data: base64Data,
                  }
              });
          }
      }
      if (text) {
        parts.push({ text });
      }

      const result = await chat.sendMessageStream({ message: parts });
      let accumulatedText = '';

      for await (const chunk of result) {
        if (stopGenerationRef.current) {
          break;
        }
        accumulatedText += chunk.text;
        setMessages(prev =>
          prev.map(msg =>
            msg.id === aiMessagePlaceholder.id
              ? { ...msg, text: accumulatedText }
              : msg
          )
        );
      }
    } catch (error) {
      console.error("Error sending message:", error);
      let errorMessage = "Sorry, an unexpected error occurred. Please try again.";
      if (error instanceof Error) {
        if (error.message.includes('API key not valid')) {
          errorMessage = "Error: The API key is not valid. Please check your configuration.";
        } else if (error.message.includes('rate limit')) {
          errorMessage = "You've sent too many messages in a short period. Please wait a moment and try again.";
        } else if (error.message.toLowerCase().includes('blocked')) {
           errorMessage = "My response was blocked due to safety settings. Please try rephrasing your message.";
        } else {
           errorMessage = `An error occurred: ${error.message}`;
        }
      }
      setMessages(prev =>
        prev.map(msg =>
          msg.id === aiMessagePlaceholder.id
            ? { ...msg, text: errorMessage }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
      stopGenerationRef.current = false;
    }
  }, [chat, handleGenerateImage]);
  
  const startNewChat = () => {
    if (isLoading) {
      handleStopGeneration();
    }
    setMessages([]);
    setIsLoading(false);
    initChat();
    try {
      localStorage.removeItem('chatHistory');
    } catch (error) {
      console.error("Could not clear chat history:", error);
    }
  };
  
  const handleLoginSuccess = () => {
    localStorage.setItem('isLoggedIn', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('chatHistory');
      setIsAuthenticated(false);
      setMessages([]);
      setChat(null);
      aiRef.current = null;
  };

  if (isAuthLoading) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900">
            <svg className="animate-spin h-10 w-10 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <>
      <ImageGenerationModal 
          isOpen={isImageModalOpen} 
          onClose={() => setIsImageModalOpen(false)} 
          onGenerate={handleGenerateImage} 
      />
      <div className="flex h-screen font-sans bg-gray-900 text-gray-200">
        <div className="w-64 bg-gray-950 p-4 flex-col border-r border-gray-800 hidden md:flex">
            <div className="flex items-center gap-3 mb-6">
                <Np10Logo />
                <h1 className="text-xl font-bold text-white">NP10 AI</h1>
            </div>
            <button 
                onClick={startNewChat}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
                <PlusIcon />
                New Chat
            </button>
            
            <div className="mt-auto">
               <div className="text-center text-xs text-gray-500 mb-4">
                  Session time: {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
              >
                <LogoutIcon />
                Log out
              </button>
            </div>
        </div>

        <div className="flex-1 flex flex-col">
          <main className="flex-1 overflow-y-auto p-4">
            <div className="max-w-4xl mx-auto h-full">
              {messages.length === 0 && !isLoading ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                      <Np10Logo />
                      <h2 className="mt-4 text-2xl font-semibold text-gray-300">How can I help you today?</h2>
                      <p className="mt-2 text-sm">
                        Try asking a question or generate an image with <code className="bg-gray-700 text-gray-300 p-1 rounded-md">/imagine a cat wearing a hat</code>
                      </p>
                  </div>
              ) : (
                <div>
                  {messages.map((msg, index) => (
                    <MessageComponent 
                      key={msg.id} 
                      message={msg} 
                      isStreaming={isLoading && index === messages.length - 1}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </main>
          <footer className="py-4 bg-gray-900/50 backdrop-blur-sm">
            <ChatInput 
              onSendMessage={handleSendMessage} 
              isLoading={isLoading}
              onStopGeneration={handleStopGeneration}
              onToggleImageModal={() => setIsImageModalOpen(true)}
            />
            <p className="text-xs text-center text-gray-600 mt-3">
              NP10 AI can make mistakes. Consider checking important information.
            </p>
          </footer>
        </div>
      </div>
    </>
  );
};

export default App;