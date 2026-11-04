import React from 'react';
import { Film, Award, Sparkles, Users, Target, ShieldCheck } from 'lucide-react';

interface AboutPageProps {
  navigate: (path: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ navigate }) => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <img
          src="https://i.postimg.cc/NjqbtJKN/Neon-Purple-Draftly-Crown-Logo.png"
          alt="DRAFTLY"
          className="h-16 w-auto mx-auto object-contain filter drop-shadow-[0_0_20px_rgba(187,134,255,0.5)]"
        />
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white font-['Manrope']">
          Creative Talent. <span className="text-gradient-purple">Extraordinary Results.</span>
        </h1>
        <p className="text-base text-[#A59BB8] leading-relaxed">
          DRAFTLY was founded to bridge the gap between world-class video editors and modern content creators, brands, and documentary storytellers.
        </p>
      </div>

      {/* Story & Vision */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        <div className="p-8 rounded-3xl bg-[#171025] border border-[#9B5CFF]/20 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/30 flex items-center justify-center text-[#BB86FF]">
            <Target className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-white font-['Manrope']">Our Mission</h2>
          <p className="text-xs sm:text-sm text-[#A59BB8] leading-relaxed">
            Video editing is not a mechanical assembly line — it is an art of emotional resonance, pacing, and visual storytelling. Our mission is to elevate creative video editors as essential storytelling partners, giving them a prestigious platform to display their authentic work while providing clients with a seamless, protected hiring experience.
          </p>
        </div>

        <div className="p-8 rounded-3xl bg-[#171025] border border-[#9B5CFF]/20 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#100B1C] border border-[#9B5CFF]/30 flex items-center justify-center text-[#BB86FF]">
            <Sparkles className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-white font-['Manrope']">Vetted Standards</h2>
          <p className="text-xs sm:text-sm text-[#A59BB8] leading-relaxed">
            Generic freelance websites are flooded with low-quality volume and unverified portfolios. On DRAFTLY, every editor undergoes administrative review. We inspect exported showreels, color grading techniques, sound design mastery, and client communication habits.
          </p>
        </div>
      </div>

      {/* Pillars */}
      <div className="p-8 sm:p-10 rounded-3xl bg-[#100B1C] border border-[#9B5CFF]/30 space-y-6">
        <h3 className="text-2xl font-bold text-white font-['Manrope'] text-center">
          The DRAFTLY Creative Philosophy
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div>
            <Film className="w-8 h-8 text-[#BB86FF] mx-auto mb-2" />
            <h4 className="font-bold text-white text-sm">Pacing is Everything</h4>
            <p className="text-xs text-[#A59BB8] mt-1">
              Whether editing a 15-second viral hook or a 45-minute documentary, cut rhythm defines engagement.
            </p>
          </div>
          <div>
            <Award className="w-8 h-8 text-amber-400 mx-auto mb-2" />
            <h4 className="font-bold text-white text-sm">True Color & Audio Depth</h4>
            <p className="text-xs text-[#A59BB8] mt-1">
              Our specialists master DaVinci Resolve color pipelines and multi-layer audio soundscapes.
            </p>
          </div>
          <div>
            <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <h4 className="font-bold text-white text-sm">Milestone Transparency</h4>
            <p className="text-xs text-[#A59BB8] mt-1">
              Clients and editors collaborate with clear deadlines, included revisions, and guaranteed delivery standards.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
