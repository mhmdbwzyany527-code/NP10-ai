import React from 'react';

interface SuggestionsProps {
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
}

const Suggestions: React.FC<SuggestionsProps> = ({ suggestions, onSuggestionClick }) => {
  if (suggestions.length === 0) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 mb-3 animate-fadeIn">
      <div className="flex flex-wrap items-center justify-center gap-2">
        {suggestions.map((text, index) => (
          <button
            key={index}
            onClick={() => onSuggestionClick(text)}
            className="px-4 py-2 bg-gray-100 dark:bg-slate-700/80 text-sm text-gray-700 dark:text-gray-300 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-500/30 hover:text-indigo-600 dark:hover:text-indigo-300 transition-all duration-200 shadow-sm border border-transparent hover:border-indigo-300 dark:hover:border-indigo-500/50"
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Suggestions;
