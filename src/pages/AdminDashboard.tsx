import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  Users,
  Film,
  CheckCircle2,
  XCircle,
  FileText,
  Video,
  Layers,
  Star,
  ShieldAlert,
  Mail,
  Sliders,
  Activity,
  LogOut,
  AlertCircle,
  Check,
  Trash2,
  Edit2,
  ExternalLink,
  Shield,
  Plus,
  Search,
  Eye,
  X,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Globe,
  Instagram,
  Youtube,
  DollarSign,
  IndianRupee,
  Clock,
  Sparkles,
  Lock,
  UserCheck,
  UserX,
  KeyRound,
  Bell,
  Send,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  EditorProfile,
  ClientProfile,
  HiringRequest,
  Category,
  Review,
  Report,
  ContactMessage,
  PlatformSettings,
  AuditLog,
  PlatformStats,
} from '../types';
import {
  getAllEditors,
  subscribeToAllEditors,
  updateEditorStatus,
  getAllClients,
  subscribeToAllClients,
  getAllHiringRequests,
  subscribeToAllHiringRequests,
  getCategories,
  subscribeToCategories,
  addCategory,
  deleteCategory,
  getAllReviews,
  subscribeToReviews,
  deleteReview,
  getReports,
  subscribeToReports,
  updateReportStatus,
  getContactMessages,
  subscribeToContactMessages,
  updateContactStatus,
  getPlatformSettings,
  updatePlatformSettings,
  getAuditLogs,
  logAuditAction,
  getPlatformStats,
  adminCreateEditorApi,
  adminGetEditorsApi,
  adminUpdateEditorApi,
  adminUpdateEditorStatusApi,
  adminDeleteEditorApi,
  adminChangeCredentialsApi,
  adminUpdateEditorCredentialsApi,
  adminGetNotificationsApi,
  adminSendNotificationApi,
  adminDeleteNotificationApi,
  adminGetRecipientsApi,
  AdminSentNotification,
} from '../services/db';
import {
  formatCurrency,
  getStatusStyle,
  sanitizeUsername,
  validateEditorFormData,
  EditorFormInput,
} from '../utils/marketplace';

interface AdminDashboardProps {
  navigate: (path: string) => void;
}

const CATEGORY_OPTIONS = [
  'Gaming',
  'Anime / AMV',
  'YouTube Shorts & Reels',
  'Documentary',
  'Commercial / Ads',
  'Motion Graphics',
  'Cinematic Vlog',
  'Music Videos',
  'Talking Head',
  'Podcasts',
];

