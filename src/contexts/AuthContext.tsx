import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import {
  ADMIN_EMAIL,
  seedMarketplaceDataIfEmpty,
  getEditorById,
  getClientProfile,
  adminGetMeApi,
  adminLogoutApi,
  editorLoginApi,
} from '../services/db';
import { BaseUser, ClientProfile, EditorProfile, UserRole } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: BaseUser | null;
  clientProfile: ClientProfile | null;
  editorProfile: EditorProfile | null;
  userRole: UserRole | null;
  isAdmin: boolean;
  loading: boolean;
  login: (email: string, pass: string) => Promise<UserRole>;
  loginWithGoogle: () => Promise<UserRole>;
  registerClient: (data: {
    fullName: string;
    email: string;
    password: string;
    photoURL?: string;
    company?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  setAdminSession: (token: string, username: string) => void;
  loginEditorWithCredentials: (identifier: string, pass: string) => Promise<void>;
  adminToken: string | null;
  editorToken: string | null;
  setEditorSession: (token: string, editor: EditorProfile) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<BaseUser | null>(null);
  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(null);
  const [editorProfile, setEditorProfile] = useState<EditorProfile | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [adminToken, setAdminTokenState] = useState<string | null>(() => {
    return sessionStorage.getItem('draftly_admin_token') || localStorage.getItem('draftly_admin_token');
  });
  const [editorToken, setEditorTokenState] = useState<string | null>(() => {
    return sessionStorage.getItem('draftly_editor_token') || localStorage.getItem('draftly_editor_token');
  });
  const [loading, setLoading] = useState(true);

  // Load user data whenever auth state changes
  async function loadUserData(user: FirebaseUser | null) {
    if (!user) {
      // If no Firebase user, but Admin token exists, preserve Admin session
      const savedAdminToken = sessionStorage.getItem('draftly_admin_token') || localStorage.getItem('draftly_admin_token');
      if (savedAdminToken) {
        try {
          const res = await adminGetMeApi(savedAdminToken);
          if (res.success) {
            setUserRole('admin');
            setUserProfile({
              id: 'admin_abhiraj',
              email: 'admin@draftly',
              username: res.username || 'Abhiraj',
              displayName: res.username || 'Abhiraj',
              role: 'admin',
              status: 'active',
              createdAt: new Date().toISOString(),
            });
            setLoading(false);
            return;
          }
        } catch {}
      }

      // Check for saved editor session
      const savedEditorToken = sessionStorage.getItem('draftly_editor_token') || localStorage.getItem('draftly_editor_token');
      const savedEdStr = sessionStorage.getItem('draftly_editor_profile') || localStorage.getItem('draftly_editor_profile');
      if (savedEditorToken && savedEdStr) {
        try {
          const ed = JSON.parse(savedEdStr);
          setUserRole('editor');
          setEditorProfile(ed);
          setUserProfile({
            id: ed.id,
            email: ed.email,
            username: ed.username,
            displayName: ed.fullName,
            photoURL: ed.photoURL,
            role: 'editor',
            status: ed.status,
            createdAt: ed.createdAt,
          });
          setLoading(false);
          return;
        } catch {}
      }

      setCurrentUser(null);
      setUserProfile(null);
      setClientProfile(null);
      setEditorProfile(null);
      setUserRole(null);
      setLoading(false);
      return;
    }

    setCurrentUser(user);

    try {
      const isBootstrappedAdmin = user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      let role: UserRole = 'client';
      let uProfile: BaseUser | null = null;

      if (userDocSnap.exists()) {
        uProfile = userDocSnap.data() as BaseUser;
        role = uProfile.role;
      } else {
        role = isBootstrappedAdmin ? 'admin' : 'client';
        uProfile = {
          id: user.uid,
          email: user.email || '',
          displayName: user.displayName || user.email?.split('@')[0] || 'User',
          photoURL: user.photoURL || '',
          role,
          status: 'active',
          createdAt: new Date().toISOString(),
        };
        await setDoc(userDocRef, uProfile, { merge: true });
      }

      if (isBootstrappedAdmin) {
        role = 'admin';
        await setDoc(doc(db, 'admins', user.uid), {
          id: user.uid,
          email: user.email,
          role: 'admin',
          createdAt: new Date().toISOString(),
        }, { merge: true });
      }

      setUserProfile(uProfile);
      setUserRole(role);

      if (role === 'editor') {
        const ed = await getEditorById(user.uid);
        setEditorProfile(ed);
      } else if (role === 'client') {
        const cl = await getClientProfile(user.uid);
        setClientProfile(cl);
      }
    } catch (err) {
      console.error('Error loading user profile:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Seed initial marketplace categories taxonomy on boot
    seedMarketplaceDataIfEmpty().catch(() => {});

    // Check if an existing admin session is active (persists across page reloads & restarts)
    const savedAdminToken = sessionStorage.getItem('draftly_admin_token') || localStorage.getItem('draftly_admin_token');
    if (savedAdminToken) {
      adminGetMeApi(savedAdminToken).then(res => {
        if (res.success) {
          setUserRole('admin');
          setUserProfile({
            id: 'admin_abhiraj',
            email: 'admin@draftly',
            username: 'Abhiraj',
            displayName: 'Abhiraj',
            role: 'admin',
            status: 'active',
            createdAt: new Date().toISOString(),
          });
          setAdminTokenState(savedAdminToken);
          setLoading(false);
        } else {
          sessionStorage.removeItem('draftly_admin_token');
          localStorage.removeItem('draftly_admin_token');
          setAdminTokenState(null);
        }
      }).catch(() => {
        sessionStorage.removeItem('draftly_admin_token');
        localStorage.removeItem('draftly_admin_token');
      });
    }

    const unsubscribe = onAuthStateChanged(auth, user => {
      loadUserData(user);
    });

    return unsubscribe;
  }, []);

  async function login(email: string, pass: string): Promise<UserRole> {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    await loadUserData(cred.user);
    
    const isBootstrappedAdmin = cred.user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
    if (isBootstrappedAdmin) return 'admin';

    const snap = await getDoc(doc(db, 'users', cred.user.uid));
    if (snap.exists()) {
      return (snap.data() as BaseUser).role;
    }
    return 'client';
  }

  async function loginWithGoogle(): Promise<UserRole> {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    await loadUserData(cred.user);
    
    const isBootstrappedAdmin = cred.user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
    if (isBootstrappedAdmin) return 'admin';

    const snap = await getDoc(doc(db, 'users', cred.user.uid));
    if (snap.exists()) {
      return (snap.data() as BaseUser).role;
    }
    return 'client';
  }

  async function registerClient(data: {
    fullName: string;
    email: string;
    password: string;
    photoURL?: string;
    company?: string;
  }): Promise<void> {
    const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
    const uid = cred.user.uid;
    const now = new Date().toISOString();

    await updateProfile(cred.user, {
      displayName: data.fullName,
      photoURL: data.photoURL || '',
    });

    const userRecord: BaseUser = {
      id: uid,
      email: data.email,
      displayName: data.fullName,
      photoURL: data.photoURL || '',
      role: 'client',
      status: 'active',
      createdAt: now,
    };
    await setDoc(doc(db, 'users', uid), userRecord);

    const clientRecord: ClientProfile = {
      id: uid,
      userId: uid,
      fullName: data.fullName,
      email: data.email,
      photoURL: data.photoURL || '',
      company: data.company || '',
      status: 'active',
      createdAt: now,
    };
    await setDoc(doc(db, 'clientProfiles', uid), clientRecord);

    await loadUserData(cred.user);
  }

  function setAdminSession(token: string, adminUsername: string) {
    sessionStorage.setItem('draftly_admin_token', token);
    localStorage.setItem('draftly_admin_token', token);
    setAdminTokenState(token);
    setUserRole('admin');
    setUserProfile({
      id: 'admin_abhiraj',
      email: 'admin@draftly',
      username: adminUsername || 'Abhiraj',
      displayName: adminUsername || 'Abhiraj',
      role: 'admin',
      status: 'active',
      createdAt: new Date().toISOString(),
    });
    setClientProfile(null);
    setEditorProfile(null);
  }

  async function loginEditorWithCredentials(identifier: string, pass: string): Promise<void> {
    const res = await editorLoginApi(identifier, pass);
    if (!res.success || !res.editor) {
      throw new Error(res.error || 'Invalid editor credentials');
    }

    const ed = res.editor;
    if (res.token) {
      sessionStorage.setItem('draftly_editor_token', res.token);
      localStorage.setItem('draftly_editor_token', res.token);
      setEditorTokenState(res.token);
    }
    sessionStorage.setItem('draftly_editor_profile', JSON.stringify(ed));
    localStorage.setItem('draftly_editor_profile', JSON.stringify(ed));
    setUserRole('editor');
    setEditorProfile(ed);
    setUserProfile({
      id: ed.id,
      email: ed.email,
      username: ed.username,
      displayName: ed.fullName,
      photoURL: ed.photoURL,
      role: 'editor',
      status: ed.status,
      createdAt: ed.createdAt,
    });
    setClientProfile(null);
  }

  function setEditorSession(token: string, ed: EditorProfile) {
    sessionStorage.setItem('draftly_editor_token', token);
    localStorage.setItem('draftly_editor_token', token);
    sessionStorage.setItem('draftly_editor_profile', JSON.stringify(ed));
    localStorage.setItem('draftly_editor_profile', JSON.stringify(ed));
    setEditorTokenState(token);
    setUserRole('editor');
    setEditorProfile(ed);
    setUserProfile({
      id: ed.id,
      email: ed.email,
      username: ed.username,
      displayName: ed.fullName,
      photoURL: ed.photoURL,
      role: 'editor',
      status: ed.status,
      createdAt: ed.createdAt,
    });
    setClientProfile(null);
  }

  async function logout(): Promise<void> {
    if (adminToken) {
      await adminLogoutApi(adminToken).catch(() => {});
    }
    sessionStorage.removeItem('draftly_admin_token');
    localStorage.removeItem('draftly_admin_token');
    sessionStorage.removeItem('draftly_editor_token');
    localStorage.removeItem('draftly_editor_token');
    sessionStorage.removeItem('draftly_editor_profile');
    localStorage.removeItem('draftly_editor_profile');
    setAdminTokenState(null);
    setEditorTokenState(null);

    await signOut(auth).catch(() => {});
    setCurrentUser(null);
    setUserProfile(null);
    setClientProfile(null);
    setEditorProfile(null);
    setUserRole(null);
  }

  async function resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  }

  async function refreshProfile(): Promise<void> {
    if (currentUser) {
      await loadUserData(currentUser);
    }
  }

  const isAdmin = userRole === 'admin' || !!adminToken || currentUser?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        clientProfile,
        editorProfile,
        userRole,
        isAdmin,
        loading,
        login,
        loginWithGoogle,
        registerClient,
        logout,
        resetPassword,
        refreshProfile,
        setAdminSession,
        loginEditorWithCredentials,
        adminToken,
        editorToken,
        setEditorSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
