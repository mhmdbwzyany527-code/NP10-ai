
import React, { useState, useCallback, useRef } from 'react';
import { XIcon, UploadCloudIcon, LoadingSpinner } from './Icons';
import { fileToBase64 } from '../utils';

interface ImageAnalyzerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAnalyze: (imageData: string, prompt: string) => Promise<void>;
}

const ImageAnalyzerModal: React.FC<ImageAnalyzerModalProps> = ({ isOpen, onClose, onAnalyze }) => {
    const [image, setImage] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const resetState = () => {
        setImage(null);
        setPrompt('');
        setIsLoading(false);
        setError(null);
        setIsDraggingOver(false);
    };

    const handleClose = () => {
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
        setImage(base64);
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

    const handleAnalyze = async () => {
        if (!image) return;
        setIsLoading(true);
        setError(null);
        try {
            await onAnalyze(image, prompt.trim());
            handleClose();
        } catch (e) {
            setError("Analysis failed. Please try again.");
            setIsLoading(false);
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 transition-opacity" onClick={handleClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl border border-gray-200 dark:border-slate-700 m-4 flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-slate-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Fast Image Analyzer</h2>
                    <button onClick={handleClose} className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700">
                        <XIcon />
                    </button>
                </div>
                <div className="p-6 space-y-4 overflow-y-auto">
                    {!image ? (
                         <div 
                            className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDraggingOver ? 'border-indigo-500 bg-indigo-500/10' : 'border-gray-300 dark:border-slate-600 hover:border-indigo-400 dark:hover:border-indigo-500'}`}
                            onClick={() => fileInputRef.current?.click()}
                            onDragEnter={handleDragEnter}
                            onDragOver={handleDragEnter} // Use same handler to keep state consistent
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                            <UploadCloudIcon />
                            <p className="mt-2 font-semibold text-gray-700 dark:text-gray-300">Click to upload or drag & drop</p>
                            <p className="text-xs text-gray-500">PNG, JPG, WEBP up to 4MB</p>
                        </div>
                    ) : (
                        <div className="text-center">
                            <img src={image} alt="Preview" className="max-h-64 mx-auto rounded-lg shadow-md" />
                             <button onClick={() => setImage(null)} className="mt-2 text-sm text-indigo-500 hover:underline">
                                Change image
                            </button>
                        </div>
                    )}

                     {error && (
                        <p className="text-sm text-center text-red-500 dark:text-red-400">{error}</p>
                    )}

                    <div>
                        <label htmlFor="analyzer-prompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                           Optional: What should I look for?
                        </label>
                         <textarea
                            id="analyzer-prompt"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g., 'Is this food safe for a dog to eat?' or 'What is the historical context of this painting?' If empty, a general analysis will be performed."
                            rows={3}
                            className="w-full bg-gray-100 dark:bg-slate-900 text-gray-800 dark:text-gray-200 placeholder-gray-500 p-3 rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-gray-300 dark:border-slate-700"
                            disabled={isLoading}
                        />
                    </div>
                </div>
                <div className="p-4 border-t border-gray-200 dark:border-slate-700">
                     <button
                        onClick={handleAnalyze}
                        disabled={!image || isLoading}
                        className="w-full px-4 py-3 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:bg-gray-500 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                    >
                        {isLoading ? <LoadingSpinner /> : 'Analyze Image'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImageAnalyzerModal;