import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientSidebarWrapper from "./ClientSidebarWrapper";
import { ThemeProvider } from "./ThemeContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MindAI Journal",
  description: "Your personal space to reflect, and track your mental health journey",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>

      <body className="transition-colors duration-200 bg-white dark:bg-gray-900">
        <ThemeProvider>
          <div className="flex h-screen">
            <ClientSidebarWrapper />
              <main className="flex-1 overflow-auto transition-colors duration-200 dark:text-white">
                {children}
              </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
