// src/app/resources/components/JournalArticleCard.tsx
import React from 'react';
import { Brain, ArrowRight } from 'lucide-react';
import { JournalArticle } from '@/app/utils/resourceUtils'; // Assuming types are in utils

interface JournalArticleCardProps {
  article: JournalArticle;
  darkMode: boolean;
  onView: (article: JournalArticle) => void;
}

const JournalArticleCard: React.FC<JournalArticleCardProps> = ({ article, darkMode, onView }) => {
  return (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm overflow-hidden p-5`}>
      <div className="flex items-center mb-3">
        <Brain className="w-6 h-6 text-indigo-500" />
        <span className={`ml-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} capitalize`}>
          Based on "{article.triggering_mood}" Entry
        </span>
      </div>

      <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>{article.title}</h3>
      <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} text-sm mb-4`}>
        {/* Use createSnippet if body can contain HTML */}
        {article.body.substring(0, 120)}...
      </p>

      <div className="flex justify-between items-center">
        <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Generated: {new Date(article.generated_at).toLocaleDateString()}
        </span>
        <button
          className={`cursor-pointer flex items-center ${darkMode ? 'text-indigo-400' : 'text-indigo-600'} font-medium text-sm hover:text-indigo-800`}
          onClick={() => onView(article)}
        >
          Read Full Article
          <ArrowRight className="h-4 w-4 ml-1" />
        </button>
      </div>
    </div>
  );
};

export default JournalArticleCard;