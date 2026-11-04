import React, { useState } from 'react';
import { Shield, ArrowRight, AlertCircle, KeyRound, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { adminLoginApi, adminChangePasswordApi } from '../services/db';

interface AdminLoginPageProps {
  navigate: (path: string) => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ navigate }) => {
  const { setAdminSession } = useAuth();
  // Start empty so placeholder "Enter your username" renders cleanly without pre-filled text
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Forced password change modal state
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changeError, setChangeError] = useState<string | null>(null);
  const [changeSuccess, setChangeSuccess] = useState<string | null>(null);
  const [changing, setChanging] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await adminLoginApi(username.trim(), password);

      if (!result.success || !result.token) {
        setError(result.error || 'Authentication failed. Please verify administrator credentials.');
        return;
      }

      // Check if Admin must change default password
      if (result.mustChangePassword) {
        setTempToken(result.token);
        setCurrentPassword(password);
        setMustChangePassword(true);
        return;
      }

      // Login successful and password already updated
      setAdminSession(result.token, result.username || 'Abhiraj');
      navigate('/admin/dashboard');
    } catch (err: any) {
      console.error('Admin login error:', err);
      setError(err.message || 'Unable to connect to Admin authentication service.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangeError(null);
    setChangeSuccess(null);

    if (newPassword.length < 6) {
      setChangeError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setChangeError('New password and confirmation do not match.');
      return;
    }

    if (newPassword === 'Abhiraj') {
      setChangeError('New password cannot be the default password ("Abhiraj").');
      return;
    }

    if (!tempToken) {
      setChangeError('Session expired. Please log in again.');
      return;
    }

    setChanging(true);

    try {
      const result = await adminChangePasswordApi(
        currentPassword,
        newPassword,
        confirmPassword,
        tempToken
      );

      if (!result.success) {
        setChangeError(result.error || 'Failed to update password.');
        return;
      }

      setChangeSuccess('Password updated successfully! Redirecting to Admin Dashboard...');
      setAdminSession(tempToken, 'Abhiraj');

      setTimeout(() => {
        setMustChangePassword(false);
        navigate('/admin/dashboard');
      }, 1200);
    } catch (err: any) {
      setChangeError(err.message || 'Error communicating with password update service.');
    } finally {
      setChanging(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl bg-[#171025] border border-[#9B5CFF]/30 p-8 shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-[#9B5CFF]/15 blur-3xl pointer-events-none" />

        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[#100B1C] border border-[#BB86FF]/40 flex items-center justify-center text-[#BB86FF] mx-auto mb-4 shadow-[0_0_20px_rgba(187,134,255,0.25)]">
            <Shield className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-white font-['Manrope']">
            Admin Access Portal
          </h1>
          <p className="text-xs text-[#A59BB8] mt-1.5">
            Secured administration access for DRAFTLY
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Exact required layout: Username label displayed only once, followed by input with [ Enter your username ] placeholder */}
          <div>
            <label htmlFor="admin-username-input" className="block text-xs font-semibold text-white mb-2">
              Username
            </label>
            <input
              id="admin-username-input"
              type="text"
              required
              autoComplete="username"
              placeholder="Enter your username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/25 text-white placeholder-[#A59BB8]/50 text-xs sm:text-sm focus:outline-none focus:border-[#BB86FF] transition-colors"
            />
          </div>

          {/* Exact required layout: Password label displayed only once, followed by input with [ Enter your password ] placeholder */}
          <div>
            <label htmlFor="admin-password-input" className="block text-xs font-semibold text-white mb-2">
              Password
            </label>
            <input
              id="admin-password-input"
              type="password"
              required
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/25 text-white placeholder-[#A59BB8]/50 text-xs sm:text-sm focus:outline-none focus:border-[#BB86FF] transition-colors"
            />
          </div>

          {/* Exact required layout: [ Login to Admin Panel ] */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-[#9B5CFF] to-[#7A22FF] hover:brightness-110 active:scale-98 shadow-[0_0_20px_rgba(155,92,255,0.4)] transition-all flex items-center justify-center gap-2"
          >
            {loading ? <span>Verifying Credentials...</span> : <span>Login to Admin Panel</span>}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-[#251B38] text-center">
          <button
            onClick={() => {
              window.location.href = '/';
            }}
            className="text-xs text-[#A59BB8] hover:text-[#BB86FF] transition-colors"
          >
            ← Return to Main Marketplace
          </button>
        </div>
      </div>

      {/* REQUIRED FIRST LOGIN PASSWORD CHANGE MODAL */}
      {mustChangePassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#171025] border border-amber-500/40 p-6 sm:p-8 shadow-2xl relative">
            <div className="w-12 h-12 rounded-2xl bg-[#100B1C] border border-amber-500/40 flex items-center justify-center text-amber-400 mx-auto mb-4">
              <KeyRound className="w-6 h-6" />
            </div>

            <div className="text-center mb-6">
              <h2 className="text-xl font-extrabold text-white font-['Manrope']">
                Change Default Admin Password
              </h2>
              <p className="text-xs text-[#A59BB8] mt-1.5 leading-relaxed">
                Initial login detected. For system security, please update your default password for user <strong className="text-white">Abhiraj</strong> before entering the dashboard.
              </p>
            </div>

            {changeError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{changeError}</span>
              </div>
            )}

            {changeSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{changeSuccess}</span>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/30 text-white text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-1">
                  New Password (min 6 characters)
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter a new secure password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/30 text-white text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/30 text-white text-xs sm:text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={changing}
                className="w-full py-3 rounded-xl text-xs sm:text-sm font-bold text-black bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 active:scale-98 shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all mt-2"
              >
                {changing ? 'Updating Password...' : 'Save New Password & Continue'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
