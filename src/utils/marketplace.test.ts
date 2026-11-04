import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateHiringRequestProgress,
  canTransitionStatus,
  formatCurrency,
  calculateAverageRating,
  filterAndSortEditors,
  sanitizeUsername,
  validateEditorFormData,
} from './marketplace';
import { EditorProfile } from '../types';

test('calculateHiringRequestProgress returns correct percentage values', () => {
  assert.equal(calculateHiringRequestProgress('pending'), 15);
  assert.equal(calculateHiringRequestProgress('accepted'), 35);
  assert.equal(calculateHiringRequestProgress('in_progress'), 60);
  assert.equal(calculateHiringRequestProgress('submitted'), 85);
  assert.equal(calculateHiringRequestProgress('revision_requested'), 70);
  assert.equal(calculateHiringRequestProgress('completed'), 100);
  assert.equal(calculateHiringRequestProgress('rejected'), 0);
  assert.equal(calculateHiringRequestProgress('cancelled'), 0);
});

test('canTransitionStatus validates editor and client permission transitions', () => {
  // Editor transitions
  assert.equal(canTransitionStatus('pending', 'accepted', 'editor'), true);
  assert.equal(canTransitionStatus('pending', 'rejected', 'editor'), true);
  assert.equal(canTransitionStatus('accepted', 'in_progress', 'editor'), true);
  assert.equal(canTransitionStatus('in_progress', 'submitted', 'editor'), true);
  assert.equal(canTransitionStatus('revision_requested', 'submitted', 'editor'), true);
  // Editor cannot complete project themselves without client approval
  assert.equal(canTransitionStatus('submitted', 'completed', 'editor'), false);

  // Client transitions
  assert.equal(canTransitionStatus('pending', 'cancelled', 'client'), true);
  assert.equal(canTransitionStatus('submitted', 'completed', 'client'), true);
  assert.equal(canTransitionStatus('submitted', 'revision_requested', 'client'), true);
  assert.equal(canTransitionStatus('pending', 'in_progress', 'client'), false);

  // Terminal state protections
  assert.equal(canTransitionStatus('completed', 'in_progress', 'editor'), false);
  assert.equal(canTransitionStatus('completed', 'pending', 'client'), false);

  // Admin override
  assert.equal(canTransitionStatus('completed', 'in_progress', 'admin'), true);
});

test('formatCurrency formats INR amounts correctly with Indian numbering', () => {
  assert.equal(formatCurrency(0), '₹0');
  assert.equal(formatCurrency(250), '₹250');
  assert.equal(formatCurrency(1500), '₹1,500');
  assert.equal(formatCurrency(100000), '₹1,00,000');
  assert.equal(formatCurrency(-10), '₹0');
});

test('calculateAverageRating computes genuine averages', () => {
  const reviews = [{ rating: 5 }, { rating: 4 }, { rating: 5 }];
  const { average, count } = calculateAverageRating(reviews);
  assert.equal(average, 4.7);
  assert.equal(count, 3);

  const empty = calculateAverageRating([]);
  assert.equal(empty.count, 0);
});

test('filterAndSortEditors filters by category, price, and query', () => {
  const mockEditors: EditorProfile[] = [
    {
      id: 'ed-1',
      userId: 'u-1',
      fullName: 'Alex Vance',
      email: 'alex@draftly.test',
      photoURL: '',
      title: 'Cinematic & Trailer Specialist',
      bio: 'Hollywood grade color grading and pacing.',
      experience: '5+ Years',
      skills: ['Premiere Pro', 'DaVinci Resolve', 'Sound Design'],
      categories: ['Cinematic', 'Commercial'],
      portfolioUrl: 'https://youtube.com',
      startingPrice: 350,
      availability: 'Available Now',
      status: 'approved',
      rating: 4.9,
      reviewCount: 42,
      completedProjectsCount: 50,
      createdAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'ed-2',
      userId: 'u-2',
      fullName: 'Kenji Sato',
      email: 'kenji@draftly.test',
      photoURL: '',
      title: 'Anime AMV & Action Editor',
      bio: 'Hyper dynamic beat syncing and transitions.',
      experience: '3+ Years',
      skills: ['After Effects', 'Beat Syncing', 'VFX'],
      categories: ['Anime', 'Reels'],
      portfolioUrl: 'https://youtube.com',
      startingPrice: 150,
      availability: 'Busy',
      status: 'approved',
      rating: 4.7,
      reviewCount: 20,
      completedProjectsCount: 25,
      createdAt: '2026-02-01T00:00:00Z',
    },
  ];

  // Category search
  const animeOnly = filterAndSortEditors(mockEditors, { category: 'Anime' });
  assert.equal(animeOnly.length, 1);
  assert.equal(animeOnly[0].id, 'ed-2');

  // Text search
  const searchVance = filterAndSortEditors(mockEditors, { searchQuery: 'Vance' });
  assert.equal(searchVance.length, 1);
  assert.equal(searchVance[0].id, 'ed-1');

  // Price filter
  const priceFilter = filterAndSortEditors(mockEditors, { maxPrice: 200 });
  assert.equal(priceFilter.length, 1);
  assert.equal(priceFilter[0].id, 'ed-2');
});

test('sanitizeUsername formats clean handles', () => {
  assert.equal(sanitizeUsername('Abhiraj'), 'abhiraj');
  assert.equal(sanitizeUsername('Marcus Sterling!'), 'marcus_sterling');
  assert.equal(sanitizeUsername('  pro_editor_99  '), 'pro_editor_99');
});

test('validateEditorFormData verifies all 16 editor fields', () => {
  const validData = {
    fullName: 'Alex Vance',
    username: 'alex_vance',
    email: 'alex@example.com',
    password: 'securePassword123',
    confirmPassword: 'securePassword123',
    photoURL: 'https://images.unsplash.com/photo-test',
    title: 'Lead Cinematic Colorist',
    bio: 'Over 6 years of experience editing high retention videos.',
    experience: '5+ Years',
    skills: ['Premiere Pro', 'DaVinci Resolve'],
    categories: ['Cinematic', 'Commercial'],
    portfolioUrl: 'https://youtube.com/watch?v=123',
    instagramUrl: 'https://instagram.com/alex',
    youtubeUrl: 'https://youtube.com/@alex',
    startingPrice: 350,
    availability: 'Available Now' as const,
  };

  const res = validateEditorFormData(validData);
  assert.equal(res.isValid, true);
  assert.equal(res.errors.length, 0);

  // Mismatched passwords
  const mismatch = validateEditorFormData({
    ...validData,
    confirmPassword: 'wrongPassword',
  });
  assert.equal(mismatch.isValid, false);
  assert.match(mismatch.errors.join(' '), /Passwords do not match/);

  // Invalid email
  const badEmail = validateEditorFormData({
    ...validData,
    email: 'not-an-email',
  });
  assert.equal(badEmail.isValid, false);
});
