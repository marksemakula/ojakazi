import React from 'react';
import { Navbar } from './Navbar';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => (
  <div className="min-h-screen flex flex-col bg-gray-50">
    <Navbar />
    <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">{children}</main>
    <footer className="text-center text-xs text-gray-400 py-4 border-t border-gray-100">
      Ojakazi &copy; {new Date().getFullYear()} — All operations are org-scoped and audited.
    </footer>
  </div>
);
