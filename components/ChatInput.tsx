
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { PlusIcon, XIcon, UploadCloudIcon, PaperPlaneIcon, StopCircleIcon, ImageIcon, AnalyzeImageIcon, CameraIcon, PaperclipIcon, MicrophoneIcon, CodeHtmlIcon, CodeCssIcon, CodeJsIcon, LoadingSpinner } from './Icons';
import SupportHeart from './SupportHeart';
import { UserProfile } from '../types';

type ImageUpload = { id: number; dataUrl: string; file: File; isLoading: boolean };

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  imageUploads: ImageUpload[];
  onRemoveImage: (id: number) => void;
  onProcessFiles: (files: FileList) => Promise<void>;
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  isChatReady: boolean;
  onStopGeneration: () => void;
  // New props for actions from the pop-up menu
  onGenerateImageClick: () => void;
  onAnalyzeImageClick: () => void;
  onCameraClick: () => void;
  onUploadClick: () => void;
  onMicClick: () => void;
  onSendCodeMessage: (codeType: 'html' | 'css' | 'js') => void;
  // For Speech-to-text
  isListening: boolean;
  onToggleListening: () => void;
  // For support heart
  userProfile: UserProfile;
  onHeartClick: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
    input, setInput, imageUploads, onRemoveImage, onProcessFiles, 
    onSendMessage, isLoading, isChatReady, onStopGeneration,
    onGenerateImageClick, onAnalyzeImageClick, onCameraClick, 
    onUploadClick, onMicClick, onSendCodeMessage,
    isListening, onToggleListening,
    userProfile, onHeartClick
}) => {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const dragCounter = useRef(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const actionsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${scrollHeight}px`;
    }
  }, [input]);

  // Close actions menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
        setIsActionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSend = () => {
    if ((input.trim() || imageUploads.length > 0) && !isLoading && isChatReady) {
      onSendMessage(input.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDraggingOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDraggingOver(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    dragCounter.current = 0;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await onProcessFiles(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  }, [onProcessFiles]);

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragEnter} // Re-use enter logic
      onDrop={handleDrop}
      className={`max-w-4xl mx-auto px-4 relative transition-all duration-300 ${isDraggingOver ? 'scale-105' : ''}`}
    >
      {isDraggingOver && (
        <div className="absolute inset-0 bg-indigo-500/10 border-2 border-dashed border-indigo-500 rounded-2xl flex flex-col items-center justify-center pointer-events-none z-20">
          <UploadCloudIcon />
          <p className="mt-2 text-indigo-500 font-semibold">Drop files to upload</p>
        </div>
      )}
      
      {imageUploads.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {imageUploads.map(upload => (
            <div key={upload.id} className="relative group w-16 h-16">
              {upload.isLoading ? (
                <div className="w-full h-full bg-gray-200 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                  <LoadingSpinner />
                </div>
              ) : (
                <img src={upload.dataUrl} alt="Upload preview" className="w-full h-full object-cover rounded-lg" />
              )}
              <button
                onClick={() => onRemoveImage(upload.id)}
                className="absolute -top-1 -right-1 bg-gray-800 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <XIcon />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="relative flex items-end gap-2 p-2 bg-gray-100 dark:bg-slate-900/80 rounded-xl shadow-md border border-gray-200 dark:border-slate-700">
        <SupportHeart 
            level={userProfile.supportLevel}
            clicks={userProfile.supportClicks}
            onClick={onHeartClick}
        />
        <div className="relative" ref={actionsMenuRef}>
          <button
            onClick={() => setIsActionsOpen(prev => !prev)}
            className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
          >
            <PlusIcon />
          </button>
          {isActionsOpen && (
            <div className="absolute bottom-full left-0 mb-2 w-52 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 p-2 z-10">
              <button onClick={() => { onGenerateImageClick(); setIsActionsOpen(false); }} className="w-full text-left flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 text-sm">
                <ImageIcon /> Generate Image
              </button>
              <button onClick={() => { onAnalyzeImageClick(); setIsActionsOpen(false); }} className="w-full text-left flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 text-sm">
                <AnalyzeImageIcon /> Analyze Image
              </button>
              <button onClick={() => { onCameraClick(); setIsActionsOpen(false); }} className="w-full text-left flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 text-sm">
                <CameraIcon /> Use Camera
              </button>
              <button onClick={() => { onUploadClick(); setIsActionsOpen(false); }} className="w-full text-left flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 text-sm">
                <PaperclipIcon /> Upload File
              </button>
              <div className="border-t border-gray-200 dark:border-slate-700 my-1"></div>
              <p className="px-2 py-1 text-xs text-gray-500">Generate Code:</p>
              <button onClick={() => { onSendCodeMessage('html'); setIsActionsOpen(false); }} className="w-full text-left flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 text-sm">
                  <CodeHtmlIcon /> HTML from Prompt
              </button>
              <button onClick={() => { onSendCodeMessage('css'); setIsActionsOpen(false); }} className="w-full text-left flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 text-sm">
                  <CodeCssIcon /> CSS from Prompt
              </button>
              <button onClick={() => { onSendCodeMessage('js'); setIsActionsOpen(false); }} className="w-full text-left flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 text-sm">
                  <CodeJsIcon /> JS from Prompt
              </button>
            </div>
          )}
        </div>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message, or drop images here..."
          rows={1}
          className="flex-1 bg-transparent resize-none p-2 focus:outline-none placeholder-gray-500 dark:placeholder-gray-400 max-h-48"
          disabled={isLoading || !isChatReady}
        />
        <button
          onClick={onToggleListening}
          className={`flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full transition-colors ${isListening ? 'bg-red-500/20 text-red-500' : 'bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-600'}`}
          disabled={isLoading}
        >
          <MicrophoneIcon isListening={isListening} />
        </button>
        {isLoading ? (
          <button
            onClick={onStopGeneration}
            className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
          >
            <StopCircleIcon />
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={(!input.trim() && imageUploads.length === 0) || !isChatReady}
            className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-500 disabled:bg-gray-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
          >
            <PaperPlaneIcon />
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatInput;
