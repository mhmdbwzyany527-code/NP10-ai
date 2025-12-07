
import React, { useState } from 'react';
import { Message, Sender } from '../types';
import { AiIcon, UserIcon, CopyIcon, LoadingSpinner, DownloadIcon, CheckIcon, RefreshCwIcon, CodeHtmlIcon, CodeCssIcon, CodeJsIcon, BrushIcon, ExternalLinkIcon } from './Icons';

interface MessageProps {
  message: Message;
  isStreaming?: boolean;
  onRetry?: () => void;
  onEditImage: (messageId: string, currentImage: string) => void;
  userPictureUrl?: string | null;
  showXpGain?: number;
}

// FIX: The original highlightSyntax function and its rule definitions were causing scoping and type errors.
// The rules have been moved outside the function for better performance and to resolve potential scoping issues.
// The function logic is now self-contained and correct, and a bug in the replace logic was fixed.
const jsRules: [RegExp, string][] = [
    [/\b(const|let|var|function|return|if|else|for|while|import|export|from|async|await|new|class|extends|super|true|false|null)\b/g, 'keyword'],
    [/(\/\*[\s\S]*?\*\/|\/\/.*)/g, 'comment'],
    [/('.*?'|".*?"|`.*?`)/gs, 'string'],
    [/\b(\d+)\b/g, 'number'],
    [/([=+\-*/%<>!&|?:]|[{}()[\].,;])/g, 'punctuation'],
    [/([a-zA-Z_]\w*)(?=\()/g, 'function'],
];

const cssRules: [RegExp, string | ((...args: string[]) => string)][] = [
    [/(\/\*[\s\S]*?\*\/)/g, 'comment'],
    [/(#[a-zA-Z0-9_-]+|(?<=\.)[a-zA-Z0-9_-]+|:[a-zA-Z-]+)/g, 'tag'], // selector
    [/([a-zA-Z-]+)(?=\s*:)/g, 'attr-name'], // property
    [/('.*?'|".*?")/g, 'string'],
    [/([a-zA-Z-]+:\s*)(.*?)(?=[;}])/g, (match, p1, p2) => `${p1}<span class="token attr-value">${p2}</span>`], // value
    [/\b(\d+(?:\.\d+)?)(px|em|rem|%|vh|vw|s|ms)\b/g, 'number'],
];

const htmlRules: [RegExp, string | ((...args: string[]) => string)][] = [
    [/<!--[\s\S]*?-->/g, 'comment'],
    [/(<\/?)([a-zA-Z0-9-]+)/g, (match, p1, p2) => `${p1}<span class="token tag">${p2}</span>`], // tags
    [/(\s[a-zA-Z-]+)=/g, (match, p1) => `<span class="token attr-name">${p1}</span>=`], // attributes
    [/(".*?")/g, (match) => `"<span class="token attr-value">${match.slice(1, -1)}</span>"`], // attribute values
];

// Simple syntax highlighter for JS, CSS, and HTML
const highlightSyntax = (code: string, language: string) => {
    let highlightedCode = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const lang = language.toLowerCase();
    let rules: [RegExp, string | ((...args: string[]) => string)][] = [];
    
    if (lang === 'js' || lang === 'javascript' || lang === 'ts' || lang === 'typescript' || lang === 'jsx') {
        rules = jsRules;
    } else if (lang === 'css') {
        rules = cssRules;
    } else if (lang === 'html' || lang === 'xml' || lang === 'svg') {
        rules = htmlRules;
    }

    for (const [regex, className] of rules) {
         highlightedCode = highlightedCode.replace(regex, (match, ...args) => {
            if (typeof className === 'string') {
                // To prevent highlighting inside other tokens
                if (args.slice(-2, -1)[0] && typeof args.slice(-2, -1)[0] === 'string' && args.slice(-2, -1)[0].includes('token')) return match;
                return `<span class="token ${className}">${match}</span>`;
            }
            return className(match, ...args);
        });
    }

    return highlightedCode;
};


const CodeBlock: React.FC<{ code: string; language: string }> = ({ code, language }) => {
    const [isCopied, setIsCopied] = useState(false);
    
    const handleCopy = () => {
        navigator.clipboard.writeText(code).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };
    
    const langDisplay = language ? language.toUpperCase() : 'CODE';
    const LangIcon = {
        HTML: CodeHtmlIcon,
        CSS: CodeCssIcon,
        JS: CodeJsIcon,
        JAVASCRIPT: CodeJsIcon
    }[langDisplay] || null;

    return (
        <div className="bg-slate-900/80 rounded-xl my-4 border border-slate-700/50 shadow-lg overflow-hidden">
            <div className="flex justify-between items-center px-4 py-2 bg-slate-800/80 border-b border-slate-700/50">
                <div className="flex items-center gap-2">
                    {LangIcon && <LangIcon />}
                    <span className="text-xs font-semibold text-slate-300 tracking-wider">{langDisplay}</span>
                </div>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-2 py-1 bg-slate-700 rounded-md text-xs text-slate-300 hover:bg-slate-600 hover:text-white transition-colors"
                    aria-label={isCopied ? "Copied" : "Copy code"}
                >
                    {isCopied ? <><CheckIcon /> Copied</> : <><CopyIcon /> Copy</>}
                </button>
            </div>
            <pre className="p-4 overflow-x-auto text-sm leading-relaxed">
                <code dangerouslySetInnerHTML={{ __html: highlightSyntax(code, language) }} />
            </pre>
        </div>
    );
};

const ImageSkeleton: React.FC = () => (
    <div className="w-64 h-64 mb-2 rounded-lg bg-gray-300 dark:bg-slate-700 animate-pulse"></div>
);

const CanvasSkeleton: React.FC<{loadingText?: string}> = ({loadingText}) => (
    <div className="w-full aspect-video mb-2 rounded-lg bg-gray-200 dark:bg-slate-600/50 animate-pulse flex flex-col items-center justify-center p-4 text-current">
        <div className="text-indigo-500 dark:text-indigo-400">
            <BrushIcon />
        </div>
        <p className="mt-2 text-sm text-center whitespace-normal">{loadingText || "Building your creation..."}</p>
    </div>
);

const formatText = (text: string) => {
    if (!text) return null;
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts = text.split(codeBlockRegex);

    return parts.map((part, index) => {
        if (index % 3 === 1) { // This is the language part, which will be handled by the code block
            return null;
        }
        if (index % 3 === 2) { // This is the code block content
            const language = parts[index - 1] || 'plaintext';
            return <CodeBlock key={index} code={part.trim()} language={language} />;
        }
        
        // This is regular text
        if (!part) return null;

        let html = part
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            // Block elements
            .replace(/^\s*>\s*(.*)/gm, '<blockquote class="border-l-4 border-gray-300 dark:border-slate-600 pl-4 italic my-2">$1</blockquote>')
            .replace(/^(---|\*\*\*)$/gm, '<hr class="my-4 border-gray-300 dark:border-slate-600" />')
            // Inline elements
            .replace(/`([^`]+)`/g, '<code class="bg-gray-200 dark:bg-slate-800 text-red-500 dark:text-red-400 px-1.5 py-0.5 rounded-md text-sm">$1</code>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
            .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italics
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-indigo-400 hover:underline">$1</a>') // Links
            
            // List elements
            .replace(/^\s*[-*] (.*)/gm, '<li data-list="ul">$1</li>')
            .replace(/^\s*\d+\. (.*)/gm, '<li data-list="ol">$1</li>');

        // Wrap consecutive list items
        html = html.replace(/(<li data-list="ul">.*?<\/li>\s*)+/gs, (match) => `<ul class="list-disc list-inside space-y-1 my-2">${match}</ul>`);
        html = html.replace(/(<li data-list="ol">.*?<\/li>\s*)+/gs, (match) => `<ol class="list-decimal list-inside space-y-1 my-2">${match}</ol>`);

        // Clean up markers and merge adjacent lists
        html = html.replace(/ data-list="(ul|ol)"/g, '')
                   .replace(/<\/ul>\s*<ul>/g, '')
                   .replace(/<\/ol>\s*<ol>/g, '');
        
        // Handle line breaks and spacing around block elements
        html = html.replace(/\n/g, '<br />')
            .replace(/<br \/>\s*(<(ul|ol|li|blockquote|hr))/g, '$1')
            .replace(/(<\/(ul|ol|li|blockquote|hr))>(\s*<br \/>)*/g, '$1>')
            .replace(/(<br \/>\s*){2,}/g, '<br />');

        return <div key={index} dangerouslySetInnerHTML={{ __html: html }} />;
    }).filter(Boolean); // Filter out null parts
};

const ImageGrid: React.FC<{ images: string[] }> = ({ images }) => {
    const count = images.length;
    if (count === 0) return null;

    if (count === 1) {
        return (
            <div className="mb-2 max-w-xs">
                <img src={images[0]} alt="Uploaded content 1" className="rounded-lg w-full h-auto object-cover" />
            </div>
        );
    }
    
    const layouts = {
        2: 'image-grid-2',
        3: 'image-grid-3',
        4: 'image-grid-4',
    };
    const layoutClass = layouts[count] || 'image-grid-5'; // Default for 5+

    const displayedImages = images.slice(0, count > 4 ? 3 : 4);
    const remainingCount = count - displayedImages.length;

    return (
        <div className={`mb-2 image-grid-container ${layoutClass}`}>
            {displayedImages.map((src, idx) => (
                <div key={idx}>
                    <img src={src} alt={`Uploaded content ${idx + 1}`} />
                    {idx === displayedImages.length - 1 && remainingCount > 0 && (
                        <div className="image-grid-overlay">
                            +{remainingCount + 1}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};


const MessageComponent: React.FC<MessageProps> = ({ message, isStreaming, onRetry, userPictureUrl, onEditImage, showXpGain }) => {
  const isUser = message.sender === Sender.User;
  const isError = message.isError;
  const [isTextCopied, setIsTextCopied] = useState(false);

  const handleDownloadImage = () => {
    if (!message.image) return;
    const link = document.createElement('a');
    link.href = message.image;
    link.download = `np10-ai-image-${Date.now()}.jpeg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
    
  const handleDownloadVideo = () => {
    if (!message.video) return;
    const link = document.createElement('a');
    link.href = message.video;
    link.download = `np10-ai-video-${Date.now()}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleCopyMessage = () => {
    if (!message.text) return;
    navigator.clipboard.writeText(message.text).then(() => {
        setIsTextCopied(true);
        setTimeout(() => setIsTextCopied(false), 2000);
    });
  };

  const handleOpenInNewTab = () => {
      if (!message.canvasCode) return;
      const blob = new Blob([message.canvasCode], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      // Revoke the URL after a short delay to allow the new tab to open
      setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const hasContent = message.text || message.image || message.video || message.isLoading || message.isLoadingImage || message.canvasCode || message.isLoadingCanvas;
  if (!hasContent) return null;

  return (
    <div className={`flex items-start gap-4 py-6 fade-in ${isUser ? 'justify-end' : ''}`}>
      {!isUser && <AiIcon />}
      <div className={`relative flex flex-col max-w-2xl w-full ${isUser ? 'items-end' : 'items-start'}`}>
         {isUser && showXpGain && (
            <div key={message.id} className="xp-gain-indicator text-xs font-bold text-indigo-500 bg-indigo-500/10 px-2 py-1 rounded-full">
                +{showXpGain} XP
            </div>
        )}
        <div 
          className={`relative group px-5 py-3 rounded-2xl w-full ${isUser 
            ? 'bg-indigo-600 text-white rounded-br-none' 
            : isError 
            ? 'bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-300 rounded-bl-none shadow-md border border-red-200 dark:border-red-500/30'
            : 'bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-bl-none shadow-md'}`}
        >
          {!isUser && message.text && !isError && (
            <div className="absolute top-2 right-2 flex gap-1.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button
                    onClick={handleCopyMessage}
                    className="p-1.5 bg-gray-200 dark:bg-slate-800 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-600 hover:text-black dark:hover:text-white transition-colors"
                    aria-label={isTextCopied ? "Copied!" : "Copy text"}
                >
                    {isTextCopied ? <CheckIcon /> : <CopyIcon />}
                </button>
            </div>
          )}

          <div className="prose prose-sm max-w-none dark:prose-invert text-inherit whitespace-pre-wrap leading-relaxed">
            {message.isLoading ? (
                <div className="flex flex-col items-center justify-center p-4 text-current">
                    <LoadingSpinner />
                    {message.loadingText && <p className="mt-2 text-sm text-center whitespace-normal">{message.loadingText}</p>}
                </div>
            ) : message.isLoadingImage ? (
                <ImageSkeleton />
            ) : message.isLoadingCanvas ? (
                <CanvasSkeleton loadingText={message.loadingText} />
            ) : message.canvasCode ? (
                <div className="not-prose my-2">
                    <div className="relative border border-gray-200 dark:border-slate-600 rounded-lg overflow-hidden shadow-md group/canvas">
                        <iframe
                            srcDoc={message.canvasCode}
                            title="Canvas Preview"
                            className="w-full aspect-video bg-white"
                            sandbox="allow-scripts allow-same-origin"
                        />
                         <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover/canvas:opacity-100 transition-opacity">
                            <button
                                onClick={handleOpenInNewTab}
                                className="p-1.5 bg-black/50 backdrop-blur-sm rounded-full text-gray-200 hover:bg-black/75 hover:text-white transition-all"
                                aria-label="Open in new tab"
                            >
                                <ExternalLinkIcon />
                            </button>
                        </div>
                    </div>
                </div>
            ) : message.image ? (
                <div className="relative group/image max-w-xs mb-2 p-0.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                    <img 
                        src={message.image} 
                        alt="Generated content" 
                        className="rounded-md w-full"
                    />
                    {!isUser && (
                        <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover/image:opacity-100 transition-opacity">
                            <button
                                onClick={() => onEditImage(message.id, message.image || '')}
                                className="p-1.5 bg-black/50 backdrop-blur-sm rounded-full text-gray-200 hover:bg-black/75 hover:text-white transition-all"
                                aria-label="Edit image"
                            >
                                <BrushIcon />
                            </button>
                            <button
                                onClick={handleDownloadImage}
                                className="p-1.5 bg-black/50 backdrop-blur-sm rounded-full text-gray-200 hover:bg-black/75 hover:text-white transition-all"
                                aria-label="Download image"
                            >
                                <DownloadIcon />
                            </button>
                        </div>
                    )}
                </div>
            ) : message.video ? (
                 <div className="relative group/video max-w-sm mb-2 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-600 shadow-md">
                    <video 
                        src={message.video} 
                        controls 
                        playsInline
                        className="w-full"
                    />
                     <button
                        onClick={handleDownloadVideo}
                        className="absolute top-2 right-2 p-1.5 bg-black/50 backdrop-blur-sm rounded-full text-gray-200 hover:bg-black/75 hover:text-white transition-all opacity-0 group-hover/video:opacity-100"
                        aria-label="Download video"
                    >
                        <DownloadIcon />
                    </button>
                </div>
            ) : null}

             {message.images && message.images.length > 0 && (
                <ImageGrid images={message.images} />
            )}

            {(isStreaming && !message.text && !message.isLoadingImage && !message.isLoading) ? (
                <LoadingSpinner />
             ) : (
                formatText(message.text)
            )}
            {isStreaming && message.text && <span className="inline-block w-2 h-4 bg-purple-400 animate-pulse ml-1" />}
          </div>
           {isError && onRetry && (
                <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-500/30 flex items-center justify-end">
                    <button 
                      onClick={onRetry} 
                      className="flex items-center gap-1.5 text-xs font-semibold text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100 transition-colors"
                      aria-label="Retry request"
                    >
                        <RefreshCwIcon />
                        Retry
                    </button>
                </div>
            )}
        </div>
         {message.sources && message.sources.length > 0 && !isUser && (
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 max-w-2xl">
                <span className="font-semibold">Sources:</span>
                <ol className="list-decimal list-inside mt-1">
                    {message.sources.map((source, index) => (
                        <li key={index} className="truncate">
                            <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">
                                {source.title || new URL(source.uri).hostname}
                            </a>
                        </li>
                    ))}
                </ol>
            </div>
        )}
      </div>
      {isUser && <UserIcon pictureUrl={userPictureUrl} />}
    </div>
  );
};

export default MessageComponent;
