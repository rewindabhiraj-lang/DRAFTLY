import React, { useState, useEffect } from 'react';
import {
  Menu,
  X,
  User,
  LogOut,
  LayoutDashboard,
  Bell,
  Film,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getUserNotifications, markNotificationAsRead, subscribeToUserNotifications } from '../services/db';
import { Notification } from '../types';

interface NavbarProps {
  currentPath: string;
  navigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, navigate }) => {
  const { userProfile, userRole, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (userProfile?.id) {
      const unsubscribe = subscribeToUserNotifications(userProfile.id, setNotifications);
      return () => unsubscribe();
    }
  }, [userProfile?.id]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNav = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
    setNotifDropdownOpen(false);
  };

  const getDashboardPath = () => {
    if (userRole === 'admin') return '/admin/dashboard';
    if (userRole === 'editor') return '/editor/dashboard';
    return '/dashboard';
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#9B5CFF]/20 bg-[#080611]/80 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <div
          onClick={() => handleNav('/')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <img
            src="https://i.postimg.cc/NjqbtJKN/Neon-Purple-Draftly-Crown-Logo.png"
            alt="DRAFTLY"
            className="h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-105 filter drop-shadow-[0_0_12px_rgba(187,134,255,0.4)]"
          />
          <div className="flex flex-col">
            <span className="text-2xl font-extrabold tracking-wider text-white font-['Manrope'] group-hover:text-[#BB86FF] transition-colors">
              DRAFTLY
            </span>
            <span className="text-[10px] uppercase tracking-widest text-[#A59BB8] -mt-1 font-medium">
              Creative Talent
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          <button
            onClick={() => handleNav('/')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              currentPath === '/'
                ? 'text-[#BB86FF] bg-[#171025] shadow-[0_0_15px_rgba(155,92,255,0.15)]'
                : 'text-[#A59BB8] hover:text-white hover:bg-[#171025]/50'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => handleNav('/explore')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              currentPath === '/explore'
                ? 'text-[#BB86FF] bg-[#171025] shadow-[0_0_15px_rgba(155,92,255,0.15)]'
                : 'text-[#A59BB8] hover:text-white hover:bg-[#171025]/50'
            }`}
          >
            Explore Editors
          </button>
          <button
            onClick={() => handleNav('/how-it-works')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              currentPath === '/how-it-works'
                ? 'text-[#BB86FF] bg-[#171025] shadow-[0_0_15px_rgba(155,92,255,0.15)]'
                : 'text-[#A59BB8] hover:text-white hover:bg-[#171025]/50'
            }`}
          >
            How It Works
          </button>
          <button
            onClick={() => handleNav('/pricing')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              currentPath === '/pricing'
                ? 'text-[#BB86FF] bg-[#171025] shadow-[0_0_15px_rgba(155,92,255,0.15)]'
                : 'text-[#A59BB8] hover:text-white hover:bg-[#171025]/50'
            }`}
          >
            Pricing
          </button>
          <button
            onClick={() => handleNav('/about')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              currentPath === '/about'
                ? 'text-[#BB86FF] bg-[#171025] shadow-[0_0_15px_rgba(155,92,255,0.15)]'
                : 'text-[#A59BB8] hover:text-white hover:bg-[#171025]/50'
            }`}
          >
            About Us
          </button>
          <button
            onClick={() => handleNav('/contact')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              currentPath === '/contact'
                ? 'text-[#BB86FF] bg-[#171025] shadow-[0_0_15px_rgba(155,92,255,0.15)]'
                : 'text-[#A59BB8] hover:text-white hover:bg-[#171025]/50'
            }`}
          >
            Contact
          </button>
        </nav>

        {/* Right CTA & Account Area */}
        <div className="flex items-center gap-3">
          {userProfile ? (
            <div className="flex items-center gap-2.5">
              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                  className="relative p-2 rounded-lg bg-[#171025] hover:bg-[#251B38] text-[#A59BB8] hover:text-white transition-colors border border-[#9B5CFF]/20"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#BB86FF] text-[#080611] text-[10px] font-bold flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {notifDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-[#171025] border border-[#9B5CFF]/30 shadow-2xl p-3 z-50">
                    <div className="flex items-center justify-between border-b border-[#251B38] pb-2 mb-2">
                      <span className="text-sm font-bold text-white">Notifications</span>
                      <span className="text-xs text-[#A59BB8]">{unreadCount} unread</span>
                    </div>
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {notifications.length === 0 ? (
                        <div className="text-center py-6 text-xs text-[#A59BB8]">
                          Your notifications will appear here.
                        </div>
                      ) : (
                        notifications.map(n => (
                          <div
                            key={n.id}
                            onClick={() => {
                              markNotificationAsRead(n.id);
                              if (n.link) handleNav(n.link);
                              setNotifDropdownOpen(false);
                            }}
                            className={`p-2.5 rounded-xl text-xs cursor-pointer transition-colors ${
                              n.read ? 'bg-[#100B1C] text-[#A59BB8]' : 'bg-[#9B5CFF]/15 text-white border border-[#9B5CFF]/30'
                            }`}
                          >
                            <p className="font-semibold text-white">{n.title}</p>
                            <p className="mt-0.5 text-[#A59BB8] line-clamp-2">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 pl-2.5 rounded-full bg-[#171025] hover:bg-[#251B38] border border-[#9B5CFF]/30 transition-all"
                >
                  <span className="text-xs font-semibold text-white max-w-[100px] truncate hidden sm:inline">
                    {userProfile.displayName}
                  </span>
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#9B5CFF]/20 text-[#BB86FF]">
                    {userRole}
                  </span>
                  <div className="w-7 h-7 rounded-full bg-[#9B5CFF]/30 border border-[#BB86FF]/50 flex items-center justify-center overflow-hidden">
                    {userProfile.photoURL ? (
                      <img
                        src={userProfile.photoURL}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-3.5 h-3.5 text-[#BB86FF]" />
                    )}
                  </div>
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-[#171025] border border-[#9B5CFF]/30 shadow-2xl p-2 z-50">
                    <div className="px-3 py-2 border-b border-[#251B38] mb-1">
                      <p className="text-xs font-bold text-white truncate">{userProfile.displayName}</p>
                      <p className="text-[11px] text-[#A59BB8] truncate">{userProfile.email}</p>
                    </div>
                    <button
                      onClick={() => handleNav(getDashboardPath())}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-white hover:bg-[#9B5CFF]/20 transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 text-[#BB86FF]" />
                      <span>My Dashboard</span>
                    </button>
                    <button
                      onClick={async () => {
                        await logout();
                        handleNav('/');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors mt-1"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleNav('/login')}
                className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-[#A59BB8] hover:text-white transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => handleNav('/register')}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-[#9B5CFF] to-[#7A22FF] text-white shadow-[0_0_20px_rgba(155,92,255,0.4)] hover:shadow-[0_0_25px_rgba(187,134,255,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Get Started
              </button>
            </div>
          )}

          {/* Mobile hamburger button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-[#171025] border border-[#9B5CFF]/20 text-[#A59BB8] hover:text-white"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#9B5CFF]/20 bg-[#100B1C] px-4 pt-3 pb-6 space-y-2">
          <button
            onClick={() => handleNav('/')}
            className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-[#A59BB8] hover:text-white hover:bg-[#171025]"
          >
            Home
          </button>
          <button
            onClick={() => handleNav('/explore')}
            className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-[#A59BB8] hover:text-white hover:bg-[#171025]"
          >
            Explore Editors
          </button>
          <button
            onClick={() => handleNav('/how-it-works')}
            className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-[#A59BB8] hover:text-white hover:bg-[#171025]"
          >
            How It Works
          </button>
          <button
            onClick={() => handleNav('/pricing')}
            className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-[#A59BB8] hover:text-white hover:bg-[#171025]"
          >
            Pricing
          </button>
          <button
            onClick={() => handleNav('/about')}
            className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-[#A59BB8] hover:text-white hover:bg-[#171025]"
          >
            About Us
          </button>
          <button
            onClick={() => handleNav('/contact')}
            className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-[#A59BB8] hover:text-white hover:bg-[#171025]"
          >
            Contact
          </button>

          <div className="pt-2 border-t border-[#251B38] flex flex-col gap-2">
            <button
              onClick={() => handleNav('/editor')}
              className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold text-[#BB86FF] bg-[#171025] border border-[#9B5CFF]/30 flex items-center gap-2"
            >
              <Film className="w-3.5 h-3.5" />
              <span>Editor Sign In</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
