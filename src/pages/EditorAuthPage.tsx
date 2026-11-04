import React, { useState } from 'react';
import {
  Mail,
  Lock,
  AlertCircle,
  Film,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface EditorAuthPageProps {
  navigate: (path: string) => void;
}

export const EditorAuthPage: React.FC<EditorAuthPageProps> = ({ navigate }) => {
  const { login, loginEditorWithCredentials } = useAuth();

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // First attempt backend editor credentials authentication
      try {
        await loginEditorWithCredentials(loginEmail.trim(), loginPassword);
        navigate('/editor/dashboard');
        return;
      } catch (err: any) {
        // If account is suspended, show immediately
        if (err.message && err.message.toLowerCase().includes('suspended')) {
          setError(err.message);
          return;
        }
        // Otherwise try Firebase login
        const role = await login(loginEmail, loginPassword);
        if (role === 'admin') navigate('/admin/dashboard');
        else navigate('/editor/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid editor credentials. Please check your username or email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl bg-[#171025] border border-[#9B5CFF]/30 p-8 shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-[#9B5CFF]/15 blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="text-center mb-8">
          <img
            src="https://i.postimg.cc/NjqbtJKN/Neon-Purple-Draftly-Crown-Logo.png"
            alt="DRAFTLY"
            className="h-12 w-auto mx-auto object-contain mb-3 filter drop-shadow-[0_0_15px_rgba(187,134,255,0.4)]"
          />
          <div className="w-12 h-12 rounded-2xl bg-[#100B1C] border border-[#BB86FF]/40 flex items-center justify-center text-[#BB86FF] mx-auto mb-3 shadow-[0_0_20px_rgba(187,134,255,0.25)]">
            <Film className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-white font-['Manrope']">
            Editor Access Portal
          </h1>
          <p className="text-xs text-[#A59BB8] mt-1.5 leading-relaxed max-w-xs mx-auto">
            Authorized workspace for onboarded video editors. Sign in to view project proposals, deliver revisions, and collaborate with clients.
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-white mb-1">
              Editor Email or Username
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#A59BB8] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="Username or registered email"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/20 text-white placeholder-[#A59BB8]/50 text-xs sm:text-sm focus:outline-none focus:border-[#BB86FF] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#A59BB8] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/20 text-white placeholder-[#A59BB8]/50 text-xs sm:text-sm focus:outline-none focus:border-[#BB86FF] transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-[#9B5CFF] to-[#7A22FF] hover:brightness-110 active:scale-98 shadow-[0_0_20px_rgba(155,92,255,0.4)] transition-all flex items-center justify-center gap-2"
          >
            {loading ? <span>Authenticating...</span> : <span>Enter Editor Dashboard</span>}
          </button>
        </form>

        {/* Administration Policy Notice */}
        <div className="mt-6 pt-5 border-t border-[#251B38] text-center">
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#A59BB8]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Editor accounts are provisioned exclusively by DRAFTLY Administration.</span>
          </div>
          <p className="text-[10px] text-[#A59BB8]/70 mt-1">
            Need client hiring services?{' '}
            <button
              onClick={() => navigate('/register')}
              className="text-[#BB86FF] font-semibold hover:underline"
            >
              Sign up as a Client
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
