"use client";

import { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import axios from 'axios';


const MOOD_COLORS = {
  'happy': 'bg-green-400',
  'content': 'bg-green-200',
  'neutral': 'bg-gray-300',
  'sad': 'bg-blue-200',
  'depressed': 'bg-blue-400',
  'angry': 'bg-red-400',
  'anxious': 'bg-yellow-400',
  'excited': 'bg-purple-400',
  'tired': 'bg-orange-300',
  'thankful': 'bg-pink-300',
  'default': 'bg-gray-200'
};

interface CalendarModalProps {
  onClose: () => void;
}

interface CalendarModalProps {
  onClose: () => void;
  darkMode: boolean; // Add darkMode prop
}

export default function CalendarModal({ onClose, darkMode }: CalendarModalProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [moodEntries, setMoodEntries] = useState<{ date: string; mood: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<{ date: string; mood: string; content?: string; id?: string } | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Generate days for the calendar
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Create 7 day week header (Sunday to Saturday)
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Handle click outside modal to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && event.target instanceof Node && !modalRef.current.contains(event.target)) {
        onClose();
      }
    }

    // Add event listener
    document.addEventListener("mousedown", handleClickOutside);
    
    // Prevent scrolling on body when modal is open
    document.body.style.overflow = "hidden";
    
    // Clean up
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "auto";
    };
  }, [onClose]);

  // Handle escape key to close modal
  useEffect(() => {
    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleEscapeKey);
    
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [onClose]);

  // Fetch mood entries on mount and when month changes
  useEffect(() => {
    const fetchMoodEntries = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const startDate = format(monthStart, 'yyyy-MM-dd');
        const endDate = format(monthEnd, 'yyyy-MM-dd');
        
        const response = await axios.get(`https://mentalheathapp.vercel.app/journal?startDate=${startDate}&endDate=${endDate}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        setMoodEntries(response.data);
      } catch (error) {
        console.error('Failed to fetch mood entries:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMoodEntries();
  }, [currentDate]);

  // Navigate to previous month
  const prevMonth = () => {
    setCurrentDate(prevDate => subMonths(prevDate, 1));
  };

  // Navigate to next month
  const nextMonth = () => {
    setCurrentDate(prevDate => addMonths(prevDate, 1));
  };

  // Get mood entry for a specific day
  const getMoodForDay = (day: Date) => {
    const entry = moodEntries.find((entry: { date: string; mood: string }) => {
      const entryDate = new Date(entry.date);
      return isSameDay(entryDate, day);
    });
    
    return entry ? entry.mood : null;
  };

  // Get color class based on mood
  const getMoodColorClass = (mood: keyof typeof MOOD_COLORS | null) => {
      return mood ? (MOOD_COLORS[mood.toLowerCase() as keyof typeof MOOD_COLORS] || MOOD_COLORS.default) : 'bg-transparent';
  };

  // Handle day click
  const handleDayClick = (day: Date) => {
    const entry = moodEntries.find(entry => {
      const entryDate = new Date(entry.date);
      return isSameDay(entryDate, day);
    });
    
    setSelectedEntry(entry || null);
  };

  // Handle export calendar data
  const handleExportData = () => {
    // This would generate a CSV or PDF with the mood data
    alert('Export functionality would be implemented here');
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 ${darkMode ? 'dark' : ''}`}>
      {/* Modal Background */}
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-auto"
      >
        {/* Modal Header */}
        <div className="border-b border-gray-200 p-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Mood Calendar</h2>
          <div className="flex gap-2">
            <button 
              onClick={handleExportData}
              className="p-2 hover:bg-gray-100 rounded-full text-gray-600"
              title="Export Calendar Data"
            >
              <Download size={20} />
            </button>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full text-gray-600"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {/* Month Navigation */}
          <div className="flex justify-between items-center mb-6">
            <button 
              onClick={prevMonth}
              className="flex items-center gap-1 py-2 px-3 rounded-md hover:bg-gray-100 text-gray-600"
              aria-label="Previous month"
            >
              <ChevronLeft size={18} />
              <span>Previous</span>
            </button>
            
            <h3 className="text-lg font-medium text-gray-800">
              {format(currentDate, 'MMMM yyyy')}
            </h3>
            
            <button 
              onClick={nextMonth}
              className="flex items-center gap-1 py-2 px-3 rounded-md hover:bg-gray-100 text-gray-600"
              aria-label="Next month"
            >
              <span>Next</span>
              <ChevronRight size={18} />
            </button>
          </div>
          
          {/* Calendar Grid */}
          {isLoading ? (
            <div className="h-72 flex items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {/* Calendar header with day names */}
              {weekDays.map(day => (
                <div key={day} className="text-center py-2 text-sm font-medium text-gray-600">
                  {day}
                </div>
              ))}
              
              {/* Fill in empty cells for days before the first of the month */}
              {Array.from({ length: monthStart.getDay() }).map((_, index) => (
                <div key={`empty-start-${index}`} className="h-16 rounded-md"></div>
              ))}
              
              {/* Calendar days */}
              {daysInMonth.map(day => {
                const mood = getMoodForDay(day);
                const moodColor = getMoodColorClass(mood as keyof typeof MOOD_COLORS | null);
                const isToday = isSameDay(day, new Date());
                const hasEntry = !!mood;
                
                return (
                  <div 
                    key={day.toISOString()} 
                    onClick={() => handleDayClick(day)}
                    className={`
                      h-16 p-2 rounded-md flex flex-col
                      ${hasEntry ? 'cursor-pointer hover:bg-gray-50 shadow-sm border border-gray-100' : 'border border-gray-50'}
                      ${isToday ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
                      ${isSameMonth(day, currentDate) ? '' : 'opacity-40'}
                    `}
                  >
                    <span className={`text-sm ${isToday ? 'font-bold' : ''}`}>
                      {format(day, 'd')}
                    </span>
                    
                    {hasEntry && (
                      <div className="mt-auto flex justify-center">
                        <div 
                          className={`
                            ${moodColor} w-8 h-8 rounded-full 
                            flex items-center justify-center
                          `}
                          title={mood ? mood.charAt(0).toUpperCase() + mood.slice(1) : ''}
                        >
                          <span className="text-xs text-white font-medium">
                            {mood ? mood.charAt(0).toUpperCase() : ''}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              
              {/* Fill in empty cells for days after the last day of the month */}
              {Array.from({ length: 6 - monthEnd.getDay() }).map((_, index) => (
                <div key={`empty-end-${index}`} className="h-16 rounded-md"></div>
              ))}
            </div>
          )}
          
          {/* Legend */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Mood Legend</h4>
            <div className="flex flex-wrap gap-3">
              {Object.entries(MOOD_COLORS).map(([mood, color]) => {
                if (mood === 'default') return null;
                
                return (
                  <div key={mood} className="flex items-center">
                    <div className={`${color} w-5 h-5 rounded-full mr-1`}></div>
                    <span className="text-sm text-gray-600 capitalize">{mood}</span>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Selected entry details */}
          {selectedEntry && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Entry for {format(new Date(selectedEntry.date), 'MMMM d, yyyy')}
              </h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center mb-3">
                  <div className={`${getMoodColorClass(selectedEntry.mood as keyof typeof MOOD_COLORS | null)} w-5 h-5 rounded-full mr-2`}></div>
                  <span className="font-medium capitalize">{selectedEntry.mood}</span>
                </div>
                
                {selectedEntry.content && (
                  <p className="text-gray-700">{selectedEntry.content}</p>
                )}
                
                <div className="mt-4 flex justify-end">
                  <a 
                    href={`/journal/entry/${selectedEntry.id}`}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose();
                    }}
                  >
                    View full entry
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Modal Footer */}
        <div className="border-t border-gray-200 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}