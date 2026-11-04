import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  increment,
  writeBatch,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase/config';
import {
  Category,
  EditorProfile,
  ClientProfile,
  HiringRequest,
  Conversation,
  Message,
  Review,
  Notification,
  ContactMessage,
  Report,
  PlatformSettings,
  AuditLog,
  PlatformStats,
  HiringRequestStatus,
  UserRole,
} from '../types';
import { formatCurrency } from '../utils/marketplace';

// Admin email configured for this applet
export const ADMIN_EMAIL = 'rewindabhiraj@gmail.com';

// ==========================================
// CATEGORIES TAXONOMY
// ==========================================
const DEFAULT_CATEGORIES: Omit<Category, 'id'>[] = [
  {
    name: 'Gaming Editors',
    slug: 'gaming',
    description: 'High-intensity gameplay montages, Twitch highlights, and esports storytelling.',
    icon: 'Gamepad2',
    editorCount: 0,
    featured: true,
  },
  {
    name: 'Anime Editors',
    slug: 'anime',
    description: 'Stylized AMVs, sync-to-beat pacing, hyper visual effects and audio design.',
    icon: 'Tv',
    editorCount: 0,
    featured: true,
  },
  {
    name: 'Reels Editors',
    slug: 'reels',
    description: 'Hook-driven 9:16 Instagram Reels that maximize retention and virality.',
    icon: 'Smartphone',
    editorCount: 0,
    featured: true,
  },
  {
    name: 'Shorts Editors',
    slug: 'shorts',
    description: 'Fast-paced YouTube Shorts with kinetic captions, sound effects, and zooms.',
    icon: 'PlaySquare',
    editorCount: 0,
    featured: true,
  },
  {
    name: 'Cinematic Editors',
    slug: 'cinematic',
    description: 'Narrative films, documentaries, premium color grading, and filmic pacing.',
    icon: 'Film',
    editorCount: 0,
    featured: true,
  },
  {
    name: 'Motion Graphics',
    slug: 'motion-graphics',
    description: '2D/3D typography, vector animation, 3D product renders, and UI mockups.',
    icon: 'Sparkles',
    editorCount: 0,
    featured: true,
  },
  {
    name: 'Wedding Editors',
    slug: 'wedding',
    description: 'Emotional, documentary, and highlight reels capturing once-in-a-lifetime vows.',
    icon: 'Heart',
    editorCount: 0,
    featured: false,
  },
  {
    name: 'Commercial Editors',
    slug: 'commercial',
    description: 'Brand commercials, SaaS explainers, direct-response ads with high conversion.',
    icon: 'Briefcase',
    editorCount: 0,
    featured: true,
  },
];

/**
 * Initializes database with default category taxonomy and settings if not present
 * (NO fake demo editors, NO fake clients, NO fake reviews)
 */
export async function seedMarketplaceDataIfEmpty(): Promise<void> {
  if (!auth.currentUser) return;
  try {
    const categoriesSnapshot = await getDocs(collection(db, 'categories'));
    if (!categoriesSnapshot.empty) {
      return; // Already initialized
    }

    const batch = writeBatch(db);

    // Seed Categories taxonomy only
    for (const cat of DEFAULT_CATEGORIES) {
      const catRef = doc(collection(db, 'categories'));
      batch.set(catRef, { ...cat, id: catRef.id, createdAt: new Date().toISOString() });
    }

    // Seed Platform Settings
    const settingsRef = doc(db, 'platformSettings', 'global');
    batch.set(settingsRef, {
      id: 'global',
      announcement: 'Welcome to DRAFTLY: Creative Talent. Extraordinary Results.',
      showAnnouncement: false,
      featuredEditorIds: [],
      updatedAt: new Date().toISOString(),
    });

    // Seed Admin bootstrap reference
    const adminRef = doc(db, 'admins', 'admin_bootstrap');
    batch.set(adminRef, {
      id: 'admin_bootstrap',
      email: ADMIN_EMAIL,
      role: 'admin',
      createdAt: new Date().toISOString(),
    });

    await batch.commit();
  } catch (err) {
    // Non-fatal if firestore permissions restrict client write
  }
}

// ==========================================
// CATEGORIES
// ==========================================
export async function getCategories(): Promise<Category[]> {
  try {
    const snap = await getDocs(collection(db, 'categories'));
    if (!snap.empty) {
      return snap.docs.map(d => ({ ...d.data(), id: d.id } as Category));
    }
    return DEFAULT_CATEGORIES.map((c, i) => ({ ...c, id: `cat_${i + 1}` }));
  } catch (error) {
    return DEFAULT_CATEGORIES.map((c, i) => ({ ...c, id: `cat_${i + 1}` }));
  }
}

