import React from 'react';
import { Menu, Sun, Moon } from 'lucide-react';

export default function Header({ toggleSidebar, toggleTheme, isLightMode }) {
  return (
    <header className="w-full bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center z-30 md:px-8">
      <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent md:hidden">
        AI Interview Trainer
      </h1>
      
      {/* Spacer for desktop layout alignment */}
      <div className="hidden md:block"></div>

      <div className="flex items-center gap-4 ml-auto">
        <button 
          onClick={toggleTheme}
          className="text-slate-400 hover:text-white flex items-center gap-2 text-sm bg-slate-800/80 border border-slate-700/50 px-3 py-1.5 rounded-lg transition-all"
        >
          {isLightMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          <span id="theme-text">{isLightMode ? 'Dark Mode' : 'Light Mode'}</span>
        </button>

        <button
          onClick={toggleSidebar}
          className="text-slate-400 hover:text-white focus:outline-none md:hidden"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>
    </header>
  );
}
