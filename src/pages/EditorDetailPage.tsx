import React, { useState, useEffect } from 'react';
import {
  Star,
  ExternalLink,
  Briefcase,
  CheckCircle2,
  Youtube,
  Instagram,
  ArrowLeft,
  MessageSquare,
  ShieldAlert,
  Calendar,
  Clock,
  Heart,
  Share2,
} from 'lucide-react';
import { EditorProfile, Review } from '../types';
import {
  getReviewsForEditor,
  getOrCreateConversation,
  submitReport,
  toggleSaveEditor,
} from '../services/db';
import { HireModal } from '../components/HireModal';
import { formatCurrency } from '../utils/marketplace';
import { useAuth } from '../contexts/AuthContext';

interface EditorDetailPageProps {
  editor: EditorProfile;
  onBack: () => void;
  navigate: (path: string) => void;
}

export const EditorDetailPage: React.FC<EditorDetailPageProps> = ({
  editor,
  onBack,
  navigate,
}) => {
  const { userProfile } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isHireOpen, setIsHireOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    getReviewsForEditor(editor.id).then(setReviews).catch(() => {});
  }, [editor.id]);

  const handleStartChat = async () => {
    if (!userProfile) {
      navigate('/login');
      return;
    }
    try {
      const convId = await getOrCreateConversation(
        userProfile.id,
        userProfile.displayName || 'Client',
        editor.id,
        editor.fullName
      );
      navigate(`/dashboard?tab=messages&conv=${convId}`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleSave = async () => {
    if (!userProfile) {
      navigate('/login');
      return;
    }
    const added = await toggleSaveEditor(userProfile.id, editor.id);
    setIsSaved(added);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) {
      navigate('/login');
      return;
    }
    try {
      await submitReport({
        reporterId: userProfile.id,
        reportedUserId: editor.id,
        reportedUserName: editor.fullName,
        reason: reportReason,
        details: reportDetails,
      });
      setReportSubmitted(true);
      setTimeout(() => {
        setReportModalOpen(false);
        setReportSubmitted(false);
      }, 1500);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-semibold text-[#A59BB8] hover:text-white mb-6 group transition-colors"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span>Back to Editors</span>
      </button>

      {/* Hero Header Box */}
      <div className="rounded-3xl bg-[#171025] border border-[#9B5CFF]/30 p-6 sm:p-8 shadow-2xl relative overflow-hidden mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="relative">
              <img
                src={editor.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
                alt={editor.fullName}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-2 border-[#9B5CFF]/40 shadow-xl"
              />
              <span
                className={`absolute bottom-0 right-0 w-5 h-5 rounded-full border-2 border-[#171025] ${
                  editor.availability === 'Available Now' ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Manrope']">
                  {editor.fullName}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Verified Pro
                </span>
              </div>
              <p className="text-sm text-[#BB86FF] font-medium">{editor.title}</p>
              
              <div className="flex flex-wrap items-center gap-4 text-xs text-[#A59BB8] pt-1">
                <div className="flex items-center gap-1 text-amber-400 font-bold">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span>{editor.rating.toFixed(1)}</span>
                  <span className="text-[#A59BB8] font-normal">({editor.reviewCount} reviews)</span>
                </div>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-[#BB86FF]" />
                  {editor.experience} Experience
                </span>
                <span>•</span>
                <span className="text-emerald-400 font-medium">
                  {editor.completedProjectsCount} Projects Completed
                </span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <button
              onClick={handleToggleSave}
              className={`p-3 rounded-2xl border transition-colors flex items-center justify-center gap-2 text-xs font-semibold ${
                isSaved
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                  : 'bg-[#100B1C] border-[#9B5CFF]/20 text-[#A59BB8] hover:text-white'
              }`}
            >
              <Heart className={`w-4 h-4 ${isSaved ? 'fill-rose-400' : ''}`} />
              <span className="sm:hidden">Save</span>
            </button>

            <button
              onClick={handleShare}
              className="p-3 rounded-2xl bg-[#100B1C] border border-[#9B5CFF]/20 text-[#A59BB8] hover:text-white transition-colors flex items-center justify-center gap-2 text-xs font-semibold"
            >
              <Share2 className="w-4 h-4" />
              <span className="sm:hidden">{copiedLink ? 'Copied' : 'Share'}</span>
            </button>

            <button
              onClick={handleStartChat}
              className="px-4 py-3 rounded-2xl bg-[#100B1C] hover:bg-[#251B38] border border-[#9B5CFF]/30 text-white text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4 text-[#BB86FF]" />
              <span>Direct Message</span>
            </button>

            <button
              onClick={() => setIsHireOpen(true)}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#9B5CFF] to-[#7A22FF] text-white text-xs font-extrabold shadow-[0_0_20px_rgba(155,92,255,0.4)] hover:brightness-110 active:scale-95 transition-all text-center"
            >
              Hire From {formatCurrency(editor.startingPrice)}
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Details & Portfolio */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Bio, Portfolio, Skills, Reviews */}
        <div className="lg:col-span-2 space-y-8">
          {/* About & Bio */}
          <div className="p-6 sm:p-7 rounded-3xl bg-[#171025] border border-[#9B5CFF]/20 space-y-4">
            <h2 className="text-lg font-bold text-white font-['Manrope']">
              Creative Background & Approach
            </h2>
            <p className="text-sm text-[#A59BB8] leading-relaxed whitespace-pre-line">
              {editor.bio}
            </p>

            <div className="pt-4 border-t border-[#251B38]">
              <h3 className="text-xs uppercase font-bold text-[#BB86FF] tracking-wider mb-2.5">
                Specializations & Categories
              </h3>
              <div className="flex flex-wrap gap-2">
                {editor.categories.map((c, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full text-xs font-semibold bg-[#9B5CFF]/15 text-[#BB86FF] border border-[#9B5CFF]/30"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <h3 className="text-xs uppercase font-bold text-[#A59BB8] tracking-wider mb-2.5">
                Software & Tooling Stack
              </h3>
              <div className="flex flex-wrap gap-2">
                {editor.skills.map((s, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-full text-xs bg-[#100B1C] text-white border border-[#251B38]"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Portfolio & Showcase */}
          <div className="p-6 sm:p-7 rounded-3xl bg-[#171025] border border-[#9B5CFF]/20 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white font-['Manrope']">
                Portfolio & Showreel
              </h2>
              {editor.portfolioUrl && (
                <a
                  href={editor.portfolioUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-[#BB86FF] hover:underline flex items-center gap-1"
                >
                  <span>Open Full Reel</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            <div className="rounded-2xl bg-[#080611] border border-[#251B38] p-5 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#171025] border border-[#9B5CFF]/30 flex items-center justify-center text-[#BB86FF] mx-auto">
                <Youtube className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-white">External Video Reel</p>
              <p className="text-xs text-[#A59BB8] max-w-md mx-auto">
                Watch full 4K exported showreel clips, multi-cam timeline cuts, and color grading breakdowns on {editor.fullName}'s verified portfolio.
              </p>
              {editor.portfolioUrl && (
                <a
                  href={editor.portfolioUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#251B38] hover:bg-[#32234B] border border-[#9B5CFF]/30 transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Launch Showreel</span>
                </a>
              )}
            </div>
          </div>

          {/* Genuine Client Reviews */}
          <div className="p-6 sm:p-7 rounded-3xl bg-[#171025] border border-[#9B5CFF]/20 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white font-['Manrope']">
                Client Reviews ({reviews.length})
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold">
                <Star className="w-4 h-4 fill-amber-400" />
                <span>{editor.rating.toFixed(1)} Rating</span>
              </div>
            </div>

            {reviews.length === 0 ? (
              <p className="text-xs text-[#A59BB8] py-4">No reviews recorded yet for this editor.</p>
            ) : (
              <div className="space-y-4">
                {reviews.map(r => (
                  <div
                    key={r.id}
                    className="p-4 rounded-2xl bg-[#100B1C] border border-[#251B38] space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{r.clientName}</span>
                      <div className="flex items-center text-amber-400 text-xs">
                        {[...Array(r.rating)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-[#A59BB8] italic leading-relaxed">
                      "{r.comment}"
                    </p>
                    <span className="text-[10px] text-[#A59BB8]/60 block">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Pricing sidebar & Social Channels */}
        <div className="space-y-6">
          {/* Pricing Box */}
          <div className="p-6 rounded-3xl bg-[#171025] border border-[#9B5CFF]/30 space-y-5">
            <span className="text-xs uppercase font-bold text-[#A59BB8] tracking-wider block">
              Starting Rate
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white">
                {formatCurrency(editor.startingPrice)}
              </span>
              <span className="text-xs text-[#A59BB8]">/ base project</span>
            </div>

            <div className="space-y-2.5 text-xs text-[#A59BB8] border-t border-[#251B38] pt-4">
              <div className="flex items-center justify-between">
                <span>Availability:</span>
                <span className="font-semibold text-emerald-400">{editor.availability}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Typical Turnaround:</span>
                <span className="font-semibold text-white">2 - 4 Business Days</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Revisions Included:</span>
                <span className="font-semibold text-white">2 Rounds Included</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Export Format:</span>
                <span className="font-semibold text-white">ProRes 422 / H.265 4K</span>
              </div>
            </div>

            <button
              onClick={() => setIsHireOpen(true)}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#9B5CFF] to-[#7A22FF] text-white text-xs font-bold shadow-[0_0_20px_rgba(155,92,255,0.4)] hover:brightness-110 active:scale-95 transition-all"
            >
              Request Hire
            </button>
          </div>

          {/* Social Channels */}
          <div className="p-5 rounded-3xl bg-[#171025] border border-[#9B5CFF]/20 space-y-3">
            <h3 className="text-xs uppercase font-bold text-white tracking-wider">
              Connected Channels
            </h3>
            <div className="space-y-2">
              {editor.youtubeUrl && (
                <a
                  href={editor.youtubeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#100B1C] hover:bg-[#251B38] text-xs text-[#A59BB8] hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Youtube className="w-4 h-4 text-red-500" />
                    <span>YouTube Channel</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              {editor.instagramUrl && (
                <a
                  href={editor.instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#100B1C] hover:bg-[#251B38] text-xs text-[#A59BB8] hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Instagram className="w-4 h-4 text-pink-400" />
                    <span>Instagram Profile</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>

          {/* Moderation Report button */}
          <div className="text-center">
            <button
              onClick={() => setReportModalOpen(true)}
              className="text-xs text-[#A59BB8]/60 hover:text-rose-400 transition-colors inline-flex items-center gap-1.5"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Report this profile to admin</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hire Modal */}
      <HireModal
        editor={editor}
        isOpen={isHireOpen}
        onClose={() => setIsHireOpen(false)}
        onSuccess={() => {
          navigate('/dashboard?tab=requests');
        }}
        onRequireAuth={() => {
          setIsHireOpen(false);
          navigate('/login');
        }}
      />

      {/* Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-[#171025] border border-[#9B5CFF]/30 p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Report Profile</h3>
            {reportSubmitted ? (
              <p className="text-xs text-emerald-400">Report submitted. Admins will review promptly.</p>
            ) : (
              <form onSubmit={handleSubmitReport} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-white mb-1">Reason</label>
                  <select
                    value={reportReason}
                    onChange={e => setReportReason(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/20 text-white text-xs"
                  >
                    <option value="">Select reason...</option>
                    <option value="Inaccurate Portfolio">Inaccurate / Stolen Portfolio</option>
                    <option value="Unresponsive">Unresponsive / Missed Deadlines</option>
                    <option value="Spam">Spam or Suspicious Behavior</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white mb-1">Details</label>
                  <textarea
                    rows={3}
                    required
                    value={reportDetails}
                    onChange={e => setReportDetails(e.target.value)}
                    placeholder="Provide additional context for moderation..."
                    className="w-full px-3 py-2 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/20 text-white text-xs"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setReportModalOpen(false)}
                    className="px-3 py-1.5 rounded-lg text-xs text-[#A59BB8]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg text-xs bg-rose-600 text-white font-semibold"
                  >
                    Submit Report
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
