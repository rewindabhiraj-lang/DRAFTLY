import React, { useState } from 'react';
import { X, Send, Calendar, IndianRupee, FileVideo, Sparkles } from 'lucide-react';
import { EditorProfile } from '../types';
import { createHiringRequest } from '../services/db';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../utils/marketplace';

interface HireModalProps {
  editor: EditorProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (requestId: string) => void;
  onRequireAuth: () => void;
}

export const HireModal: React.FC<HireModalProps> = ({
  editor,
  isOpen,
  onClose,
  onSuccess,
  onRequireAuth,
}) => {
  const { userProfile, userRole } = useAuth();
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [budget, setBudget] = useState(editor ? String(editor.startingPrice) : '200');
  const [deadline, setDeadline] = useState(
    new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]
  );
  const [referenceUrl, setReferenceUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !editor) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!userProfile) {
      onRequireAuth();
      return;
    }

    if (!projectTitle.trim()) {
      setError('Please provide a project title.');
      return;
    }

    if (!projectDescription.trim() || projectDescription.trim().length < 20) {
      setError('Please describe your project in at least 20 characters.');
      return;
    }

    const budgetNum = Number(budget);
    if (isNaN(budgetNum) || budgetNum < 500) {
      setError('Please enter a valid budget of at least ₹500.');
      return;
    }

    setSubmitting(true);
    try {
      const reqId = await createHiringRequest({
        clientId: userProfile.id,
        clientName: userProfile.displayName || 'Client',
        clientEmail: userProfile.email,
        editorId: editor.id,
        editorName: editor.fullName,
        projectTitle: projectTitle.trim(),
        projectDescription: `${projectDescription.trim()}${
          referenceUrl ? `\n\nReference / Footage Link: ${referenceUrl.trim()}` : ''
        }`,
        budget: budgetNum,
        deadline,
      });

      onSuccess(reqId);
      onClose();
    } catch (err) {
      console.error('Failed to create hiring request:', err);
      setError('Could not submit hiring request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl rounded-2xl bg-[#171025] border border-[#9B5CFF]/30 shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#251B38]">
          <div className="flex items-center gap-3">
            <img
              src={editor.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
              alt={editor.fullName}
              className="w-12 h-12 rounded-xl object-cover border border-[#9B5CFF]/30"
            />
            <div>
              <h2 className="text-lg font-bold text-white">Hire {editor.fullName}</h2>
              <p className="text-xs text-[#A59BB8]">
                {editor.title} • Starting {formatCurrency(editor.startingPrice)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#A59BB8] hover:text-white hover:bg-[#251B38] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-white mb-1">
              Project Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. YouTube Documentary Color Grade & Sound Edit"
              value={projectTitle}
              onChange={e => setProjectTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/20 text-white placeholder-[#A59BB8]/50 text-sm focus:outline-none focus:border-[#BB86FF] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white mb-1">
              Project Brief & Description *
            </label>
            <textarea
              required
              rows={4}
              placeholder="Describe video length, target style, music preferences, pacing, and deliverables..."
              value={projectDescription}
              onChange={e => setProjectDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/20 text-white placeholder-[#A59BB8]/50 text-sm focus:outline-none focus:border-[#BB86FF] transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-white mb-1 flex items-center gap-1">
                <IndianRupee className="w-3.5 h-3.5 text-[#BB86FF]" />
                Budget (INR ₹) *
              </label>
              <input
                type="number"
                min="500"
                step="100"
                placeholder="e.g. 5000"
                required
                value={budget}
                onChange={e => setBudget(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/20 text-white text-sm focus:outline-none focus:border-[#BB86FF] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#BB86FF]" />
                Target Deadline *
              </label>
              <input
                type="date"
                required
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/20 text-white text-sm focus:outline-none focus:border-[#BB86FF] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white mb-1 flex items-center gap-1">
              <FileVideo className="w-3.5 h-3.5 text-[#BB86FF]" />
              Footage / Reference Link (Optional)
            </label>
            <input
              type="url"
              placeholder="Google Drive, Dropbox, Frame.io, or YouTube reference URL"
              value={referenceUrl}
              onChange={e => setReferenceUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/20 text-white placeholder-[#A59BB8]/50 text-sm focus:outline-none focus:border-[#BB86FF] transition-colors"
            />
          </div>

          <div className="pt-3 border-t border-[#251B38] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#A59BB8] hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#9B5CFF] to-[#7A22FF] hover:brightness-110 active:scale-95 shadow-[0_0_20px_rgba(155,92,255,0.4)] transition-all flex items-center gap-2"
            >
              {submitting ? (
                <span>Sending Request...</span>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Proposal</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
