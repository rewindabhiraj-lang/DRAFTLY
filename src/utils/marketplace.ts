import { EditorProfile, HiringRequestStatus, UserRole } from '../types';

export interface EditorFilterOptions {
  searchQuery?: string;
  category?: string;
  experience?: string;
  minPrice?: number;
  maxPrice?: number;
  availability?: string;
  sortBy?: 'rating' | 'price_asc' | 'price_desc' | 'experience' | 'newest';
}

/**
 * Returns progress percentage (0 - 100) based on request status
 */
export function calculateHiringRequestProgress(status: HiringRequestStatus): number {
  switch (status) {
    case 'pending':
      return 15;
    case 'accepted':
      return 35;
    case 'in_progress':
      return 60;
    case 'submitted':
      return 85;
    case 'revision_requested':
      return 70;
    case 'completed':
      return 100;
    case 'rejected':
    case 'cancelled':
      return 0;
    default:
      return 0;
  }
}

/**
 * Validates status transitions by user role
 */
export function canTransitionStatus(
  current: HiringRequestStatus,
  target: HiringRequestStatus,
  role: UserRole
): boolean {
  if (current === target) return true;
  if (role === 'admin') return true;

  // Terminal states cannot be changed by non-admins
  if (current === 'completed' || current === 'rejected' || current === 'cancelled') {
    return false;
  }

  if (role === 'editor') {
    if (current === 'pending' && (target === 'accepted' || target === 'rejected')) return true;
    if (current === 'accepted' && target === 'in_progress') return true;
    if ((current === 'in_progress' || current === 'revision_requested') && target === 'submitted') return true;
    return false;
  }

  if (role === 'client') {
    if (current === 'pending' && target === 'cancelled') return true;
    if (current === 'submitted' && (target === 'completed' || target === 'revision_requested')) return true;
    return false;
  }

  return false;
}

/**
 * Format currency in Indian Rupees (INR) using Indian numbering system (e.g. ₹500, ₹1,500, ₹10,000, ₹1,00,000)
 */
