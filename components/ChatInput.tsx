import React, { useState, useRef, useEffect } from 'react';
import { SendIcon, PaperclipIcon, StopIcon, XIcon, ImageIcon } from './Icons';

interface ChatInputProps {
  onSendMessage: (message: string, image?: string) => void;
  isLoading: boolean;
  onStopGeneration: () => void;
  onToggleImageModal: () => void;
}

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading, onStopGeneration, onToggleImageModal }) => {
  const [input, setInput] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSend = () => {
    if ((input.trim() || image) && !isLoading) {
      onSendMessage(input.trim(), image || undefined);
      setInput('');
      setImage(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          if (file.size > 4 * 1024 * 1024) { // 4MB limit
            alert('Image size should not exceed 4MB.');
            return;
          }
          const base64 = await fileToBase64(file);
          setImage(base64);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
  };

  const handleAttachClick = () => {
      fileInputRef.current?.click();
  };
  
  const removeImage = () => {
      setImage(null);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      <div className="relative rounded-2xl bg-gray-800 border border-gray-700 shadow-lg flex flex-col">
        {image && (
            <div className="p-2 pl-6 pt-4">
                <div className="relative inline-block">
                    <img src={image} alt="Preview" className="h-20 w-20 object-cover rounded-md" />
                    <button onClick={removeImage} className="absolute -top-2 -right-2 bg-gray-700 rounded-full p-0.5 text-white hover:bg-gray-600">
                        <XIcon />
                    </button>
                </div>
            </div>
        )}
        <div className="flex items-center">
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange}
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
            />
             <button
                onClick={handleAttachClick}
                disabled={isLoading}
                className="p-2 ml-4 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                aria-label="Attach image"
            >
                <PaperclipIcon />
            </button>
            <button
                onClick={onToggleImageModal}
                disabled={isLoading}
                className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                aria-label="Generate an image"
            >
                <ImageIcon />
            </button>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="اكتب رسالتك هنا..."
              rows={1}
              className="w-full bg-transparent text-gray-200 placeholder-gray-500 py-4 pl-2 pr-16 resize-none focus:outline-none max-h-48"
              disabled={isLoading}
            />
            <button
              onClick={isLoading ? onStopGeneration : handleSend}
              disabled={!isLoading && !input.trim() && !image}
              className="absolute right-4 bottom-3.5 p-2 rounded-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
              aria-label={isLoading ? "Stop generation" : "Send message"}
            >
              {isLoading ? <StopIcon /> : <SendIcon isDisabled={!input.trim() && !image} />}
            </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;