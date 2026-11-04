import React, { useState } from 'react';
import { X, Star, Send } from 'lucide-react';
import { HiringRequest } from '../types';
import { createReview } from '../services/db';
import { useAuth } from '../contexts/AuthContext';

interface ReviewModalProps {
  request: HiringRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  request,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { userProfile } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !request || !userProfile) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || comment.trim().length < 10) {
      setError('Please provide feedback of at least 10 characters.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await createReview({
        requestId: request.id,
        clientId: userProfile.id,
        clientName: userProfile.displayName || 'Client',
        editorId: request.editorId,
        editorName: request.editorName,
        rating,
        comment: comment.trim(),
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to submit review:', err);
      setError('Could not submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md rounded-2xl bg-[#171025] border border-[#9B5CFF]/30 shadow-2xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#251B38]">
          <div>
            <h3 className="font-bold text-white text-base">Leave a Review</h3>
            <p className="text-xs text-[#A59BB8]">
              For {request.editorName} • {request.projectTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#A59BB8] hover:text-white hover:bg-[#251B38]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-white mb-2">
              Overall Rating
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1.5 transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= rating
                        ? 'fill-amber-400 text-amber-400 filter drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]'
                        : 'text-gray-600'
                    }`}
                  />
                </button>
              ))}
              <span className="text-sm font-bold text-amber-300 ml-2">
                {rating} / 5 Stars
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white mb-1">
              Your Feedback & Experience *
            </label>
            <textarea
              required
              rows={4}
              placeholder="How was the communication, turnaround speed, color grading, and creative vision?"
              value={comment}
              onChange={e => setComment(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/20 text-white placeholder-[#A59BB8]/50 text-xs sm:text-sm focus:outline-none focus:border-[#BB86FF] transition-colors resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#A59BB8] hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#9B5CFF] to-[#7A22FF] hover:brightness-110 active:scale-95 shadow-[0_0_15px_rgba(155,92,255,0.4)] transition-all flex items-center gap-2"
            >
              {submitting ? 'Submitting...' : 'Post Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
