import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

// Persistent storage directory setup
const DATA_DIR = path.join(__dirname, '.data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const ADMIN_AUTH_FILE = path.join(DATA_DIR, 'admin_auth.json');
const EDITORS_STORE_FILE = path.join(DATA_DIR, 'editors_store.json');
const EDITORS_AUTH_FILE = path.join(DATA_DIR, 'editors_auth.json');
const ADMIN_NOTIFICATIONS_FILE = path.join(DATA_DIR, 'admin_notifications.json');
const SESSION_SECRET_FILE = path.join(DATA_DIR, 'session_secret.txt');

// Load or generate persistent session secret
let SESSION_SECRET = '';
if (fs.existsSync(SESSION_SECRET_FILE)) {
  try {
    SESSION_SECRET = fs.readFileSync(SESSION_SECRET_FILE, 'utf-8').trim();
  } catch {}
}
if (!SESSION_SECRET) {
  SESSION_SECRET = crypto.randomBytes(32).toString('hex');
  fs.writeFileSync(SESSION_SECRET_FILE, SESSION_SECRET, 'utf-8');
}

// Helper functions for secure password hashing (scrypt)
function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function verifyPassword(password: string, salt: string, storedHash: string): boolean {
  try {
    const computed = crypto.scryptSync(password, salt, 64).toString('hex');
    const a = Buffer.from(computed, 'hex');
    const b = Buffer.from(storedHash, 'hex');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

// Cryptographically signed session tokens (survive server restarts & page refreshes)
function generateSessionToken(role: 'admin' | 'editor', idOrUsername: string): string {
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  const payload = `${role}:${idOrUsername}:${expiresAt}`;
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
  return Buffer.from(`${payload}:${signature}`).toString('base64url');
}

function verifySessionToken(token: string): { valid: boolean; role?: 'admin' | 'editor'; idOrUsername?: string } {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf-8');
    const parts = decoded.split(':');
    if (parts.length !== 4) return { valid: false };

    const [role, idOrUsername, expiresAtStr, signature] = parts;
    const expiresAt = parseInt(expiresAtStr, 10);

    if (isNaN(expiresAt) || Date.now() > expiresAt) {
      return { valid: false };
    }

    const payload = `${role}:${idOrUsername}:${expiresAtStr}`;
    const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');

    const sigA = Buffer.from(signature, 'hex');
    const sigB = Buffer.from(expectedSig, 'hex');

    if (sigA.length !== sigB.length || !crypto.timingSafeEqual(sigA, sigB)) {
      return { valid: false };
    }

    return { valid: true, role: role as 'admin' | 'editor', idOrUsername };
  } catch {
    return { valid: false };
  }
}

// Initial Admin Credential Bootstrap (Username: Abhiraj, Initial Password: Abhiraj)
export function getOrInitAdminAuth(): {
  username: string;
  salt: string;
  passwordHash: string;
  mustChangePassword: boolean;
  updatedAt: string;
} {
  if (fs.existsSync(ADMIN_AUTH_FILE)) {
    try {
      const content = fs.readFileSync(ADMIN_AUTH_FILE, 'utf-8');
      const data = JSON.parse(content);
      if (data && data.salt && data.passwordHash) {
        data.username = data.username || 'Abhiraj';
        return data;
      }
    } catch (err) {
      console.error('Error reading admin_auth.json, resetting to default:', err);
    }
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword('Abhiraj', salt);
  const initialAdmin = {
    username: 'Abhiraj',
    salt,
    passwordHash,
    mustChangePassword: true,
    updatedAt: new Date().toISOString(),
  };

  fs.writeFileSync(ADMIN_AUTH_FILE, JSON.stringify(initialAdmin, null, 2), 'utf-8');
  return initialAdmin;
}

// Real Editors Store (No fake seed data - all editors created by Admin)
function getStoredEditors(): any[] {
  if (fs.existsSync(EDITORS_STORE_FILE)) {
    try {
      const content = fs.readFileSync(EDITORS_STORE_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }
  // Initialize with empty array
  fs.writeFileSync(EDITORS_STORE_FILE, JSON.stringify([], null, 2), 'utf-8');
  return [];
}

function saveStoredEditors(editors: any[]): void {
  fs.writeFileSync(EDITORS_STORE_FILE, JSON.stringify(editors, null, 2), 'utf-8');
}

function getStoredEditorAuth(): any[] {
  if (fs.existsSync(EDITORS_AUTH_FILE)) {
    try {
      const content = fs.readFileSync(EDITORS_AUTH_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }
  fs.writeFileSync(EDITORS_AUTH_FILE, JSON.stringify([], null, 2), 'utf-8');
  return [];
}

function saveStoredEditorAuth(authList: any[]): void {
  fs.writeFileSync(EDITORS_AUTH_FILE, JSON.stringify(authList, null, 2), 'utf-8');
}

// Initialize persistent files on startup
getOrInitAdminAuth();
getStoredEditors();
getStoredEditorAuth();

// Admin Authentication Middleware
function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Unauthorized: Admin authentication token required' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const verified = verifySessionToken(token);

  if (!verified.valid || verified.role !== 'admin') {
    res.status(401).json({ success: false, error: 'Unauthorized: Session has expired or is invalid' });
    return;
  }

  next();
}

// ==========================================
// ADMIN AUTHENTICATION ENDPOINTS
// ==========================================

// 1. Admin Login (Username: Abhiraj, Initial Password: Abhiraj)
app.post('/api/admin/login', (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ success: false, error: 'Username and password are required' });
    return;
  }

  const adminAuth = getOrInitAdminAuth();
  const currentAdminUsername = adminAuth.username || 'Abhiraj';

  // Verify username matches configured admin username (case-insensitive check)
  if (username.trim().toLowerCase() !== currentAdminUsername.toLowerCase()) {
    res.status(401).json({ success: false, error: `Unknown admin username. Admin username is "${currentAdminUsername}".` });
    return;
  }

  const isValid = verifyPassword(password, adminAuth.salt, adminAuth.passwordHash);

  if (!isValid) {
    res.status(401).json({ success: false, error: 'Incorrect Password. Please enter the valid admin password.' });
    return;
  }

  // Issue persistent cryptographic session token
  const sessionToken = generateSessionToken('admin', currentAdminUsername);

  res.json({
    success: true,
    token: sessionToken,
    username: currentAdminUsername,
    role: 'admin',
    mustChangePassword: adminAuth.mustChangePassword,
  });
});

// 2. Change Default Password or Update Admin Credentials
app.post('/api/admin/change-password', requireAdminAuth, (req: Request, res: Response) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmPassword) {
    res.status(400).json({ success: false, error: 'All password fields are required' });
    return;
  }

  if (newPassword !== confirmPassword) {
    res.status(400).json({ success: false, error: 'New password and confirmation do not match' });
    return;
  }

  if (newPassword.length < 6) {
    res.status(400).json({ success: false, error: 'New password must be at least 6 characters long' });
    return;
  }

  const adminAuth = getOrInitAdminAuth();
  const isCurrentValid = verifyPassword(currentPassword, adminAuth.salt, adminAuth.passwordHash);

  if (!isCurrentValid) {
    res.status(400).json({ success: false, error: 'Current password is incorrect' });
    return;
  }

  // Update salt and password hash
  const newSalt = crypto.randomBytes(16).toString('hex');
  const newHash = hashPassword(newPassword, newSalt);

  const updatedAdmin = {
    username: adminAuth.username || 'Abhiraj',
    salt: newSalt,
    passwordHash: newHash,
    mustChangePassword: false,
    updatedAt: new Date().toISOString(),
  };

  fs.writeFileSync(ADMIN_AUTH_FILE, JSON.stringify(updatedAdmin, null, 2), 'utf-8');

  res.json({
    success: true,
    message: 'Admin password changed successfully',
    mustChangePassword: false,
  });
});

// 2b. Secure Admin Credentials Management (Change Username and/or Password)
app.post('/api/admin/change-credentials', requireAdminAuth, (req: Request, res: Response) => {
  const { currentPassword, newUsername, newPassword, confirmPassword } = req.body;

  if (!currentPassword) {
    res.status(400).json({ success: false, error: 'Current password is required to update credentials' });
    return;
  }

  const adminAuth = getOrInitAdminAuth();
  const isCurrentValid = verifyPassword(currentPassword, adminAuth.salt, adminAuth.passwordHash);

  if (!isCurrentValid) {
    res.status(400).json({ success: false, error: 'Current password is incorrect' });
    return;
  }

  let updatedUsername = adminAuth.username || 'Abhiraj';
  let updatedSalt = adminAuth.salt;
  let updatedHash = adminAuth.passwordHash;

  if (newUsername && newUsername.trim()) {
    const cleanUser = newUsername.trim();
    if (cleanUser.length < 3) {
      res.status(400).json({ success: false, error: 'Username must be at least 3 characters long' });
      return;
    }
    updatedUsername = cleanUser;
  }

  if (newPassword) {
    if (newPassword.length < 6) {
      res.status(400).json({ success: false, error: 'New password must be at least 6 characters long' });
      return;
    }
    if (newPassword !== confirmPassword) {
      res.status(400).json({ success: false, error: 'New password and confirmation do not match' });
      return;
    }
    updatedSalt = crypto.randomBytes(16).toString('hex');
    updatedHash = hashPassword(newPassword, updatedSalt);
  }

  const updatedAdmin = {
    username: updatedUsername,
    salt: updatedSalt,
    passwordHash: updatedHash,
    mustChangePassword: false,
    updatedAt: new Date().toISOString(),
  };

  fs.writeFileSync(ADMIN_AUTH_FILE, JSON.stringify(updatedAdmin, null, 2), 'utf-8');

  // Issue fresh session token with updated username
  const newToken = generateSessionToken('admin', updatedUsername);

  res.json({
    success: true,
    message: 'Admin credentials updated successfully',
    username: updatedUsername,
    token: newToken,
  });
});

// 3. Admin Session Check (/api/admin/me)
app.get('/api/admin/me', requireAdminAuth, (req: Request, res: Response) => {
  const adminAuth = getOrInitAdminAuth();
  res.json({
    success: true,
    username: adminAuth.username || 'Abhiraj',
    role: 'admin',
    mustChangePassword: adminAuth.mustChangePassword,
  });
});

// 4. Admin Logout
app.post('/api/admin/logout', (req: Request, res: Response) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// ==========================================
// ADMIN EDITOR MANAGEMENT ENDPOINTS
// ==========================================

// 5. Add New Editor (+ Add My Editor - 16 Fields)
app.post('/api/admin/editors', requireAdminAuth, (req: Request, res: Response) => {
  const {
    fullName,
    username,
    email,
    password,
    confirmPassword,
    photoURL,
    title,
    bio,
    experience,
    skills,
    categories,
    portfolioUrl,
    instagramUrl,
    youtubeUrl,
    startingPrice,
    availability,
  } = req.body;

  // Validation
  if (!fullName || !fullName.trim()) {
    res.status(400).json({ success: false, error: 'Full Name is required' });
    return;
  }

  const cleanUsername = String(username || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');

  if (!cleanUsername || cleanUsername.length < 3) {
    res.status(400).json({ success: false, error: 'Username must be at least 3 alphanumeric characters' });
    return;
  }

  const cleanEmail = String(email || '').trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!cleanEmail || !emailRegex.test(cleanEmail)) {
    res.status(400).json({ success: false, error: 'A valid email address is required' });
    return;
  }

  if (!password || password.length < 6) {
    res.status(400).json({ success: false, error: 'Password must be at least 6 characters long' });
    return;
  }

  if (password !== confirmPassword) {
    res.status(400).json({ success: false, error: 'Passwords do not match' });
    return;
  }

  if (!title || !title.trim()) {
    res.status(400).json({ success: false, error: 'Professional Title is required' });
    return;
  }

  if (!bio || !bio.trim()) {
    res.status(400).json({ success: false, error: 'Bio is required' });
    return;
  }

  if (!portfolioUrl || !portfolioUrl.trim()) {
    res.status(400).json({ success: false, error: 'Portfolio or Showreel URL is required' });
    return;
  }

  const priceNum = Number(startingPrice);
  if (isNaN(priceNum) || priceNum <= 0) {
    res.status(400).json({ success: false, error: 'Starting Price must be a positive number' });
    return;
  }

  const categoriesList = Array.isArray(categories)
    ? categories
    : [categories].filter(Boolean);

  if (categoriesList.length === 0) {
    res.status(400).json({ success: false, error: 'Select at least one editing category' });
    return;
  }

  const skillsList = Array.isArray(skills)
    ? skills
    : String(skills || '').split(',').map((s: string) => s.trim()).filter(Boolean);

  if (skillsList.length === 0) {
    res.status(400).json({ success: false, error: 'At least one skill or software proficiency is required' });
    return;
  }

  // Prevent duplicate username or email
  const currentEditors = getStoredEditors();
  const currentAuth = getStoredEditorAuth();

  const duplicateUsername = currentEditors.some(
    (e: any) => String(e.username || '').toLowerCase() === cleanUsername
  ) || currentAuth.some((a: any) => String(a.username || '').toLowerCase() === cleanUsername);

  if (duplicateUsername) {
    res.status(409).json({ success: false, error: 'An editor with this username already exists' });
    return;
  }

  const duplicateEmail = currentEditors.some(
    (e: any) => String(e.email || '').toLowerCase() === cleanEmail
  ) || currentAuth.some((a: any) => String(a.email || '').toLowerCase() === cleanEmail);

  if (duplicateEmail) {
    res.status(409).json({ success: false, error: 'An editor with this email address already exists' });
    return;
  }

  // Generate Editor ID
  const editorId = `editor_${cleanUsername}_${Date.now().toString(36)}`;
  const now = new Date().toISOString();

  // Create Editor profile with status: 'active' (since Admin manually created it)
  const newEditorProfile = {
    id: editorId,
    userId: editorId,
    fullName: fullName.trim(),
    username: cleanUsername,
    email: cleanEmail,
    photoURL: photoURL?.trim() || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    title: title.trim(),
    bio: bio.trim(),
    experience: experience || '3-5 years (Mid-Level)',
    skills: skillsList,
    categories: categoriesList,
    portfolioUrl: portfolioUrl.trim(),
    instagramUrl: instagramUrl?.trim() || '',
    youtubeUrl: youtubeUrl?.trim() || '',
    startingPrice: priceNum,
    availability: availability || 'Available Now',
    status: 'active',
    rating: 5.0,
    reviewCount: 0,
    completedProjectsCount: 0,
    featured: false,
    createdAt: now,
    updatedAt: now,
  };

  // Save secure password hash (never stored in plaintext)
  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(password, salt);

  currentAuth.push({
    id: editorId,
    username: cleanUsername,
    email: cleanEmail,
    salt,
    passwordHash,
    role: 'editor',
    status: 'active',
    createdAt: now,
  });
  saveStoredEditorAuth(currentAuth);

  currentEditors.unshift(newEditorProfile);
  saveStoredEditors(currentEditors);

  res.status(201).json({
    success: true,
    message: 'Editor account created successfully',
    editor: newEditorProfile,
  });
});

// 6. Get All Editors (Admin only)
app.get('/api/admin/editors', requireAdminAuth, (req: Request, res: Response) => {
  const editors = getStoredEditors();
  res.json({ success: true, editors });
});

// 7. Update Editor Details (Admin only)
app.put('/api/admin/editors/:id', requireAdminAuth, (req: Request, res: Response) => {
  const editorId = req.params.id;
  const updates = req.body;
  const editors = getStoredEditors();

  const index = editors.findIndex((e: any) => e.id === editorId);
  if (index === -1) {
    res.status(404).json({ success: false, error: 'Editor not found' });
    return;
  }

  const existing = editors[index];
  const updatedEditor = {
    ...existing,
    fullName: updates.fullName !== undefined ? updates.fullName.trim() : existing.fullName,
    title: updates.title !== undefined ? updates.title.trim() : existing.title,
    bio: updates.bio !== undefined ? updates.bio.trim() : existing.bio,
    experience: updates.experience || existing.experience,
    photoURL: updates.photoURL !== undefined ? updates.photoURL.trim() : existing.photoURL,
    skills: Array.isArray(updates.skills)
      ? updates.skills
      : updates.skills !== undefined
      ? String(updates.skills).split(',').map((s: string) => s.trim()).filter(Boolean)
      : existing.skills,
    categories: Array.isArray(updates.categories) ? updates.categories : existing.categories,
    portfolioUrl: updates.portfolioUrl !== undefined ? updates.portfolioUrl.trim() : existing.portfolioUrl,
    instagramUrl: updates.instagramUrl !== undefined ? updates.instagramUrl.trim() : existing.instagramUrl,
    youtubeUrl: updates.youtubeUrl !== undefined ? updates.youtubeUrl.trim() : existing.youtubeUrl,
    startingPrice: updates.startingPrice !== undefined ? Number(updates.startingPrice) : existing.startingPrice,
    availability: updates.availability || existing.availability,
    updatedAt: new Date().toISOString(),
  };

  editors[index] = updatedEditor;
  saveStoredEditors(editors);

  res.json({ success: true, editor: updatedEditor });
});

// 8. Update Editor Status (Suspend / Reactivate / Approve)
app.patch('/api/admin/editors/:id/status', requireAdminAuth, (req: Request, res: Response) => {
  const editorId = req.params.id;
  const { status } = req.body;

  const validStatuses = ['active', 'approved', 'suspended', 'rejected'];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ success: false, error: `Status must be one of: ${validStatuses.join(', ')}` });
    return;
  }

  const normalizedStatus = status === 'approved' ? 'active' : status;

  const editors = getStoredEditors();
  const index = editors.findIndex((e: any) => e.id === editorId);
  if (index === -1) {
    res.status(404).json({ success: false, error: 'Editor not found' });
    return;
  }

  editors[index].status = normalizedStatus;
  editors[index].updatedAt = new Date().toISOString();
  saveStoredEditors(editors);

  // Sync to auth store
  const authList = getStoredEditorAuth();
  const authItem = authList.find((a: any) => a.id === editorId);
  if (authItem) {
    authItem.status = normalizedStatus;
    saveStoredEditorAuth(authList);
  }

  res.json({ success: true, id: editorId, status: normalizedStatus });
});