export function subscribeToCategories(callback: (categories: Category[]) => void): () => void {
  try {
    return onSnapshot(
      collection(db, 'categories'),
      snapshot => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Category));
          callback(list);
        } else {
          callback(DEFAULT_CATEGORIES.map((c, i) => ({ ...c, id: `cat_${i + 1}` })));
        }
      },
      () => {
        callback(DEFAULT_CATEGORIES.map((c, i) => ({ ...c, id: `cat_${i + 1}` })));
      }
    );
  } catch {
    callback(DEFAULT_CATEGORIES.map((c, i) => ({ ...c, id: `cat_${i + 1}` })));
    return () => {};
  }
}

export async function addCategory(category: Omit<Category, 'id'>): Promise<string> {
  try {
    const ref = doc(collection(db, 'categories'));
    await setDoc(ref, { ...category, id: ref.id, createdAt: new Date().toISOString() });
    return ref.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'categories');
  }
}

export async function updateCategory(id: string, data: Partial<Category>): Promise<void> {
  try {
    await updateDoc(doc(db, 'categories', id), data);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `categories/${id}`);
  }
}

export async function deleteCategory(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'categories', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `categories/${id}`);
  }
}

// ==========================================
// EDITORS (REALTIME + SERVER BACKEND SYNC)
// ==========================================

export async function getApprovedEditors(): Promise<EditorProfile[]> {
  try {
    const res = await fetch('/api/public/editors');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.editors) && data.editors.length > 0) {
        return data.editors;
      }
    }
  } catch {}

  try {
    const snap = await getDocs(collection(db, 'editorProfiles'));
    if (!snap.empty) {
      return snap.docs
        .map(d => ({ ...d.data(), id: d.id } as EditorProfile))
        .filter(e => e.status === 'active' || e.status === 'approved');
    }
  } catch {}

  return [];
}

export function subscribeToApprovedEditors(callback: (editors: EditorProfile[]) => void): () => void {
  // Initial fetch from backend API
  fetch('/api/public/editors')
    .then(res => res.json())
    .then(data => {
      if (data.success && Array.isArray(data.editors)) {
        callback(data.editors);
      }
    })
    .catch(() => {});

  try {
    const unsubscribe = onSnapshot(
      collection(db, 'editorProfiles'),
      snapshot => {
        const approved = snapshot.docs
          .map(d => ({ ...d.data(), id: d.id } as EditorProfile))
          .filter(e => e.status === 'active' || e.status === 'approved');
        if (approved.length > 0) {
          callback(approved);
        }
      },
      () => {
        // Fallback polling for backend sync
      }
    );
    return unsubscribe;
  } catch {
    return () => {};
  }
}

export async function getAllEditors(): Promise<EditorProfile[]> {
  const adminToken = sessionStorage.getItem('draftly_admin_token') || localStorage.getItem('draftly_admin_token');
  if (adminToken) {
    try {
      const res = await fetch('/api/admin/editors', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.editors)) {
          return data.editors;
        }
      }
    } catch {}
  }

  try {
    const snap = await getDocs(collection(db, 'editorProfiles'));
    if (!snap.empty) {
      return snap.docs.map(d => ({ ...d.data(), id: d.id } as EditorProfile));
    }
  } catch {}

  return [];
}

export function subscribeToAllEditors(callback: (editors: EditorProfile[]) => void): () => void {
  const adminToken = sessionStorage.getItem('draftly_admin_token') || localStorage.getItem('draftly_admin_token');

  const fetchBackendEditors = () => {
    if (adminToken) {
      fetch('/api/admin/editors', {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && Array.isArray(data.editors)) {
            callback(data.editors);
          }
        })
        .catch(() => {});
    }
  };

  fetchBackendEditors();

  try {
    const unsubscribe = onSnapshot(
      collection(db, 'editorProfiles'),
      snapshot => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as EditorProfile));
          callback(list);
        } else {
          fetchBackendEditors();
        }
      },
      () => {
        fetchBackendEditors();
      }
    );
    return unsubscribe;
  } catch {
    return () => {};
  }
}

export async function getEditorById(id: string): Promise<EditorProfile | null> {
  try {
    const snap = await getDoc(doc(db, 'editorProfiles', id));
    if (snap.exists()) {
      return { ...snap.data(), id: snap.id } as EditorProfile;
    }
  } catch {}

  // Check backend editors
  try {
    const res = await fetch('/api/public/editors');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.editors)) {
        const found = data.editors.find((e: any) => e.id === id || e.userId === id);
        if (found) return found;
      }
    }
  } catch {}

  return null;
}

