import React, { useState } from 'react';
import { Mail, Lock, User, Building, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface RegisterPageProps {
  navigate: (path: string) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ navigate }) => {
  const { registerClient } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [company, setCompany] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await registerClient({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        company: company.trim(),
      });
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to create client account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl bg-[#171025] border border-[#9B5CFF]/30 p-8 shadow-2xl relative overflow-hidden">
        <div className="text-center mb-6">
          <img
            src="https://i.postimg.cc/NjqbtJKN/Neon-Purple-Draftly-Crown-Logo.png"
            alt="DRAFTLY"
            className="h-12 w-auto mx-auto object-contain mb-3 filter drop-shadow-[0_0_15px_rgba(187,134,255,0.4)]"
          />
          <h1 className="text-2xl font-extrabold text-white font-['Manrope']">
            Create Client Account
          </h1>
          <p className="text-xs text-[#A59BB8] mt-1">
            Hire elite video editors, post briefs, and streamline approvals.
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
            <label className="block text-xs font-semibold text-white mb-1">Full Name *</label>
            <div className="relative">
              <User className="w-4 h-4 text-[#A59BB8] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="David Miller"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/20 text-white placeholder-[#A59BB8]/50 text-xs sm:text-sm focus:outline-none focus:border-[#BB86FF] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white mb-1">Email Address *</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#A59BB8] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="david@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/20 text-white placeholder-[#A59BB8]/50 text-xs sm:text-sm focus:outline-none focus:border-[#BB86FF] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white mb-1">Company / Studio (Optional)</label>
            <div className="relative">
              <Building className="w-4 h-4 text-[#A59BB8] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Apex Media Productions"
                value={company}
                onChange={e => setCompany(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/20 text-white placeholder-[#A59BB8]/50 text-xs sm:text-sm focus:outline-none focus:border-[#BB86FF] transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-white mb-1">Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#A59BB8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/20 text-white text-xs sm:text-sm focus:outline-none focus:border-[#BB86FF]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white mb-1">Confirm Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#A59BB8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/20 text-white text-xs sm:text-sm focus:outline-none focus:border-[#BB86FF]"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-[#9B5CFF] to-[#7A22FF] hover:brightness-110 active:scale-95 shadow-[0_0_20px_rgba(155,92,255,0.4)] transition-all flex items-center justify-center gap-2"
          >
            {loading ? <span>Creating Account...</span> : <span>Create Account</span>}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-[#A59BB8]">
          <span>Already have an account? </span>
          <button
            onClick={() => navigate('/login')}
            className="text-[#BB86FF] font-semibold hover:underline"
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
};