const EXPERIENCE_OPTIONS = [
  '1-2 years (Junior)',
  '3-5 years (Mid-Level)',
  '5+ years (Senior)',
  '8+ years (Lead / Director)',
];

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ navigate }) => {
  const { userProfile, isAdmin, logout, adminToken, setAdminSession } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Core Data States
  const [editors, setEditors] = useState<EditorProfile[]>([]);
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [requests, setRequests] = useState<HiringRequest[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [contacts, setContacts] = useState<ContactMessage[]>([]);
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Announcement state
  const [announcementText, setAnnouncementText] = useState('');
  const [showAnnouncement, setShowAnnouncement] = useState(true);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Toast feedback
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // New Category Modal
  const [showCatModal, setShowCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  // -------------------------------------------------------------
  // Editor Management States
  // -------------------------------------------------------------
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'suspended'>('all');

  // Add Editor Modal
  const [showAddEditorModal, setShowAddEditorModal] = useState(false);
  const [addEditorLoading, setAddEditorLoading] = useState(false);
  const [addEditorError, setAddEditorError] = useState<string | null>(null);
  const [addEditorSuccess, setAddEditorSuccess] = useState<string | null>(null);

  const initialAddFormState: EditorFormInput = {
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    photoURL: AVATAR_PRESETS[0],
    title: '',
    bio: '',
    experience: '3-5 years (Mid-Level)',
    skills: 'Premiere Pro, After Effects, DaVinci Resolve',
    categories: ['Gaming', 'YouTube Shorts & Reels'],
    portfolioUrl: '',
    instagramUrl: '',
    youtubeUrl: '',
    startingPrice: 5000,
    availability: 'Available Now',
  };
  const [addForm, setAddForm] = useState<EditorFormInput>(initialAddFormState);

  // -------------------------------------------------------------
  // Admin Account Credentials State
  // -------------------------------------------------------------
  const [adminCurrentPassword, setAdminCurrentPassword] = useState('');
  const [adminNewUsername, setAdminNewUsername] = useState('');
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('');
  const [adminCredLoading, setAdminCredLoading] = useState(false);
  const [adminCredError, setAdminCredError] = useState<string | null>(null);
  const [adminCredSuccess, setAdminCredSuccess] = useState<string | null>(null);

  // -------------------------------------------------------------
  // Editor Credentials Modal State
  // -------------------------------------------------------------
  const [credEditor, setCredEditor] = useState<EditorProfile | null>(null);
  const [editorNewUsername, setEditorNewUsername] = useState('');
  const [editorNewPassword, setEditorNewPassword] = useState('');
  const [editorCredLoading, setEditorCredLoading] = useState(false);
  const [editorCredError, setEditorCredError] = useState<string | null>(null);
  const [editorCredSuccess, setEditorCredSuccess] = useState<string | null>(null);

  // -------------------------------------------------------------
  // Notifications Management State
  // -------------------------------------------------------------
  const [adminNotifications, setAdminNotifications] = useState<AdminSentNotification[]>([]);
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifAudience, setNotifAudience] = useState<'all_clients' | 'all_editors' | 'specific_client' | 'specific_editor'>('all_clients');
  const [notifTargetUserId, setNotifTargetUserId] = useState('');
  const [availableRecipients, setAvailableRecipients] = useState<{ editors: any[]; clients: any[] }>({ editors: [], clients: [] });
  const [sendingNotif, setSendingNotif] = useState(false);
  const [deletingNotifId, setDeletingNotifId] = useState<string | null>(null);
  const [notifError, setNotifError] = useState<string | null>(null);
  const [notifSuccess, setNotifSuccess] = useState<string | null>(null);

  // View Editor Profile Modal
  const [viewingEditor, setViewingEditor] = useState<EditorProfile | null>(null);

  // Edit Editor Modal
  const [editingEditor, setEditingEditor] = useState<EditorProfile | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<EditorProfile>>({});
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Confirmation Modal
  const [confirmModal, setConfirmModal] = useState<{
    type: 'suspend' | 'reactivate' | 'delete' | 'approve' | 'reject';
    editor: EditorProfile;
  } | null>(null);
  const [confirmActionLoading, setConfirmActionLoading] = useState(false);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch all editors with fallback
  const fetchEditorsList = async () => {
    try {
      const res = await adminGetEditorsApi(adminToken || undefined);
      if (res.success && res.editors && res.editors.length > 0) {
        setEditors(res.editors);
        return;
      }
      const liveEds = await getAllEditors();
      setEditors(liveEds);
    } catch (err) {
      console.warn('Error fetching editors:', err);
      const liveEds = await getAllEditors();
      setEditors(liveEds);
    }
  };

  useEffect(() => {
    // Realtime subscriptions across all marketplace collections
    const unsubEditors = subscribeToAllEditors(eds => {
      setEditors(eds);
      setLoading(false);
    });

    const unsubRequests = subscribeToAllHiringRequests(reqs => {
      setRequests(reqs);
    });

    const unsubClients = subscribeToAllClients(cls => {
      setClients(cls);
    });

    const unsubReviews = subscribeToReviews(revs => {
      setReviews(revs);
    });

    const unsubReports = subscribeToReports(reps => {
      setReports(reps);
    });

    const unsubContacts = subscribeToContactMessages(msgs => {
      setContacts(msgs);
    });

    const unsubCategories = subscribeToCategories(cats => {
      setCategories(cats);
    });

    getPlatformSettings()
      .then(stg => {
        setSettings(stg);
        if (stg) {
          setAnnouncementText(stg.announcement || '');
          setShowAnnouncement(stg.showAnnouncement ?? true);
        }
      })
      .catch(() => {});

    getAuditLogs().then(setAuditLogs).catch(() => {});
    getPlatformStats().then(setStats).catch(() => {});

    if (adminToken) {
      adminGetNotificationsApi(adminToken).then(res => {
        if (res.success && res.notifications) setAdminNotifications(res.notifications);
      });
      adminGetRecipientsApi(adminToken).then(res => {
        if (res.success) {
          setAvailableRecipients({ editors: res.editors || [], clients: res.clients || [] });
        }
      });
    }

    return () => {
      unsubEditors();
      unsubRequests();
      unsubClients();
      unsubReviews();
      unsubReports();
      unsubContacts();
      unsubCategories();
    };
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchEditorsList();
    setRefreshing(false);
    showToast('success', 'Editor list refreshed from server.');
  };

  const pendingApprovals = editors.filter(e => e.status === 'pending');
  const activeProjects = requests.filter(r =>
    ['accepted', 'in_progress', 'submitted', 'revision_requested'].includes(r.status)
  );
  const completedProjects = requests.filter(r => r.status === 'completed');

  // Filtered editors list
  const filteredEditors = useMemo(() => {
    return editors.filter(ed => {
      // Status filter
      if (statusFilter !== 'all' && ed.status !== statusFilter) {
        return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = ed.fullName?.toLowerCase().includes(q);
        const usernameMatch = ed.username?.toLowerCase().includes(q);
        const emailMatch = ed.email?.toLowerCase().includes(q);
        const titleMatch = ed.title?.toLowerCase().includes(q);
        const skillsMatch = ed.skills?.some(s => s.toLowerCase().includes(q));
        const catMatch = ed.categories?.some(c => c.toLowerCase().includes(q));
        return nameMatch || usernameMatch || emailMatch || titleMatch || skillsMatch || catMatch;
      }
      return true;
    });
  }, [editors, statusFilter, searchQuery]);

  // -------------------------------------------------------------
  // Add Editor Handler (All 16 Fields)
  // -------------------------------------------------------------
  const handleAddEditorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddEditorError(null);
    setAddEditorSuccess(null);

    // Frontend validation
    const validation = validateEditorFormData(addForm);
    if (!validation.isValid) {
      setAddEditorError(validation.errors[0] || 'Please complete all required fields.');
      return;
    }

    setAddEditorLoading(true);
    try {
      const skillsArray = typeof addForm.skills === 'string'
        ? addForm.skills.split(',').map(s => s.trim()).filter(Boolean)
        : addForm.skills;

      const payload = {
        fullName: addForm.fullName.trim(),
        username: sanitizeUsername(addForm.username),
        email: addForm.email.trim().toLowerCase(),
        password: addForm.password,
        confirmPassword: addForm.confirmPassword,
        photoURL: addForm.photoURL || AVATAR_PRESETS[0],
        title: addForm.title.trim(),
        bio: addForm.bio.trim(),
        experience: addForm.experience,
        skills: skillsArray,
        categories: addForm.categories,
        portfolioUrl: addForm.portfolioUrl.trim(),
        instagramUrl: addForm.instagramUrl ? addForm.instagramUrl.trim() : undefined,
        youtubeUrl: addForm.youtubeUrl ? addForm.youtubeUrl.trim() : undefined,
        startingPrice: Number(addForm.startingPrice) || 100,
        availability: addForm.availability,
      };

      const res = await adminCreateEditorApi(payload, adminToken || undefined);

      if (!res.success) {
        setAddEditorError(res.message || 'Failed to create editor account.');
        setAddEditorLoading(false);
        return;
      }

      setAddEditorSuccess(
        `Editor account for @${payload.username} (${payload.fullName}) created successfully!`
      );
      showToast('success', `Editor account created for @${payload.username}`);

      // Refresh list
      await fetchEditorsList();

      await logAuditAction(
        'CREATE_EDITOR',
        userProfile?.id || 'admin',
        userProfile?.email || 'admin@draftly',
        `Admin created new verified editor: ${payload.fullName} (@${payload.username})`,
        res.editor?.id
      );

      // Reset form after short delay
      setTimeout(() => {
        setAddForm(initialAddFormState);
        setShowAddEditorModal(false);
        setAddEditorSuccess(null);
      }, 1500);
    } catch (err: any) {
      setAddEditorError(err.message || 'Unexpected server error occurred.');
    } finally {
      setAddEditorLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Edit Editor Details Handler
  // -------------------------------------------------------------
  const handleOpenEdit = (editor: EditorProfile) => {
    setEditingEditor(editor);
    setEditFormData({
      fullName: editor.fullName,
      title: editor.title,
      bio: editor.bio,
      experience: editor.experience,
      skills: editor.skills,
      categories: editor.categories,
      startingPrice: editor.startingPrice,
      availability: editor.availability,
      portfolioUrl: editor.portfolioUrl,
      instagramUrl: editor.instagramUrl,
      youtubeUrl: editor.youtubeUrl,
    });
    setEditError(null);
  };

  const handleSaveEditEditor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEditor) return;
    setEditLoading(true);
    setEditError(null);

    try {
      const skillsArray = Array.isArray(editFormData.skills)
        ? editFormData.skills
        : typeof editFormData.skills === 'string'
        ? (editFormData.skills as string).split(',').map(s => s.trim()).filter(Boolean)
        : [];

      const payload = {
        fullName: editFormData.fullName?.trim(),
        title: editFormData.title?.trim(),
        bio: editFormData.bio?.trim(),
        experience: editFormData.experience,
        skills: skillsArray,
        categories: editFormData.categories,
        startingPrice: Number(editFormData.startingPrice) || editingEditor.startingPrice,
        availability: editFormData.availability,
        portfolioUrl: editFormData.portfolioUrl?.trim(),
        instagramUrl: editFormData.instagramUrl?.trim(),
        youtubeUrl: editFormData.youtubeUrl?.trim(),
      };

      const res = await adminUpdateEditorApi(editingEditor.id, payload, adminToken || undefined);
      if (!res.success) {
        setEditError(res.message || 'Failed to update editor.');
        setEditLoading(false);
        return;
      }

      showToast('success', `Editor details updated for ${editingEditor.fullName}`);
      setEditingEditor(null);
      await fetchEditorsList();

      await logAuditAction(
        'EDIT_EDITOR',
        userProfile?.id || 'admin',
        userProfile?.email || 'admin@draftly',
        `Admin edited details for editor: ${editingEditor.fullName}`,
        editingEditor.id
      );
    } catch (err: any) {
      setEditError(err.message || 'Update failed');
    } finally {
      setEditLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Confirmation Actions (Suspend, Reactivate, Delete, Approve)
  // -------------------------------------------------------------
  const handleExecuteConfirmedAction = async () => {
    if (!confirmModal) return;
    const { type, editor } = confirmModal;
    setConfirmActionLoading(true);

    try {
      if (type === 'delete') {
        const res = await adminDeleteEditorApi(editor.id, adminToken || undefined);
        if (!res.success) {
          showToast('error', res.message || 'Failed to delete editor.');
          return;
        }
        setEditors(prev => prev.filter(e => e.id !== editor.id));
        showToast('success', `Deleted editor @${editor.username || editor.fullName}.`);
        await logAuditAction(
          'DELETE_EDITOR',
          userProfile?.id || 'admin',
          userProfile?.email || 'admin@draftly',
          `Admin permanently deleted editor: ${editor.fullName} (@${editor.username})`,
          editor.id
        );
      } else {
        const targetStatus: 'approved' | 'suspended' | 'rejected' =
          type === 'suspend'
            ? 'suspended'
            : type === 'reactivate' || type === 'approve'
            ? 'approved'
            : 'rejected';

        const res = await adminUpdateEditorStatusApi(editor.id, targetStatus, adminToken || undefined);
        if (!res.success) {
          // Fallback to direct firestore update
          await updateEditorStatus(editor.id, targetStatus);
        }

        setEditors(prev =>
          prev.map(e => (e.id === editor.id ? { ...e, status: targetStatus } : e))
        );

        const actionWord =
          targetStatus === 'approved'
            ? 'approved'
            : targetStatus === 'suspended'
            ? 'suspended'
            : 'rejected';

        showToast('success', `Editor @${editor.username || editor.fullName} is now ${actionWord}.`);

        await logAuditAction(
          targetStatus === 'approved' ? 'APPROVE_EDITOR' : 'SUSPEND_EDITOR',
          userProfile?.id || 'admin',
          userProfile?.email || 'admin@draftly',
          `Status changed to ${targetStatus} for editor ${editor.fullName}`,
          editor.id
        );
      }
      setConfirmModal(null);
    } catch (err: any) {
      showToast('error', err.message || 'Action failed.');
    } finally {
      setConfirmActionLoading(false);
    }
  };

  // Category & Review Helpers
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const catId = await addCategory({
      name: newCatName.trim(),
      slug: newCatSlug.trim() || newCatName.toLowerCase().replace(/\s+/g, '-'),
      description: newCatDesc.trim(),
      icon: 'Film',
      editorCount: 0,
      featured: true,
    });
    setCategories(prev => [
      ...prev,
      {
        id: catId,
        name: newCatName.trim(),
        slug: newCatSlug.trim() || newCatName.toLowerCase().replace(/\s+/g, '-'),
        description: newCatDesc.trim(),
        icon: 'Film',
        editorCount: 0,
        featured: true,
      },
    ]);
    setShowCatModal(false);
    setNewCatName('');
    setNewCatSlug('');
    setNewCatDesc('');
    showToast('success', `Category "${newCatName}" added.`);
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Delete category "${name}"?`)) return;
    await deleteCategory(id);
    setCategories(prev => prev.filter(c => c.id !== id));
    showToast('success', `Category "${name}" deleted.`);
  };

  const handleDeleteReview = async (id: string) => {
    if (!confirm('Remove this review from public display?')) return;
    await deleteReview(id);
    setReviews(prev => prev.filter(r => r.id !== id));
    showToast('success', 'Review deleted.');
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await updatePlatformSettings({
      announcement: announcementText,
      showAnnouncement,
    });
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
    showToast('success', 'Platform settings updated.');
  };

  // -------------------------------------------------------------
  // Admin Credentials Management
  // -------------------------------------------------------------
  const handleAdminChangeCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminCredError(null);
    setAdminCredSuccess(null);

    if (!adminCurrentPassword) {
      setAdminCredError('Current password is required to verify your authorization.');
      return;
    }

    if (adminNewPassword) {
      if (adminNewPassword.length < 6) {
        setAdminCredError('New password must be at least 6 characters.');
        return;
      }
      if (adminNewPassword !== adminConfirmPassword) {
        setAdminCredError('New password and confirmation do not match.');
        return;
      }
    }

    if (!adminNewUsername.trim() && !adminNewPassword) {
      setAdminCredError('Provide a new username or a new password to update.');
      return;
    }

    setAdminCredLoading(true);
    try {
      const res = await adminChangeCredentialsApi(
        {
          currentPassword: adminCurrentPassword,
          newUsername: adminNewUsername.trim() || undefined,
          newPassword: adminNewPassword || undefined,
        },
        adminToken || undefined
      );

      if (!res.success) {
        setAdminCredError(res.message || 'Failed to update credentials.');
        return;
      }

      setAdminCredSuccess('Admin credentials updated successfully! New credentials are now active.');
      if (res.token) {
        setAdminSession(res.token, res.username || adminNewUsername.trim() || userProfile?.username || 'Abhiraj');
      }
      setAdminCurrentPassword('');
      setAdminNewPassword('');
      setAdminConfirmPassword('');
      showToast('success', 'Admin credentials updated successfully.');
    } catch (err: any) {
      setAdminCredError(err.message || 'Failed to update credentials.');
    } finally {
      setAdminCredLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Editor Credentials Management (Admin Action)
  // -------------------------------------------------------------
  const handleOpenCredModal = (ed: EditorProfile) => {
    setCredEditor(ed);
    setEditorNewUsername(ed.username || '');
    setEditorNewPassword('');
    setEditorCredError(null);
    setEditorCredSuccess(null);
  };

  const handleUpdateEditorCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credEditor) return;
    setEditorCredError(null);
    setEditorCredSuccess(null);

    if (!editorNewUsername.trim() && !editorNewPassword) {
      setEditorCredError('Please provide a new username or a new password.');
      return;
    }

    if (editorNewPassword && editorNewPassword.length < 6) {
      setEditorCredError('New password must be at least 6 characters long.');
      return;
    }

    setEditorCredLoading(true);
    try {
      const res = await adminUpdateEditorCredentialsApi(
        credEditor.id,
        {
          username: editorNewUsername.trim() || undefined,
          password: editorNewPassword || undefined,
        },
        adminToken || undefined
      );

      if (!res.success) {
        setEditorCredError(res.message || 'Failed to update editor credentials.');
        return;
      }

      setEditorCredSuccess('Editor credentials updated successfully!');
      showToast('success', `Credentials updated for ${credEditor.fullName}`);
      await fetchEditorsList();
      setTimeout(() => {
        setCredEditor(null);
        setEditorCredSuccess(null);
      }, 1500);
    } catch (err: any) {
      setEditorCredError(err.message || 'Failed to update editor credentials.');
    } finally {
      setEditorCredLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Real-Time Notifications Broadcast (Admin Action)
  // -------------------------------------------------------------
  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotifError(null);
    setNotifSuccess(null);

    if (!notifTitle.trim() || !notifMessage.trim()) {
      setNotifError('Please enter both a notification title and message.');
      return;
    }

    if ((notifAudience === 'specific_client' || notifAudience === 'specific_editor') && !notifTargetUserId) {
      setNotifError('Please select a specific recipient from the dropdown.');
      return;
    }

    setSendingNotif(true);
    try {
      const res = await adminSendNotificationApi(
        {
          title: notifTitle.trim(),
          message: notifMessage.trim(),
          targetAudience: notifAudience,
          targetUserId: notifTargetUserId || undefined,
        },
        adminToken || undefined
      );

      if (!res.success) {
        setNotifError(res.message || 'Failed to send notification.');
        return;
      }

      setNotifSuccess(`Notification dispatched in real time to ${res.sentCount || 1} recipient(s)!`);
      setNotifTitle('');
      setNotifMessage('');
      setNotifTargetUserId('');

      if (adminToken) {
        const notifRes = await adminGetNotificationsApi(adminToken);
        if (notifRes.success && notifRes.notifications) {
          setAdminNotifications(notifRes.notifications);
        }
      }
      showToast('success', 'Notification broadcast delivered.');
    } catch (err: any) {
      setNotifError(err.message || 'Failed to send notification.');
    } finally {
      setSendingNotif(false);
    }
  };

  const handleDeleteNotification = async (notifId: string) => {
    if (!confirm('Delete this notification record from history?')) return;
    setDeletingNotifId(notifId);
    try {
      const res = await adminDeleteNotificationApi(notifId, adminToken || undefined);
      if (res.success) {
        setAdminNotifications(prev => prev.filter(n => n.id !== notifId));
        showToast('success', 'Notification removed from history.');
      } else {
        showToast('error', res.message || 'Failed to delete notification.');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete notification.');
    } finally {
      setDeletingNotifId(null);
    }
  };

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'editors', label: 'Manage Editors', icon: Film, count: editors.length },
    { id: 'clients', label: 'Manage Clients', icon: Users, count: clients.length },
    { id: 'requests', label: 'Hiring Requests', icon: FileText, count: requests.length },
    { id: 'active_projects', label: 'Active Projects', icon: Video, count: activeProjects.length },
    { id: 'completed_projects', label: 'Completed Projects', icon: CheckCircle2, count: completedProjects.length },
    { id: 'categories', label: 'Categories', icon: Layers },
    { id: 'notifications', label: 'Notifications', icon: Bell, count: adminNotifications.length },
    { id: 'account', label: 'Account Credentials', icon: KeyRound },
    { id: 'reviews', label: 'Reviews', icon: Star },
    { id: 'reports', label: 'Reports', icon: ShieldAlert, badge: reports.filter(r => r.status === 'pending').length },
    { id: 'contact', label: 'Contact Messages', icon: Mail, badge: contacts.filter(c => c.status === 'unread').length },
    { id: 'settings', label: 'Website Settings', icon: Sliders },
    { id: 'audit', label: 'Activity Logs', icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-[#080611] flex flex-col md:flex-row text-white font-['Inter'] selection:bg-[#9B5CFF]/30">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div
            className={`px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border ${
              toast.type === 'success'
                ? 'bg-[#171025] border-emerald-500/50 text-emerald-300'
                : 'bg-[#171025] border-rose-500/50 text-rose-300'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span className="text-xs font-semibold">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 text-white/60 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-[#100B1C] border-r border-[#9B5CFF]/20 flex flex-col justify-between shrink-0">
        <div>
          <div className="p-6 border-b border-[#251B38]">
            <div
              onClick={() => navigate('/')}
              className="flex items-center gap-3 cursor-pointer group mb-4"
            >
              <img
                src="https://i.postimg.cc/NjqbtJKN/Neon-Purple-Draftly-Crown-Logo.png"
                alt="DRAFTLY"
                className="h-8 w-auto object-contain"
              />
              <span className="text-xl font-extrabold text-white font-['Manrope'] tracking-wide">
                DRAFTLY
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-purple-950/40 border border-[#9B5CFF]/30">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#BB86FF]" />
                <div>
                  <span className="text-xs font-bold text-white block">Abhiraj</span>
                  <span className="text-[10px] text-[#A59BB8] font-mono">Super Admin</span>
                </div>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            {/* Prominent + Add My Editor Button in Sidebar */}
            <button
              onClick={() => {
                setAddEditorError(null);
                setAddEditorSuccess(null);
                setShowAddEditorModal(true);
              }}
              className="w-full mt-4 py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#9B5CFF] to-[#7A22FF] text-white text-xs font-bold shadow-[0_0_15px_rgba(155,92,255,0.35)] hover:shadow-[0_0_20px_rgba(187,134,255,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add My Editor</span>
            </button>
          </div>

          <nav className="p-3 space-y-1 max-h-[calc(100vh-250px)] overflow-y-auto">
            {sidebarItems.map(item => {
              const IconComp = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#9B5CFF]/20 text-[#BB86FF] border border-[#9B5CFF]/40 shadow-[0_0_12px_rgba(155,92,255,0.2)]'
                      : 'text-[#A59BB8] hover:text-white hover:bg-[#171025]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <IconComp className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {typeof item.badge === 'number' && item.badge > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-[#080611]">
                      {item.badge}
                    </span>
                  )}
                  {typeof item.count === 'number' && (
                    <span className="text-[10px] text-[#A59BB8] px-1.5 py-0.5 rounded bg-[#171025]">
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-[#251B38] bg-[#0c0816]">
          <button
            onClick={async () => {
              await logout();
              navigate('/admin');
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Admin</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 p-6 sm:p-8 lg:p-10 overflow-y-auto max-w-7xl">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Manrope']">
                  Platform Statistics & Overview
                </h1>
                <p className="text-xs sm:text-sm text-[#A59BB8] mt-1">
                  Real-time metrics and editor network status.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="px-3 py-2 rounded-xl bg-[#171025] hover:bg-[#251B38] border border-[#9B5CFF]/30 text-[#A59BB8] hover:text-white text-xs font-semibold flex items-center gap-2 transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#BB86FF]' : ''}`} />
                  <span>Sync</span>
                </button>

                <button
                  onClick={() => {
                    setAddEditorError(null);
                    setAddEditorSuccess(null);
                    setShowAddEditorModal(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#9B5CFF] to-[#7A22FF] text-white text-xs font-bold shadow-[0_0_20px_rgba(155,92,255,0.4)] hover:shadow-[0_0_25px_rgba(187,134,255,0.6)] flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add My Editor</span>
                </button>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              <div
                onClick={() => setActiveTab('editors')}
                className="p-5 rounded-2xl bg-[#171025] border border-[#9B5CFF]/20 hover:border-[#BB86FF]/50 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#A59BB8]">Registered Editors</span>
                  <Film className="w-4 h-4 text-[#BB86FF]" />
                </div>
                <span className="text-3xl font-extrabold text-white mt-1 block">
                  {editors.length}
                </span>
                <span className="text-[10px] text-amber-300 mt-1 block">
                  {pendingApprovals.length} pending review • {editors.filter(e => e.status === 'approved').length} approved
                </span>
              </div>

              <div
                onClick={() => setActiveTab('completed_projects')}
                className="p-5 rounded-2xl bg-[#171025] border border-[#9B5CFF]/20 hover:border-emerald-500/50 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#A59BB8]">Completed Projects</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-3xl font-extrabold text-emerald-400 mt-1 block">
                  {completedProjects.length}
                </span>
                <span className="text-[10px] text-[#A59BB8] mt-1 block">
                  Delivered on DRAFTLY
                </span>
              </div>

              <div
                onClick={() => setActiveTab('clients')}
                className="p-5 rounded-2xl bg-[#171025] border border-[#9B5CFF]/20 hover:border-blue-500/50 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#A59BB8]">Active Clients</span>
                  <Users className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-3xl font-extrabold text-white mt-1 block">
                  {clients.length > 0 ? clients.length : 1}
                </span>
                <span className="text-[10px] text-[#A59BB8] mt-1 block">
                  Brands & Creators
                </span>
              </div>

              <div
                onClick={() => setActiveTab('requests')}
                className="p-5 rounded-2xl bg-[#171025] border border-[#9B5CFF]/20 hover:border-purple-500/50 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#A59BB8]">Total Proposals</span>
                  <FileText className="w-4 h-4 text-[#BB86FF]" />
                </div>
                <span className="text-3xl font-extrabold text-[#BB86FF] mt-1 block">
                  {requests.length}
                </span>
                <span className="text-[10px] text-[#A59BB8] mt-1 block">
                  {activeProjects.length} in production
                </span>
              </div>
            </div>

            {/* Pending Approvals quick action card */}
            {pendingApprovals.length > 0 && (
              <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-400" />
                  <div>
                    <h3 className="font-bold text-white text-base">
                      {pendingApprovals.length} Editor Application(s) Awaiting Review
                    </h3>
                    <p className="text-xs text-[#A59BB8]">
                      Verify their showreel and portfolio before making them publicly searchable.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('approvals')}
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold transition-all shadow-md"
                >
                  Review Applications
                </button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* MANAGE EDITORS TAB (Section 4 & 2 Requirements) */}
        {/* ========================================================= */}
        {activeTab === 'editors' && (
          <div className="space-y-6">
            {/* Header with Prominent Add Editor Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#251B38]">
              <div>
                <h1 className="text-2xl font-extrabold text-white font-['Manrope'] flex items-center gap-3">
                  <span>Manage Editors</span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#9B5CFF]/20 text-[#BB86FF] border border-[#9B5CFF]/30">
                    {editors.length} Total
                  </span>
                </h1>
                <p className="text-xs text-[#A59BB8] mt-1">
                  Create, audit, inspect, suspend, reactivate, or delete creative video editor accounts.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="p-2.5 rounded-xl bg-[#171025] border border-[#9B5CFF]/20 text-[#A59BB8] hover:text-white hover:border-[#BB86FF] transition-all"
                  title="Reload editor database"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#BB86FF]' : ''}`} />
                </button>

                {/* Primary + Add My Editor Button */}
                <button
                  onClick={() => {
                    setAddEditorError(null);
                    setAddEditorSuccess(null);
                    setShowAddEditorModal(true);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#9B5CFF] to-[#7A22FF] text-white text-xs font-bold shadow-[0_0_20px_rgba(155,92,255,0.4)] hover:shadow-[0_0_25px_rgba(187,134,255,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>+ Add My Editor</span>
                </button>
              </div>
            </div>

            {/* Search and Filters Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-[#100B1C] p-4 rounded-2xl border border-[#9B5CFF]/20">
              {/* Search Editors Input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#A59BB8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search editors by name, @username, email, title, skill, or category..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#171025] border border-[#9B5CFF]/20 text-white placeholder-[#A59BB8]/60 text-xs focus:outline-none focus:border-[#BB86FF] transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A59BB8] hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status Filter Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                {(['all', 'approved', 'pending', 'suspended'] as const).map(st => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-all ${
                      statusFilter === st
                        ? 'bg-[#9B5CFF] text-white shadow-[0_0_12px_rgba(155,92,255,0.4)]'
                        : 'bg-[#171025] text-[#A59BB8] hover:text-white border border-[#251B38]'
                    }`}
                  >
                    {st === 'all' ? `All (${editors.length})` : `${st} (${editors.filter(e => e.status === st || (st === 'approved' && e.status === 'active')).length})`}
                  </button>
                ))}
              </div>
            </div>

            {/* Editors Data Table */}
            <div className="overflow-x-auto rounded-2xl bg-[#171025] border border-[#9B5CFF]/20 shadow-xl">
              <table className="w-full text-left text-xs text-[#A59BB8]">
                <thead className="bg-[#100B1C] text-white uppercase text-[10px] tracking-wider border-b border-[#251B38]">
                  <tr>
                    <th className="p-4">Editor Profile</th>
                    <th className="p-4">Username & Email</th>
                    <th className="p-4">Experience</th>
                    <th className="p-4">Software & Skills</th>
                    <th className="p-4">Rate</th>
                    <th className="p-4">Account Status</th>
                    <th className="p-4">Registered Date</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#251B38]">
                  {filteredEditors.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-[#A59BB8]">
                        <Film className="w-8 h-8 text-[#9B5CFF]/40 mx-auto mb-2" />
                        <p className="font-semibold text-white">
                          {editors.length === 0 ? 'No editors have been added yet.' : 'No editors found matching criteria'}
                        </p>
                        <p className="text-[11px] mt-1">
                          {editors.length === 0
                            ? 'Click "+ Add My Editor" above to onboard your first video editor.'
                            : `No editors match your search "${searchQuery}".`}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredEditors.map(ed => {
                      const regDate = ed.createdAt
                        ? new Date(ed.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'Pre-seeded';

                      return (
                        <tr
                          key={ed.id}
                          className="hover:bg-[#100B1C]/60 transition-colors group"
                        >
                          {/* Profile Picture & Full Name */}
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={
                                  ed.photoURL ||
                                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
                                }
                                alt={ed.fullName}
                                className="w-10 h-10 rounded-xl object-cover border border-[#9B5CFF]/30 shrink-0 group-hover:border-[#BB86FF] transition-colors"
                              />
                              <div>
                                <span className="font-bold text-white text-sm block">
                                  {ed.fullName}
                                </span>
                                <span className="text-[11px] text-[#BB86FF] block truncate max-w-[160px]">
                                  {ed.title || 'Video Editor'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Username & Email */}
                          <td className="p-4">
                            <span className="font-mono font-bold text-white text-xs block">
                              @{ed.username || ed.fullName.toLowerCase().replace(/\s+/g, '')}
                            </span>
                            <span className="text-[11px] text-[#A59BB8] block">
                              {ed.email}
                            </span>
                          </td>

                          {/* Experience */}
                          <td className="p-4">
                            <span className="text-white font-medium text-xs block">
                              {ed.experience || '3+ years'}
                            </span>
                            <span className="text-[10px] text-[#A59BB8]">
                              {ed.availability || 'Available Now'}
                            </span>
                          </td>

                          {/* Skills */}
                          <td className="p-4">
                            <div className="flex flex-wrap gap-1 max-w-[180px]">
                              {(ed.skills || []).slice(0, 3).map((sk, i) => (
                                <span
                                  key={i}
                                  className="px-1.5 py-0.5 rounded text-[10px] bg-[#100B1C] text-[#BB86FF] border border-[#9B5CFF]/30 font-medium"
                                >
                                  {sk}
                                </span>
                              ))}
                              {(ed.skills || []).length > 3 && (
                                <span className="text-[10px] text-[#A59BB8] self-center">
                                  +{ed.skills.length - 3}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Rate */}
                          <td className="p-4 font-bold text-white text-xs">
                            {formatCurrency(ed.startingPrice || 100)}
                          </td>

                          {/* Status */}
                          <td className="p-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                                ed.status === 'approved'
                                  ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                                  : ed.status === 'pending'
                                  ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                                  : ed.status === 'suspended'
                                  ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                                  : 'bg-zinc-500/10 text-zinc-300 border border-zinc-500/30'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  ed.status === 'approved'
                                    ? 'bg-emerald-400'
                                    : ed.status === 'pending'
                                    ? 'bg-amber-400'
                                    : ed.status === 'suspended'
                                    ? 'bg-rose-400'
                                    : 'bg-zinc-400'
                                }`}
                              />
                              <span className="capitalize">{ed.status}</span>
                            </span>
                          </td>

                          {/* Registration Date */}
                          <td className="p-4 text-[11px] text-[#A59BB8] whitespace-nowrap">
                            {regDate}
                          </td>

                          {/* Actions */}
                          <td className="p-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* View Profile */}
                              <button
                                onClick={() => setViewingEditor(ed)}
                                className="p-1.5 rounded-lg bg-[#100B1C] hover:bg-[#9B5CFF]/20 text-[#A59BB8] hover:text-[#BB86FF] border border-[#251B38] transition-colors"
                                title="View Complete Profile"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* Manage Credentials */}
                              <button
                                onClick={() => {
                                  setCredEditor(ed);
                                  setEditorNewUsername(ed.username || '');
                                  setEditorNewPassword('');
                                  setEditorCredError(null);
                                  setEditorCredSuccess(null);
                                }}
                                className="p-1.5 rounded-lg bg-[#100B1C] hover:bg-amber-500/20 text-[#A59BB8] hover:text-amber-300 border border-[#251B38] transition-colors"
                                title="Manage Username & Password"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                              </button>

                              {/* Edit Details */}
                              <button
                                onClick={() => handleOpenEdit(ed)}
                                className="p-1.5 rounded-lg bg-[#100B1C] hover:bg-[#9B5CFF]/20 text-[#A59BB8] hover:text-white border border-[#251B38] transition-colors"
                                title="Edit Details"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Approve Button (if pending) */}
                              {ed.status === 'pending' && (
                                <button
                                  onClick={() =>
                                    setConfirmModal({ type: 'approve', editor: ed })
                                  }
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold transition-colors flex items-center gap-1"
                                  title="Approve Editor"
                                >
                                  <UserCheck className="w-3 h-3" />
                                  <span>Approve</span>
                                </button>
                              )}

                              {/* Suspend or Reactivate */}
                              {ed.status === 'suspended' ? (
                                <button
                                  onClick={() =>
                                    setConfirmModal({ type: 'reactivate', editor: ed })
                                  }
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold transition-colors flex items-center gap-1"
                                  title="Reactivate Editor"
                                >
                                  <UserCheck className="w-3 h-3" />
                                  <span>Reactivate</span>
                                </button>
                              ) : (
                                ed.status !== 'pending' && (
                                  <button
                                    onClick={() =>
                                      setConfirmModal({ type: 'suspend', editor: ed })
                                    }
                                    className="px-2.5 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 text-[11px] font-semibold transition-colors flex items-center gap-1"
                                    title="Suspend Editor Account"
                                  >
                                    <UserX className="w-3 h-3" />
                                    <span>Suspend</span>
                                  </button>
                                )
                              )}

                              {/* Delete Editor */}
                              <button
                                onClick={() =>
                                  setConfirmModal({ type: 'delete', editor: ed })
                                }
                                className="p-1.5 rounded-lg bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 transition-colors"
                                title="Delete Editor Account"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* EDITOR APPROVALS TAB */}
        {/* ========================================================= */}
        {activeTab === 'approvals' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-extrabold text-white font-['Manrope']">
                Editor Application Queue ({pendingApprovals.length})
              </h1>
              <p className="text-xs text-[#A59BB8] mt-1">
                Inspect applicant showreels, rates, and approve or reject access.
              </p>
            </div>

            {pendingApprovals.length === 0 ? (
              <div className="text-center py-16 bg-[#171025] rounded-3xl border border-[#251B38]">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-white">No pending applications!</p>
                <p className="text-xs text-[#A59BB8] mt-1">
                  All registered editor accounts are reviewed.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingApprovals.map(editor => (
                  <div
                    key={editor.id}
                    className="p-6 rounded-3xl bg-[#171025] border border-amber-500/30 space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <img
                          src={
                            editor.photoURL ||
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'
                          }
                          alt=""
                          className="w-14 h-14 rounded-2xl object-cover border border-[#9B5CFF]/30"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-base text-white">
                              {editor.fullName}
                            </h3>
                            <span className="font-mono text-xs text-[#BB86FF]">
                              @{editor.username || editor.fullName.toLowerCase().replace(/\s+/g, '')}
                            </span>
                          </div>
                          <p className="text-xs text-[#BB86FF]">{editor.title}</p>
                          <p className="text-[11px] text-[#A59BB8]">
                            Email: {editor.email} • Experience: {editor.experience} • Rate:{' '}
                            {formatCurrency(editor.startingPrice)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            setConfirmModal({ type: 'reject', editor })
                          }
                          className="px-4 py-2 rounded-xl text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 transition-colors"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() =>
                            setConfirmModal({ type: 'approve', editor })
                          }
                          className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md transition-all flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve Editor</span>
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-[#A59BB8] leading-relaxed bg-[#100B1C] p-3 rounded-2xl border border-[#251B38]">
                      {editor.bio}
                    </p>

                    {editor.portfolioUrl && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-[#A59BB8]">Showreel:</span>
                        <a
                          href={editor.portfolioUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#BB86FF] hover:underline flex items-center gap-1 font-semibold"
                        >
                          <span>{editor.portfolioUrl}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* MANAGE CLIENTS TAB */}
        {/* ========================================================= */}
        {activeTab === 'clients' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-extrabold text-white font-['Manrope']">
                Registered Clients ({clients.length})
              </h1>
              <p className="text-xs text-[#A59BB8] mt-1">
                Client accounts creating hiring proposals and funding projects.
              </p>
            </div>

            <div className="overflow-x-auto rounded-2xl bg-[#171025] border border-[#9B5CFF]/20 shadow-xl">
              <table className="w-full text-left text-xs text-[#A59BB8]">
                <thead className="bg-[#100B1C] text-white uppercase text-[10px] tracking-wider border-b border-[#251B38]">
                  <tr>
                    <th className="p-4">Client Name</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Company</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#251B38]">
                  {clients.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-[#A59BB8]">
                        No external client profiles registered yet.
                      </td>
                    </tr>
                  ) : (
                    clients.map(cl => (
                      <tr key={cl.id} className="hover:bg-[#100B1C]/50">
                        <td className="p-4 font-bold text-white">{cl.fullName}</td>
                        <td className="p-4">{cl.email}</td>
                        <td className="p-4">{cl.company || 'Individual Creator'}</td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-300">
                            {cl.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* HIRING REQUESTS TAB */}
        {/* ========================================================= */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-extrabold text-white font-['Manrope']">
                All Hiring Requests ({requests.length})
              </h1>
              <p className="text-xs text-[#A59BB8] mt-1">
                Audit every proposal, budget terms, and status transition.
              </p>
            </div>

            <div className="space-y-3">
              {requests.length === 0 ? (
                <div className="text-center py-12 bg-[#171025] rounded-3xl border border-[#251B38] text-sm text-[#A59BB8]">
                  No hiring requests submitted yet.
                </div>
              ) : (
                requests.map(req => {
                  const style = getStatusStyle(req.status);
                  return (
                    <div
                      key={req.id}
                      className="p-5 rounded-2xl bg-[#171025] border border-[#9B5CFF]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-sm">{req.projectTitle}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] border font-bold ${style.badgeClass}`}>
                            {style.label}
                          </span>
                        </div>
                        <p className="text-[#A59BB8] mt-1">
                          Client: <strong className="text-white">{req.clientName}</strong> → Editor: <strong className="text-[#BB86FF]">{req.editorName}</strong> • Budget: {formatCurrency(req.budget)}
                        </p>
                      </div>

                      <span className="text-[#A59BB8] text-[11px]">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ACTIVE PROJECTS */}
        {activeTab === 'active_projects' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-extrabold text-white font-['Manrope']">
                Active Projects in Production ({activeProjects.length})
              </h1>
              <p className="text-xs text-[#A59BB8] mt-1">
                Projects currently under development or review by editors.
              </p>
            </div>
            <div className="space-y-3">
              {activeProjects.length === 0 ? (
                <div className="p-12 text-center text-[#A59BB8] bg-[#171025] rounded-2xl">
                  No active projects currently in production.
                </div>
              ) : (
                activeProjects.map(req => (
                  <div
                    key={req.id}
                    className="p-5 rounded-2xl bg-[#171025] border border-purple-500/30 flex justify-between items-center text-xs"
                  >
                    <div>
                      <h4 className="font-bold text-white text-sm">{req.projectTitle}</h4>
                      <p className="text-[#A59BB8]">Client: {req.clientName} | Editor: {req.editorName}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#9B5CFF]/20 text-[#BB86FF]">
                      {req.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* COMPLETED PROJECTS */}
        {activeTab === 'completed_projects' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-extrabold text-white font-['Manrope']">
                Completed & Delivered Projects ({completedProjects.length})
              </h1>
              <p className="text-xs text-[#A59BB8] mt-1">
                Completed marketplace projects with final review files.
              </p>
            </div>
            <div className="space-y-3">
              {completedProjects.length === 0 ? (
                <div className="p-12 text-center text-[#A59BB8] bg-[#171025] rounded-2xl">
                  No completed projects yet.
                </div>
              ) : (
                completedProjects.map(req => (
                  <div
                    key={req.id}
                    className="p-5 rounded-2xl bg-[#171025] border border-emerald-500/30 flex justify-between items-center text-xs"
                  >
                    <div>
                      <h4 className="font-bold text-white text-sm">{req.projectTitle}</h4>
                      <p className="text-[#A59BB8]">Budget: {formatCurrency(req.budget)}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400">
                      Delivered
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* CATEGORIES TAB */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-extrabold text-white font-['Manrope']">
                  Creative Categories ({categories.length})
                </h1>
                <p className="text-xs text-[#A59BB8] mt-1">
                  Manage categories shown on public explore filters and home page.
                </p>
              </div>

              <button
                onClick={() => setShowCatModal(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#9B5CFF] to-[#7A22FF] flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Category</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map(cat => (
                <div
                  key={cat.id}
                  className="p-5 rounded-2xl bg-[#171025] border border-[#9B5CFF]/20 flex flex-col justify-between space-y-3"
                >
                  <div>
                    <h4 className="font-bold text-white text-sm">{cat.name}</h4>
                    <p className="text-xs text-[#A59BB8] mt-1 line-clamp-2">{cat.description}</p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-[#251B38]">
                    <span className="text-[10px] text-[#BB86FF]">slug: /{cat.slug}</span>
                    <button
                      onClick={() => handleDeleteCategory(cat.id, cat.name)}
                      className="text-rose-400 hover:text-rose-300 p-1"
                      title="Delete category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* REVIEWS TAB */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-extrabold text-white font-['Manrope']">
                Customer Reviews Moderation ({reviews.length})
              </h1>
              <p className="text-xs text-[#A59BB8] mt-1">
                Audit client testimonials and purge malicious or fraudulent entries.
              </p>
            </div>

            <div className="space-y-4">
              {reviews.map(rev => (
                <div
                  key={rev.id}
                  className="p-5 rounded-2xl bg-[#171025] border border-[#9B5CFF]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{rev.clientName}</span>
                      <span className="text-xs text-[#A59BB8]">→ {rev.editorName}</span>
                      <span className="text-amber-400 text-xs font-bold">★ {rev.rating}</span>
                    </div>
                    <p className="text-xs text-[#A59BB8] italic leading-relaxed">
                      "{rev.comment}"
                    </p>
                  </div>

                  <button
                    onClick={() => handleDeleteReview(rev.id)}
                    className="p-2 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Remove review"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* REPORTS TAB */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-extrabold text-white font-['Manrope']">
                Moderation Reports ({reports.length})
              </h1>
              <p className="text-xs text-[#A59BB8] mt-1">
                Flagged user or profile disputes submitted to administration.
              </p>
            </div>

            {reports.length === 0 ? (
              <div className="text-center py-16 bg-[#171025] rounded-3xl border border-[#251B38]">
                <p className="text-sm text-[#A59BB8]">No open reports.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map(rep => (
                  <div
                    key={rep.id}
                    className="p-5 rounded-2xl bg-[#171025] border border-rose-500/30 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-rose-400">
                        Reason: {rep.reason}
                      </span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#100B1C] text-white">
                        {rep.status}
                      </span>
                    </div>
                    <p className="text-xs text-[#A59BB8] bg-[#100B1C] p-3 rounded-xl">
                      {rep.details}
                    </p>
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-[#A59BB8]">Target ID: {rep.reportedUserId}</span>
                      <button
                        onClick={async () => {
                          await updateReportStatus(rep.id, 'resolved');
                          setReports(prev =>
                            prev.map(r => (r.id === rep.id ? { ...r, status: 'resolved' } : r))
                          );
                        }}
                        className="px-3 py-1 rounded-lg bg-emerald-600/20 text-emerald-400 font-semibold"
                      >
                        Mark Resolved
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CONTACT MESSAGES TAB */}
        {activeTab === 'contact' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-extrabold text-white font-['Manrope']">
                Contact Messages ({contacts.length})
              </h1>
              <p className="text-xs text-[#A59BB8] mt-1">
                Inquiries and support tickets received through the Contact page.
              </p>
            </div>

            {contacts.length === 0 ? (
              <div className="text-center py-16 bg-[#171025] rounded-3xl border border-[#251B38]">
                <p className="text-sm text-[#A59BB8]">No contact messages received.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {contacts.map(c => (
                  <div
                    key={c.id}
                    className="p-5 rounded-2xl bg-[#171025] border border-[#9B5CFF]/20 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-white text-sm">{c.subject}</span>
                        <p className="text-[11px] text-[#A59BB8]">
                          From: {c.name} ({c.email})
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.status === 'unread'
                            ? 'bg-amber-500/10 text-amber-300'
                            : 'bg-emerald-500/10 text-emerald-300'
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>

                    <p className="p-3 rounded-xl bg-[#100B1C] border border-[#251B38] text-white leading-relaxed">
                      {c.message}
                    </p>

                    <div className="flex justify-end pt-1">
                      {c.status === 'unread' && (
                        <button
                          onClick={async () => {
                            await updateContactStatus(c.id, 'read');
                            setContacts(prev =>
                              prev.map(item => (item.id === c.id ? { ...item, status: 'read' } : item))
                            );
                          }}
                          className="px-3 py-1 rounded-lg bg-[#251B38] text-white hover:bg-[#32234B]"
                        >
                          Mark as Read
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* WEBSITE SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl space-y-6">
            <div>
              <h1 className="text-2xl font-extrabold text-white font-['Manrope']">
                Global Platform Settings
              </h1>
              <p className="text-xs text-[#A59BB8] mt-1">
                Control announcements, featured banners, and marketplace rules.
              </p>
            </div>

            {settingsSaved && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs">
                Platform settings updated in Firestore!
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="p-6 rounded-3xl bg-[#171025] border border-[#9B5CFF]/20 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white mb-1">
                  Global Announcement Banner Message
                </label>
                <textarea
                  rows={3}
                  value={announcementText}
                  onChange={e => setAnnouncementText(e.target.value)}
                  placeholder="e.g. Welcome to DRAFTLY: Verified Creative Video Talent..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/20 text-white text-xs sm:text-sm focus:outline-none focus:border-[#BB86FF]"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showAnnounce"
                  checked={showAnnouncement}
                  onChange={e => setShowAnnouncement(e.target.checked)}
                  className="w-4 h-4 accent-[#BB86FF]"
                />
                <label htmlFor="showAnnounce" className="text-xs text-white">
                  Display announcement banner across public header
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#9B5CFF] to-[#7A22FF]"
                >
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        )}

        {/* AUDIT LOGS TAB */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-extrabold text-white font-['Manrope']">
                Activity & Audit Logs ({auditLogs.length})
              </h1>
              <p className="text-xs text-[#A59BB8] mt-1">
                Immutable trace of admin operations, approvals, and system state updates.
              </p>
            </div>

            <div className="space-y-2">
              {auditLogs.map(log => (
                <div
                  key={log.id}
                  className="p-3.5 rounded-xl bg-[#171025] border border-[#251B38] flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2 font-mono"
                >
                  <div>
                    <span className="text-[#BB86FF] font-bold">[{log.action}]</span>{' '}
                    <span className="text-white">{log.details}</span>
                  </div>
                  <span className="text-[10px] text-[#A59BB8]">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-extrabold text-white font-['Manrope']">
                Real-Time Website Notifications
              </h1>
              <p className="text-xs text-[#A59BB8] mt-1">
                Dispatch live instant updates to clients and editors. Delivered immediately via Firestore real-time listeners.
              </p>
            </div>

            {/* Compose Notification Card */}
            <div className="p-6 rounded-3xl bg-[#171025] border border-[#9B5CFF]/30 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#9B5CFF]/20 border border-[#9B5CFF]/40 flex items-center justify-center text-[#BB86FF]">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Compose Notification Broadcast</h3>
                  <p className="text-xs text-[#A59BB8]">Target audience receives notification in real time without refreshing.</p>
                </div>
              </div>

              {notifError && (
                <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{notifError}</span>
                </div>
              )}

              {notifSuccess && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{notifSuccess}</span>
                </div>
              )}

              <form onSubmit={handleSendNotification} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Notification Title */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-white mb-1">
                      Notification Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Platform Maintenance / Creator Contest Announced"
                      value={notifTitle}
                      onChange={e => setNotifTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/30 text-white text-xs sm:text-sm focus:border-[#BB86FF] focus:outline-none"
                    />
                  </div>

                  {/* Target Audience */}
                  <div>
                    <label className="block text-xs font-semibold text-white mb-1">
                      Target Audience *
                    </label>
                    <select
                      value={notifAudience}
                      onChange={e => {
                        setNotifAudience(e.target.value as any);
                        setNotifTargetUserId('');
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/30 text-white text-xs sm:text-sm focus:border-[#BB86FF] focus:outline-none"
                    >
                      <option value="all_clients" className="bg-[#171025]">All Clients</option>
                      <option value="all_editors" className="bg-[#171025]">All Editors</option>
                      <option value="specific_client" className="bg-[#171025]">Specific Client</option>
                      <option value="specific_editor" className="bg-[#171025]">Specific Editor</option>
                    </select>
                  </div>

                  {/* Specific Recipient Dropdown (When applicable) */}
                  {(notifAudience === 'specific_client' || notifAudience === 'specific_editor') && (
                    <div>
                      <label className="block text-xs font-semibold text-white mb-1">
                        Select Recipient *
                      </label>
                      <select
                        required
                        value={notifTargetUserId}
                        onChange={e => setNotifTargetUserId(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/30 text-white text-xs sm:text-sm focus:border-[#BB86FF] focus:outline-none"
                      >
                        <option value="" className="bg-[#171025]">-- Select Recipient --</option>
                        {notifAudience === 'specific_client' ? (
                          (availableRecipients.clients.length > 0 ? availableRecipients.clients : clients).map(c => (
                            <option key={c.id} value={c.id} className="bg-[#171025]">
                              {c.fullName || c.displayName} ({c.email})
                            </option>
                          ))
                        ) : (
                          (availableRecipients.editors.length > 0 ? availableRecipients.editors : editors).map(ed => (
                            <option key={ed.id} value={ed.id} className="bg-[#171025]">
                              {ed.fullName} (@{ed.username || ed.id})
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                  )}

                  {/* Notification Message */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-white mb-1">
                      Message Content *
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Write the message that will pop up on the recipient's dashboard..."
                      value={notifMessage}
                      onChange={e => setNotifMessage(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/30 text-white text-xs sm:text-sm focus:border-[#BB86FF] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={sendingNotif}
                    className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#9B5CFF] to-[#7A22FF] shadow-[0_0_20px_rgba(155,92,255,0.4)] hover:shadow-[0_0_25px_rgba(187,134,255,0.6)] flex items-center gap-2 disabled:opacity-50"
                  >
                    {sendingNotif ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending Broadcast...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Live Notification</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Notification History */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white font-['Manrope']">
                  Notification Broadcast History ({adminNotifications.length})
                </h3>
                <span className="text-xs text-[#A59BB8]">Stored permanently with recipient records</span>
              </div>

              {adminNotifications.length === 0 ? (
                <div className="text-center py-12 rounded-3xl bg-[#171025] border border-[#251B38]">
                  <Bell className="w-8 h-8 text-[#A59BB8]/40 mx-auto mb-2" />
                  <p className="text-xs text-[#A59BB8]">No notifications broadcasted yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {adminNotifications.map(n => (
                    <div
                      key={n.id}
                      className="p-5 rounded-2xl bg-[#171025] border border-[#9B5CFF]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h4 className="text-sm font-bold text-white">{n.title}</h4>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#9B5CFF]/20 text-[#BB86FF] border border-[#9B5CFF]/30 uppercase">
                            {n.targetAudience.replace('_', ' ')}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#100B1C] text-emerald-400 border border-emerald-500/30">
                            {n.sentCount} Delivered
                          </span>
                        </div>
                        <p className="text-xs text-[#A59BB8] leading-relaxed">{n.message}</p>
                        <div className="flex items-center gap-4 text-[10px] text-[#A59BB8]/60 pt-1">
                          <span>Sent by Admin: {n.sentBy}</span>
                          <span>•</span>
                          <span>{new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteNotification(n.id)}
                        disabled={deletingNotifId === n.id}
                        className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 border border-rose-500/20 shrink-0 transition-colors"
                        title="Delete notification record"
                      >
                        {deletingNotifId === n.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ADMIN ACCOUNT & CREDENTIALS TAB */}
        {activeTab === 'account' && (
          <div className="max-w-2xl space-y-6">
            <div>
              <h1 className="text-2xl font-extrabold text-white font-['Manrope']">
                Account Settings & Security
              </h1>
              <p className="text-xs text-[#A59BB8] mt-1">
                Manage your administrator login credentials. Changes persist permanently across server restarts.
              </p>
            </div>

            {adminCredError && (
              <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{adminCredError}</span>
              </div>
            )}

            {adminCredSuccess && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{adminCredSuccess}</span>
              </div>
            )}

            <form onSubmit={handleAdminChangeCredentials} className="p-6 sm:p-8 rounded-3xl bg-[#171025] border border-[#9B5CFF]/30 shadow-xl space-y-5">
              <div className="flex items-center gap-3 pb-2 border-b border-[#251B38]">
                <div className="w-10 h-10 rounded-2xl bg-[#9B5CFF]/20 border border-[#9B5CFF]/40 flex items-center justify-center text-[#BB86FF]">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Administrator Credentials</h3>
                  <p className="text-xs text-[#A59BB8]">Current Username: <span className="font-mono text-[#BB86FF] font-bold">@{userProfile?.username || 'Abhiraj'}</span></p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-1">
                  Current Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter current password to authorize changes"
                  value={adminCurrentPassword}
                  onChange={e => setAdminCurrentPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/30 text-white text-xs sm:text-sm focus:border-[#BB86FF] focus:outline-none"
                />
              </div>

              <div className="pt-2 border-t border-[#251B38] space-y-4">
                <h4 className="text-xs font-bold text-[#BB86FF] uppercase tracking-wider">
                  Update Credentials (Fill at least one)
                </h4>

                <div>
                  <label className="block text-xs font-semibold text-white mb-1">
                    New Admin Username
                  </label>
                  <input
                    type="text"
                    placeholder="Enter new username (leave blank to keep current)"
                    value={adminNewUsername}
                    onChange={e => setAdminNewUsername(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/30 text-white text-xs sm:text-sm focus:border-[#BB86FF] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-white mb-1">
                      New Password (min 6 chars)
                    </label>
                    <input
                      type="password"
                      placeholder="Enter new password"
                      value={adminNewPassword}
                      onChange={e => setAdminNewPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/30 text-white text-xs sm:text-sm focus:border-[#BB86FF] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      value={adminConfirmPassword}
                      onChange={e => setAdminConfirmPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/30 text-white text-xs sm:text-sm focus:border-[#BB86FF] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#251B38] flex items-center justify-between">
                <span className="text-[11px] text-[#A59BB8]">
                  Password will be hashed using SHA-256 with cryptographically generated salt.
                </span>
                <button
                  type="submit"
                  disabled={adminCredLoading}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#9B5CFF] to-[#7A22FF] shadow-[0_0_20px_rgba(155,92,255,0.4)] hover:shadow-[0_0_25px_rgba(187,134,255,0.6)] flex items-center gap-2 disabled:opacity-50 shrink-0"
                >
                  {adminCredLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Credentials...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Update Credentials</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* ADD NEW EDITOR MODAL (Section 2: All 16 Fields) */}
      {/* ========================================================= */}
      {showAddEditorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md overflow-hidden animate-fade-in">
          <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl bg-[#171025] border border-[#9B5CFF]/40 shadow-[0_0_50px_rgba(155,92,255,0.25)] overflow-hidden">
            {/* Modal Header (Fixed at top) */}
            <div className="shrink-0 flex items-center justify-between px-6 py-4 sm:px-8 sm:py-5 border-b border-[#251B38] bg-[#171025]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#9B5CFF]/30 to-[#7A22FF]/30 border border-[#BB86FF]/40 flex items-center justify-center">
                  <Film className="w-5 h-5 text-[#BB86FF]" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-white font-['Manrope']">
                    + Add My Editor
                  </h3>
                  <p className="text-xs text-[#A59BB8]">
                    Provision a real, active editor account with complete profile details.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowAddEditorModal(false)}
                className="p-2 rounded-xl text-[#A59BB8] hover:text-white hover:bg-[#251B38] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form wrapping body and sticky action buttons */}
            <form onSubmit={handleAddEditorSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              {/* Scrollable Form Body */}
              <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8 space-y-6 overscroll-contain">
              {/* Error / Success Feedback */}
              {addEditorError && (
                <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{addEditorError}</span>
                </div>
              )}
              {addEditorSuccess && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{addEditorSuccess}</span>
                </div>
              )}

              {/* SECTION 1: CREDENTIALS */}
              <div className="space-y-4">
                <h4 className="text-xs uppercase tracking-wider font-bold text-[#BB86FF] flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5" />
                  <span>1. Authentication & Credentials</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Field 1: Full Name */}
                  <div>
                    <label className="block text-xs font-semibold text-white mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Liam Vance"
                      value={addForm.fullName}
                      onChange={e => {
                        const name = e.target.value;
                        setAddForm(prev => ({
                          ...prev,
                          fullName: name,
                          username: prev.username || sanitizeUsername(name),
                        }));
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/30 text-white text-xs sm:text-sm focus:border-[#BB86FF] focus:outline-none"
                    />
                  </div>

                  {/* Field 2: Username */}
                  <div>
                    <label className="block text-xs font-semibold text-white mb-1 flex items-center justify-between">
                      <span>Username *</span>
                      <span className="text-[10px] text-[#A59BB8]">Unique handle</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#BB86FF] text-xs font-mono font-bold">
                        @
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="liamvance"
                        value={addForm.username}
                        onChange={e =>
                          setAddForm(prev => ({
                            ...prev,
                            username: sanitizeUsername(e.target.value),
                          }))
                        }
                        className="w-full pl-7 pr-3.5 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/30 text-white text-xs sm:text-sm font-mono focus:border-[#BB86FF] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Field 3: Email Address */}
                  <div>
                    <label className="block text-xs font-semibold text-white mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="liam@creative.studio"
                      value={addForm.email}
                      onChange={e =>
                        setAddForm(prev => ({ ...prev, email: e.target.value }))
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/30 text-white text-xs sm:text-sm focus:border-[#BB86FF] focus:outline-none"
                    />
                  </div>

                  {/* Field 4: Password */}
                  <div>
                    <label className="block text-xs font-semibold text-white mb-1">
                      Initial Password * (min 6 chars)
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="••••••••"
                      value={addForm.password}
                      onChange={e =>
                        setAddForm(prev => ({ ...prev, password: e.target.value }))
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/30 text-white text-xs sm:text-sm focus:border-[#BB86FF] focus:outline-none"
                    />
                  </div>

                  {/* Field 5: Confirm Password */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-white mb-1">
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="••••••••"
                      value={addForm.confirmPassword}
                      onChange={e =>
                        setAddForm(prev => ({ ...prev, confirmPassword: e.target.value }))
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/30 text-white text-xs sm:text-sm focus:border-[#BB86FF] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: PROFILE & SPECIALTY */}
              <div className="space-y-4 pt-2 border-t border-[#251B38]">
                <h4 className="text-xs uppercase tracking-wider font-bold text-[#BB86FF] flex items-center gap-2">
                  <Film className="w-3.5 h-3.5" />
                  <span>2. Profile & Professional Specialty</span>
                </h4>

                {/* Field 6: Profile Picture URL */}
                <div>
                  <label className="block text-xs font-semibold text-white mb-1 flex items-center justify-between">
                    <span>Profile Picture URL</span>
                    <span className="text-[10px] text-[#A59BB8]">Quick presets below:</span>
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={addForm.photoURL}
                      onChange={e =>
                        setAddForm(prev => ({ ...prev, photoURL: e.target.value }))
                      }
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/30 text-white text-xs sm:text-sm focus:border-[#BB86FF] focus:outline-none"
                    />
                    {addForm.photoURL && (
                      <img
                        src={addForm.photoURL}
                        alt="Preview"
                        className="w-10 h-10 rounded-xl object-cover border border-[#BB86FF] shrink-0"
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#A59BB8]">Presets:</span>
                    {AVATAR_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() =>
                          setAddForm(prev => ({ ...prev, photoURL: preset }))
                        }
                        className="w-6 h-6 rounded-full overflow-hidden border border-[#9B5CFF]/40 hover:scale-110 transition-transform"
                      >
                        <img src={preset} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Field 7: Professional Title */}
                  <div>
                    <label className="block text-xs font-semibold text-white mb-1">
                      Professional Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Senior YouTube & Gaming Editor"
                      value={addForm.title}
                      onChange={e =>
                        setAddForm(prev => ({ ...prev, title: e.target.value }))
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/30 text-white text-xs sm:text-sm focus:border-[#BB86FF] focus:outline-none"
                    />
                  </div>

                  {/* Field 9: Experience */}
                  <div>
                    <label className="block text-xs font-semibold text-white mb-1">
                      Experience Level *
                    </label>
                    <select
                      value={addForm.experience}
                      onChange={e =>
                        setAddForm(prev => ({ ...prev, experience: e.target.value }))
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/30 text-white text-xs sm:text-sm focus:border-[#BB86FF] focus:outline-none"
                    >
                      {EXPERIENCE_OPTIONS.map(opt => (
                        <option key={opt} value={opt} className="bg-[#171025] text-white">
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Field 8: Bio */}
                <div>
                  <label className="block text-xs font-semibold text-white mb-1">
                    Bio & Overview *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Brief summary of creative editing style, storytelling techniques, and workflow speed..."
                    value={addForm.bio}
                    onChange={e =>
                      setAddForm(prev => ({ ...prev, bio: e.target.value }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/30 text-white text-xs sm:text-sm focus:border-[#BB86FF] focus:outline-none"
                  />
                </div>
              </div>

              {/* SECTION 3: SKILLS & CATEGORIES */}
              <div className="space-y-4 pt-2 border-t border-[#251B38]">
                <h4 className="text-xs uppercase tracking-wider font-bold text-[#BB86FF] flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5" />
                  <span>3. Software, Skills & Editing Categories</span>
                </h4>

                {/* Field 10: Skills */}
                <div>
                  <label className="block text-xs font-semibold text-white mb-1">
                    Skills & Software (comma-separated) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Premiere Pro, After Effects, DaVinci Resolve, Sound Design, Color Grading"
                    value={
                      typeof addForm.skills === 'string'
                        ? addForm.skills
                        : (addForm.skills || []).join(', ')
                    }
                    onChange={e =>
                      setAddForm(prev => ({ ...prev, skills: e.target.value }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/30 text-white text-xs sm:text-sm focus:border-[#BB86FF] focus:outline-none"
                  />
                </div>

                {/* Field 11: Editing Categories */}
                <div>
                  <label className="block text-xs font-semibold text-white mb-1.5">
                    Editing Categories * (Select at least one)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORY_OPTIONS.map(cat => {
                      const isSelected = addForm.categories.includes(cat);
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setAddForm(prev => {
                              const exists = prev.categories.includes(cat);
                              const updated = exists
                                ? prev.categories.filter(c => c !== cat)
                                : [...prev.categories, cat];
                              return { ...prev, categories: updated };
                            });
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                            isSelected
                              ? 'bg-[#9B5CFF] text-white shadow-[0_0_12px_rgba(155,92,255,0.4)]'
                              : 'bg-[#100B1C] text-[#A59BB8] hover:text-white border border-[#251B38]'
                          }`}
                        >
                          {cat} {isSelected && '✓'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* SECTION 4: RATES, AVAILABILITY & PORTFOLIO */}
              <div className="space-y-4 pt-2 border-t border-[#251B38]">
                <h4 className="text-xs uppercase tracking-wider font-bold text-[#BB86FF] flex items-center gap-2">
                  <IndianRupee className="w-3.5 h-3.5" />
                  <span>4. Rates, Availability & Social Portfolios</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Field 15: Starting Price */}
                  <div>
                    <label className="block text-xs font-semibold text-white mb-1">
                      Starting Price (INR ₹) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#BB86FF] font-bold">
                        ₹
                      </span>
                      <input
                        type="number"
                        required
                        min={100}
                        max={1000000}
                        step={100}
                        placeholder="5000"
                        value={addForm.startingPrice}
                        onChange={e =>
                          setAddForm(prev => ({
                            ...prev,
                            startingPrice: Number(e.target.value),
                          }))
                        }
                        className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/30 text-white text-xs sm:text-sm focus:border-[#BB86FF] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Field 16: Availability */}
                  <div>
                    <label className="block text-xs font-semibold text-white mb-1">
                      Availability Status *
                    </label>
                    <select
                      value={addForm.availability}
                      onChange={e =>
                        setAddForm(prev => ({
                          ...prev,
                          availability: e.target.value as any,
                        }))
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/30 text-white text-xs sm:text-sm focus:border-[#BB86FF] focus:outline-none"
                    >
                      <option value="Available Now" className="bg-[#171025]">
                        Available Now
                      </option>
                      <option value="Busy" className="bg-[#171025]">
                        Busy
                      </option>
                      <option value="Booked" className="bg-[#171025]">
                        Booked
                      </option>
                    </select>
                  </div>

                  {/* Field 12: Portfolio URL */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-white mb-1">
                      Portfolio / Showreel URL (YouTube, Vimeo, Google Drive) *
                    </label>
                    <input
                      type="url"
                      required
                      placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                      value={addForm.portfolioUrl}
                      onChange={e =>
                        setAddForm(prev => ({ ...prev, portfolioUrl: e.target.value }))
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/30 text-white text-xs sm:text-sm focus:border-[#BB86FF] focus:outline-none"
                    />
                  </div>

                  {/* Field 13: Instagram URL */}
                  <div>
                    <label className="block text-xs font-semibold text-white mb-1 flex items-center gap-1.5">
                      <Instagram className="w-3.5 h-3.5 text-pink-400" />
                      <span>Instagram URL (Optional)</span>
                    </label>
                    <input
                      type="url"
                      placeholder="https://instagram.com/username"
                      value={addForm.instagramUrl}
                      onChange={e =>
                        setAddForm(prev => ({ ...prev, instagramUrl: e.target.value }))
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/30 text-white text-xs sm:text-sm focus:border-[#BB86FF] focus:outline-none"
                    />
                  </div>

                  {/* Field 14: YouTube URL */}
                  <div>
                    <label className="block text-xs font-semibold text-white mb-1 flex items-center gap-1.5">
                      <Youtube className="w-3.5 h-3.5 text-rose-500" />
                      <span>YouTube Channel URL (Optional)</span>
                    </label>
                    <input
                      type="url"
                      placeholder="https://youtube.com/@channel"
                      value={addForm.youtubeUrl}
                      onChange={e =>
                        setAddForm(prev => ({ ...prev, youtubeUrl: e.target.value }))
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/30 text-white text-xs sm:text-sm focus:border-[#BB86FF] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              </div>

              {/* Sticky Modal Actions (Always visible at bottom) */}
              <div className="shrink-0 flex items-center justify-end gap-3 px-6 py-4 sm:px-8 border-t border-[#251B38] bg-[#171025]">
                <button
                  type="button"
                  onClick={() => setShowAddEditorModal(false)}
                  disabled={addEditorLoading}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-[#A59BB8] hover:text-white hover:bg-[#251B38] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addEditorLoading}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#9B5CFF] to-[#7A22FF] shadow-[0_0_20px_rgba(155,92,255,0.4)] hover:shadow-[0_0_25px_rgba(187,134,255,0.6)] flex items-center gap-2 disabled:opacity-50"
                >
                  {addEditorLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>+ Add My Editor</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW EDITOR PROFILE MODAL */}
      {/* ========================================================= */}
      {viewingEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl rounded-3xl bg-[#171025] border border-[#9B5CFF]/40 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setViewingEditor(null)}
              className="absolute right-5 top-5 p-2 rounded-xl text-[#A59BB8] hover:text-white hover:bg-[#251B38]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <img
                src={viewingEditor.photoURL || AVATAR_PRESETS[0]}
                alt={viewingEditor.fullName}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-[#BB86FF]"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-extrabold text-white">
                    {viewingEditor.fullName}
                  </h3>
                  <span className="font-mono text-xs text-[#BB86FF] bg-[#100B1C] px-2 py-0.5 rounded-md border border-[#9B5CFF]/30">
                    @{viewingEditor.username || viewingEditor.fullName.toLowerCase().replace(/\s+/g, '')}
                  </span>
                </div>
                <p className="text-xs text-[#BB86FF] font-semibold">
                  {viewingEditor.title}
                </p>
                <p className="text-xs text-[#A59BB8]">{viewingEditor.email}</p>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-[#100B1C] border border-[#251B38] text-center">
              <div>
                <span className="text-[10px] text-[#A59BB8] block">Starting Rate</span>
                <span className="text-base font-bold text-white">
                  {formatCurrency(viewingEditor.startingPrice)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#A59BB8] block">Experience</span>
                <span className="text-base font-bold text-white">
                  {viewingEditor.experience}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#A59BB8] block">Availability</span>
                <span className="text-base font-bold text-emerald-400">
                  {viewingEditor.availability || 'Available Now'}
                </span>
              </div>
            </div>

            {/* Bio */}
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1.5">
                About & Creative Overview
              </h4>
              <p className="text-xs text-[#A59BB8] leading-relaxed bg-[#100B1C] p-3.5 rounded-2xl border border-[#251B38]">
                {viewingEditor.bio}
              </p>
            </div>

            {/* Categories & Skills */}
            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1.5">
                  Editing Categories
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {(viewingEditor.categories || []).map((cat, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg text-xs bg-[#9B5CFF]/20 text-[#BB86FF] border border-[#9B5CFF]/30 font-semibold"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1.5">
                  Software & Technical Skills
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {(viewingEditor.skills || []).map((sk, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded text-xs bg-[#100B1C] text-white border border-[#251B38]"
                    >
                      {sk}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Links */}
            <div className="space-y-2 pt-2 border-t border-[#251B38]">
              {viewingEditor.portfolioUrl && (
                <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-[#100B1C]">
                  <span className="text-[#A59BB8]">Showreel Portfolio:</span>
                  <a
                    href={viewingEditor.portfolioUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#BB86FF] hover:underline flex items-center gap-1 font-semibold truncate max-w-xs"
                  >
                    <span>{viewingEditor.portfolioUrl}</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                </div>
              )}
              {viewingEditor.instagramUrl && (
                <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-[#100B1C]">
                  <span className="text-[#A59BB8] flex items-center gap-1">
                    <Instagram className="w-3.5 h-3.5 text-pink-400" />
                    <span>Instagram:</span>
                  </span>
                  <a
                    href={viewingEditor.instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#BB86FF] hover:underline truncate max-w-xs"
                  >
                    {viewingEditor.instagramUrl}
                  </a>
                </div>
              )}
              {viewingEditor.youtubeUrl && (
                <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-[#100B1C]">
                  <span className="text-[#A59BB8] flex items-center gap-1">
                    <Youtube className="w-3.5 h-3.5 text-rose-500" />
                    <span>YouTube:</span>
                  </span>
                  <a
                    href={viewingEditor.youtubeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#BB86FF] hover:underline truncate max-w-xs"
                  >
                    {viewingEditor.youtubeUrl}
                  </a>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  const target = viewingEditor;
                  setViewingEditor(null);
                  handleOpenCredModal(target);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#9B5CFF]/20 text-[#BB86FF] hover:bg-[#9B5CFF]/30 border border-[#9B5CFF]/40 flex items-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Credentials</span>
              </button>
              <button
                onClick={() => {
                  setViewingEditor(null);
                  handleOpenEdit(viewingEditor);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#251B38] text-white hover:bg-[#32234B] flex items-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
              <button
                onClick={() => setViewingEditor(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#9B5CFF] text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* EDIT EDITOR DETAILS MODAL */}
      {/* ========================================================= */}
      {editingEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fade-in">
          <div className="relative w-full max-w-2xl my-6 rounded-3xl bg-[#171025] border border-[#9B5CFF]/40 shadow-2xl p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#251B38]">
              <div>
                <h3 className="text-lg font-bold text-white">
                  Edit Editor Details: {editingEditor.fullName}
                </h3>
                <p className="text-xs text-[#A59BB8]">
                  Update professional specialties, portfolio links, and pricing.
                </p>
              </div>
              <button
                onClick={() => setEditingEditor(null)}
                className="p-1.5 rounded-xl text-[#A59BB8] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveEditEditor} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-white mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={editFormData.fullName || ''}
                    onChange={e =>
                      setEditFormData(prev => ({ ...prev, fullName: e.target.value }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/30 text-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white mb-1">
                    Professional Title
                  </label>
                  <input
                    type="text"
                    value={editFormData.title || ''}
                    onChange={e =>
                      setEditFormData(prev => ({ ...prev, title: e.target.value }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/30 text-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white mb-1">
                    Starting Price (INR ₹)
                  </label>
                  <input
                    type="number"
                    value={editFormData.startingPrice || 5000}
                    onChange={e =>
                      setEditFormData(prev => ({
                        ...prev,
                        startingPrice: Number(e.target.value),
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/30 text-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white mb-1">
                    Availability
                  </label>
                  <select
                    value={editFormData.availability || 'Available Now'}
                    onChange={e =>
                      setEditFormData(prev => ({
                        ...prev,
                        availability: e.target.value as any,
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/30 text-white text-xs"
                  >
                    <option value="Available Now">Available Now</option>
                    <option value="Busy">Busy</option>
                    <option value="Booked">Booked</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-1">
                  Bio / Overview
                </label>
                <textarea
                  rows={3}
                  value={editFormData.bio || ''}
                  onChange={e =>
                    setEditFormData(prev => ({ ...prev, bio: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/30 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-1">
                  Skills (comma-separated)
                </label>
                <input
                  type="text"
                  value={
                    Array.isArray(editFormData.skills)
                      ? editFormData.skills.join(', ')
                      : editFormData.skills || ''
                  }
                  onChange={e =>
                    setEditFormData(prev => ({ ...prev, skills: e.target.value as any }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/30 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-1">
                  Showreel Portfolio URL
                </label>
                <input
                  type="url"
                  value={editFormData.portfolioUrl || ''}
                  onChange={e =>
                    setEditFormData(prev => ({ ...prev, portfolioUrl: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/30 text-white text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#251B38]">
                <button
                  type="button"
                  onClick={() => setEditingEditor(null)}
                  className="px-4 py-2 rounded-xl text-xs text-[#A59BB8]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#9B5CFF] to-[#7A22FF] flex items-center gap-1.5"
                >
                  {editLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MANAGE EDITOR CREDENTIALS MODAL */}
      {/* ========================================================= */}
      {credEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-[#171025] border border-[#9B5CFF]/40 shadow-2xl p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#251B38]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Editor Credentials
                  </h3>
                  <p className="text-xs text-[#A59BB8]">
                    {credEditor.fullName} (@{credEditor.username || 'unknown'})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCredEditor(null)}
                className="p-1.5 rounded-xl text-[#A59BB8] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editorCredError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{editorCredError}</span>
              </div>
            )}

            {editorCredSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{editorCredSuccess}</span>
              </div>
            )}

            <form onSubmit={handleUpdateEditorCredentials} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white mb-1">
                  Editor Username
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#BB86FF] font-mono font-bold text-xs">
                    @
                  </span>
                  <input
                    type="text"
                    value={editorNewUsername}
                    onChange={e => setEditorNewUsername(sanitizeUsername(e.target.value))}
                    placeholder="Enter new username handle"
                    className="w-full pl-7 pr-3.5 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/30 text-white text-xs sm:text-sm font-mono focus:border-[#BB86FF] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-1">
                  Reset Password (min 6 chars)
                </label>
                <input
                  type="password"
                  placeholder="Enter new password (leave blank to keep unchanged)"
                  value={editorNewPassword}
                  onChange={e => setEditorNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/30 text-white text-xs sm:text-sm focus:border-[#BB86FF] focus:outline-none"
                />
                <span className="text-[10px] text-[#A59BB8] mt-1 block">
                  Takes effect immediately for all subsequent logins.
                </span>
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-[#251B38]">
                <button
                  type="button"
                  onClick={() => setCredEditor(null)}
                  disabled={editorCredLoading}
                  className="px-4 py-2 rounded-xl text-xs text-[#A59BB8] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editorCredLoading}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#9B5CFF] to-[#7A22FF] shadow-lg flex items-center gap-1.5 disabled:opacity-50"
                >
                  {editorCredLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Save Credentials</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* CONFIRMATION DIALOG MODAL (Suspend, Reactivate, Delete, Approve) */}
      {/* ========================================================= */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#171025] border border-[#9B5CFF]/40 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${
                  confirmModal.type === 'delete'
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                    : confirmModal.type === 'suspend'
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                    : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                }`}
              >
                {confirmModal.type === 'delete' ? (
                  <Trash2 className="w-5 h-5" />
                ) : confirmModal.type === 'suspend' ? (
                  <UserX className="w-5 h-5" />
                ) : (
                  <UserCheck className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-white capitalize">
                  {confirmModal.type === 'delete'
                    ? 'Delete Editor Account?'
                    : confirmModal.type === 'suspend'
                    ? 'Suspend Editor Account?'
                    : confirmModal.type === 'reactivate'
                    ? 'Reactivate Editor Account?'
                    : 'Approve Editor Application?'}
                </h3>
                <p className="text-xs text-[#A59BB8]">
                  Target: {confirmModal.editor.fullName} (@{confirmModal.editor.username || confirmModal.editor.fullName.toLowerCase().replace(/\s+/g, '')})
                </p>
              </div>
            </div>

            <p className="text-xs text-[#A59BB8] leading-relaxed bg-[#100B1C] p-3 rounded-2xl border border-[#251B38]">
              {confirmModal.type === 'delete'
                ? 'WARNING: This will permanently purge this editor account, their login authentication record, and remove them from all public marketplace listings. This action cannot be reversed.'
                : confirmModal.type === 'suspend'
                ? 'This will immediately revoke login access for this editor and hide their card from the public Explore page until reactivated.'
                : confirmModal.type === 'reactivate'
                ? 'This will restore active login privileges and return the editor to the verified marketplace directory.'
                : 'This will officially approve this applicant, granting immediate dashboard access and public profile visibility.'}
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                disabled={confirmActionLoading}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#A59BB8] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteConfirmedAction}
                disabled={confirmActionLoading}
                className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-lg flex items-center gap-2 ${
                  confirmModal.type === 'delete'
                    ? 'bg-rose-600 hover:bg-rose-500'
                    : confirmModal.type === 'suspend'
                    ? 'bg-amber-600 hover:bg-amber-500'
                    : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                {confirmActionLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span className="capitalize">Confirm {confirmModal.type}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-[#171025] border border-[#9B5CFF]/30 p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Create New Category</h3>
            <form onSubmit={handleAddCategory} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-white mb-1">Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Drone & Aerial Editors"
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/20 text-white text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white mb-1">Slug (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. drone-aerial"
                  value={newCatSlug}
                  onChange={e => setNewCatSlug(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/20 text-white text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Category scope and typical camera formats..."
                  value={newCatDesc}
                  onChange={e => setNewCatDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/20 text-white text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCatModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-[#A59BB8]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#9B5CFF] to-[#7A22FF]"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