export async function updateEditorProfile(id: string, data: Partial<EditorProfile>): Promise<void> {
  const adminToken = sessionStorage.getItem('draftly_admin_token') || localStorage.getItem('draftly_admin_token');
  if (adminToken) {
    await adminUpdateEditorApi(id, data, adminToken);
  }

  try {
    await updateDoc(doc(db, 'editorProfiles', id), {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  } catch {}
}

export async function updateEditorStatus(
  id: string,
  status: 'active' | 'approved' | 'rejected' | 'suspended'
): Promise<void> {
  const adminToken = sessionStorage.getItem('draftly_admin_token') || localStorage.getItem('draftly_admin_token');
  if (adminToken) {
    await adminUpdateEditorStatusApi(id, status, adminToken);
  }

  try {
    await updateDoc(doc(db, 'editorProfiles', id), {
      status,
      updatedAt: new Date().toISOString(),
    });
  } catch {}
}

// ==========================================
// CLIENTS
// ==========================================
export async function getClientProfile(id: string): Promise<ClientProfile | null> {
  try {
    const snap = await getDoc(doc(db, 'clientProfiles', id));
    if (snap.exists()) {
      return { ...snap.data(), id: snap.id } as ClientProfile;
    }
    return null;
  } catch (error) {
    return null;
  }
}

export async function getAllClients(): Promise<ClientProfile[]> {
  try {
    const snap = await getDocs(collection(db, 'clientProfiles'));
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as ClientProfile));
  } catch (error) {
    return [];
  }
}

export function subscribeToAllClients(callback: (clients: ClientProfile[]) => void): () => void {
  try {
    return onSnapshot(
      collection(db, 'clientProfiles'),
      snapshot => {
        const list = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as ClientProfile));
        callback(list);
      },
      () => {
        callback([]);
      }
    );
  } catch {
    callback([]);
    return () => {};
  }
}

export async function updateClientProfile(id: string, data: Partial<ClientProfile>): Promise<void> {
  try {
    await updateDoc(doc(db, 'clientProfiles', id), {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `clientProfiles/${id}`);
  }
}

// ==========================================
// HIRING REQUESTS & WORKFLOW (REALTIME)
// ==========================================
export async function createHiringRequest(
  request: Omit<HiringRequest, 'id' | 'createdAt' | 'updatedAt' | 'status'>
): Promise<string> {
  try {
    const ref = doc(collection(db, 'hiringRequests'));
    const now = new Date().toISOString();
    const newRequest: HiringRequest = {
      ...request,
      id: ref.id,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(ref, newRequest);

    // Notify editor in realtime
    await createNotification({
      userId: request.editorId,
      title: 'New Hiring Request Received!',
      message: `${request.clientName} proposed "${request.projectTitle}" (Budget: ${formatCurrency(request.budget)}).`,
      type: 'request',
      link: '/editor/dashboard?tab=requests',
      read: false,
      createdAt: now,
    });

    return ref.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'hiringRequests');
  }
}

export async function getClientHiringRequests(clientId: string): Promise<HiringRequest[]> {
  try {
    const q = query(
      collection(db, 'hiringRequests'),
      where('clientId', '==', clientId)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as HiringRequest))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    return [];
  }
}

export function subscribeToClientHiringRequests(
  clientId: string,
  callback: (requests: HiringRequest[]) => void
): () => void {
  try {
    const q = query(
      collection(db, 'hiringRequests'),
      where('clientId', '==', clientId)
    );
    return onSnapshot(
      q,
      snapshot => {
        const list = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as HiringRequest))
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        callback(list);
      },
      () => {
        callback([]);
      }
    );
  } catch {
    callback([]);
    return () => {};
  }
}

export async function getEditorHiringRequests(editorId: string): Promise<HiringRequest[]> {
  try {
    const q = query(
      collection(db, 'hiringRequests'),
      where('editorId', '==', editorId)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as HiringRequest))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    return [];
  }
}

export function subscribeToEditorHiringRequests(
  editorId: string,
  callback: (requests: HiringRequest[]) => void
): () => void {
  try {
    const q = query(
      collection(db, 'hiringRequests'),
      where('editorId', '==', editorId)
    );
    return onSnapshot(
      q,
      snapshot => {
        const list = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as HiringRequest))
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        callback(list);
      },
      () => {
        callback([]);
      }
    );
  } catch {
    callback([]);
    return () => {};
  }
}

export async function getAllHiringRequests(): Promise<HiringRequest[]> {
  try {
    const snap = await getDocs(collection(db, 'hiringRequests'));
    if (!snap.empty) {
      return snap.docs.map(d => ({ ...d.data(), id: d.id } as HiringRequest))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  } catch (error) {}
  return [];
}

export function subscribeToAllHiringRequests(
  callback: (requests: HiringRequest[]) => void
): () => void {
  try {
    return onSnapshot(
      collection(db, 'hiringRequests'),
      snapshot => {
        const list = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as HiringRequest))
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        callback(list);
      },
      () => {
        callback([]);
      }
    );
  } catch {
    callback([]);
    return () => {};
  }
}