// 9. Delete Editor
app.delete('/api/admin/editors/:id', requireAdminAuth, (req: Request, res: Response) => {
  const editorId = req.params.id;
  let editors = getStoredEditors();

  const found = editors.find((e: any) => e.id === editorId);
  if (!found) {
    res.status(404).json({ success: false, error: 'Editor not found' });
    return;
  }

  editors = editors.filter((e: any) => e.id !== editorId);
  saveStoredEditors(editors);

  let authList = getStoredEditorAuth();
  authList = authList.filter((a: any) => a.id !== editorId);
  saveStoredEditorAuth(authList);

  res.json({ success: true, message: 'Editor successfully deleted' });
});

// ==========================================
// EDITOR AUTHENTICATION (/editor)
// ==========================================
app.post('/api/editor/login', (req: Request, res: Response) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    res.status(400).json({ success: false, error: 'Email or Username and Password are required' });
    return;
  }

  const cleanIdentifier = identifier.trim().toLowerCase();
  const authList = getStoredEditorAuth();

  const match = authList.find(
    (a: any) =>
      a.email.toLowerCase() === cleanIdentifier ||
      (a.username && a.username.toLowerCase() === cleanIdentifier)
  );

  if (!match) {
    res.status(401).json({ success: false, error: 'Invalid editor credentials' });
    return;
  }

  const isPasswordValid = verifyPassword(password, match.salt, match.passwordHash);
  if (!isPasswordValid) {
    res.status(401).json({ success: false, error: 'Invalid editor credentials' });
    return;
  }

  // Check account suspension immediately
  if (match.status === 'suspended') {
    res.status(403).json({
      success: false,
      error: 'Your editor account has been suspended by administration. Please contact support.',
    });
    return;
  }

  const editors = getStoredEditors();
  const profile = editors.find((e: any) => e.id === match.id);

  const sessionToken = generateSessionToken('editor', match.id);

  res.json({
    success: true,
    token: sessionToken,
    editor: profile || {
      id: match.id,
      email: match.email,
      username: match.username,
      role: 'editor',
      status: match.status,
    },
  });
});

