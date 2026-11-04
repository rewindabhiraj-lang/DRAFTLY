import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  SlidersHorizontal,
  Star,
  IndianRupee,
  Briefcase,
  X,
  Sparkles,
} from 'lucide-react';
import { EditorProfile } from '../types';
import { getApprovedEditors, subscribeToApprovedEditors, getSavedEditorIds, toggleSaveEditor } from '../services/db';
import { filterAndSortEditors, EditorFilterOptions, formatCurrency } from '../utils/marketplace';
import { EditorCard } from '../components/EditorCard';
import { HireModal } from '../components/HireModal';
import { useAuth } from '../contexts/AuthContext';

interface ExplorePageProps {
  navigate: (path: string) => void;
  onSelectEditor: (editor: EditorProfile) => void;
  initialCategory?: string;
}

export const ExplorePage: React.FC<ExplorePageProps> = ({
  navigate,
  onSelectEditor,
  initialCategory,
}) => {
  const { userProfile } = useAuth();
  const [allEditors, setAllEditors] = useState<EditorProfile[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState(initialCategory || 'all');
  const [experience, setExperience] = useState('all');
  const [availability, setAvailability] = useState('all');
  const [maxPrice, setMaxPrice] = useState<number>(50000);
  const [sortBy, setSortBy] = useState<'rating' | 'price_asc' | 'price_desc' | 'experience' | 'newest'>('rating');
  const [hireTargetEditor, setHireTargetEditor] = useState<EditorProfile | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToApprovedEditors(eds => {
      setAllEditors(eds);
      setLoading(false);
    });

    if (userProfile?.id) {
      getSavedEditorIds(userProfile.id).then(setSavedIds).catch(() => {});
    }

    return () => unsubscribe();
  }, [userProfile?.id]);

  useEffect(() => {
    if (initialCategory) {
      setCategory(initialCategory);
    }
  }, [initialCategory]);

  const handleToggleSave = async (editorId: string) => {
    if (!userProfile) {
      navigate('/login');
      return;
    }
    const added = await toggleSaveEditor(userProfile.id, editorId);
    setSavedIds(prev =>
      added ? [...prev, editorId] : prev.filter(id => id !== editorId)
    );
  };

  const handleHireClick = (editor: EditorProfile) => {
    if (!userProfile) {
      navigate('/login');
    } else {
      setHireTargetEditor(editor);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setCategory('all');
    setExperience('all');
    setAvailability('all');
    setMaxPrice(50000);
    setSortBy('rating');
  };

  const filteredEditors = filterAndSortEditors(allEditors, {
    searchQuery,
    category,
    experience,
    availability,
    maxPrice,
    sortBy,
  });

  const categoriesList = [
    'all',
    'Gaming',
    'Anime',
    'Reels',
    'Shorts',
    'Cinematic',
    'Motion Graphics',
    'Wedding',
    'Commercial',
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Top Header */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-['Manrope']">
          Explore Video Editors
        </h1>
        <p className="text-sm text-[#A59BB8] mt-1.5">
          Browse verified creative talent, examine portfolios, and start milestone-protected projects.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl bg-[#171025] border border-[#9B5CFF]/20 p-4 sm:p-5 mb-8 shadow-xl space-y-4">
        {/* Top search input & sort */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#A59BB8] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by editor name, skill (After Effects, DaVinci), or keyword..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/20 text-white placeholder-[#A59BB8]/50 text-sm focus:outline-none focus:border-[#BB86FF] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A59BB8] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#A59BB8] whitespace-nowrap hidden sm:inline">
              Sort by:
            </span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="px-3 py-2.5 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/20 text-white text-xs sm:text-sm focus:outline-none focus:border-[#BB86FF]"
            >
              <option value="rating">Top Rated</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="experience">Most Projects</option>
              <option value="newest">Newest</option>
            </select>
          </div>
        </div>

        {/* Categories scrollable pill list */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categoriesList.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                category.toLowerCase() === cat.toLowerCase()
                  ? 'bg-gradient-to-r from-[#9B5CFF] to-[#7A22FF] text-white shadow-[0_0_15px_rgba(155,92,255,0.4)]'
                  : 'bg-[#100B1C] text-[#A59BB8] border border-[#9B5CFF]/20 hover:text-white hover:border-[#BB86FF]/40'
              }`}
            >
              {cat === 'all' ? 'All Categories' : cat}
            </button>
          ))}
        </div>

        {/* Secondary Filters: Experience, Availability, Max Price */}
        <div className="pt-3 border-t border-[#251B38] flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[#A59BB8]">Experience:</span>
              <select
                value={experience}
                onChange={e => setExperience(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-[#100B1C] border border-[#9B5CFF]/20 text-white"
              >
                <option value="all">Any Experience</option>
                <option value="1-2 Years">1-2 Years</option>
                <option value="3+ Years">3+ Years</option>
                <option value="5+ Years">5+ Years</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[#A59BB8]">Availability:</span>
              <select
                value={availability}
                onChange={e => setAvailability(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-[#100B1C] border border-[#9B5CFF]/20 text-white"
              >
                <option value="all">Any</option>
                <option value="Available Now">Available Now</option>
                <option value="Busy">Busy</option>
                <option value="Booked">Booked</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[#A59BB8]">Max Starting Price:</span>
              <input
                type="range"
                min="500"
                max="100000"
                step="500"
                value={maxPrice}
                onChange={e => setMaxPrice(Number(e.target.value))}
                className="w-24 accent-[#BB86FF]"
              />
              <span className="text-white font-bold">{formatCurrency(maxPrice)}</span>
            </div>
          </div>

          <button
            onClick={clearFilters}
            className="text-[#BB86FF] hover:underline"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Editor Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-80 rounded-2xl bg-[#171025] animate-pulse border border-[#251B38]" />
          ))}
        </div>
      ) : filteredEditors.length === 0 ? (
        <div className="text-center py-20 bg-[#171025]/50 rounded-2xl border border-[#251B38] space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#100B1C] border border-[#9B5CFF]/30 flex items-center justify-center text-[#BB86FF] mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">
            {allEditors.length === 0 ? 'No editors have been added yet.' : 'No editors found matching criteria'}
          </h3>
          <p className="text-xs text-[#A59BB8] max-w-sm mx-auto">
            {allEditors.length === 0
              ? 'Our curation team is currently onboarding top post-production talent. Check back soon.'
              : 'We couldn’t find any verified editors matching your specific search filters.'}
          </p>
          {allEditors.length > 0 && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#9B5CFF]/20 text-[#BB86FF] hover:bg-[#9B5CFF]/30 border border-[#9B5CFF]/40 transition-colors"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEditors.map(editor => (
            <EditorCard
              key={editor.id}
              editor={editor}
              isSaved={savedIds.includes(editor.id)}
              onToggleSave={handleToggleSave}
              onViewProfile={onSelectEditor}
              onHire={handleHireClick}
            />
          ))}
        </div>
      )}

      {/* Hire Modal */}
      <HireModal
        editor={hireTargetEditor}
        isOpen={!!hireTargetEditor}
        onClose={() => setHireTargetEditor(null)}
        onSuccess={() => {
          navigate('/dashboard?tab=requests');
        }}
        onRequireAuth={() => {
          setHireTargetEditor(null);
          navigate('/login');
        }}
      />
    </div>
  );
};