export async function updateHiringRequestStatus(
  requestId: string,
  status: HiringRequestStatus,
  extraData: {
    rejectionReason?: string;
    submissionNotes?: string;
    submissionUrls?: string[];
    revisionNotes?: string;
  } = {}
): Promise<void> {
  try {
    const reqRef = doc(db, 'hiringRequests', requestId);
    const currentSnap = await getDoc(reqRef);
    if (!currentSnap.exists()) return;
    const reqData = currentSnap.data() as HiringRequest;

    const now = new Date().toISOString();
    await updateDoc(reqRef, {
      ...extraData,
      status,
      updatedAt: now,
    });

    // Notify appropriate user
    if (status === 'accepted') {
      await createNotification({
        userId: reqData.clientId,
        title: 'Hiring Request Accepted!',
        message: `${reqData.editorName} accepted your project "${reqData.projectTitle}". Work is commencing!`,
        type: 'project',
        link: '/dashboard?tab=projects',
        read: false,
        createdAt: now,
      });
    } else if (status === 'rejected') {
      await createNotification({
        userId: reqData.clientId,
        title: 'Hiring Request Declined',
        message: `${reqData.editorName} was unable to take on "${reqData.projectTitle}". Reason: ${extraData.rejectionReason || 'Unavailable'}`,
        type: 'request',
        link: '/dashboard?tab=requests',
        read: false,
        createdAt: now,
      });
    } else if (status === 'submitted') {
      await createNotification({
        userId: reqData.clientId,
        title: 'Project Delivered for Review!',
        message: `${reqData.editorName} submitted the completed video for "${reqData.projectTitle}". Review and approve or request revision.`,
        type: 'project',
        link: '/dashboard?tab=projects',
        read: false,
        createdAt: now,
      });
    } else if (status === 'revision_requested') {
      await createNotification({
        userId: reqData.editorId,
        title: 'Revision Requested',
        message: `${reqData.clientName} requested adjustments on "${reqData.projectTitle}". Notes: ${extraData.revisionNotes || ''}`,
        type: 'project',
        link: '/editor/dashboard?tab=projects',
        read: false,
        createdAt: now,
      });
    } else if (status === 'completed') {
      await updateDoc(doc(db, 'editorProfiles', reqData.editorId), {
        completedProjectsCount: increment(1),
      }).catch(() => {});

      await createNotification({
        userId: reqData.editorId,
        title: 'Project Approved & Completed! 🏆',
        message: `${reqData.clientName} has approved and completed "${reqData.projectTitle}". Great job!`,
        type: 'project',
        link: '/editor/dashboard?tab=completed',
        read: false,
        createdAt: now,
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `hiringRequests/${requestId}`);
  }
}

// ==========================================
// REVIEWS (REALTIME)
// ==========================================
export async function getReviewsForEditor(editorId: string): Promise<Review[]> {
  try {
    const q = query(collection(db, 'reviews'), where('editorId', '==', editorId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map(d => ({ ...d.data(), id: d.id } as Review))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  } catch (error) {}
  return [];
}

export async function getAllReviews(): Promise<Review[]> {
  try {
    const snap = await getDocs(collection(db, 'reviews'));
    if (!snap.empty) {
      return snap.docs.map(d => ({ ...d.data(), id: d.id } as Review))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  } catch (error) {}
  return [];
}

export function subscribeToReviews(callback: (reviews: Review[]) => void): () => void {
  try {
    return onSnapshot(
      collection(db, 'reviews'),
      snapshot => {
        const list = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Review))
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        callback(list);
      },
      () => {
        callback([]);
      }
    );
  } catch {
    callback([]);
    return () => {};
  }
}

export async function createReview(review: Omit<Review, 'id' | 'createdAt'>): Promise<string> {
  try {
    const ref = doc(collection(db, 'reviews'));
    const now = new Date().toISOString();
    const newReview: Review = { ...review, id: ref.id, createdAt: now };
    await setDoc(ref, newReview);

    // Recalculate editor rating
    const allEditorReviews = await getReviewsForEditor(review.editorId);
    const totalRating = allEditorReviews.reduce((sum, r) => sum + r.rating, 0) + review.rating;
    const newCount = allEditorReviews.length + 1;
    const newAvg = Number((totalRating / newCount).toFixed(1));

    await updateDoc(doc(db, 'editorProfiles', review.editorId), {
      rating: newAvg,
      reviewCount: newCount,
    }).catch(() => {});

    await createNotification({
      userId: review.editorId,
      title: 'New Client Review Received ⭐',
      message: `${review.clientName} gave you a ${review.rating}-star review: "${review.comment.slice(0, 50)}..."`,
      type: 'review',
      link: '/editor/dashboard?tab=reviews',
      read: false,
      createdAt: now,
    });

    return ref.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'reviews');
  }
}

export async function deleteReview(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'reviews', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `reviews/${id}`);
  }
}

