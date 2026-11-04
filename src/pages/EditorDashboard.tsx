import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  User,
  Film,
  FileText,
  Video,
  CheckCircle,
  MessageSquare,
  IndianRupee,
  Star,
  Bell,
  Settings,
  LogOut,
  AlertTriangle,
  Clock,
  ExternalLink,
  Send,
  Upload,
  Check,
  X,
  KeyRound,
  Lock,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { EditorProfile, HiringRequest, Conversation, Notification, Review } from '../types';
import {
  getEditorHiringRequests,
  subscribeToEditorHiringRequests,
  updateHiringRequestStatus,
  updateEditorProfile,
  getUserConversations,
  subscribeToConversations,
  getUserNotifications,
  subscribeToUserNotifications,
  getReviewsForEditor,
  markNotificationAsRead,
  editorChangeCredentialsApi,
} from '../services/db';
import { formatCurrency, getStatusStyle, sanitizeUsername } from '../utils/marketplace';
import { ChatModal } from '../components/ChatModal';

interface EditorDashboardProps {
  navigate: (path: string) => void;
  initialTab?: string;
}

export const EditorDashboard: React.FC<EditorDashboardProps> = ({
  navigate,
  initialTab = 'overview',
}) => {
  const { userProfile, editorProfile, logout, refreshProfile, editorToken, setEditorSession } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [requests, setRequests] = useState<HiringRequest[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  // Deliver work modal
  const [submitModalReq, setSubmitModalReq] = useState<HiringRequest | null>(null);
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [submissionUrls, setSubmissionUrls] = useState('');
  const [submittingDelivery, setSubmittingDelivery] = useState(false);

  // Reject proposal modal
  const [rejectModalReq, setRejectModalReq] = useState<HiringRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Chat modal
  const [activeChat, setActiveChat] = useState<{
    convId: string;
    recipientId: string;
    recipientName: string;
  } | null>(null);

  // Profile fields state
  const [fullName, setFullName] = useState(editorProfile?.fullName || '');
  const [title, setTitle] = useState(editorProfile?.title || '');
  const [bio, setBio] = useState(editorProfile?.bio || '');
  const [experience, setExperience] = useState(editorProfile?.experience || '3+ Years');
  const [startingPrice, setStartingPrice] = useState(editorProfile ? String(editorProfile.startingPrice) : '250');
  const [availability, setAvailability] = useState<'Available Now' | 'Busy' | 'Booked'>(
    editorProfile?.availability || 'Available Now'
  );
  const [portfolioUrl, setPortfolioUrl] = useState(editorProfile?.portfolioUrl || '');
  const [instagramUrl, setInstagramUrl] = useState(editorProfile?.instagramUrl || '');
  const [youtubeUrl, setYoutubeUrl] = useState(editorProfile?.youtubeUrl || '');
  const [skillsStr, setSkillsStr] = useState(editorProfile?.skills?.join(', ') || '');
  const [profileSaved, setProfileSaved] = useState(false);

  useEffect(() => {
    if (!userProfile?.id) return;

    const unsubRequests = subscribeToEditorHiringRequests(userProfile.id, setRequests);
    const unsubConversations = subscribeToConversations(userProfile.id, setConversations);
    const unsubNotifications = subscribeToUserNotifications(userProfile.id, setNotifications);

    getReviewsForEditor(userProfile.id)
      .then(setReviews)
      .catch(() => {})
      .finally(() => setLoading(false));

    return () => {
      unsubRequests();
      unsubConversations();
      unsubNotifications();
    };
  }, [userProfile?.id]);

  const refreshRequests = async () => {
    if (!userProfile) return;
    const reqs = await getEditorHiringRequests(userProfile.id);
    setRequests(reqs);
  };

  const isPendingApproval = editorProfile?.status === 'pending';
  const isSuspended = editorProfile?.status === 'suspended';

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const activeProjects = requests.filter(r =>
    ['accepted', 'in_progress', 'submitted', 'revision_requested'].includes(r.status)
  );
  const completedProjects = requests.filter(r => r.status === 'completed');

  const totalEarned = completedProjects.reduce((sum, r) => sum + (r.budget || 0), 0);

  const handleAcceptProposal = async (req: HiringRequest) => {
    await updateHiringRequestStatus(req.id, 'accepted');
    await refreshRequests();
  };

  const handleRejectProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalReq) return;
    await updateHiringRequestStatus(rejectModalReq.id, 'rejected', {
      rejectionReason: rejectionReason.trim() || 'Editor currently unavailable',
    });
    setRejectModalReq(null);
    setRejectionReason('');
    await refreshRequests();
  };

  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitModalReq || !submissionUrls.trim()) return;
    setSubmittingDelivery(true);
    try {
      const urls = submissionUrls
        .split('\n')
        .map(u => u.trim())
        .filter(u => u.length > 0);

      await updateHiringRequestStatus(submitModalReq.id, 'submitted', {
        submissionNotes: submissionNotes.trim(),
        submissionUrls: urls,
      });

      setSubmitModalReq(null);
      setSubmissionNotes('');
      setSubmissionUrls('');
      await refreshRequests();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingDelivery(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;

    const skills = skillsStr
      .split(',')
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0);

    await updateEditorProfile(userProfile.id, {
      fullName,
      title,
      bio,
      experience,
      startingPrice: Number(startingPrice) || 200,
      availability,
      portfolioUrl,
      instagramUrl,
      youtubeUrl,
      skills,
    });

    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
    refreshProfile();
  };

  // Editor Credentials Management State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newUsername, setNewUsername] = useState(editorProfile?.username || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [credLoading, setCredLoading] = useState(false);
  const [credError, setCredError] = useState<string | null>(null);
  const [credSuccess, setCredSuccess] = useState<string | null>(null);

  const handleEditorChangeCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setCredError(null);
    setCredSuccess(null);

    if (!currentPassword) {
      setCredError('Current password is required to verify your authorization.');
      return;
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        setCredError('New password must be at least 6 characters long.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setCredError('New password and confirmation do not match.');
        return;
      }
    }

    if (!newUsername.trim() && !newPassword) {
      setCredError('Provide a new username or new password to update.');
      return;
    }

    const token =
      editorToken ||
      sessionStorage.getItem('draftly_editor_token') ||
      localStorage.getItem('draftly_editor_token');

    if (!token) {
      setCredError('Editor authentication session missing. Please log in again.');
      return;
    }

    setCredLoading(true);
    try {
      const res = await editorChangeCredentialsApi(
        {
          currentPassword,
          newUsername: newUsername.trim() || undefined,
          newPassword: newPassword || undefined,
          confirmPassword: confirmPassword || undefined,
        },
        token
      );

      if (!res.success) {
        setCredError(res.message || res.error || 'Failed to update credentials.');
        return;
      }

      setCredSuccess('Your account credentials have been updated successfully! Changes take effect immediately.');
      if (res.token && res.editor) {
        setEditorSession(res.token, res.editor);
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      refreshProfile();
    } catch (err: any) {
      setCredError(err.message || 'Failed to update credentials.');
    } finally {
      setCredLoading(false);
    }
  };

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'portfolio', label: 'Portfolio', icon: Film },
    { id: 'requests', label: 'Hiring Requests', icon: FileText, badge: pendingRequests.length },
    { id: 'projects', label: 'Active Projects', icon: Video, badge: activeProjects.length },
    { id: 'completed', label: 'Completed Projects', icon: CheckCircle },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'earnings', label: 'Earnings Overview', icon: IndianRupee },
    { id: 'reviews', label: 'Reviews', icon: Star },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: notifications.filter(n => !n.read).length },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#080611] flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-[#100B1C] border-r border-[#9B5CFF]/20 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo & Editor status snippet */}
          <div className="p-6 border-b border-[#251B38]">
            <div
              onClick={() => navigate('/')}
              className="flex items-center gap-3 cursor-pointer group mb-5"
            >
              <img
                src="https://i.postimg.cc/NjqbtJKN/Neon-Purple-Draftly-Crown-Logo.png"
                alt="DRAFTLY"
                className="h-8 w-auto object-contain"
              />
              <span className="text-xl font-extrabold text-white font-['Manrope']">
                DRAFTLY
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#9B5CFF]/20 border border-[#9B5CFF]/40 flex items-center justify-center text-[#BB86FF] font-bold">
                {editorProfile?.fullName ? editorProfile.fullName[0].toUpperCase() : 'E'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate">
                  {editorProfile?.fullName || userProfile?.displayName || 'Editor'}
                </p>
                <span
                  className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                    isPendingApproval
                      ? 'bg-amber-500/10 text-amber-300'
                      : isSuspended
                      ? 'bg-rose-500/10 text-rose-300'
                      : 'bg-emerald-500/10 text-emerald-300'
                  }`}
                >
                  {editorProfile?.status || 'Active Pro'}
                </span>
              </div>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="p-4 space-y-1">
            {sidebarItems.map(item => {
              const IconComp = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#9B5CFF]/20 text-[#BB86FF] border border-[#9B5CFF]/40 shadow-[0_0_15px_rgba(155,92,255,0.2)]'
                      : 'text-[#A59BB8] hover:text-white hover:bg-[#171025]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <IconComp className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {typeof item.badge === 'number' && item.badge > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#9B5CFF] text-white">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom logout */}
        <div className="p-4 border-t border-[#251B38]">
          <button
            onClick={async () => {
              await logout();
              navigate('/');
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 p-6 sm:p-8 lg:p-10 overflow-y-auto max-w-7xl">
        {/* PENDING APPROVAL OR SUSPENSION NOTICE BANNER */}
        {isPendingApproval && (
          <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-4">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-sm text-amber-300">
                Application Under Review by DRAFTLY Admins
              </h3>
              <p className="text-xs text-amber-200/80 mt-1 leading-relaxed">
                Your profile was submitted and is currently being audited for video quality and portfolio authenticity.
                You can configure your settings, bio, and showreel in the meantime. Admins typically review within 24 hours.
              </p>
            </div>
          </div>
        )}

        {isSuspended && (
          <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-4">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-sm text-rose-300">
                Account Suspended
              </h3>
              <p className="text-xs text-rose-200/80 mt-1">
                Your editor profile is temporarily inactive. Please contact support via the Contact page to resolve this.
              </p>
            </div>
          </div>
        )}

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Manrope']">
                  Editor Dashboard
                </h1>
                <p className="text-xs sm:text-sm text-[#A59BB8] mt-1">
                  Manage incoming client briefs, track active edits, and deliver finalized videos.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-[#A59BB8]">Current Availability:</span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#171025] border border-[#9B5CFF]/30 text-emerald-400">
                  {editorProfile?.availability || 'Available Now'}
                </span>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="p-5 rounded-2xl bg-[#171025] border border-[#9B5CFF]/20">
                <span className="text-xs text-[#A59BB8] font-medium block">Total Earned</span>
                <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-1 block">
                  {formatCurrency(totalEarned)}
                </span>
              </div>
              <div className="p-5 rounded-2xl bg-[#171025] border border-[#9B5CFF]/20">
                <span className="text-xs text-[#A59BB8] font-medium block">Pending Proposals</span>
                <span className="text-2xl sm:text-3xl font-extrabold text-amber-400 mt-1 block">
                  {pendingRequests.length}
                </span>
              </div>
              <div className="p-5 rounded-2xl bg-[#171025] border border-[#9B5CFF]/20">
                <span className="text-xs text-[#A59BB8] font-medium block">Active Projects</span>
                <span className="text-2xl sm:text-3xl font-extrabold text-[#BB86FF] mt-1 block">
                  {activeProjects.length}
                </span>
              </div>
              <div className="p-5 rounded-2xl bg-[#171025] border border-[#9B5CFF]/20">
                <span className="text-xs text-[#A59BB8] font-medium block">Average Rating</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                  <span className="text-2xl sm:text-3xl font-extrabold text-white">
                    {editorProfile?.rating?.toFixed(1) || '5.0'}
                  </span>
                </div>
              </div>
            </div>

            {/* In-Flight Work */}
            <div className="p-6 rounded-3xl bg-[#171025] border border-[#9B5CFF]/20 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white font-['Manrope']">
                  Projects Needing Attention
                </h2>
                <button
                  onClick={() => setActiveTab('projects')}
                  className="text-xs font-semibold text-[#BB86FF] hover:underline"
                >
                  View All Active
                </button>
              </div>

              {activeProjects.length === 0 ? (
                <p className="text-xs text-[#A59BB8] py-6 text-center">
                  No active projects currently underway. Check your incoming proposals!
                </p>
              ) : (
                <div className="space-y-3">
                  {activeProjects.slice(0, 3).map(proj => {
                    const style = getStatusStyle(proj.status);
                    return (
                      <div
                        key={proj.id}
                        className="p-4 rounded-2xl bg-[#100B1C] border border-[#251B38] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-white">{proj.projectTitle}</h4>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] border font-bold ${style.badgeClass}`}>
                              {style.label}
                            </span>
                          </div>
                          <p className="text-xs text-[#A59BB8] mt-1">
                            Client: <strong className="text-white">{proj.clientName}</strong> • Due: {proj.deadline} • Budget: {formatCurrency(proj.budget)}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setActiveChat({
                                convId: proj.id,
                                recipientId: proj.clientId,
                                recipientName: proj.clientName,
                              });
                            }}
                            className="px-3 py-1.5 rounded-xl bg-[#251B38] text-xs font-semibold text-white hover:bg-[#32234B] flex items-center gap-1.5"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-[#BB86FF]" />
                            <span>Chat</span>
                          </button>
                          <button
                            onClick={() => setSubmitModalReq(proj)}
                            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#9B5CFF] to-[#7A22FF] text-xs font-bold text-white"
                          >
                            Deliver Work
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* HIRING REQUESTS TAB */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-extrabold text-white font-['Manrope']">
                Incoming Hiring Proposals
              </h1>
              <p className="text-xs text-[#A59BB8] mt-1">
                Review briefs submitted by clients. Accept to begin or decline if unavailable.
              </p>
            </div>

            {requests.length === 0 ? (
              <div className="text-center py-16 bg-[#171025] rounded-3xl border border-[#251B38]">
                <p className="text-sm text-[#A59BB8]">No proposals received yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map(req => {
                  const style = getStatusStyle(req.status);
                  return (
                    <div
                      key={req.id}
                      className="p-6 rounded-3xl bg-[#171025] border border-[#9B5CFF]/20 space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h3 className="text-base font-bold text-white">{req.projectTitle}</h3>
                          <p className="text-xs text-[#A59BB8]">
                            From: <strong className="text-white">{req.clientName}</strong> ({req.clientEmail})
                          </p>
                        </div>
                        <span className={`self-start sm:self-auto px-2.5 py-1 rounded-full text-xs font-bold border ${style.badgeClass}`}>
                          {style.label}
                        </span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-[#100B1C] border border-[#251B38] text-xs text-[#A59BB8] whitespace-pre-line leading-relaxed">
                        {req.projectDescription}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-2 border-t border-[#251B38]">
                        <div className="flex items-center gap-4 text-[#A59BB8]">
                          <span>Budget: <strong className="text-white">{formatCurrency(req.budget)}</strong></span>
                          <span>Deadline: <strong className="text-white">{req.deadline}</strong></span>
                        </div>

                        {req.status === 'pending' && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setRejectModalReq(req)}
                              className="px-4 py-2 rounded-xl text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 transition-colors"
                            >
                              Decline
                            </button>
                            <button
                              onClick={() => handleAcceptProposal(req)}
                              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#9B5CFF] to-[#7A22FF] hover:brightness-110 shadow-md transition-all"
                            >
                              Accept & Start Project
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ACTIVE PROJECTS TAB */}
        {activeTab === 'projects' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-extrabold text-white font-['Manrope']">
                Active Projects Underway
              </h1>
              <p className="text-xs text-[#A59BB8] mt-1">
                Edit raw footage, communicate with client, and submit finalized video deliverables.
              </p>
            </div>

            {activeProjects.length === 0 ? (
              <div className="text-center py-16 bg-[#171025] rounded-3xl border border-[#251B38]">
                <p className="text-sm text-[#A59BB8]">No active editing projects currently in flight.</p>
              </div>
            ) : (
              <div className="space-y-5">
                {activeProjects.map(proj => {
                  const style = getStatusStyle(proj.status);
                  return (
                    <div
                      key={proj.id}
                      className="p-6 rounded-3xl bg-[#171025] border border-[#9B5CFF]/30 space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h3 className="text-lg font-bold text-white">{proj.projectTitle}</h3>
                          <p className="text-xs text-[#A59BB8]">
                            Client: <strong className="text-white">{proj.clientName}</strong> • Budget: {formatCurrency(proj.budget)} • Due: {proj.deadline}
                          </p>
                        </div>
                        <span className={`self-start sm:self-auto px-3 py-1 rounded-full text-xs font-bold border ${style.badgeClass}`}>
                          {style.label}
                        </span>
                      </div>

                      {/* Revision notes if client requested changes */}
                      {proj.status === 'revision_requested' && proj.revisionNotes && (
                        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1">
                          <span className="text-xs font-bold text-amber-300 block">
                            Client Requested Adjustments:
                          </span>
                          <p className="text-xs text-white leading-relaxed">
                            {proj.revisionNotes}
                          </p>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#251B38]">
                        <button
                          onClick={() => {
                            setActiveChat({
                              convId: proj.id,
                              recipientId: proj.clientId,
                              recipientName: proj.clientName,
                            });
                          }}
                          className="px-4 py-2 rounded-xl bg-[#100B1C] hover:bg-[#251B38] border border-[#9B5CFF]/30 text-white text-xs font-semibold flex items-center gap-2"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-[#BB86FF]" />
                          <span>Chat with Client</span>
                        </button>

                        <button
                          onClick={() => setSubmitModalReq(proj)}
                          className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#9B5CFF] to-[#7A22FF] text-white text-xs font-bold shadow-md hover:brightness-110 transition-all flex items-center gap-2"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Deliver Final Video</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* COMPLETED PROJECTS TAB */}
        {activeTab === 'completed' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-extrabold text-white font-['Manrope']">
                Completed Deliveries ({completedProjects.length})
              </h1>
              <p className="text-xs text-[#A59BB8] mt-1">
                Approved projects and completed creator collaborations.
              </p>
            </div>

            {completedProjects.length === 0 ? (
              <div className="text-center py-16 bg-[#171025] rounded-3xl border border-[#251B38]">
                <p className="text-sm text-[#A59BB8]">No completed projects yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {completedProjects.map(proj => (
                  <div
                    key={proj.id}
                    className="p-5 rounded-2xl bg-[#171025] border border-[#9B5CFF]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div>
                      <h4 className="font-bold text-base text-white">{proj.projectTitle}</h4>
                      <p className="text-xs text-[#A59BB8] mt-1">
                        Client: <strong className="text-white">{proj.clientName}</strong> • Earned: <strong className="text-emerald-400">{formatCurrency(proj.budget)}</strong>
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      Approved & Paid
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MESSAGES TAB */}
        {activeTab === 'messages' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-extrabold text-white font-['Manrope']">
                Client Messages
              </h1>
              <p className="text-xs text-[#A59BB8] mt-1">
                Real-time communications with clients across all active orders.
              </p>
            </div>

            {conversations.length === 0 ? (
              <div className="text-center py-16 bg-[#171025] rounded-3xl border border-[#251B38]">
                <p className="text-sm text-[#A59BB8]">No message channels open yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {conversations.map(conv => (
                  <div
                    key={conv.id}
                    onClick={() => {
                      setActiveChat({
                        convId: conv.id,
                        recipientId: conv.clientId,
                        recipientName: conv.clientName,
                      });
                    }}
                    className="p-5 rounded-2xl bg-[#171025] border border-[#9B5CFF]/20 hover:border-[#BB86FF] cursor-pointer transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-white text-sm">{conv.clientName}</h4>
                      <span className="text-[10px] text-[#A59BB8]">
                        {new Date(conv.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-[#A59BB8] line-clamp-2">
                      {conv.lastMessage || 'Channel active'}
                    </p>
                    <span className="text-[11px] text-[#BB86FF] font-semibold block pt-1">
                      Open conversation →
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* EARNINGS OVERVIEW TAB */}
        {activeTab === 'earnings' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-extrabold text-white font-['Manrope']">
                Earnings Overview
              </h1>
              <p className="text-xs text-[#A59BB8] mt-1">
                Transparent revenue metrics from verified completed project milestones.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="p-6 rounded-3xl bg-[#171025] border border-[#9B5CFF]/20">
                <span className="text-xs text-[#A59BB8] block">Total Gross Revenue</span>
                <span className="text-3xl font-extrabold text-emerald-400 mt-2 block">
                  {formatCurrency(totalEarned)}
                </span>
              </div>
              <div className="p-6 rounded-3xl bg-[#171025] border border-[#9B5CFF]/20">
                <span className="text-xs text-[#A59BB8] block">Completed Orders</span>
                <span className="text-3xl font-extrabold text-white mt-2 block">
                  {completedProjects.length}
                </span>
              </div>
              <div className="p-6 rounded-3xl bg-[#171025] border border-[#9B5CFF]/20">
                <span className="text-xs text-[#A59BB8] block">Average Order Value</span>
                <span className="text-3xl font-extrabold text-[#BB86FF] mt-2 block">
                  {completedProjects.length > 0
                    ? formatCurrency(Math.round(totalEarned / completedProjects.length))
                    : '$0'}
                </span>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-[#171025] border border-[#9B5CFF]/20">
              <h3 className="font-bold text-white text-base mb-3">Escrow & Milestone Terms</h3>
              <p className="text-xs text-[#A59BB8] leading-relaxed">
                DRAFTLY guarantees fair compensation for approved deliveries. Payments are released upon client milestone sign-off.
              </p>
            </div>
          </div>
        )}

        {/* REVIEWS TAB */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-extrabold text-white font-['Manrope']">
                Client Reviews ({reviews.length})
              </h1>
              <p className="text-xs text-[#A59BB8] mt-1">
                Authentic testimonials left by producers and creators.
              </p>
            </div>

            {reviews.length === 0 ? (
              <div className="text-center py-16 bg-[#171025] rounded-3xl border border-[#251B38]">
                <p className="text-sm text-[#A59BB8]">No reviews received yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map(rev => (
                  <div
                    key={rev.id}
                    className="p-5 rounded-2xl bg-[#171025] border border-[#9B5CFF]/20 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">{rev.clientName}</span>
                      <div className="flex items-center text-amber-400 text-xs">
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-[#A59BB8] italic leading-relaxed">
                      "{rev.comment}"
                    </p>
                    <span className="text-[10px] text-[#A59BB8]/60 block">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="max-w-3xl space-y-6">
            <div>
              <h1 className="text-2xl font-extrabold text-white font-['Manrope']">
                Editor Profile & Rate Settings
              </h1>
              <p className="text-xs text-[#A59BB8] mt-1">
                Update how you appear in the public marketplace.
              </p>
            </div>

            {profileSaved && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs">
                Profile updated successfully!
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="p-6 rounded-3xl bg-[#171025] border border-[#9B5CFF]/20 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-white mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/20 text-white text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white mb-1">Professional Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lead Colorist & Commercial Editor"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/20 text-white text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-1">Professional Bio</label>
                <textarea
                  rows={4}
                  required
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/20 text-white text-xs sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-white mb-1">Experience</label>
                  <select
                    value={experience}
                    onChange={e => setExperience(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/20 text-white text-xs sm:text-sm"
                  >
                    <option value="1-2 Years">1-2 Years</option>
                    <option value="3+ Years">3+ Years</option>
                    <option value="5+ Years">5+ Years</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white mb-1">Starting Price ($)</label>
                  <input
                    type="number"
                    min="10"
                    required
                    value={startingPrice}
                    onChange={e => setStartingPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/20 text-white text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white mb-1">Availability</label>
                  <select
                    value={availability}
                    onChange={e => setAvailability(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/20 text-white text-xs sm:text-sm"
                  >
                    <option value="Available Now">Available Now</option>
                    <option value="Busy">Busy</option>
                    <option value="Booked">Booked</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-1">Skills (comma separated)</label>
                <input
                  type="text"
                  placeholder="Premiere Pro, DaVinci Resolve, After Effects, Sound Design"
                  value={skillsStr}
                  onChange={e => setSkillsStr(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/20 text-white text-xs sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-white mb-1">YouTube Channel URL</label>
                  <input
                    type="url"
                    placeholder="https://youtube.com/@channel"
                    value={youtubeUrl}
                    onChange={e => setYoutubeUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/20 text-white text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white mb-1">Instagram URL</label>
                  <input
                    type="url"
                    placeholder="https://instagram.com/profile"
                    value={instagramUrl}
                    onChange={e => setInstagramUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/20 text-white text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#9B5CFF] to-[#7A22FF]"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        )}

        {/* PORTFOLIO TAB */}
        {activeTab === 'portfolio' && (
          <div className="max-w-2xl space-y-6">
            <div>
              <h1 className="text-2xl font-extrabold text-white font-['Manrope']">
                Portfolio & Reel Links
              </h1>
              <p className="text-xs text-[#A59BB8] mt-1">
                Link to your Vimeo, YouTube, or Google Drive showreels.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[#171025] border border-[#9B5CFF]/20 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white mb-1">Primary Showreel URL</label>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={portfolioUrl}
                  onChange={e => setPortfolioUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/20 text-white text-xs sm:text-sm"
                />
              </div>

              {portfolioUrl && (
                <div className="p-4 rounded-2xl bg-[#100B1C] border border-[#251B38] flex items-center justify-between">
                  <span className="text-xs text-white truncate max-w-sm">{portfolioUrl}</span>
                  <a
                    href={portfolioUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-[#BB86FF] hover:underline flex items-center gap-1"
                  >
                    <span>Test Reel</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              <button
                onClick={async () => {
                  if (userProfile) {
                    await updateEditorProfile(userProfile.id, { portfolioUrl });
                    alert('Portfolio link saved!');
                  }
                }}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#9B5CFF] to-[#7A22FF]"
              >
                Update Showreel Link
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Submit Completed Work Modal */}
      {submitModalReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-[#171025] border border-[#9B5CFF]/30 p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Deliver Project Deliverables</h3>
            <p className="text-xs text-[#A59BB8]">
              Delivering "{submitModalReq.projectTitle}" for {submitModalReq.clientName}.
            </p>

            <form onSubmit={handleSubmitWork} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white mb-1">
                  Delivery / Download Links (1 per line) *
                </label>
                <textarea
                  required
                  rows={3}
                  value={submissionUrls}
                  onChange={e => setSubmissionUrls(e.target.value)}
                  placeholder="https://drive.google.com/file/d/...\nhttps://vimeo.com/review/..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/20 text-white text-xs sm:text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-1">
                  Submission Notes for Client
                </label>
                <textarea
                  rows={3}
                  value={submissionNotes}
                  onChange={e => setSubmissionNotes(e.target.value)}
                  placeholder="Include export specs (4K ProRes 422, Rec.709, stereo audio mix) and details on color grading nodes..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/20 text-white text-xs sm:text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSubmitModalReq(null)}
                  className="px-4 py-2 rounded-xl text-xs text-[#A59BB8]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDelivery}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#9B5CFF] to-[#7A22FF]"
                >
                  {submittingDelivery ? 'Delivering...' : 'Submit to Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Decline Proposal Modal */}
      {rejectModalReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-[#171025] border border-[#9B5CFF]/30 p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Decline Proposal</h3>
            <p className="text-xs text-[#A59BB8]">
              Decline proposal "{rejectModalReq.projectTitle}" from {rejectModalReq.clientName}.
            </p>

            <form onSubmit={handleRejectProposal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white mb-1">Reason (Optional)</label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  placeholder="e.g. Schedule currently fully booked; budget below standard scope..."
                  className="w-full px-3 py-2 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/20 text-white text-xs sm:text-sm"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectModalReq(null)}
                  className="px-4 py-2 rounded-xl text-xs text-[#A59BB8]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500"
                >
                  Confirm Decline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {activeChat && (
        <ChatModal
          isOpen={!!activeChat}
          onClose={() => setActiveChat(null)}
          conversationId={activeChat.convId}
          recipientId={activeChat.recipientId}
          recipientName={activeChat.recipientName}
        />
      )}
    </div>
  );
};