export function formatCurrency(amount: number): string {
  if (isNaN(amount) || amount < 0) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Calculate average rating and round to 1 decimal place
 */
export function calculateAverageRating(reviews: { rating: number }[]): { average: number; count: number } {
  if (!reviews || reviews.length === 0) {
    return { average: 5.0, count: 0 };
  }
  const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
  const avg = Number((sum / reviews.length).toFixed(1));
  return { average: avg, count: reviews.length };
}

/**
 * Filters and sorts editors in memory
 */
export function filterAndSortEditors(
  editors: EditorProfile[],
  filters: EditorFilterOptions = {}
): EditorProfile[] {
  let result = [...editors];

  // Search filter
  if (filters.searchQuery && filters.searchQuery.trim().length > 0) {
    const q = filters.searchQuery.toLowerCase().trim();
    result = result.filter(e =>
      e.fullName.toLowerCase().includes(q) ||
      e.title.toLowerCase().includes(q) ||
      e.bio.toLowerCase().includes(q) ||
      e.skills.some(s => s.toLowerCase().includes(q)) ||
      e.categories.some(c => c.toLowerCase().includes(q))
    );
  }

  // Category filter
  if (filters.category && filters.category !== 'all') {
    const cat = filters.category.toLowerCase();
    result = result.filter(e =>
      e.categories.some(c => c.toLowerCase() === cat)
    );
  }

  // Experience filter
  if (filters.experience && filters.experience !== 'all') {
    result = result.filter(e => e.experience === filters.experience);
  }

  // Availability filter
  if (filters.availability && filters.availability !== 'all') {
    result = result.filter(e => e.availability === filters.availability);
  }

  // Price range
  if (typeof filters.minPrice === 'number' && filters.minPrice > 0) {
    result = result.filter(e => e.startingPrice >= filters.minPrice!);
  }
  if (typeof filters.maxPrice === 'number' && filters.maxPrice > 0) {
    result = result.filter(e => e.startingPrice <= filters.maxPrice!);
  }

  // Sorting
  if (filters.sortBy) {
    switch (filters.sortBy) {
      case 'rating':
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'price_asc':
        result.sort((a, b) => a.startingPrice - b.startingPrice);
        break;
      case 'price_desc':
        result.sort((a, b) => b.startingPrice - a.startingPrice);
        break;
      case 'experience':
        result.sort((a, b) => (b.completedProjectsCount || 0) - (a.completedProjectsCount || 0));
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }
  }

  return result;
}

/**
 * Returns UI badge color styles for project/request status
 */
export function getStatusStyle(status: HiringRequestStatus | string): {
  label: string;
  badgeClass: string;
} {
  switch (status) {
    case 'pending':
      return {
        label: 'Pending Approval',
        badgeClass: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
      };
    case 'accepted':
      return {
        label: 'Accepted',
        badgeClass: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
      };
    case 'in_progress':
      return {
        label: 'In Progress',
        badgeClass: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
      };
    case 'submitted':
      return {
        label: 'Submitted for Review',
        badgeClass: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
      };
    case 'revision_requested':
      return {
        label: 'Revision Requested',
        badgeClass: 'bg-orange-500/10 text-orange-300 border-orange-500/30',
      };
    case 'completed':
      return {
        label: 'Completed',
        badgeClass: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40',
      };
    case 'rejected':
      return {
        label: 'Declined',
        badgeClass: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
      };
    case 'cancelled':
      return {
        label: 'Cancelled',
        badgeClass: 'bg-gray-500/10 text-gray-300 border-gray-500/30',
      };
    default:
      return {
        label: String(status),
        badgeClass: 'bg-gray-500/10 text-gray-300 border-gray-500/30',
      };
  }
}

/**
 * Sanitizes username (letters, numbers, underscore, lowercase)
 */
export function sanitizeUsername(username: string): string {
  if (!username) return '';
  return username
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

export interface EditorFormInput {
  fullName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword?: string;
  photoURL?: string;
  title: string;
  bio: string;
  experience: string;
  skills: string[] | string;
  categories: string[];
  portfolioUrl: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  startingPrice: number | string;
  availability: 'Available Now' | 'Busy' | 'Booked';
}

/**
 * Validates the 16 fields required for Admin-created Editor accounts
 */
export function validateEditorFormData(data: EditorFormInput, isUpdate = false): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.fullName || data.fullName.trim().length < 2) {
    errors.push('Full Name must be at least 2 characters.');
  }

  const cleanUser = sanitizeUsername(data.username);
  if (!cleanUser || cleanUser.length < 3) {
    errors.push('Username must be at least 3 alphanumeric characters.');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email || !emailRegex.test(data.email.trim())) {
    errors.push('A valid email address is required.');
  }

  if (!isUpdate) {
    if (!data.password || data.password.length < 6) {
      errors.push('Password must be at least 6 characters.');
    }
    if (data.confirmPassword !== undefined && data.password !== data.confirmPassword) {
      errors.push('Passwords do not match.');
    }
  }

  if (!data.title || data.title.trim().length < 3) {
    errors.push('Professional Title is required (min 3 chars).');
  }

  if (!data.bio || data.bio.trim().length < 10) {
    errors.push('Bio is required (min 10 characters).');
  }

  if (!data.portfolioUrl || !data.portfolioUrl.trim().startsWith('http')) {
    errors.push('Portfolio or Showreel URL must start with http:// or https://.');
  }

  const priceNum = Number(data.startingPrice);
  if (isNaN(priceNum) || priceNum <= 0) {
    errors.push('Starting Price must be a positive number.');
  }

  if (!data.categories || data.categories.length === 0) {
    errors.push('Select at least one editing category.');
  }

  const skillsList = Array.isArray(data.skills)
    ? data.skills
    : String(data.skills || '').split(',').map(s => s.trim()).filter(Boolean);

  if (skillsList.length === 0) {
    errors.push('At least one skill or software proficiency is required.');
  }

  const validAvail = ['Available Now', 'Busy', 'Booked'];
  if (!validAvail.includes(data.availability)) {
    errors.push('Availability must be "Available Now", "Busy", or "Booked".');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
