import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Compass,
  FileText,
  Video,
  MessageSquare,
  Bell,
  Heart,
  Star,
  User,
  Settings,
  LogOut,
  Clock,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Send,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { HiringRequest, Conversation, Notification, EditorProfile, Review } from '../types';
import {
  getClientHiringRequests,
  subscribeToClientHiringRequests,
  updateHiringRequestStatus,
  getUserConversations,
  subscribeToConversations,
  getUserNotifications,
  subscribeToUserNotifications,
  getSavedEditorIds,
  getApprovedEditors,
  getAllReviews,
  updateClientProfile,
  markNotificationAsRead,
  toggleSaveEditor,
} from '../services/db';
import { getStatusStyle, formatCurrency } from '../utils/marketplace';
import { ChatModal } from '../components/ChatModal';
import { ReviewModal } from '../components/ReviewModal';
import { EditorCard } from '../components/EditorCard';

interface ClientDashboardProps {
  navigate: (path: string) => void;
  initialTab?: string;
}

export const ClientDashboard: React.FC<ClientDashboardProps> = ({
  navigate,
  initialTab = 'overview',
}) => {
  const { userProfile, clientProfile, logout, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [requests, setRequests] = useState<HiringRequest[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [savedEditors, setSavedEditors] = useState<EditorProfile[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  // Chat modal state
  const [activeChat, setActiveChat] = useState<{
    convId: string;
    recipientId: string;
    recipientName: string;
  } | null>(null);

  // Review modal state
  const [reviewTargetReq, setReviewTargetReq] = useState<HiringRequest | null>(null);

  // Revision modal state
  const [revisionModalReq, setRevisionModalReq] = useState<HiringRequest | null>(null);
  const [revisionNotes, setRevisionNotes] = useState('');

  // Profile edit state
  const [fullName, setFullName] = useState(clientProfile?.fullName || userProfile?.displayName || '');
  const [company, setCompany] = useState(clientProfile?.company || '');
  const [bio, setBio] = useState(clientProfile?.bio || '');
  const [profileSaved, setProfileSaved] = useState(false);

  useEffect(() => {
    if (!userProfile?.id) return;

    const unsubRequests = subscribeToClientHiringRequests(userProfile.id, setRequests);
    const unsubConversations = subscribeToConversations(userProfile.id, setConversations);
    const unsubNotifications = subscribeToUserNotifications(userProfile.id, setNotifications);

    async function loadExtraData() {
      if (!userProfile?.id) return;
      try {
        const [allEds, allRevs, sIds] = await Promise.all([
          getApprovedEditors(),
          getAllReviews(),
          getSavedEditorIds(userProfile.id),
        ]);
        setSavedEditors(allEds.filter(e => sIds.includes(e.id)));
        setReviews(allRevs.filter(r => r.clientId === userProfile.id));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadExtraData();

    return () => {
      unsubRequests();
      unsubConversations();
      unsubNotifications();
    };
  }, [userProfile?.id]);

  const refreshRequests = async () => {
    if (!userProfile) return;
    const reqs = await getClientHiringRequests(userProfile.id);
    setRequests(reqs);
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const activeProjects = requests.filter(r =>
    ['accepted', 'in_progress', 'submitted', 'revision_requested'].includes(r.status)
  );
  const completedProjects = requests.filter(r => r.status === 'completed');

  const handleApproveWork = async (req: HiringRequest) => {
    await updateHiringRequestStatus(req.id, 'completed');
    await refreshRequests();
    setReviewTargetReq(req); // Open review modal right after approving!
  };

  const handleSendRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionModalReq || !revisionNotes.trim()) return;
    await updateHiringRequestStatus(revisionModalReq.id, 'revision_requested', {
      revisionNotes: revisionNotes.trim(),
    });
    setRevisionModalReq(null);
    setRevisionNotes('');
    await refreshRequests();
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    await updateClientProfile(userProfile.id, {
      fullName,
      company,
      bio,
    });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
    refreshProfile();
  };

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'requests', label: 'My Hiring Requests', icon: FileText, badge: pendingRequests.length },
    { id: 'projects', label: 'Active Projects', icon: Video, badge: activeProjects.length },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'saved', label: 'Saved Editors', icon: Heart },
    { id: 'reviews', label: 'Reviews', icon: Star },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: notifications.filter(n => !n.read).length },
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#080611] flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-[#100B1C] border-r border-[#9B5CFF]/20 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo & User snippet */}
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
                {userProfile?.displayName ? userProfile.displayName[0].toUpperCase() : 'C'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate">
                  {userProfile?.displayName || 'Client'}
                </p>
                <span className="text-[10px] uppercase font-semibold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
                  Client Portal
                </span>
              </div>
            </div>
          </div>

          {/* Nav List */}
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

            <button
              onClick={() => navigate('/explore')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[#BB86FF] hover:bg-[#171025] transition-colors"
            >
              <Compass className="w-4 h-4" />
              <span>Explore Marketplace</span>
            </button>
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

      {/* Main Dashboard Workspace */}
      <main className="flex-1 p-6 sm:p-8 lg:p-10 overflow-y-auto max-w-7xl">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Manrope']">
                Welcome back, {userProfile?.displayName || 'Client'}
              </h1>
              <p className="text-xs sm:text-sm text-[#A59BB8] mt-1">
                Monitor your hiring proposals, video deliverables, and live collaborations.
              </p>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="p-5 rounded-2xl bg-[#171025] border border-[#9B5CFF]/20">
                <span className="text-xs text-[#A59BB8] font-medium block">Total Requests</span>
                <span className="text-2xl sm:text-3xl font-extrabold text-white mt-1 block">
                  {requests.length}
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
                <span className="text-xs text-[#A59BB8] font-medium block">Completed Projects</span>
                <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-1 block">
                  {completedProjects.length}
                </span>
              </div>
            </div>

            {/* In-Flight Projects Highlight */}
            <div className="p-6 rounded-3xl bg-[#171025] border border-[#9B5CFF]/20 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white font-['Manrope']">
                  Recent Project Updates
                </h2>
                <button
                  onClick={() => setActiveTab('projects')}
                  className="text-xs font-semibold text-[#BB86FF] hover:underline"
                >
                  View All Active
                </button>
              </div>

              {activeProjects.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#A59BB8]">
                  <p>No active projects at this moment.</p>
                  <button
                    onClick={() => navigate('/explore')}
                    className="mt-3 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#9B5CFF] to-[#7A22FF]"
                  >
                    Hire a Pro Editor
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeProjects.slice(0, 3).map(req => {
                    const style = getStatusStyle(req.status);
                    return (
                      <div
                        key={req.id}
                        className="p-4 rounded-2xl bg-[#100B1C] border border-[#251B38] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white">{req.projectTitle}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] border font-bold ${style.badgeClass}`}>
                              {style.label}
                            </span>
                          </div>
                          <p className="text-xs text-[#A59BB8] mt-1">
                            Editor: <strong className="text-white">{req.editorName}</strong> • Budget: {formatCurrency(req.budget)} • Due: {req.deadline}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setActiveChat({
                                convId: req.id,
                                recipientId: req.editorId,
                                recipientName: req.editorName,
                              });
                            }}
                            className="px-3 py-1.5 rounded-xl bg-[#251B38] text-xs font-semibold text-white hover:bg-[#32234B] flex items-center gap-1.5"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-[#BB86FF]" />
                            <span>Chat</span>
                          </button>
                          {req.status === 'submitted' && (
                            <button
                              onClick={() => handleApproveWork(req)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white"
                            >
                              Approve Delivery
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* MY HIRING REQUESTS TAB */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-extrabold text-white font-['Manrope']">
                My Hiring Requests
              </h1>
              <p className="text-xs text-[#A59BB8] mt-1">
                Proposals you have sent to editors awaiting acceptance.
              </p>
            </div>

            {requests.length === 0 ? (
              <div className="text-center py-16 bg-[#171025] rounded-3xl border border-[#251B38] space-y-3">
                <p className="text-sm text-[#A59BB8]">You haven't sent any hiring requests yet.</p>
                <button
                  onClick={() => navigate('/explore')}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#9B5CFF] to-[#7A22FF]"
                >
                  Browse Video Editors
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map(req => {
                  const style = getStatusStyle(req.status);
                  return (
                    <div
                      key={req.id}
                      className="p-5 rounded-2xl bg-[#171025] border border-[#9B5CFF]/20 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h3 className="text-base font-bold text-white">{req.projectTitle}</h3>
                          <p className="text-xs text-[#A59BB8]">
                            Proposed to: <span className="text-[#BB86FF] font-semibold">{req.editorName}</span>
                          </p>
                        </div>
                        <span className={`self-start sm:self-auto px-2.5 py-1 rounded-full text-xs font-bold border ${style.badgeClass}`}>
                          {style.label}
                        </span>
                      </div>

                      <p className="text-xs text-[#A59BB8] leading-relaxed whitespace-pre-line bg-[#100B1C] p-3 rounded-xl border border-[#251B38]">
                        {req.projectDescription}
                      </p>

                      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#A59BB8] pt-2 border-t border-[#251B38]">
                        <div className="flex items-center gap-4">
                          <span>Budget: <strong className="text-white">{formatCurrency(req.budget)}</strong></span>
                          <span>Deadline: <strong className="text-white">{req.deadline}</strong></span>
                        </div>

                        {req.status === 'pending' && (
                          <button
                            onClick={async () => {
                              await updateHiringRequestStatus(req.id, 'cancelled');
                              refreshRequests();
                            }}
                            className="text-xs text-rose-400 hover:underline"
                          >
                            Cancel Proposal
                          </button>
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
                Active & Delivered Projects
              </h1>
              <p className="text-xs text-[#A59BB8] mt-1">
                Collaborate with assigned editors, inspect submitted cuts, and release approvals.
              </p>
            </div>

            {activeProjects.length === 0 ? (
              <div className="text-center py-16 bg-[#171025] rounded-3xl border border-[#251B38]">
                <p className="text-sm text-[#A59BB8]">No projects are currently in production.</p>
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
                            Assigned Editor: <span className="text-[#BB86FF] font-semibold">{proj.editorName}</span> • Budget: {formatCurrency(proj.budget)}
                          </p>
                        </div>
                        <span className={`self-start sm:self-auto px-3 py-1 rounded-full text-xs font-bold border ${style.badgeClass}`}>
                          {style.label}
                        </span>
                      </div>

                      {/* If Editor Submitted Deliverables */}
                      {proj.status === 'submitted' && (
                        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
                          <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                            <Sparkles className="w-4 h-4" />
                            <span>Work Delivered for Review!</span>
                          </div>
                          {proj.submissionNotes && (
                            <p className="text-xs text-white">
                              <strong>Editor Notes:</strong> {proj.submissionNotes}
                            </p>
                          )}
                          {proj.submissionUrls && proj.submissionUrls.length > 0 && (
                            <div className="space-y-1">
                              <span className="text-[11px] text-[#A59BB8] block">Download / Stream Links:</span>
                              {proj.submissionUrls.map((url, i) => (
                                <a
                                  key={i}
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs text-[#BB86FF] hover:underline flex items-center gap-1.5"
                                >
                                  <span>{url}</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center gap-3 pt-2">
                            <button
                              onClick={() => handleApproveWork(proj)}
                              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg transition-all"
                            >
                              Approve & Mark Completed
                            </button>
                            <button
                              onClick={() => setRevisionModalReq(proj)}
                              className="px-4 py-2 rounded-xl text-xs font-semibold text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 transition-all flex items-center gap-1.5"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Request Revisions</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Chat action button */}
                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={() => {
                            setActiveChat({
                              convId: proj.id,
                              recipientId: proj.editorId,
                              recipientName: proj.editorName,
                            });
                          }}
                          className="px-4 py-2 rounded-xl bg-[#100B1C] hover:bg-[#251B38] border border-[#9B5CFF]/30 text-white text-xs font-semibold flex items-center gap-2"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-[#BB86FF]" />
                          <span>Open Direct Chat with {proj.editorName}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* MESSAGES TAB */}
        {activeTab === 'messages' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-extrabold text-white font-['Manrope']">
                Direct Conversations
              </h1>
              <p className="text-xs text-[#A59BB8] mt-1">
                Real-time communication channels between you and editors.
              </p>
            </div>

            {conversations.length === 0 ? (
              <div className="text-center py-16 bg-[#171025] rounded-3xl border border-[#251B38] space-y-2">
                <p className="text-sm text-[#A59BB8]">No active conversations yet.</p>
                <p className="text-xs text-[#A59BB8]">
                  Messages will appear here as soon as you contact an editor or start a project.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {conversations.map(conv => (
                  <div
                    key={conv.id}
                    onClick={() => {
                      setActiveChat({
                        convId: conv.id,
                        recipientId: conv.editorId,
                        recipientName: conv.editorName,
                      });
                    }}
                    className="p-5 rounded-2xl bg-[#171025] border border-[#9B5CFF]/20 hover:border-[#BB86FF] cursor-pointer transition-all hover:-translate-y-0.5 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-white text-sm">{conv.editorName}</h3>
                      <span className="text-[10px] text-[#A59BB8]">
                        {new Date(conv.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-[#A59BB8] line-clamp-2">
                      {conv.lastMessage || 'No messages yet'}
                    </p>
                    <span className="text-[11px] text-[#BB86FF] font-semibold block pt-1">
                      Click to open chat →
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SAVED EDITORS TAB */}
        {activeTab === 'saved' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-extrabold text-white font-['Manrope']">
                Saved Editors ({savedEditors.length})
              </h1>
              <p className="text-xs text-[#A59BB8] mt-1">
                Your bookmarked video editors for upcoming projects.
              </p>
            </div>

            {savedEditors.length === 0 ? (
              <div className="text-center py-16 bg-[#171025] rounded-3xl border border-[#251B38]">
                <p className="text-sm text-[#A59BB8]">You haven't bookmarked any editors yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedEditors.map(ed => (
                  <EditorCard
                    key={ed.id}
                    editor={ed}
                    isSaved={true}
                    onToggleSave={async (id) => {
                      await toggleSaveEditor(userProfile!.id, id);
                      setSavedEditors(prev => prev.filter(e => e.id !== id));
                    }}
                    onViewProfile={() => navigate(`/explore`)}
                    onHire={() => navigate(`/explore`)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* REVIEWS TAB */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-extrabold text-white font-['Manrope']">
                My Posted Reviews ({reviews.length})
              </h1>
              <p className="text-xs text-[#A59BB8] mt-1">
                Verified ratings and testimonials you have left for completed edits.
              </p>
            </div>

            {reviews.length === 0 ? (
              <div className="text-center py-16 bg-[#171025] rounded-3xl border border-[#251B38]">
                <p className="text-sm text-[#A59BB8]">No reviews written yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map(rev => (
                  <div
                    key={rev.id}
                    className="p-5 rounded-2xl bg-[#171025] border border-[#9B5CFF]/20 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">{rev.editorName}</span>
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

        {/* NOTIFICATIONS TAB */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-extrabold text-white font-['Manrope']">
                Notifications
              </h1>
              <p className="text-xs text-[#A59BB8] mt-1">
                Real-time updates regarding your project milestones and proposals.
              </p>
            </div>

            {notifications.length === 0 ? (
              <div className="text-center py-16 bg-[#171025] rounded-3xl border border-[#251B38]">
                <p className="text-sm text-[#A59BB8]">No notifications yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => markNotificationAsRead(n.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      n.read
                        ? 'bg-[#100B1C] border-[#251B38] text-[#A59BB8]'
                        : 'bg-[#171025] border-[#9B5CFF]/40 text-white shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-white">{n.title}</h4>
                      <span className="text-[10px] text-[#A59BB8]">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-[#A59BB8] mt-1">{n.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl space-y-6">
            <div>
              <h1 className="text-2xl font-extrabold text-white font-['Manrope']">
                Client Profile
              </h1>
              <p className="text-xs text-[#A59BB8] mt-1">
                Update your identity shown to editors when sending proposals.
              </p>
            </div>

            {profileSaved && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs">
                Profile updated successfully!
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="p-6 rounded-3xl bg-[#171025] border border-[#9B5CFF]/20 space-y-4">
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
                <label className="block text-xs font-semibold text-white mb-1">Company / Studio (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Apex Media Productions"
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/20 text-white text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-1">Bio / Channel Description</label>
                <textarea
                  rows={3}
                  placeholder="Tell editors about your channel niche, content pacing, and audience..."
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/20 text-white text-xs sm:text-sm"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#9B5CFF] to-[#7A22FF]"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl space-y-6">
            <div>
              <h1 className="text-2xl font-extrabold text-white font-['Manrope']">
                Account Settings
              </h1>
              <p className="text-xs text-[#A59BB8] mt-1">
                Manage your credentials and security.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[#171025] border border-[#9B5CFF]/20 space-y-4 text-xs">
              <div>
                <span className="text-[#A59BB8] block">Registered Email:</span>
                <span className="text-white font-bold">{userProfile?.email}</span>
              </div>
              <div>
                <span className="text-[#A59BB8] block">Account ID:</span>
                <span className="text-white font-mono">{userProfile?.id}</span>
              </div>
              <div className="pt-4 border-t border-[#251B38]">
                <button
                  onClick={() => alert('Password reset email sent to ' + userProfile?.email)}
                  className="px-4 py-2 rounded-xl bg-[#251B38] text-white font-semibold hover:bg-[#32234B]"
                >
                  Send Password Reset Email
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

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

      {/* Review Modal */}
      <ReviewModal
        request={reviewTargetReq}
        isOpen={!!reviewTargetReq}
        onClose={() => setReviewTargetReq(null)}
        onSuccess={() => {
          refreshRequests();
          setActiveTab('reviews');
        }}
      />

      {/* Revision Request Modal */}
      {revisionModalReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-[#171025] border border-[#9B5CFF]/30 p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Request Revisions</h3>
            <p className="text-xs text-[#A59BB8]">
              Specify timestamps and exact adjustments for {revisionModalReq.editorName}.
            </p>
            <form onSubmit={handleSendRevision} className="space-y-4">
              <textarea
                required
                rows={4}
                value={revisionNotes}
                onChange={e => setRevisionNotes(e.target.value)}
                placeholder="e.g. At 01:14 please reduce music volume; tighten cut between interview 1 and B-roll at 02:30..."
                className="w-full px-3 py-2 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/20 text-white text-xs sm:text-sm"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRevisionModalReq(null)}
                  className="px-4 py-2 rounded-xl text-xs text-[#A59BB8]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-500"
                >
                  Submit Revision Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
