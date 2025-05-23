// Then create a client component in a separate file:
// ClientSidebarWrapper.tsx
'use client';
import { usePathname } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import { ThemeProvider } from '@/app/ThemeContext'; // Adjust the import path as necessary

export default function ClientSidebarWrapper() {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith('/auth') || pathname === '/login' || pathname === '/signup' || pathname === '/register';
  
  if (isAuthPage) return null;
  
  return (
    <Sidebar />
  );

}