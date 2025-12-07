

import React, { useState, useCallback, useRef } from 'react';
import { XIcon, UploadCloudIcon, LoadingSpinner, ImageIcon } from './Icons';
import { fileToBase64 } from '../utils'; // Assuming you create a utils file for this

export type VideoConfig = {
    prompt: string;
    image?: { data: string; mimeType: string; };
    aspectRatio: '16:9' | '9:16';
    resolution: '720p' | '1080p';
}

interface VideoGenerationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (config: VideoConfig) => Promise<void>;
}

const VideoGenerationModal: React.FC<VideoGenerationModalProps> = ({ isOpen, onClose, onGenerate }) => {
    const [prompt, setPrompt] = useState('');
    const [image, setImage] = useState<{ data: string; mimeType: string; file: File } | null>(null);
    const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
    const [resolution, setResolution] = useState<'720p' | '1080p'>('1080p');
    const [isLoading, setIsLoading] = useState(false);
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const resetState = () => {
        setPrompt('');
        setImage(null);
        setAspectRatio('16:9');
        setResolution('1080p');
        setIsLoading(false);
        setError(null);
        setIsDraggingOver(false);
    };

    const handleClose = () => {
        if (isLoading) return;
        resetState();
        onClose();
    };

    const processFile = useCallback(async (file: File) => {
        if (!file.type.startsWith('image/')) {
            setError('Please upload a valid image file (PNG, JPG, etc.).');
            return;
        }
        if (file.size > 4 * 1024 * 1024) { // 4MB limit
            setError(`Image exceeds the 4MB size limit.`);
            return;
        }
        setError(null);
        const base64 = await fileToBase64(file);
        setImage({ data: base64.split(',')[1], mimeType: file.type, file });
    }, []);
    
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            await processFile(e.target.files[0]);
        }
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(false);
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            await processFile(e.dataTransfer.files[0]);
            e.dataTransfer.clearData();
        }
    };

    const handleGenerate = async () => {
        if (!prompt.trim() && !image) {
            setError("A prompt or an image is required.");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            await onGenerate({ 
                prompt: prompt.trim(), 
                image: image ? { data: image.data, mimeType: image.mimeType } : undefined,
                aspectRatio, 
                resolution 
            });
            handleClose();
        } catch (e) {
            console.error("Video generation failed:", e);
            setError("Generation failed. Please try again.");
            setIsLoading(false);
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 transition-opacity" onClick={handleClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl border border-gray-200 dark:border-slate-700 m-4 flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-slate-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Generate Video</h2>
                    <button onClick={handleClose} className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700">
                        <XIcon />
                    </button>
                </div>
                <div className="p-6 space-y-4 overflow-y-auto">
                    <div>
                        <label htmlFor="video-prompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                           Prompt
                        </label>
                         <textarea
                            id="video-prompt"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="A neon hologram of a cat driving at top speed..."
                            rows={4}
                            className="w-full bg-gray-100 dark:bg-slate-900 text-gray-800 dark:text-gray-200 placeholder-gray-500 p-3 rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-gray-300 dark:border-slate-700"
                            disabled={isLoading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                           Optional Start Image
                        </label>
                         {!image ? (
                             <div 
                                className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDraggingOver ? 'border-indigo-500 bg-indigo-500/10' : 'border-gray-300 dark:border-slate-600 hover:border-indigo-400 dark:hover:border-indigo-500'}`}
                                onClick={() => fileInputRef.current?.click()}
                                onDragEnter={handleDragEnter}
                                onDragOver={handleDragEnter}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                            >
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                                <UploadCloudIcon />
                                <p className="mt-2 font-semibold text-gray-700 dark:text-gray-300">Click to upload or drag & drop</p>
                                <p className="text-xs text-gray-500">PNG, JPG, WEBP up to 4MB</p>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4">
                                <img src={URL.createObjectURL(image.file)} alt="Preview" className="h-20 w-20 object-cover rounded-lg shadow-md" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{image.file.name}</p>
                                    <p className="text-xs text-gray-500">{(image.file.size / 1024).toFixed(1)} KB</p>
                                    <button onClick={() => setImage(null)} className="mt-1 text-xs text-indigo-500 hover:underline">
                                        Remove image
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label htmlFor="aspect-ratio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Aspect Ratio</label>
                           <select id="aspect-ratio" value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as '16:9' | '9:16')} className="w-full bg-gray-100 dark:bg-slate-900 text-gray-800 dark:text-gray-200 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-gray-300 dark:border-slate-700">
                               <option value="16:9">16:9 (Landscape)</option>
                               <option value="9:16">9:16 (Portrait)</option>
                           </select>
                        </div>
                         <div>
                           <label htmlFor="resolution" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Resolution</label>
                           <select id="resolution" value={resolution} onChange={(e) => setResolution(e.target.value as '720p' | '1080p')} className="w-full bg-gray-100 dark:bg-slate-900 text-gray-800 dark:text-gray-200 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-gray-300 dark:border-slate-700">
                               <option value="1080p">1080p</option>
                               <option value="720p">720p</option>
                           </select>
                        </div>
                    </div>
                     {error && (
                        <p className="text-sm text-center text-red-500 dark:text-red-400">{error}</p>
                    )}
                </div>
                <div className="p-4 border-t border-gray-200 dark:border-slate-700">
                     <button
                        onClick={handleGenerate}
                        disabled={(!prompt.trim() && !image) || isLoading}
                        className="w-full px-4 py-3 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:bg-gray-500 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                    >
                        {isLoading ? <LoadingSpinner /> : 'Generate Video'}
                    </button>
                     <p className="text-xs text-center text-gray-500 dark:text-gray-600 mt-2">
                        Video generation can take several minutes.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default VideoGenerationModal;