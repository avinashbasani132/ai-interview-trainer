import React from 'react';
import { Menu, Sun, Moon } from 'lucide-react';

export default function Header({ toggleSidebar, toggleTheme, isLightMode }) {
  return (
    <header className="w-full glass-nav sticky top-0 p-4 flex justify-between items-center z-30 md:px-8">
      <h1 className="text-xl font-extrabold font-heading bg-gradient-to-r from-primary-light to-accent bg-clip-text text-transparent md:hidden">
        AI Interview Trainer
      </h1>
      
      {/* Spacer for desktop layout alignment */}
      <div className="hidden md:block"></div>

      <div className="flex items-center gap-4 ml-auto">
        <button 
          onClick={toggleTheme}
          className="text-slate-300 hover:text-white flex items-center gap-2 text-sm bg-white/5 border border-white/10 hover:border-primary/50 hover:bg-white/10 px-4 py-2 rounded-xl transition-all duration-300 shadow-sm"
        >
          {isLightMode ? <Moon className="w-4 h-4 text-accent" /> : <Sun className="w-4 h-4 text-amber-400" />}
          <span id="theme-text" className="font-medium tracking-wide">{isLightMode ? 'Dark Mode' : 'Light Mode'}</span>
        </button>

        <button
          onClick={toggleSidebar}
          className="text-slate-300 hover:text-primary-light focus:outline-none md:hidden bg-white/5 p-2 rounded-lg border border-white/10 transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>
    </header>
  );
}