// ==========================================
// CHAT & REAL-TIME MESSAGING
// ==========================================
export async function getOrCreateConversation(
  clientId: string,
  clientName: string,
  editorId: string,
  editorName: string
): Promise<string> {
  try {
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', clientId)
    );
    const snap = await getDocs(q);
    const existing = snap.docs.find(d => {
      const data = d.data() as Conversation;
      return data.participants.includes(editorId);
    });

    if (existing) {
      return existing.id;
    }

    const convRef = doc(collection(db, 'conversations'));
    const now = new Date().toISOString();
    const newConv: Conversation = {
      id: convRef.id,
      participants: [clientId, editorId],
      clientId,
      clientName,
      editorId,
      editorName,
      lastMessage: 'Conversation opened',
      lastMessageTimestamp: now,
      unreadBy: [],
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(convRef, newConv);
    return convRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'conversations');
  }
}

export async function getUserConversations(userId: string): Promise<Conversation[]> {
  try {
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', userId)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as Conversation))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } catch (error) {
    return [];
  }
}

export function subscribeToConversations(
  userId: string,
  callback: (conversations: Conversation[]) => void
): () => void {
  try {
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', userId)
    );
    return onSnapshot(
      q,
      snapshot => {
        const list = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Conversation))
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        callback(list);
      },
      () => {
        callback([]);
      }
    );
  } catch {
    callback([]);
    return () => {};
  }
}

export function subscribeToMessages(
  conversationId: string,
  callback: (messages: Message[]) => void
): () => void {
  const q = query(
    collection(db, 'messages'),
    where('conversationId', '==', conversationId)
  );

  return onSnapshot(
    q,
    snapshot => {
      const msgs = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Message))
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      callback(msgs);
    },
    error => {
      handleFirestoreError(error, OperationType.GET, `messages?conversationId=${conversationId}`);
    }
  );
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  senderName: string,
  text: string,
  recipientId: string
): Promise<void> {
  try {
    const msgRef = doc(collection(db, 'messages'));
    const now = new Date().toISOString();
    const newMsg: Message = {
      id: msgRef.id,
      conversationId,
      senderId,
      senderName,
      text,
      read: false,
      createdAt: now,
    };

    await setDoc(msgRef, newMsg);

    // Update conversation metadata
    await updateDoc(doc(db, 'conversations', conversationId), {
      lastMessage: text,
      lastMessageTimestamp: now,
      unreadBy: [recipientId],
      updatedAt: now,
    });

    // Notify recipient
    await createNotification({
      userId: recipientId,
      title: `New message from ${senderName}`,
      message: text.length > 60 ? text.slice(0, 60) + '...' : text,
      type: 'message',
      link: `/dashboard?tab=messages&conv=${conversationId}`,
      read: false,
      createdAt: now,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'messages');
  }
}

// ==========================================
// SAVED / BOOKMARKED EDITORS
// ==========================================
export async function getSavedEditorIds(clientId: string): Promise<string[]> {
  try {
    const q = query(collection(db, 'savedEditors'), where('clientId', '==', clientId));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data().editorId);
  } catch (error) {
    return [];
  }
}

export async function toggleSaveEditor(clientId: string, editorId: string): Promise<boolean> {
  try {
    const q = query(
      collection(db, 'savedEditors'),
      where('clientId', '==', clientId),
      where('editorId', '==', editorId)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      await deleteDoc(snap.docs[0].ref);
      return false; // Removed
    } else {
      const ref = doc(collection(db, 'savedEditors'));
      await setDoc(ref, {
        id: ref.id,
        clientId,
        editorId,
        createdAt: new Date().toISOString(),
      });
      return true; // Added
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'savedEditors');
  }
}

// ==========================================
// NOTIFICATIONS (REALTIME)
// ==========================================
export async function getUserNotifications(userId: string): Promise<Notification[]> {
  try {
    const q = query(collection(db, 'notifications'), where('userId', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as Notification))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    return [];
  }
}

export function subscribeToUserNotifications(
  userId: string,
  callback: (notifications: Notification[]) => void
): () => void {
  try {
    const q = query(collection(db, 'notifications'), where('userId', '==', userId));
    return onSnapshot(
      q,
      snapshot => {
        const list = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Notification))
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        callback(list);
      },
      () => {
        callback([]);
      }
    );
  } catch {
    callback([]);
    return () => {};
  }
}

export async function createNotification(notif: Omit<Notification, 'id'>): Promise<void> {
  try {
    const ref = doc(collection(db, 'notifications'));
    await setDoc(ref, { ...notif, id: ref.id });
  } catch (err) {
    console.warn('Notification create warning:', err);
  }
}

export async function markNotificationAsRead(id: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'notifications', id), { read: true });
  } catch (error) {
    // Ignore non-fatal
  }
}

