
import React from 'react';
import { MenuIcon, DownloadIcon } from './Icons';
import LiveUserCounter from './LiveUserCounter';

interface ChatHeaderProps {
    onMenuClick: () => void;
    title: string;
    onExportChat: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ onMenuClick, title, onExportChat }) => {
    return (
        <div className="flex items-center p-4 border-b border-gray-200 dark:border-slate-700 flex-shrink-0">
            <button onClick={onMenuClick} className="mr-4 text-gray-600 dark:text-gray-300 md:hidden">
                <MenuIcon />
            </button>
            <h2 className="text-lg font-semibold truncate flex-1">{title}</h2>
            <div className="flex items-center gap-4">
                <LiveUserCounter />
                <button onClick={onExportChat} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors" aria-label="Export chat">
                    <DownloadIcon />
                </button>
            </div>
        </div>
    );
};

export default ChatHeader;
