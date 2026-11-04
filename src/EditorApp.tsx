import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { EditorAuthPage } from './pages/EditorAuthPage';
import { EditorDashboard } from './pages/EditorDashboard';
import { ExternalLink, LogOut, User } from 'lucide-react';

function EditorAppContent() {
  const { userProfile, editorProfile, userRole, logout, loading } = useAuth();
  const [currentPath, setCurrentPath] = useState(window.location.pathname || '/editor');

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const urlParams = new URLSearchParams(window.location.search);
  const initialTab = urlParams.get('tab') || undefined;

  const isEditor = userRole === 'editor' && !!userProfile;
  const avatarUrl = editorProfile?.photoURL || userProfile?.photoURL;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080611] flex flex-col items-center justify-center space-y-4">
        <img
          src="https://i.postimg.cc/NjqbtJKN/Neon-Purple-Draftly-Crown-Logo.png"
          alt="DRAFTLY"
          className="h-16 w-auto object-contain animate-pulse filter drop-shadow-[0_0_25px_rgba(187,134,255,0.6)]"
        />
        <div className="flex items-center gap-2 text-xs font-semibold text-[#BB86FF]">
          <span className="w-2 h-2 rounded-full bg-[#BB86FF] animate-ping" />
          <span>Loading DRAFTLY Creator Workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#080611] text-white selection:bg-[#9B5CFF]/30 selection:text-white font-['Inter']">
      {/* Top Editor Bar */}
      <header className="border-b border-[#251B38] bg-[#100B1C]/90 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2.5 group">
              <img
                src="https://i.postimg.cc/NjqbtJKN/Neon-Purple-Draftly-Crown-Logo.png"
                alt="DRAFTLY"
                className="h-8 w-auto object-contain transition-transform group-hover:scale-105"
              />
              <span className="font-extrabold text-lg tracking-wider text-white font-['Manrope']">
                DRAFTLY <span className="text-xs px-2 py-0.5 rounded-md bg-[#9B5CFF]/20 text-[#BB86FF] font-semibold border border-[#9B5CFF]/30 ml-1.5 uppercase">Creator</span>
              </span>
            </a>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 text-xs font-medium">
            <a
              href="/"
              className="flex items-center gap-1.5 text-[#A59BB8] hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
            >
              <span>Main Marketplace</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            {isEditor && (
              <div className="flex items-center gap-3 pl-3 border-l border-[#251B38]">
                <div className="flex items-center gap-2">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={userProfile?.displayName || 'Editor'}
                      className="w-7 h-7 rounded-full object-cover border border-[#BB86FF]/40"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-[#9B5CFF]/20 border border-[#BB86FF]/40 flex items-center justify-center text-[#BB86FF]">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <span className="text-white font-semibold hidden sm:inline">{userProfile?.displayName || 'Editor'}</span>
                </div>
                <button
                  onClick={async () => {
                    await logout();
                    navigate('/editor');
                  }}
                  className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors flex items-center gap-1 text-xs"
                  title="Log out of Editor Portal"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Editor View */}
      <main className="flex-1">
        {isEditor ? (
          <EditorDashboard navigate={navigate} initialTab={initialTab} />
        ) : (
          <EditorAuthPage navigate={navigate} />
        )}
      </main>
    </div>
  );
}

export default function EditorApp() {
  return (
    <AuthProvider>
      <EditorAppContent />
    </AuthProvider>
  );
}