// ==========================================
// CONTACT US MESSAGES
// ==========================================
export async function submitContactMessage(msg: Omit<ContactMessage, 'id' | 'createdAt' | 'status'>): Promise<string> {
  try {
    const ref = doc(collection(db, 'contactMessages'));
    const newMsg: ContactMessage = {
      ...msg,
      id: ref.id,
      status: 'unread',
      createdAt: new Date().toISOString(),
    };
    await setDoc(ref, newMsg);
    return ref.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'contactMessages');
  }
}

export async function getContactMessages(): Promise<ContactMessage[]> {
  try {
    const snap = await getDocs(collection(db, 'contactMessages'));
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as ContactMessage))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    return [];
  }
}

export function subscribeToContactMessages(callback: (messages: ContactMessage[]) => void): () => void {
  try {
    return onSnapshot(
      collection(db, 'contactMessages'),
      snapshot => {
        const list = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as ContactMessage))
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        callback(list);
      },
      () => {
        callback([]);
      }
    );
  } catch {
    callback([]);
    return () => {};
  }
}

export async function updateContactStatus(id: string, status: 'unread' | 'read' | 'replied'): Promise<void> {
  try {
    await updateDoc(doc(db, 'contactMessages', id), { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `contactMessages/${id}`);
  }
}

// ==========================================
// REPORTS & MODERATION
// ==========================================
export async function submitReport(report: Omit<Report, 'id' | 'createdAt' | 'status'>): Promise<string> {
  try {
    const ref = doc(collection(db, 'reports'));
    const newReport: Report = {
      ...report,
      id: ref.id,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    await setDoc(ref, newReport);
    return ref.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'reports');
  }
}

export async function getReports(): Promise<Report[]> {
  try {
    const snap = await getDocs(collection(db, 'reports'));
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as Report))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    return [];
  }
}

export function subscribeToReports(callback: (reports: Report[]) => void): () => void {
  try {
    return onSnapshot(
      collection(db, 'reports'),
      snapshot => {
        const list = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Report))
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        callback(list);
      },
      () => {
        callback([]);
      }
    );
  } catch {
    callback([]);
    return () => {};
  }
}

export async function updateReportStatus(id: string, status: 'pending' | 'investigating' | 'resolved'): Promise<void> {
  try {
    await updateDoc(doc(db, 'reports', id), { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `reports/${id}`);
  }
}

// ==========================================
// PLATFORM SETTINGS & AUDIT LOGS
// ==========================================
export async function getPlatformSettings(): Promise<PlatformSettings | null> {
  try {
    const snap = await getDoc(doc(db, 'platformSettings', 'global'));
    if (!snap.exists()) return null;
    return snap.data() as PlatformSettings;
  } catch (error) {
    return null;
  }
}

export async function updatePlatformSettings(data: Partial<PlatformSettings>): Promise<void> {
  try {
    await setDoc(doc(db, 'platformSettings', 'global'), {
      ...data,
      id: 'global',
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'platformSettings/global');
  }
}

export async function logAuditAction(action: string, actorId: string, actorEmail: string, details: string, targetId?: string): Promise<void> {
  try {
    const ref = doc(collection(db, 'auditLogs'));
    const log: AuditLog = {
      id: ref.id,
      action,
      actorId,
      actorEmail,
      targetId,
      details,
      createdAt: new Date().toISOString(),
    };
    await setDoc(ref, log);
  } catch (err) {
    console.warn('Audit log write error:', err);
  }
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  try {
    const snap = await getDocs(collection(db, 'auditLogs'));
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as AuditLog))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    return [];
  }
}

// ==========================================
// PLATFORM STATISTICS (CALCULATED IN REALTIME)
// ==========================================
export async function getPlatformStats(): Promise<PlatformStats> {
  try {
    const [editorsSnap, requestsSnap, clientsSnap, reviewsSnap] = await Promise.all([
      getDocs(collection(db, 'editorProfiles')),
      getDocs(collection(db, 'hiringRequests')),
      getDocs(collection(db, 'clientProfiles')),
      getDocs(collection(db, 'reviews')),
    ]);

    const editors = editorsSnap.docs.map(d => d.data() as EditorProfile);
    const requests = requestsSnap.docs.map(d => d.data() as HiringRequest);
    const reviews = reviewsSnap.docs.map(d => d.data() as Review);

    // Count editors from firestore or fallback to backend API if firestore was offline
    let registeredEditors = editors.length;
    if (registeredEditors === 0) {
      try {
        const res = await fetch('/api/public/editors');
        if (res.ok) {
          const d = await res.json();
          if (Array.isArray(d.editors)) registeredEditors = d.editors.length;
        }
      } catch {}
    }

    const completedProjects = requests.filter(r => r.status === 'completed').length;
    const activeClients = clientsSnap.size;
    const totalProjects = requests.length;
    const pendingApprovals = editors.filter(e => e.status === 'pending').length;

    let averageRating = 5.0;
    if (reviews.length > 0) {
      const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
      averageRating = Number((sum / reviews.length).toFixed(1));
    }

    return {
      registeredEditors,
      completedProjects,
      activeClients,
      totalProjects,
      pendingApprovals,
      averageRating,
    };
  } catch (error) {
    return {
      registeredEditors: 0,
      completedProjects: 0,
      activeClients: 0,
      totalProjects: 0,
      pendingApprovals: 0,
      averageRating: 5.0,
    };
  }
}

