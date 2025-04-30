"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Book,
  PieChart,
  FileQuestion,
  Settings,
  ChevronRight,
  Menu,
  X,
  Brain,
  LogOut
} from 'lucide-react';
import axios from 'axios';

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
      setIsCollapsed(window.innerWidth < 1024);
    };
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const navItems: NavItem[] = [
    { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={20} /> },
    { name: "Journal", path: "/journal", icon: <Book size={20} /> },
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

  return (
    <>
      {/* Mobile Menu Toggle */}
      <button
        onClick={toggleMobileMenu}
        className="fixed top-4 left-4 p-2 rounded-md bg-blue-100 text-blue-600 lg:hidden z-50"
        aria-label="Toggle menu"
      >
        {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <div
        className={`
          fixed top-0 left-0 h-full bg-white border-r border-gray-200 
          transition-all duration-300 ease-in-out flex flex-col justify-between
          ${isCollapsed ? 'w-16' : 'w-64'} 
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} 
          lg:translate-x-0 z-40
        `}
      >
        {/* Brand */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <a href="/" className='cursor-pointer flex items-center justify-center gap-2'>
            <div className="flex-shrink-0 h-8 w-8 rounded-md flex items-center justify-center">
              <span className="text-white font-bold">
                <Brain className="h-8 w-8 text-blue-600" />
              </span>
            </div>
            {!isCollapsed && <span className="text-blue-600 font-semibold text-lg">MindJournal</span>}
          </a>
        </div>

        {/* Navigation */}
        <nav className="flex-1 pt-5 pb-4 overflow-y-auto">
          <ul className="space-y-1 px-2">
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <li key={item.name}>
                  <Link
                    href={item.path}
                    className={`
                      flex items-center p-3 rounded-md 
                      ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}
                      ${isCollapsed ? 'justify-center' : 'justify-start space-x-3'}
                      transition-all duration-200
                    `}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    {!isCollapsed && <span>{item.name}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Profile and Logout */}
        <div className="border-t border-gray-200 p-4">
          {user && (
            <div
              className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} mb-4`}
            >
              <div className="flex-shrink-0 h-8 w-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                <span className="font-semibold text-sm">{user.initials}</span>
              </div>
              {!isCollapsed && (
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-700">{user.name}</span>
                  <span className="text-xs text-gray-500 truncate max-w-[180px]">{user.email}</span>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleLogout}
            className={`
              w-full flex items-center p-2 rounded-md cursor-pointer
              text-red-600 hover:bg-red-50
              transition-all duration-200
              ${isCollapsed ? 'justify-center' : 'justify-start space-x-2'}
            `}
          >
            <LogOut size={18} />
            {!isCollapsed && <span>Logout</span>}
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
