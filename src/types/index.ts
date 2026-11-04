export type UserRole = 'client' | 'editor' | 'admin';

export type UserStatus = 'active' | 'pending' | 'suspended' | 'rejected';

export type AvailabilityStatus = 'Available Now' | 'Busy' | 'Booked';

export type HiringRequestStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'in_progress'
  | 'submitted'
  | 'revision_requested'
  | 'completed'
  | 'cancelled';

export interface BaseUser {
  id: string;
  email: string;
  username?: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface EditorProfile {
  id: string;
  userId: string;
  fullName: string;
  username?: string;
  email: string;
  photoURL: string;
  title: string;
  bio: string;
  experience: string; // e.g. "3+ Years", "5+ Years", "1-2 Years"
  skills: string[];
  categories: string[];
  portfolioUrl: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  startingPrice: number;
  availability: AvailabilityStatus;
  status: 'active' | 'approved' | 'suspended' | 'pending' | 'rejected';
  rating: number;
  reviewCount: number;
  completedProjectsCount: number;
  featured?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface ClientProfile {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  photoURL?: string;
  company?: string;
  bio?: string;
  projectsHiredCount?: number;
  status?: 'active' | 'suspended';
  createdAt: string;
  updatedAt?: string;
}

export interface HiringRequest {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  editorId: string;
  editorName: string;
  projectTitle: string;
  projectDescription: string;
  budget: number;
  deadline: string;
  status: HiringRequestStatus;
  submissionNotes?: string;
  submissionUrls?: string[];
  rejectionReason?: string;
  revisionNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  participants: string[];
  clientId: string;
  clientName: string;
  editorId: string;
  editorName: string;
  lastMessage?: string;
  lastMessageTimestamp?: string;
  unreadBy?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  text: string;
  read: boolean;
  createdAt: string;
}

export interface Review {
  id: string;
  requestId: string;
  clientId: string;
  clientName: string;
  editorId: string;
  editorName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'request' | 'project' | 'message' | 'system' | 'review';
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  editorCount: number;
  featured?: boolean;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'unread' | 'read' | 'replied';
  createdAt: string;
}

export interface Report {
  id: string;
  reporterId: string;
  reporterEmail?: string;
  reportedUserId: string;
  reportedUserName?: string;
  targetType?: string;
  targetId?: string;
  reason: string;
  details: string;
  status: 'pending' | 'investigating' | 'resolved';
  createdAt: string;
}

export interface PlatformSettings {
  id: string;
  announcement?: string;
  showAnnouncement?: boolean;
  featuredEditorIds?: string[];
  updatedAt?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  actorId: string;
  actorEmail: string;
  targetId?: string;
  details: string;
  createdAt: string;
}

export interface PlatformStats {
  registeredEditors: number;
  completedProjects: number;
  activeClients: number;
  totalProjects: number;
  pendingApprovals: number;
  averageRating: number;
}