// ==========================================
// TRUSTED SERVER-SIDE ADMIN & EDITOR MANAGEMENT
// ==========================================

export async function adminLoginApi(username: string, password: string): Promise<{
  success: boolean;
  token?: string;
  username?: string;
  role?: string;
  mustChangePassword?: boolean;
  error?: string;
}> {
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Admin authentication failed' };
    }
    return data;
  } catch (err: any) {
    return { success: false, error: err.message || 'Connection error to Admin API' };
  }
}

export async function adminChangePasswordApi(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
  token: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch('/api/admin/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Failed to update admin password' };
    }
    return data;
  } catch (err: any) {
    return { success: false, error: err.message || 'Connection error to Admin API' };
  }
}

export async function adminGetMeApi(token: string): Promise<{
  success: boolean;
  username?: string;
  role?: string;
  mustChangePassword?: boolean;
  error?: string;
}> {
  try {
    const res = await fetch('/api/admin/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function adminLogoutApi(token?: string): Promise<{ success: boolean }> {
  try {
    if (token) {
      await fetch('/api/admin/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    }
    return { success: true };
  } catch {
    return { success: true };
  }
}

export async function adminCreateEditorApi(
  data: any,
  token?: string
): Promise<{ success: boolean; editor?: EditorProfile; error?: string; message?: string }> {
  try {
    const res = await fetch('/api/admin/editors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) {
      return { success: false, error: result.error || 'Failed to create editor', message: result.error };
    }

    // Sync to Firestore in realtime
    if (result.editor?.id) {
      try {
        await setDoc(doc(db, 'editorProfiles', result.editor.id), result.editor, { merge: true });
      } catch (e) {
        console.warn('Could not mirror editor to firestore:', e);
      }
    }

    return { ...result, message: result.message || 'Editor created successfully' };
  } catch (err: any) {
    return { success: false, error: err.message, message: err.message };
  }
}

export async function adminGetEditorsApi(token?: string): Promise<{
  success: boolean;
  editors?: EditorProfile[];
  error?: string;
  message?: string;
}> {
  try {
    const res = await fetch('/api/admin/editors', {
      headers: { Authorization: token ? `Bearer ${token}` : '' },
    });
    const result = await res.json();
    return result;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function adminUpdateEditorApi(
  id: string,
  updates: any,
  token?: string
): Promise<{ success: boolean; editor?: EditorProfile; error?: string; message?: string }> {
  try {
    const res = await fetch(`/api/admin/editors/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify(updates),
    });
    const result = await res.json();

    // Sync to Firestore
    if (result.editor) {
      try {
        await setDoc(doc(db, 'editorProfiles', id), result.editor, { merge: true });
      } catch {}
    }

    return { ...result, message: result.error || result.message };
  } catch (err: any) {
    return { success: false, error: err.message, message: err.message };
  }
}

export async function adminUpdateEditorStatusApi(
  id: string,
  status: 'active' | 'approved' | 'suspended' | 'rejected',
  token?: string
): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const res = await fetch(`/api/admin/editors/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify({ status }),
    });
    const result = await res.json();

    // Sync to Firestore
    try {
      await updateDoc(doc(db, 'editorProfiles', id), {
        status,
        updatedAt: new Date().toISOString(),
      });
    } catch {}

    return { ...result, message: result.error || result.message };
  } catch (err: any) {
    return { success: false, error: err.message, message: err.message };
  }
}

export async function adminDeleteEditorApi(
  id: string,
  token?: string
): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const res = await fetch(`/api/admin/editors/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { Authorization: token ? `Bearer ${token}` : '' },
    });
    const result = await res.json();

    // Delete from Firestore
    try {
      await deleteDoc(doc(db, 'editorProfiles', id));
    } catch {}

    return { ...result, message: result.error || result.message };
  } catch (err: any) {
    return { success: false, error: err.message, message: err.message };
  }
}

export async function editorLoginApi(
  identifier: string,
  password: string
): Promise<{ success: boolean; editor?: any; token?: string; error?: string }> {
  try {
    const res = await fetch('/api/editor/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Editor login failed' };
    }
    return data;
  } catch (err: any) {
    return { success: false, error: err.message || 'Connection error to Editor API' };
  }
}

// ==========================================
// CREDENTIAL & NOTIFICATION SERVICES
// ==========================================

export async function adminChangeCredentialsApi(
  data: {
    currentPassword: string;
    newUsername?: string;
    newPassword?: string;
    confirmPassword?: string;
  },
  token: string
): Promise<{ success: boolean; message?: string; username?: string; token?: string; error?: string }> {
  try {
    const res = await fetch('/api/admin/change-credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Connection error to Admin API' };
  }
}

export async function adminUpdateEditorCredentialsApi(
  editorId: string,
  data: { newUsername?: string; newPassword?: string },
  token: string
): Promise<{ success: boolean; message?: string; editor?: any; error?: string }> {
  try {
    const res = await fetch(`/api/admin/editors/${encodeURIComponent(editorId)}/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Connection error to Editor Management API' };
  }
}

export async function editorChangeCredentialsApi(
  data: {
    currentPassword: string;
    newUsername?: string;
    newPassword?: string;
    confirmPassword?: string;
  },
  token: string
): Promise<{ success: boolean; message?: string; token?: string; editor?: any; error?: string }> {
  try {
    const res = await fetch('/api/editor/change-credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Connection error to Editor API' };
  }
}

export interface AdminSentNotification {
  id: string;
  title: string;
  message: string;
  targetAudience: 'all_clients' | 'all_editors' | 'specific_client' | 'specific_editor';
  targetUserId?: string | null;
  targetUserName?: string | null;
  recipientCount: number;
  createdAt: string;
  sentBy: string;
}

export async function adminGetNotificationsApi(
  token: string
): Promise<{ success: boolean; notifications?: AdminSentNotification[]; error?: string }> {
  try {
    const res = await fetch('/api/admin/notifications', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function adminSendNotificationApi(
  payload: {
    title: string;
    message: string;
    targetAudience: 'all_clients' | 'all_editors' | 'specific_client' | 'specific_editor';
    targetUserId?: string;
    targetUserName?: string;
  },
  token: string
): Promise<{ success: boolean; notification?: AdminSentNotification; error?: string }> {
  try {
    // 1. Record on server
    const res = await fetch('/api/admin/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    if (!result.success) return result;

    // 2. Broadcast in real time to Firestore so clients & editors receive it instantly!
    const now = new Date().toISOString();
    const notifTitle = payload.title.trim();
    const notifMessage = payload.message.trim();

    try {
      if (payload.targetAudience === 'all_clients') {
        const clientsSnap = await getDocs(collection(db, 'clientProfiles'));
        if (!clientsSnap.empty) {
          const batch = writeBatch(db);
          clientsSnap.docs.forEach(docSnap => {
            const notifRef = doc(collection(db, 'notifications'));
            batch.set(notifRef, {
              id: notifRef.id,
              userId: docSnap.id,
              title: notifTitle,
              message: notifMessage,
              type: 'system',
              read: false,
              createdAt: now,
              broadcastId: result.notification?.id,
            });
          });
          await batch.commit();
        }
      } else if (payload.targetAudience === 'all_editors') {
        const editorsSnap = await getDocs(collection(db, 'editorProfiles'));
        if (!editorsSnap.empty) {
          const batch = writeBatch(db);
          editorsSnap.docs.forEach(docSnap => {
            const notifRef = doc(collection(db, 'notifications'));
            batch.set(notifRef, {
              id: notifRef.id,
              userId: docSnap.id,
              title: notifTitle,
              message: notifMessage,
              type: 'system',
              read: false,
              createdAt: now,
              broadcastId: result.notification?.id,
            });
          });
          await batch.commit();
        }
      } else if (payload.targetUserId) {
        const notifRef = doc(collection(db, 'notifications'));
        await setDoc(notifRef, {
          id: notifRef.id,
          userId: payload.targetUserId,
          title: notifTitle,
          message: notifMessage,
          type: 'system',
          read: false,
          createdAt: now,
          broadcastId: result.notification?.id,
        });
      }
    } catch (fsErr) {
      console.warn('Real-time Firestore notification sync note:', fsErr);
    }

    return result;
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to dispatch notification' };
  }
}

export async function adminDeleteNotificationApi(
  id: string,
  token: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch(`/api/admin/notifications/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const result = await res.json();

    // Clean up corresponding Firestore notifications matching broadcastId
    try {
      const q = query(collection(db, 'notifications'), where('broadcastId', '==', id));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const batch = writeBatch(db);
        snap.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
      }
    } catch {}

    return result;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function adminGetRecipientsApi(
  token: string
): Promise<{ success: boolean; editors?: any[]; clients?: any[]; error?: string }> {
  try {
    const res = await fetch('/api/admin/recipients', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const result = await res.json();

    // Also fetch clients from Firestore
    try {
      const clientsSnap = await getDocs(collection(db, 'clientProfiles'));
      result.clients = clientsSnap.docs.map(d => ({
        id: d.id,
        name: d.data().fullName || d.data().displayName || d.data().email || 'Client',
        email: d.data().email,
      }));
    } catch {
      result.clients = [];
    }

    return result;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
