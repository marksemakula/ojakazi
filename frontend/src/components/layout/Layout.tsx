import React from 'react';
import { Navbar } from './Navbar';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => (
  <div className="min-h-screen flex flex-col bg-gray-50">
    <Navbar />
    <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">{children}</main>
    <footer className="bg-white border-t border-gray-200 mt-8">
      <div className="container mx-auto max-w-6xl px-4 py-10 flex flex-col items-center gap-4">
        <img
          src="/inzozi-logo.png"
          alt="Inzozi Partners"
          className="h-20 w-auto opacity-80"
        />
        <div className="text-center">
          <p className="text-xs font-bold tracking-[0.25em] text-gray-500 uppercase">Inzozi Partners</p>
          <p className="text-xs text-gray-400 mt-1">
            E-Signature &amp; E-Stamp Platform
          </p>
        </div>
        <p className="text-xs text-gray-300">
          &copy; {new Date().getFullYear()} Inzozi Partners. All rights reserved.
        </p>
      </div>
    </footer>
  </div>
);
