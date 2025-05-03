"use client";

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Book,
  PieChart,
  FileQuestion,
  Settings,
  Menu,
  X,
  Brain,
  LogOut,
  Moon,
  Sun,
  MessageCircle // Added for chat
} from 'lucide-react';
import axios from 'axios';
import { useTheme } from '@/app/ThemeContext'; // Import our theme hook

type NavItem = {
  name: string;
  path: string;
  icon: React.ReactNode;
};

type UserProps = {
  name: string;
  email: string;
  initials: string;
};

const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [user, setUser] = useState<UserProps | null>(null);
  const { darkMode, toggleDarkMode } = useTheme(); // Use our theme hook

  // Axios instance for authenticated requests
  const authAxios = axios.create({
    baseURL: 'https://mentalheathapp.vercel.app/users',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  authAxios.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Fetch user data on mount
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/');
        return;
      }

      try {
        const response = await authAxios.get('/me');
        const userData = response.data;

        const fullName = userData.full_name || 'User';
        const initials = fullName
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase();

        setUser({
          name: fullName,
          email: userData.email || '',
          initials
        });
      } catch (error) {
        console.error('Failed to fetch user:', error);
        localStorage.removeItem('token');
        router.push('/');
      }
    };

    fetchUser();
  }, [router]);

  useEffect(() => {
    const checkIsMobile = () => {
      // Only set isCollapsed for desktop/tablet views, not for mobile
      setIsCollapsed(window.innerWidth < 1024 && window.innerWidth >= 640);
    };
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const navItems: NavItem[] = [
    { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={20} /> },
    { name: "Journal", path: "/journal", icon: <Book size={20} /> },
    { name: "Chat with MINDAI", path: "/chat", icon: <MessageCircle size={20} /> }, // Added chat link
    { name: "Insights", path: "/insights", icon: <PieChart size={20} /> },
    { name: "Resources", path: "/resources", icon: <FileQuestion size={20} /> },
    { name: "Settings", path: "/settings", icon: <Settings size={20} /> }
  ];

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);
  const toggleMobileMenu = () => setIsMobileOpen(!isMobileOpen);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsMobileOpen(false);
    router.push('/');
  };

  // New function to handle navigation
  const handleNavigation = (path: string) => {
    if (isMobileOpen) {
      setIsMobileOpen(false);
    }
    router.push(path);
  };

  return (
    <>
      {/* Mobile Menu Toggle */}
      <button
        onClick={toggleMobileMenu}
        className={` ${isMobileOpen ? "left-52" : "left-4"} fixed top-4 p-2 rounded-md ${darkMode ? 'bg-gray-800 text-blue-400' : 'bg-blue-100 text-blue-600'} lg:hidden z-50`}
        aria-label="Toggle menu"
      >
        {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <div
        className={`
          fixed top-0 left-0 h-full border-r transition-all duration-300 ease-in-out flex flex-col justify-between
          ${darkMode ? 'bg-gray-900 text-white border-gray-800' : 'bg-white text-gray-800 border-gray-200'}
          ${isCollapsed ? 'w-16' : 'w-64'} 
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} 
          lg:translate-x-0 z-40
        `}
      >
        {/* Brand */}
        <div className={`flex items-center justify-between p-4 border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
          <a 
            href="/" 
            className='cursor-pointer flex items-center justify-center gap-2'
            onClick={(e) => {
              e.preventDefault();
              handleNavigation('/');
            }}
          >
            <div className="flex-shrink-0 h-8 w-8 rounded-md flex items-center justify-center">
              <span className="font-bold">
                <Brain className={`h-8 w-8 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              </span>
            </div>
            {(!isCollapsed || isMobileOpen) && <span className={`font-semibold text-lg ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>MindJournal</span>}
          </a>
        </div>

        {/* Navigation */}
        <nav className="flex-1 pt-5 pb-4 overflow-y-auto">
          <ul className="space-y-1 px-2">
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <li key={item.name}>
                  <a
                    href={item.path}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavigation(item.path);
                    }}
                    className={`
                      flex items-center p-3 rounded-md transition-all duration-200 cursor-pointer
                      ${isActive 
                        ? darkMode 
                          ? 'bg-blue-900/30 text-blue-400' 
                          : 'bg-blue-50 text-blue-600' 
                        : darkMode 
                          ? 'text-gray-300 hover:bg-gray-800' 
                          : 'text-gray-600 hover:bg-gray-100'
                      }
                      ${isCollapsed && !isMobileOpen ? 'justify-center' : 'justify-start space-x-3'}
                    `}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    {(!isCollapsed || isMobileOpen) && <span>{item.name}</span>}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Profile, Theme Toggle and Logout */}
        <div className={`border-t p-4 ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className={`
              w-full flex items-center p-2 rounded-md cursor-pointer mb-4
              ${darkMode 
                ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }
              transition-all duration-200
              ${isCollapsed && !isMobileOpen ? 'justify-center' : 'justify-start space-x-2'}
            `}
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            {(!isCollapsed || isMobileOpen) && (
              <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
            )}
          </button>

          {user && (
            <div
              className={`flex items-center ${isCollapsed && !isMobileOpen ? 'justify-center' : 'space-x-3'} mb-4`}
            >
              <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${darkMode ? 'bg-gray-800 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                <span className="font-semibold text-sm">{user.initials}</span>
              </div>
              {(!isCollapsed || isMobileOpen) && (
                <div className="flex flex-col">
                  <span className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{user.name}</span>
                  <span className={`text-xs truncate max-w-[180px] ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{user.email}</span>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleLogout}
            className={`
              w-full flex items-center p-2 rounded-md cursor-pointer
              ${darkMode 
                ? 'text-red-400 hover:bg-red-900/30' 
                : 'text-red-600 hover:bg-red-50'
              }
              transition-all duration-200
              ${isCollapsed && !isMobileOpen ? 'justify-center' : 'justify-start space-x-2'}
            `}
          >
            <LogOut size={18} />
            {(!isCollapsed || isMobileOpen) && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={toggleMobileMenu}
          aria-hidden="true"
        />
      )}
    </>
  );
};

export default Sidebar;