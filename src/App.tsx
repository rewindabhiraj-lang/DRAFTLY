import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { ExplorePage } from './pages/ExplorePage';
import { EditorDetailPage } from './pages/EditorDetailPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { PricingPage } from './pages/PricingPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { EditorAuthPage } from './pages/EditorAuthPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { ClientDashboard } from './pages/ClientDashboard';
import { EditorDashboard } from './pages/EditorDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { TermsPage, PrivacyPage } from './pages/LegalPages';
import { NotFoundPage } from './pages/NotFoundPage';
import { EditorProfile, PlatformSettings } from './types';
import { getPlatformSettings } from './services/db';
import { Sparkles, X } from 'lucide-react';

function AppContent() {
  const { userProfile, userRole, isAdmin, loading } = useAuth();
  const [currentPath, setCurrentPath] = useState(window.location.pathname || '/');
  const [selectedEditor, setSelectedEditor] = useState<EditorProfile | null>(null);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);
  const [dismissAnnouncement, setDismissAnnouncement] = useState(false);

  // Sync route navigation with browser history & dedicated multi-page routing
  const navigate = (path: string) => {
    if (path === '/admin' || path.startsWith('/admin/')) {
      window.location.href = path;
      return;
    }
    if (path === '/editor' || path.startsWith('/editor/')) {
      window.location.href = path;
      return;
    }
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    setSelectedEditor(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
      setSelectedEditor(null);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    getPlatformSettings().then(setPlatformSettings).catch(() => {});
  }, []);

  // Determine query params (e.g. category filter or tab)
  const urlParams = new URLSearchParams(window.location.search);
  const initialCategory = urlParams.get('cat') || undefined;
  const initialTab = urlParams.get('tab') || undefined;

  // Decide if current route is a standalone dashboard
  const isDashboardRoute =
    currentPath.startsWith('/dashboard') ||
    currentPath.startsWith('/editor/dashboard') ||
    currentPath.startsWith('/admin/dashboard');

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
          <span>Loading DRAFTLY Workspace...</span>
        </div>
      </div>
    );
  }

  // Active Main Body Rendering
  const renderPage = () => {
    // If viewing single editor detail
    if (selectedEditor) {
      return (
        <EditorDetailPage
          editor={selectedEditor}
          onBack={() => setSelectedEditor(null)}
          navigate={navigate}
        />
      );
    }

    // Role-based Dashboards
    if (currentPath.startsWith('/admin/dashboard')) {
      if (!isAdmin) {
        return <AdminLoginPage navigate={navigate} />;
      }
      return <AdminDashboard navigate={navigate} />;
    }

    if (currentPath.startsWith('/editor/dashboard')) {
      if (userRole !== 'editor' && !userProfile) {
        return <EditorAuthPage navigate={navigate} />;
      }
      return <EditorDashboard navigate={navigate} initialTab={initialTab} />;
    }

    if (currentPath.startsWith('/dashboard')) {
      if (!userProfile) {
        return <LoginPage navigate={navigate} />;
      }
      return <ClientDashboard navigate={navigate} initialTab={initialTab} />;
    }

    // Specific Public Routes
    switch (currentPath) {
      case '/':
        return (
          <HomePage
            navigate={navigate}
            onSelectEditor={editor => setSelectedEditor(editor)}
          />
        );
      case '/explore':
        return (
          <ExplorePage
            navigate={navigate}
            onSelectEditor={editor => setSelectedEditor(editor)}
            initialCategory={initialCategory}
          />
        );
      case '/how-it-works':
        return <HowItWorksPage navigate={navigate} />;
      case '/pricing':
        return <PricingPage navigate={navigate} />;
      case '/about':
        return <AboutPage navigate={navigate} />;
      case '/contact':
        return <ContactPage navigate={navigate} />;
      case '/login':
        return <LoginPage navigate={navigate} />;
      case '/register':
        return <RegisterPage navigate={navigate} />;
      case '/editor':
        return <EditorAuthPage navigate={navigate} />;
      case '/admin':
        return <AdminLoginPage navigate={navigate} />;
      case '/terms':
        return <TermsPage navigate={navigate} />;
      case '/privacy':
        return <PrivacyPage navigate={navigate} />;
      default:
        return <NotFoundPage navigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080611] text-white selection:bg-[#9B5CFF]/30 selection:text-white">
      {/* Global Announcement Banner */}
      {platformSettings?.showAnnouncement &&
        platformSettings.announcement &&
        !dismissAnnouncement &&
        !isDashboardRoute && (
          <div className="bg-gradient-to-r from-[#9B5CFF] via-[#7A22FF] to-[#9B5CFF] text-white px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-md">
            <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-center w-full">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>{platformSettings.announcement}</span>
            </div>
            <button
              onClick={() => setDismissAnnouncement(true)}
              className="text-white/80 hover:text-white p-1"
              aria-label="Dismiss announcement"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

      {/* Render Navbar on non-dashboard pages */}
      {!isDashboardRoute && <Navbar currentPath={currentPath} navigate={navigate} />}

      {/* Page View Body */}
      <div className="flex-1">{renderPage()}</div>

      {/* Render Footer on non-dashboard pages */}
      {!isDashboardRoute && <Footer navigate={navigate} />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
