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

      <aside className={`fixed inset-y-0 left-0 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition duration-200 ease-in-out z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full`}>
        <div className="p-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
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
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                  isActive 
                    ? 'bg-slate-800 text-white font-bold border border-slate-700/60' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                {item.name}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors font-semibold text-left"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
