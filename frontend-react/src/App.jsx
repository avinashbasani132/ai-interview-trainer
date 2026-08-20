import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Footer from './components/Footer';
import ChatWidget from './components/ChatWidget';

// Views
import Auth from './views/Auth';
import Dashboard from './views/Dashboard';
import Resume from './views/Resume';
import Rounds from './views/Rounds';
import History from './views/History';
import Learning from './views/Learning';
import Arena from './views/Arena';
import Leaderboard from './views/Leaderboard';
import Community from './views/Community';
import Certificates from './views/Certificates';
import Profile from './views/Profile';
import Admin from './views/Admin';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('access_token'));
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLightMode, setIsLightMode] = useState(false);
  const [resumeInterviewSessionId, setResumeInterviewSessionId] = useState(null);

  const checkAdminStatus = React.useCallback(() => {
    // Decode token or verify with backend
    if (!token) return false;
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));
      // Many standard JWT payloads have custom claims or boolean flag
      const adminClaim = Boolean(
        (payload.sub && payload.sub.is_admin) || 
        payload.is_admin || 
        payload.identity?.is_admin
      );
      if (adminClaim) {
        setIsAdmin(true);
      }
      return adminClaim;
    } catch (e) {
      console.error('Failed to parse JWT payload:', e);
      return false;
    }
  }, [token]);

  useEffect(() => {
    // Listen for auth expiration events from api client
    const handleAuthChange = () => {
      setToken(null);
      setIsAdmin(false);
    };
    
    window.addEventListener('auth_change', handleAuthChange);
    
    // Check initial user token properties
    if (token) {
      checkAdminStatus();
    }

    return () => window.removeEventListener('auth_change', handleAuthChange);
  }, [token, checkAdminStatus]);


  const handleAuthSuccess = (isAdminUser) => {
    setToken(localStorage.getItem('access_token'));
    setIsAdmin(isAdminUser);
    setActiveView(isAdminUser ? 'admin' : 'dashboard');
  };


  const logout = () => {
    localStorage.removeItem('access_token');
    setToken(null);
    setIsAdmin(false);
    setActiveView('dashboard');
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleTheme = () => {
    const html = document.documentElement;
    html.classList.toggle('light-mode');
    setIsLightMode(html.classList.contains('light-mode'));
  };

  const startStandardInterview = () => {
    setResumeInterviewSessionId(null);
    setActiveView('rounds');
  };

  // Render view
  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard setActiveView={setActiveView} startStandardInterview={startStandardInterview} />;
      case 'resume':
        return <Resume setActiveView={setActiveView} setResumeInterviewSessionId={setResumeInterviewSessionId} />;
      case 'rounds':
        return <Rounds sessionId={resumeInterviewSessionId} setSessionId={setResumeInterviewSessionId} />;
      case 'history':
        return <History />;
      case 'learning':
        return <Learning />;
      case 'arena':
        return <Arena />;
      case 'leaderboard':
        return <Leaderboard />;
      case 'community':
        return <Community />;
      case 'certificates':
        return <Certificates setActiveView={setActiveView} />;
      case 'profile':
        return <Profile />;
      case 'admin':
        return isAdmin ? (
          <Admin 
            logout={logout} 
            toggleTheme={toggleTheme} 
            isLightMode={isLightMode} 
            setActiveView={setActiveView} 
          />
        ) : (
          <Dashboard setActiveView={setActiveView} startStandardInterview={startStandardInterview} />
        );
      default:
        return <Dashboard setActiveView={setActiveView} startStandardInterview={startStandardInterview} />;
    }
  };

  if (!token || token === 'undefined' || token === 'null') {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  // Full-page dedicated layout for Administrator Portal (no candidate sidebar)
  if (activeView === 'admin' && isAdmin) {
    return (
      <div className="min-h-screen w-screen bg-slate-950 text-white font-sans overflow-x-hidden">
        <Admin 
          logout={logout} 
          toggleTheme={toggleTheme} 
          isLightMode={isLightMode} 
          setActiveView={setActiveView} 
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-white font-sans">
      {/* Sidebar Navigation */}
      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView} 
        isAdmin={isAdmin} 
        logout={logout}
        isOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
      />

      {/* Main Panel Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative">
        {/* Header bar */}
        <Header 
          toggleSidebar={toggleSidebar} 
          toggleTheme={toggleTheme}
          isLightMode={isLightMode}
        />

        {/* Dynamic content view */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10 bg-slate-950">
          <div className="max-w-6xl mx-auto">
            {renderView()}
          </div>
        </main>

        {/* Premium footer */}
        <Footer />
        
        {/* Floating Career Chat widget */}
        <ChatWidget />
      </div>
    </div>
  );
}

