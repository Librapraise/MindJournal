// components/WritingPrompts.tsx
import React, { useState, useEffect } from 'react';
import { WritingPrompt } from '@/app/types';

interface WritingPromptsProps {
  editor: any;
  darkMode?: boolean;
}

const WritingPrompts: React.FC<WritingPromptsProps> = ({ editor, darkMode = false }) => {
  const [suggestions, setSuggestions] = useState<WritingPrompt[]>([
    {
      text: 'Since you mentioned stress management, would you like to explore what specific techniques work best for you?',
      type: 'stress'
    },
    {
      text: 'How have these things you\'re grateful for impacted your broader perspective?',
      type: 'gratitude'
    },
    {
      text: 'What made your team collaboration successful today?',
      type: 'collaboration'
    },
    {
      text: 'What other self-care practices could you add to your morning routine?',
      type: 'intentions'
    }
  ]);

  // Fetch a journal prompt on component mount
  useEffect(() => {
    const fetchPrompt = async () => {
      try {
        const response = await fetch('https://mentalheathapp.vercel.app/journal/prompt/', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || 'mock-token-123'}`
          }
        });
        
        if (response.ok) {
          const promptText = await response.text();
          if (promptText) {
            setSuggestions(prev => [
              {
                text: promptText,
                type: 'api-generated'
              },
              ...prev.slice(0, 3) // Keep only first 3 of the existing prompts
            ]);
          }
        }
      } catch (error) {
        console.error('Error fetching journal prompt:', error);
      }
    };
    
    fetchPrompt();
  }, []);

  const handlePromptClick = (promptText: string) => {
    if (editor) {
      // Insert prompt at cursor position or at end
      const position = editor.state.selection.anchor;
      editor.chain().focus().insertContentAt(position, `\n\n**Reflection prompt:** ${promptText}\n\n`).run();
    }
  };

  return (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
      <h3 className={`text-medium font-bold ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-3`}>AI Writing Prompts</h3>
      <div className="space-y-3">
        {suggestions.map((prompt, index) => (
          <div
            key={index}
            className={`p-3 rounded-md cursor-pointer transition ${
              prompt.type === 'stress'
                ? darkMode 
                  ? 'bg-indigo-900 text-indigo-200' 
                  : 'bg-indigo-100 text-indigo-800'
                : darkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-800'
            }`}
            onClick={() => handlePromptClick(prompt.text)}
          >
            <p className="text-sm">{prompt.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WritingPrompts;