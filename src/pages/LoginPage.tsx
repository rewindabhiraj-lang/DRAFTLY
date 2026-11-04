import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LoginPageProps {
  navigate: (path: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ navigate }) => {
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const role = await login(email, password);
      if (role === 'admin') navigate('/admin/dashboard');
      else if (role === 'editor') navigate('/editor/dashboard');
      else navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      const role = await loginWithGoogle();
      if (role === 'admin') navigate('/admin/dashboard');
      else if (role === 'editor') navigate('/editor/dashboard');
      else navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Google sign in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl bg-[#171025] border border-[#9B5CFF]/30 p-8 shadow-2xl relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#BB86FF]/10 blur-2xl pointer-events-none" />

        {/* Brand Header */}
        <div className="text-center mb-8">
          <img
            src="https://i.postimg.cc/NjqbtJKN/Neon-Purple-Draftly-Crown-Logo.png"
            alt="DRAFTLY"
            className="h-12 w-auto mx-auto object-contain mb-3 filter drop-shadow-[0_0_15px_rgba(187,134,255,0.4)]"
          />
          <h1 className="text-2xl font-extrabold text-white font-['Manrope']">
            Sign In to DRAFTLY
          </h1>
          <p className="text-xs text-[#A59BB8] mt-1">
            Access your client dashboard, proposals, and projects.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-white mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#A59BB8] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/20 text-white placeholder-[#A59BB8]/50 text-xs sm:text-sm focus:outline-none focus:border-[#BB86FF] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#A59BB8] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/20 text-white placeholder-[#A59BB8]/50 text-xs sm:text-sm focus:outline-none focus:border-[#BB86FF] transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-[#9B5CFF] to-[#7A22FF] hover:brightness-110 active:scale-95 shadow-[0_0_20px_rgba(155,92,255,0.4)] transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Signing In...</span>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="flex-1 h-px bg-[#251B38]" />
          <span className="text-[11px] text-[#A59BB8] uppercase">or</span>
          <div className="flex-1 h-px bg-[#251B38]" />
        </div>

        {/* Google sign in button */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={loading}
          className="w-full py-2.5 rounded-xl text-xs font-semibold text-white bg-[#100B1C] hover:bg-[#251B38] border border-[#9B5CFF]/30 transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>


        {/* Footer link */}
        <div className="mt-6 text-center text-xs text-[#A59BB8]">
          <span>Don't have an account? </span>
          <button
            onClick={() => navigate('/register')}
            className="text-[#BB86FF] font-semibold hover:underline"
          >
            Create Client Account
          </button>
        </div>

        <div className="mt-2 text-center text-xs text-[#A59BB8]">
          <span>Are you an editor? </span>
          <button
            onClick={() => navigate('/editor')}
            className="text-white hover:underline"
          >
            Editor Portal
          </button>
        </div>
      </div>
    </div>
  );
};
