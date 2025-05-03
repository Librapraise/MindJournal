import { useState, useRef, useEffect } from 'react';
import { Send, Mic, Paperclip, Smile, Bot } from 'lucide-react';
import { useTheme } from '@/app/ThemeContext'; // Import theme hook

export default function ChatbotUI() {
  const { darkMode } = useTheme(); // Use theme hook
  const [messages, setMessages] = useState<{ id: number; content: string; sender: string; timestamp: string }[]>([]);
  
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Load messages from localStorage when component mounts
  useEffect(() => {
    const savedMessages = localStorage.getItem('chatMessages');
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    } else {
      // Set default welcome message if no saved messages exist
      const defaultMessage = {
        id: 1,
        content: "Hello! I'm MINDAI. How are you feeling today?",
        sender: "bot",
        timestamp: new Date().toISOString()
      };
      setMessages([defaultMessage]);
      localStorage.setItem('chatMessages', JSON.stringify([defaultMessage]));
    }
  }, []);
  
  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('chatMessages', JSON.stringify(messages));
    }
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };
  
  const handleSendMessage = async () => {
    if (inputValue.trim() === "") return;
    
    // Add user message
    const newUserMessage = {
      id: Date.now(), // Using timestamp for more unique IDs
      content: inputValue,
      sender: "user",
      timestamp: new Date().toISOString()
    };
    
    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    setInputValue("");
    setIsTyping(true);
    
    try {
      // Send message to API
      const response = await fetch('https://mentalheathapp.vercel.app/chat/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('token') // Assuming token is stored in localStorage
        },
        body: JSON.stringify({ message: inputValue })
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response from API');
      }
      
      const data = await response.json();
      
      // Add bot response
      const botResponse = {
        id: Date.now() + 1, // Ensure unique ID
        content: data.response,
        sender: "bot",
        timestamp: new Date().toISOString()
      };
      
      setMessages(prevMessages => [...prevMessages, botResponse]);
    } catch (error) {
      console.error('Error:', error);
      
      // Add error message
      const errorResponse = {
        id: Date.now() + 1,
        content: "I'm sorry, I'm having trouble connecting right now. Please try again later.",
        sender: "bot",
        timestamp: new Date().toISOString()
      };
      
      setMessages(prevMessages => [...prevMessages, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const formatTime = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const clearChat = () => {
    const defaultMessage = {
      id: Date.now(),
      content: "Hello! I'm MINDAI. How are you feeling today?",
      sender: "bot",
      timestamp: new Date().toISOString()
    };
    setMessages([defaultMessage]);
    localStorage.setItem('chatMessages', JSON.stringify([defaultMessage]));
  };
  
  return (
    <div className={`flex flex-col h-screen ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} `}>
      {/* Top Bar */}
      <div className={`${darkMode ? 'bg-gray-900 text-white' : 'bg-white'} p-4 flex items-center justify-between shadow-sm`}>
        <div className="flex items-center justify-center mt-10 lg:mt-0">
          <Bot className={`h-6 w-6 ${darkMode ? 'text-blue-400' : 'text-blue-500'} mr-2`} />
          <h2 className={`font-semibold ${darkMode ? 'text-blue-400' : 'text-blue-500'}`}>MINDAI</h2>
        </div>
        <button 
          onClick={clearChat}
          className={`mt-10 lg:mt-0 cursor-pointer text-sm ${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Clear Chat
        </button>
      </div>
      
      {/* Messages Area */}
      <div className={`flex-1 overflow-y-auto p-4 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-xs md:max-w-md lg:max-w-lg rounded-lg p-3 ${
                  message.sender === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : darkMode
                      ? 'bg-gray-700 text-gray-100 rounded-bl-none shadow-sm'
                      : 'bg-white text-gray-800 rounded-bl-none shadow-sm'
                }`}
              >
                <div className="mb-1">{message.content}</div>
                <div 
                  className={`text-xs ${
                    message.sender === 'user' 
                      ? 'text-blue-200' 
                      : darkMode ? 'text-gray-400' : 'text-gray-500'
                  } text-right`}
                >
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className={`${darkMode ? 'bg-gray-700 text-gray-100' : 'bg-white text-gray-800'} rounded-lg rounded-bl-none p-3 shadow-sm`}>
                <div className="flex space-x-1">
                  <div className={`w-2 h-2 ${darkMode ? 'bg-gray-400' : 'bg-gray-400'} rounded-full animate-bounce`} style={{ animationDelay: '0ms' }}></div>
                  <div className={`w-2 h-2 ${darkMode ? 'bg-gray-400' : 'bg-gray-400'} rounded-full animate-bounce`} style={{ animationDelay: '150ms' }}></div>
                  <div className={`w-2 h-2 ${darkMode ? 'bg-gray-400' : 'bg-gray-400'} rounded-full animate-bounce`} style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Input Area */}
      <div className={`${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} p-4 border-t`}>
        <div className="max-w-3xl mx-auto">
          <div className={`flex items-end ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'} rounded-lg border focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500`}>
            
            <textarea
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className={`flex-1 py-3 px-2 bg-transparent outline-none resize-none max-h-32 ${darkMode ? 'text-white' : 'text-gray-800'}`}
              rows={1}
            />
            
            <div className="flex items-center">
              <button 
                onClick={handleSendMessage}
                disabled={inputValue.trim() === ''}
                className={`p-2 m-1 rounded-full ${
                  inputValue.trim() === '' 
                    ? 'bg-gray-300 text-gray-500' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
          
          <div className={`mt-2 text-xs text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            This is a supportive chat assistant and not a substitute for professional mental health care
          </div>
        </div>
      </div>
    </div>
  );
}