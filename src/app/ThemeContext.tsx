"use client";

import React, { createContext, useState, useContext, useEffect } from 'react';

type ThemeContextType = {
  darkMode: boolean;
  toggleDarkMode: () => void;
  toggleTheme: () => void; // Add the toggleTheme function
  theme: string; // Add the theme property
  setTheme: (theme: string) => void; 
};


const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize with user preference or system preference
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [theme, setTheme] = useState<string>('light'); // Initialize theme state

  useEffect(() => {
    // Check local storage first
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme) {
      setDarkMode(storedTheme === 'dark');
    } else {
      // If no stored preference, check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(prefersDark);
    }
  }, []);

  useEffect(() => {
    // Update document class when darkMode changes
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Save preference to localStorage
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode, toggleTheme, theme: darkMode ? 'dark' : 'light', setTheme: toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};