import React, { useState } from 'react';
import { Message, Sender } from '../types';
import { AiIcon, UserIcon, CopyIcon, LoadingSpinner, DownloadIcon } from './Icons';

interface MessageProps {
  message: Message;
  isStreaming?: boolean;
}

const CodeBlock: React.FC<{ code: string }> = ({ code }) => {
    const [isCopied, setIsCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(code).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };

    return (
        <div className="relative group">
            <pre className="bg-gray-800 text-white p-4 pr-12 rounded-md my-2 overflow-x-auto text-sm">
                <code>{code}</code>
            </pre>
            <button
                onClick={handleCopy}
                className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded-md text-gray-300 hover:bg-gray-600 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                aria-label={isCopied ? "Copied" : "Copy code"}
            >
                {isCopied ? '✓' : <CopyIcon />}
            </button>
        </div>
    );
};

const ImageSkeleton: React.FC = () => (
    <div className="w-64 h-64 mb-2 rounded-lg bg-gray-700 animate-pulse"></div>
);

const formatText = (text: string) => {
    const codeBlockRegex = /```([\s\S]*?)```/g;
    const parts = text.split(codeBlockRegex);

    return parts.map((part, index) => {
        if (index % 2 === 1) { // This is a code block
            return <CodeBlock key={index} code={part.trim()} />;
        }
        
        // This is regular text, process other markdown
        const html = part
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
            .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italics
            .replace(/^- (.*$)/gm, '<li class="ml-4 list-disc">$1</li>') // List items
            .replace(/(<li.*?>.*?<\/li>)+/g, '<ul>$&</ul>') // Wrap adjacent li in ul
            .replace(/<\/ul>\s*<ul>/g, '') // Merge adjacent lists
            .replace(/\n/g, '<br />'); // Preserve line breaks

        return <div key={index} dangerouslySetInnerHTML={{ __html: html.replace(/<br \/>(\s*<br \/>)+/g, '<br />') }} />;
    });
};


const MessageComponent: React.FC<MessageProps> = ({ message, isStreaming }) => {
  const isUser = message.sender === Sender.User;
  const [isTextCopied, setIsTextCopied] = useState(false);

  const handleDownload = () => {
    if (!message.image) return;
    const link = document.createElement('a');
    link.href = message.image;
    link.download = `np10-ai-image-${Date.now()}.jpeg`;
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

  return (
    <div className={`flex items-start gap-4 py-6 ${isUser ? 'justify-end' : ''}`}>
      {!isUser && <AiIcon />}
      <div className={`flex flex-col max-w-2xl ${isUser ? 'items-end' : 'items-start'}`}>
        <div 
          className={`relative group px-5 py-3 rounded-2xl ${isUser 
            ? 'bg-indigo-600 text-white rounded-br-none' 
            : 'bg-gray-700 text-gray-200 rounded-bl-none'}`}
        >
          {!isUser && message.text && (
             <button
                onClick={handleCopyMessage}
                className="absolute top-2 right-2 p-1.5 bg-gray-800 rounded-md text-gray-300 hover:bg-gray-600 hover:text-white transition-colors opacity-0 group-hover:opacity-100 z-10"
                aria-label={isTextCopied ? "Copied!" : "Copy text"}
            >
                {isTextCopied ? '✓' : <CopyIcon />}
            </button>
          )}

          <div className="prose prose-invert prose-sm max-w-none text-white whitespace-pre-wrap">
            {message.isLoadingImage ? (
                <ImageSkeleton />
            ) : message.image && (
                <div className="relative group/image max-w-xs mb-2 p-0.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                    <img 
                        src={message.image} 
                        alt="Generated content" 
                        className="rounded-md w-full"
                    />
                    {!isUser && (
                        <button
                            onClick={handleDownload}
                            className="absolute top-2 right-2 p-1.5 bg-black/50 backdrop-blur-sm rounded-full text-gray-200 hover:bg-black/75 hover:text-white transition-all opacity-0 group-hover/image:opacity-100"
                            aria-label="Download image"
                        >
                            <DownloadIcon />
                        </button>
                    )}
                </div>
            )}
            {isStreaming && !message.text && !message.isLoadingImage ? (
                <LoadingSpinner />
             ) : (
                formatText(message.text)
            )}
            {isStreaming && message.text && <span className="inline-block w-2 h-4 bg-purple-400 animate-pulse ml-1" />}
          </div>
        </div>
      </div>
      {isUser && <UserIcon />}
    </div>
  );
};

export default MessageComponent;