// 10. Admin Update Editor Credentials (Change Username and/or Password)
app.post('/api/admin/editors/:id/credentials', requireAdminAuth, (req: Request, res: Response) => {
  const editorId = req.params.id;
  const { newUsername, newPassword } = req.body;

  const authList = getStoredEditorAuth();
  const authIdx = authList.findIndex((a: any) => a.id === editorId);
  if (authIdx === -1) {
    res.status(404).json({ success: false, error: 'Editor authentication account not found' });
    return;
  }

  const editors = getStoredEditors();
  const editorIdx = editors.findIndex((e: any) => e.id === editorId);

  if (newUsername && newUsername.trim()) {
    const cleanUser = String(newUsername).trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    if (cleanUser.length < 3) {
      res.status(400).json({ success: false, error: 'Username must be at least 3 alphanumeric characters' });
      return;
    }
    const duplicate = authList.find((a: any) => a.id !== editorId && a.username?.toLowerCase() === cleanUser);
    if (duplicate) {
      res.status(400).json({ success: false, error: 'Username is already in use by another editor' });
      return;
    }
    authList[authIdx].username = cleanUser;
    if (editorIdx !== -1) {
      editors[editorIdx].username = cleanUser;
    }
  }

  if (newPassword) {
    if (newPassword.length < 6) {
      res.status(400).json({ success: false, error: 'Password must be at least 6 characters long' });
      return;
    }
    const newSalt = crypto.randomBytes(16).toString('hex');
    const newHash = hashPassword(newPassword, newSalt);
    authList[authIdx].salt = newSalt;
    authList[authIdx].passwordHash = newHash;
  }

  authList[authIdx].updatedAt = new Date().toISOString();
  saveStoredEditorAuth(authList);

  if (editorIdx !== -1) {
    editors[editorIdx].updatedAt = new Date().toISOString();
    saveStoredEditors(editors);
  }

  res.json({
    success: true,
    message: 'Editor credentials updated successfully',
    editor: editorIdx !== -1 ? editors[editorIdx] : authList[authIdx],
  });
});

