import React from 'react';
import { 
  LayoutDashboard, FileText, Briefcase, History, 
  BookOpen, Code, Trophy, MessageSquare, Award, User, LogOut, ShieldAlert
} from 'lucide-react';

export default function Sidebar({ activeView, setActiveView, isAdmin, logout, isOpen, toggleSidebar }) {
  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'resume', name: 'Resume', icon: FileText },
    { id: 'rounds', name: 'Rounds', icon: Briefcase },
    { id: 'history', name: 'History', icon: History },
    { id: 'learning', name: 'Learning', icon: BookOpen },
    { id: 'arena', name: 'Arena', icon: Code },
    { id: 'leaderboard', name: 'Leaderboard', icon: Trophy },
    { id: 'community', name: 'Community', icon: MessageSquare },
    { id: 'certificates', name: 'Certificates', icon: Award },
    { id: 'profile', name: 'Profile', icon: User }
  ];

  if (isAdmin) {
    menuItems.push({ id: 'admin', name: 'Admin Control', icon: ShieldAlert });
  }

  const handleNavClick = (viewId) => {
    setActiveView(viewId);
    if (window.innerWidth < 768) {
      toggleSidebar();
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          onClick={toggleSidebar} 
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
        ></div>
      )}

      <aside className={`fixed inset-y-0 left-0 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] z-50 w-64 bg-surface/40 backdrop-blur-2xl border-r border-white/5 flex flex-col h-full shadow-[4px_0_24px_rgba(0,0,0,0.2)]`}>
        <div className="p-6">
          <h1 className="text-2xl font-extrabold font-heading tracking-tight bg-gradient-to-br from-primary-light via-primary to-accent bg-clip-text text-transparent drop-shadow-sm">
            Trainer AI
          </h1>
        </div>
        <nav className="flex-1 mt-6 px-4 space-y-2 overflow-y-auto">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-left group ${
                  isActive 
                    ? 'bg-primary/10 text-primary-light font-bold border border-primary/20 shadow-[inset_0_0_12px_rgba(99,102,241,0.2)]' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-white hover:translate-x-1'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'text-primary-light scale-110' : 'text-slate-500 group-hover:text-primary-light'}`} />
                {item.name}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/5">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 text-rose-500/80 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all duration-300 font-semibold text-left"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
