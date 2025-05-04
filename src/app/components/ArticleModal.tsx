"use client";

import { X } from "lucide-react";
import { useTheme } from "@/app/ThemeContext";

interface ArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: {
    title: string;
    category: string;
    duration?: string;
    rating?: number;
    isSaved: boolean;
    id: string;
    imageUrl?: string;
    body: string;
    tags?: string[];
  } | null;
  onBookmark: (id: string) => void;
}

export default function ArticleModal({ 
  isOpen, 
  onClose, 
  article, 
  onBookmark
}: ArticleModalProps) {
  const { darkMode } = useTheme();

  if (!isOpen || !article) return null;

  // Prevent background scrolling when modal is open
  if (typeof window !== 'undefined') {
    document.body.style.overflow = 'hidden';
  }

  const handleClose = () => {
    if (typeof window !== 'undefined') {
      document.body.style.overflow = 'auto';
    }
    onClose();
  };

  // Handle click outside the modal content to close
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // Category badge styling
  const getCategoryStyle = (category: string) => {
    switch (category) {
      case "article":
        return "bg-blue-100 text-blue-800";
      case "video":
        return "bg-red-100 text-red-800";
      case "audio":
        return "bg-purple-100 text-purple-800";
      case "exercise":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div 
        className={`relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg shadow-xl ${
          darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header with close button */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-gray-200 bg-opacity-90 backdrop-blur-sm"
          style={{ 
            backgroundColor: darkMode ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)'
          }}
        >
          <h2 className="text-xl font-bold">{article.title}</h2>
          <button 
            onClick={handleClose}
            className={`rounded-full p-1 ${
              darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Article content */}
        <div className="p-6">
          {/* Category and metadata */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryStyle(article.category)}`}>
              {article.category}
            </span>
            
            {article.duration && (
              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {article.duration}
              </span>
            )}
            
            {article.rating && (
              <div className="flex items-center">
                <span className="text-yellow-500">★</span>
                <span className="ml-1 text-sm font-medium">{article.rating}</span>
              </div>
            )}
            
            <button
              onClick={() => onBookmark(article.id)}
              className={`ml-auto flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                article.isSaved
                  ? 'bg-indigo-100 text-indigo-700'
                  : darkMode
                    ? 'bg-gray-700 text-gray-300'
                    : 'bg-gray-100 text-gray-700'
              }`}
            >
              {article.isSaved ? 'Saved' : 'Save'}
            </button>
          </div>
          
          {/* Featured image */}
          {article.imageUrl && (
            <div className="mb-6">
              <img 
                src={article.imageUrl} 
                alt={article.title} 
                className="w-full max-h-96 object-cover rounded-lg"
              />
            </div>
          )}
          
          {/* Main content */}
          <div className={`prose ${darkMode ? 'prose-invert' : ''} max-w-none`}>
            {/* Parse and render content - handle both HTML and plain text */}
            {article.body.includes('<') && article.body.includes('>')
              ? <div dangerouslySetInnerHTML={{ __html: article.body }} />
              : article.body.split('\n').map((paragraph: string, i: number) => (
                  <p key={i}>{paragraph}</p>
                ))
            }
          </div>
          
          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="mt-8">
              <h3 className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Related Topics
              </h3>
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag: string, index: number) => (
                  <span 
                    key={index} 
                    className={`px-3 py-1 rounded-full text-sm ${
                      darkMode 
                        ? 'bg-gray-700 text-gray-300' 
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleClose}
            className={`px-4 py-2 rounded-lg ${
              darkMode
                ? 'bg-gray-700 text-white hover:bg-gray-600'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}