// 11. Editor Change Own Credentials (/api/editor/change-credentials)
app.post('/api/editor/change-credentials', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Unauthorized: missing token' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const verified = verifySessionToken(token);
  if (!verified.valid || verified.role !== 'editor' || !verified.idOrUsername) {
    res.status(401).json({ success: false, error: 'Invalid or expired session token' });
    return;
  }

  const editorId = verified.idOrUsername;
  const { currentPassword, newUsername, newPassword, confirmPassword } = req.body;

  if (!currentPassword) {
    res.status(400).json({ success: false, error: 'Current password is required to update credentials' });
    return;
  }

  const authList = getStoredEditorAuth();
  const authIdx = authList.findIndex((a: any) => a.id === editorId);
  if (authIdx === -1) {
    res.status(404).json({ success: false, error: 'Editor account not found' });
    return;
  }

  const isCurrentValid = verifyPassword(currentPassword, authList[authIdx].salt, authList[authIdx].passwordHash);
  if (!isCurrentValid) {
    res.status(400).json({ success: false, error: 'Current password is incorrect' });
    return;
  }

  const editors = getStoredEditors();
  const editorIdx = editors.findIndex((e: any) => e.id === editorId);

  if (newUsername && newUsername.trim()) {
    const cleanUser = String(newUsername).trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    if (cleanUser.length < 3) {
      res.status(400).json({ success: false, error: 'Username must be at least 3 alphanumeric characters' });
      return;
    }
    const duplicate = authList.find((a: any) => a.id !== editorId && a.username?.toLowerCase() === cleanUser);
    if (duplicate) {
      res.status(400).json({ success: false, error: 'Username is already in use by another editor' });
      return;
    }
    authList[authIdx].username = cleanUser;
    if (editorIdx !== -1) {
      editors[editorIdx].username = cleanUser;
    }
  }

  if (newPassword) {
    if (newPassword.length < 6) {
      res.status(400).json({ success: false, error: 'New password must be at least 6 characters long' });
      return;
    }
    if (newPassword !== confirmPassword) {
      res.status(400).json({ success: false, error: 'New password and confirmation do not match' });
      return;
    }
    const newSalt = crypto.randomBytes(16).toString('hex');
    const newHash = hashPassword(newPassword, newSalt);
    authList[authIdx].salt = newSalt;
    authList[authIdx].passwordHash = newHash;
  }

  authList[authIdx].updatedAt = new Date().toISOString();
  saveStoredEditorAuth(authList);

  if (editorIdx !== -1) {
    editors[editorIdx].updatedAt = new Date().toISOString();
    saveStoredEditors(editors);
  }

  const newToken = generateSessionToken('editor', editorId);

  res.json({
    success: true,
    message: 'Your credentials have been updated successfully',
    token: newToken,
    editor: editorIdx !== -1 ? editors[editorIdx] : authList[authIdx],
  });
});

