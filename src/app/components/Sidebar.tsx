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
  LogOut
} from 'lucide-react';

// Define types for navigation items and user
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
  
  // Check if the window is mobile size on mount and resize
  useEffect(() => {
    const checkIsMobile = () => {
      setIsCollapsed(window.innerWidth < 1024);
    };
    
    // Set initial state
    checkIsMobile();
    
    // Add event listener
    window.addEventListener('resize', checkIsMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Navigation items
  const navItems: NavItem[] = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: <LayoutDashboard size={20} />
    },
    {
      name: "Journal",
      path: "/journal",
      icon: <Book size={20} />
    },
    {
      name: "Insights",
      path: "/insights",
      icon: <PieChart size={20} />
    },
    {
      name: "Resources",
      path: "/resources",
      icon: <FileQuestion size={20} />
    },
    {
      name: "Settings",
      path: "/settings",
      icon: <Settings size={20} />
    }
  ];

  // User information
  const user: UserProps = {
    name: "John Doe",
    email: "john@example.com",
    initials: "JD"
  };

  // Toggle sidebar collapse state
  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileOpen(!isMobileOpen);
  };
  
  // Handle logout
  const handleLogout = () => {
    // Clear authentication token from localStorage
    localStorage.removeItem('token');
    
    // Close mobile menu if open
    if (isMobileOpen) {
      setIsMobileOpen(false);
    }
    
    // Redirect to auth page
    router.push('/');
  };

  return (
    <>
      {/* Mobile Menu Button - Only visible on small screens */}
      <button 
        onClick={toggleMobileMenu}
        className="fixed top-4 left-4 p-2 rounded-md bg-blue-100 text-blue-600 lg:hidden z-50"
        aria-label="Toggle menu"
      >
        {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
      
      {/* Sidebar - Desktop version always visible, mobile version toggleable */}
      <div 
        className={`
          fixed top-0 left-0 h-full 
          bg-white border-r border-gray-200 
          transition-all duration-300 ease-in-out
          flex flex-col justify-between
          ${isCollapsed ? 'w-16' : 'w-64'} 
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} 
          lg:translate-x-0
          z-40
        `}
      >
        {/* Brand Logo & Toggle Button */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <div className="flex-shrink-0 h-8 w-8 bg-blue-500 rounded-md flex items-center justify-center">
              <span className="text-white font-medium">M</span>
            </div>
            {!isCollapsed && <span className="text-blue-600 font-semibold text-lg">MindJournal</span>}
          </div>
          
          {/* Toggle Button - Hidden on mobile */}
          <button 
            onClick={toggleSidebar} 
            className="p-1 rounded-md text-gray-400 hover:bg-gray-100 hidden lg:block"
            aria-label="Toggle sidebar"
          >
            <ChevronRight size={18} className={`transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`} />
          </button>
        </div>
        
        {/* Navigation Menu */}
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
                      ${isActive 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'text-gray-600 hover:bg-gray-100'
                      }
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
        
        {/* User Profile Section and Logout */}
        <div className="border-t border-gray-200 p-4">
          {/* User Profile */}
          <div className={`
            flex items-center 
            ${isCollapsed ? 'justify-center' : 'space-x-3'}
            mb-4
          `}>
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
          
          {/* Logout Button */}
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
      
      {/* Overlay for mobile - only appears when mobile menu is open */}
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