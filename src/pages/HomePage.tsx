import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  Play,
  Star,
  CheckCircle2,
  Film,
  Zap,
  ShieldCheck,
  TrendingUp,
  Sliders,
  Scissors,
  Layers,
  Award,
  Users,
  Video,
} from 'lucide-react';
import { EditorProfile, Category, Review, PlatformStats } from '../types';
import {
  getApprovedEditors,
  subscribeToApprovedEditors,
  getCategories,
  getAllReviews,
  subscribeToReviews,
  getPlatformStats,
  getSavedEditorIds,
  toggleSaveEditor,
} from '../services/db';
import { EditorCard } from '../components/EditorCard';
import { HireModal } from '../components/HireModal';
import { useAuth } from '../contexts/AuthContext';

interface HomePageProps {
  navigate: (path: string) => void;
  onSelectEditor: (editor: EditorProfile) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ navigate, onSelectEditor }) => {
  const { userProfile } = useAuth();
  const [editors, setEditors] = useState<EditorProfile[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<PlatformStats>({
    registeredEditors: 0,
    completedProjects: 0,
    activeClients: 0,
    totalProjects: 0,
    pendingApprovals: 0,
    averageRating: 5.0,
  });
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [hireTargetEditor, setHireTargetEditor] = useState<EditorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Realtime subscription for approved editors
    const unsubscribeEditors = subscribeToApprovedEditors(eds => {
      setEditors(eds);
      setLoading(false);
    });

    // Realtime subscription for reviews
    const unsubscribeReviews = subscribeToReviews(revs => {
      setReviews(revs.slice(0, 6));
    });

    getCategories().then(setCategories).catch(() => {});
    getPlatformStats().then(setStats).catch(() => {});

    if (userProfile?.id) {
      getSavedEditorIds(userProfile.id).then(setSavedIds).catch(() => {});
    }

    return () => {
      unsubscribeEditors();
      unsubscribeReviews();
    };
  }, [userProfile?.id]);

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

  return (
    <div className="relative overflow-hidden">
      {/* Background Neon Ambient Glows */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-[#9B5CFF]/20 via-[#7A22FF]/10 to-transparent blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-[800px] right-0 w-[450px] h-[450px] bg-[#BB86FF]/10 blur-[150px] pointer-events-none -z-10" />

      {/* 1. HERO SECTION */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24 lg:pt-20 lg:pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Headline, Description & CTAs */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#171025] border border-[#9B5CFF]/30 text-xs font-semibold text-[#BB86FF] shadow-[0_0_20px_rgba(155,92,255,0.2)]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>The Premier Video Editor Marketplace</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white font-['Manrope'] leading-[1.12]">
              Your Vision.{' '}
              <span className="text-gradient-purple">Their Creativity.</span>
            </h1>

            <p className="text-base sm:text-lg text-[#A59BB8] leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Find talented video editors, connect with creative professionals and turn your ideas into extraordinary content. From viral 9:16 reels to Hollywood-grade color grading.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                onClick={() => navigate('/explore')}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-bold text-white bg-gradient-to-r from-[#9B5CFF] to-[#7A22FF] hover:brightness-110 active:scale-95 shadow-[0_0_30px_rgba(155,92,255,0.4)] transition-all flex items-center justify-center gap-2.5 group"
              >
                <span>Find an Editor</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => navigate('/how-it-works')}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-semibold text-[#BB86FF] hover:text-white bg-[#171025] hover:bg-[#251B38] border border-[#9B5CFF]/30 hover:border-[#BB86FF] transition-all flex items-center justify-center gap-2"
              >
                <Film className="w-4 h-4" />
                <span>How It Works</span>
              </button>
            </div>

            {/* Micro proof badges */}
            <div className="pt-6 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-[#A59BB8]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Vetted Talent Only</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#BB86FF]" />
                <span>Fast Milestone Approvals</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Verified Client Reviews</span>
              </div>
            </div>
          </div>

          {/* Right Column: Animated Creative Timeline & Video Interface Mockup */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl bg-[#100B1C] border border-[#9B5CFF]/30 p-5 shadow-2xl backdrop-blur-xl">
              {/* Header preview bar */}
              <div className="flex items-center justify-between pb-4 border-b border-[#251B38]">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-[11px] text-[#A59BB8] font-mono">DRAFTLY STUDIO • 4K TIMELINE</span>
              </div>

              {/* Video Player Canvas Mockup */}
              <div className="relative aspect-video rounded-2xl bg-[#080611] overflow-hidden my-4 border border-[#9B5CFF]/20 flex items-center justify-center">
                <img
                  src="https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&auto=format&fit=crop&q=80"
                  alt="Video timeline preview"
                  className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#080611] via-transparent to-transparent" />
                <div className="w-12 h-12 rounded-full bg-[#9B5CFF]/80 backdrop-blur-md flex items-center justify-center text-white shadow-[0_0_20px_rgba(155,92,255,0.6)]">
                  <Play className="w-5 h-5 ml-0.5 fill-white" />
                </div>
              </div>

              {/* Multi-track Timeline Mockup */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-[10px] text-[#A59BB8] font-mono px-1">
                  <span>TIMELINE • PRO EDIT</span>
                  <span className="text-[#BB86FF]">4 AUDIO / 3 VIDEO TRACKS</span>
                </div>

                {/* Video Track 1 */}
                <div className="h-7 rounded-lg bg-[#171025] border border-[#9B5CFF]/30 flex items-center p-1 gap-1 overflow-hidden">
                  <div className="w-16 h-full rounded bg-[#9B5CFF]/30 border border-[#9B5CFF]/50 flex items-center justify-center text-[9px] font-bold text-white">
                    V3 B-Roll
                  </div>
                  <div className="w-28 h-full rounded bg-purple-700/40 border border-purple-500/40 flex items-center justify-center text-[9px] text-[#BB86FF]">
                    Kinetic Hook
                  </div>
                  <div className="flex-1 h-full rounded bg-[#9B5CFF]/20 border border-[#9B5CFF]/30 flex items-center justify-center text-[9px] text-[#A59BB8]">
                    Motion Graphic Callout
                  </div>
                </div>

                {/* Video Track 2 - Main A-Roll */}
                <div className="h-7 rounded-lg bg-[#171025] border border-[#251B38] flex items-center p-1 gap-1 overflow-hidden">
                  <div className="w-24 h-full rounded bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-[9px] font-semibold text-blue-300">
                    A-Roll Intro
                  </div>
                  <div className="w-32 h-full rounded bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-[9px] font-semibold text-blue-300">
                    Interview Cut 01
                  </div>
                  <div className="flex-1 h-full rounded bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-[9px] font-semibold text-blue-300">
                    Interview Cut 02
                  </div>
                </div>

                {/* Audio Waveform Track */}
                <div className="h-6 rounded-lg bg-[#0D0917] border border-emerald-500/20 flex items-center px-2 justify-between overflow-hidden">
                  <span className="text-[8px] font-mono text-emerald-400">A1 SFX + MASTER DIALOGUE</span>
                  <div className="flex items-end gap-0.5 h-3">
                    {[3, 6, 10, 4, 12, 8, 14, 5, 9, 12, 16, 7, 10, 3, 15, 8, 12, 6, 11, 4].map((h, i) => (
                      <span
                        key={i}
                        className="w-0.5 bg-emerald-400 rounded-full"
                        style={{ height: `${h}px` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. LIVE STATISTICS SECTION (ACTUAL FIRESTORE DATA) */}
      <section className="border-y border-[#9B5CFF]/20 bg-[#100B1C]/60 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="p-6 rounded-2xl bg-[#171025]/60 border border-[#9B5CFF]/15 text-center">
              <span className="text-3xl sm:text-4xl font-extrabold text-white font-['Manrope'] block">
                {stats.registeredEditors}
              </span>
              <span className="text-xs sm:text-sm text-[#A59BB8] font-medium mt-1 block">
                Registered Editors
              </span>
            </div>

            <div className="p-6 rounded-2xl bg-[#171025]/60 border border-[#9B5CFF]/15 text-center">
              <span className="text-3xl sm:text-4xl font-extrabold text-[#BB86FF] font-['Manrope'] block">
                {stats.completedProjects}
              </span>
              <span className="text-xs sm:text-sm text-[#A59BB8] font-medium mt-1 block">
                Completed Projects
              </span>
            </div>

            <div className="p-6 rounded-2xl bg-[#171025]/60 border border-[#9B5CFF]/15 text-center">
              <span className="text-3xl sm:text-4xl font-extrabold text-white font-['Manrope'] block">
                {stats.activeClients}
              </span>
              <span className="text-xs sm:text-sm text-[#A59BB8] font-medium mt-1 block">
                Active Clients
              </span>
            </div>

            <div className="p-6 rounded-2xl bg-[#171025]/60 border border-[#9B5CFF]/15 text-center">
              <span className="text-3xl sm:text-4xl font-extrabold text-emerald-400 font-['Manrope'] block">
                {stats.totalProjects}
              </span>
              <span className="text-xs sm:text-sm text-[#A59BB8] font-medium mt-1 block">
                Total Projects
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FEATURED EDITORS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#171025] border border-[#9B5CFF]/30 text-xs font-semibold text-[#BB86FF] mb-3">
              <Award className="w-3.5 h-3.5" />
              <span>Elite Talent</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-['Manrope']">
              Featured Video Editors
            </h2>
            <p className="text-sm text-[#A59BB8] mt-2 max-w-xl">
              Hand-selected creative editors with proven track records in pacing, storytelling, and high-retention post-production.
            </p>
          </div>

          <button
            onClick={() => navigate('/explore')}
            className="self-start sm:self-auto px-5 py-2.5 rounded-xl bg-[#171025] hover:bg-[#251B38] text-white border border-[#9B5CFF]/30 text-xs font-semibold flex items-center gap-2 hover:border-[#BB86FF] transition-all"
          >
            <span>View All Editors</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-80 rounded-2xl bg-[#171025] animate-pulse border border-[#251B38]" />
            ))}
          </div>
        ) : editors.length === 0 ? (
          <div className="text-center py-16 bg-[#171025]/40 rounded-2xl border border-[#251B38] space-y-2">
            <Film className="w-8 h-8 text-[#9B5CFF]/50 mx-auto" />
            <p className="text-white font-bold text-sm">No editors have been added yet.</p>
            <p className="text-xs text-[#A59BB8] max-w-sm mx-auto">
              Our curation team is currently onboarding top post-production talent. Check back soon.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {editors.slice(0, 3).map(editor => (
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
      </section>

      {/* 4. HOW IT WORKS SECTION */}
      <section className="border-t border-[#9B5CFF]/20 bg-[#100B1C]/40 py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-['Manrope']">
              How DRAFTLY Works
            </h2>
            <p className="text-sm text-[#A59BB8] mt-2">
              A frictionless 4-step workflow built specifically for creators, agencies, and video pros.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'Explore Talented Editors',
                desc: 'Filter verified editors by genre, software, experience, rate, and authentic portfolio showreels.',
                icon: Sliders,
              },
              {
                step: '02',
                title: 'Choose Your Preferred Editor',
                desc: 'Inspect full client reviews, turnaround metrics, and sample work tailored to your niche.',
                icon: Users,
              },
              {
                step: '03',
                title: 'Send a Hiring Request',
                desc: 'Define your project scope, target timeline, budget, and raw footage links in one easy proposal.',
                icon: Scissors,
              },
              {
                step: '04',
                title: 'Collaborate & Complete Projects',
                desc: 'Chat in real-time, review deliverables, request fine-tuned revisions, and release project approval.',
                icon: CheckCircle2,
              },
            ].map((item, idx) => {
              const IconComp = item.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-[#171025] border border-[#9B5CFF]/20 hover:border-[#BB86FF]/50 transition-all hover:-translate-y-1 group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black text-[#9B5CFF]/40 font-mono group-hover:text-[#BB86FF] transition-colors">
                      {item.step}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/30 flex items-center justify-center text-[#BB86FF]">
                      <IconComp className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-xs text-[#A59BB8] leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. CATEGORIES SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-['Manrope']">
            Explore Creative Categories
          </h2>
          <p className="text-sm text-[#A59BB8] mt-2">
            Every niche demands specialized pacing, motion graphics, and audio mix.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {categories.map(cat => (
            <div
              key={cat.id}
              onClick={() => navigate(`/explore?cat=${encodeURIComponent(cat.name.replace(' Editors', ''))}`)}
              className="p-5 rounded-2xl bg-[#171025] border border-[#9B5CFF]/20 hover:border-[#BB86FF] hover:bg-[#251B38]/50 cursor-pointer transition-all hover:scale-[1.02] text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/30 flex items-center justify-center text-[#BB86FF] mb-3 group-hover:shadow-[0_0_15px_rgba(155,92,255,0.4)] transition-all">
                <Film className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-sm group-hover:text-[#BB86FF] transition-colors">
                {cat.name}
              </h3>
              <p className="text-xs text-[#A59BB8] line-clamp-2 mt-1">
                {cat.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. GENUINE FIRESTORE REVIEWS */}
      {reviews.length > 0 && (
        <section className="border-t border-[#9B5CFF]/20 bg-[#100B1C]/60 py-20 lg:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#171025] border border-[#9B5CFF]/30 text-xs font-semibold text-amber-300 mb-3">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>Verified Client Reviews</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-['Manrope']">
                What Creators Say
              </h2>
              <p className="text-sm text-[#A59BB8] mt-2">
                Real feedback from producers and creators who completed projects on DRAFTLY.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {reviews.map(rev => (
                <div
                  key={rev.id}
                  className="p-6 rounded-2xl bg-[#171025] border border-[#9B5CFF]/20 hover:border-[#BB86FF]/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-1 text-amber-400 mb-3">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-xs sm:text-sm text-[#A59BB8] italic leading-relaxed mb-4">
                      "{rev.comment}"
                    </p>
                  </div>
                  <div className="pt-4 border-t border-[#251B38] flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white">{rev.clientName}</p>
                      <p className="text-[10px] text-[#BB86FF]">Editor: {rev.editorName}</p>
                    </div>
                    <span className="text-[10px] text-[#A59BB8]">Verified Project</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 7. BOTTOM CTA BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="relative rounded-3xl bg-gradient-to-r from-[#171025] via-[#211536] to-[#171025] border border-[#9B5CFF]/40 p-8 sm:p-12 text-center overflow-hidden shadow-[0_0_50px_rgba(155,92,255,0.25)]">
          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-['Manrope']">
              Ready to elevate your video content?
            </h2>
            <p className="text-sm text-[#A59BB8]">
              Connect with extraordinary video editors and streamline your post-production workflow on DRAFTLY.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate('/explore')}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#9B5CFF] to-[#7A22FF] hover:brightness-110 active:scale-95 shadow-[0_0_20px_rgba(155,92,255,0.4)] transition-all"
              >
                Explore Editors Now
              </button>
              <button
                onClick={() => navigate('/register')}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-sm font-semibold text-[#BB86FF] hover:text-white bg-[#100B1C] border border-[#9B5CFF]/30 transition-all"
              >
                Get Started as Client
              </button>
            </div>
          </div>
        </div>
      </section>

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