// ==========================================
// NOTIFICATIONS MANAGEMENT (ADMIN)
// ==========================================
function getAdminNotifications(): any[] {
  if (fs.existsSync(ADMIN_NOTIFICATIONS_FILE)) {
    try {
      const content = fs.readFileSync(ADMIN_NOTIFICATIONS_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }
  return [];
}

function saveAdminNotifications(list: any[]): void {
  fs.writeFileSync(ADMIN_NOTIFICATIONS_FILE, JSON.stringify(list, null, 2), 'utf-8');
}

// 12. Get All Admin Sent Notifications History
app.get('/api/admin/notifications', requireAdminAuth, (req: Request, res: Response) => {
  const notifs = getAdminNotifications();
  notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({ success: true, notifications: notifs });
});

// 13. Create & Send Website Notification
app.post('/api/admin/notifications', requireAdminAuth, (req: Request, res: Response) => {
  const { title, message, targetAudience, targetUserId, targetUserName } = req.body;

  if (!title || !title.trim()) {
    res.status(400).json({ success: false, error: 'Notification title is required' });
    return;
  }
  if (!message || !message.trim()) {
    res.status(400).json({ success: false, error: 'Notification message is required' });
    return;
  }

  const notifId = `notif_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const now = new Date().toISOString();

  let recipientCount = 1;
  const editors = getStoredEditors();
  if (targetAudience === 'all_editors') {
    recipientCount = Math.max(1, editors.length);
  } else if (targetAudience === 'all_clients') {
    recipientCount = 1;
  }

  const newNotif = {
    id: notifId,
    title: title.trim(),
    message: message.trim(),
    targetAudience: targetAudience || 'all_clients',
    targetUserId: targetUserId || null,
    targetUserName: targetUserName || null,
    recipientCount,
    createdAt: now,
    sentBy: 'Admin',
  };

  const list = getAdminNotifications();
  list.unshift(newNotif);
  saveAdminNotifications(list);

  res.json({ success: true, notification: newNotif });
});

// 14. Delete Website Notification
app.delete('/api/admin/notifications/:id', requireAdminAuth, (req: Request, res: Response) => {
  const notifId = req.params.id;
  let list = getAdminNotifications();
  const existing = list.find((n: any) => n.id === notifId);
  if (!existing) {
    res.status(404).json({ success: false, error: 'Notification not found' });
    return;
  }
  list = list.filter((n: any) => n.id !== notifId);
  saveAdminNotifications(list);
  res.json({ success: true, message: 'Notification deleted successfully' });
});

// 15. Get Available Recipients (Editors & Clients) for Notification Target Selector
app.get('/api/admin/recipients', requireAdminAuth, (req: Request, res: Response) => {
  const editors = getStoredEditors();
  res.json({
    success: true,
    editors: editors.map((e: any) => ({
      id: e.id,
      name: e.fullName,
      username: e.username,
      email: e.email,
    })),
  });
});

// Public API for marketplace sync (only returns active / approved editors)
app.get('/api/public/editors', (req: Request, res: Response) => {
  const editors = getStoredEditors();
  const approved = editors.filter((e: any) => e.status === 'active' || e.status === 'approved');
  res.json({ success: true, editors: approved });
});

// API health endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    brand: 'DRAFTLY',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Start server with multi-page Vite dev middleware or static production files
async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);

    // Multi-page HTML route handling for development
    app.get('*', async (req: Request, res: Response, next: NextFunction) => {
      const url = req.originalUrl.split('?')[0];

      // Skip API endpoints or files with extensions
      if (url.startsWith('/api') || url.includes('.')) {
        return next();
      }

      try {
        let templatePath = path.resolve(__dirname, 'index.html');
        if (url === '/admin' || url.startsWith('/admin/')) {
          templatePath = path.resolve(__dirname, 'admin.html');
        } else if (url === '/editor' || url.startsWith('/editor/')) {
          templatePath = path.resolve(__dirname, 'editor.html');
        }

        const template = fs.readFileSync(templatePath, 'utf-8');
        const html = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));

    app.get('/admin*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'admin.html'));
    });
    app.get('/editor*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'editor.html'));
    });
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DRAFTLY server running on http://0.0.0.0:${PORT} (${isProduction ? 'production' : 'development'})`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
