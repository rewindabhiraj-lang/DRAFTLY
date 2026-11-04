import React from 'react';
import { Check, Sparkles, Shield, IndianRupee, ArrowRight } from 'lucide-react';

interface PricingPageProps {
  navigate: (path: string) => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({ navigate }) => {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#171025] border border-[#9B5CFF]/30 text-xs font-semibold text-[#BB86FF] mb-3">
          <IndianRupee className="w-3.5 h-3.5" />
          <span>Fair & Transparent</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white font-['Manrope']">
          Transparent Marketplace Pricing
        </h1>
        <p className="text-sm text-[#A59BB8] mt-2">
          No hidden subscription fees for clients. Editors set their own rates and keep their earnings.
        </p>
      </div>

      {/* 3 Tier Architecture Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        {/* Tier 1 */}
        <div className="p-7 rounded-3xl bg-[#171025] border border-[#9B5CFF]/20 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <span className="text-xs uppercase font-bold text-[#A59BB8] tracking-wider block">
              Short-Form Content
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-white">₹8,000 - ₹20,000</span>
              <span className="text-xs text-[#A59BB8]">/ video</span>
            </div>
            <p className="text-xs text-[#A59BB8] leading-relaxed">
              Ideal for TikTok, Instagram Reels, and YouTube Shorts creators requiring fast-paced retention cuts, kinetic captions, and sound effects.
            </p>
            <ul className="space-y-2.5 text-xs text-white pt-2">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>9:16 vertical retention pacing</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Kinetic subtitles & zooms</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>24 - 48 hour turnaround</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>2 revision rounds included</span>
              </li>
            </ul>
          </div>
          <button
            onClick={() => navigate('/explore?cat=Shorts')}
            className="w-full py-2.5 rounded-xl text-xs font-bold bg-[#251B38] hover:bg-[#32234B] text-white border border-[#9B5CFF]/30 transition-colors"
          >
            Find Short-Form Editors
          </button>
        </div>

        {/* Tier 2 - Featured */}
        <div className="p-8 rounded-3xl bg-gradient-to-b from-[#211536] to-[#171025] border-2 border-[#BB86FF] shadow-[0_0_40px_rgba(155,92,255,0.3)] flex flex-col justify-between space-y-6 relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-gradient-to-r from-[#9B5CFF] to-[#7A22FF] text-[10px] font-bold text-white uppercase tracking-wider shadow-md">
            Most Popular
          </div>
          <div className="space-y-4">
            <span className="text-xs uppercase font-bold text-[#BB86FF] tracking-wider block">
              Cinematic & Long-Form
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-white">₹20,000 - ₹50,000</span>
              <span className="text-xs text-[#A59BB8]">/ project</span>
            </div>
            <p className="text-xs text-[#A59BB8] leading-relaxed">
              For YouTube documentarians, podcast productions, narrative short films, and high-production storytelling.
            </p>
            <ul className="space-y-2.5 text-xs text-white pt-2">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Full DaVinci Resolve color grade</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Multi-cam editing & audio mix</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Custom lower thirds & motion graphics</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Direct 1-on-1 real-time chat</span>
              </li>
            </ul>
          </div>
          <button
            onClick={() => navigate('/explore?cat=Cinematic')}
            className="w-full py-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#9B5CFF] to-[#7A22FF] hover:brightness-110 shadow-lg transition-all"
          >
            Find Cinematic Editors
          </button>
        </div>

        {/* Tier 3 */}
        <div className="p-7 rounded-3xl bg-[#171025] border border-[#9B5CFF]/20 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <span className="text-xs uppercase font-bold text-[#A59BB8] tracking-wider block">
              Commercial & 3D Motion
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-white">₹50,000 - ₹1,25,000+</span>
              <span className="text-xs text-[#A59BB8]">/ campaign</span>
            </div>
            <p className="text-xs text-[#A59BB8] leading-relaxed">
              Designed for SaaS launch videos, brand commercials, 3D product animations, and broadcast-ready deliverables.
            </p>
            <ul className="space-y-2.5 text-xs text-white pt-2">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Cinema 4D / Blender 3D assets</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>ProRes 422 HQ / 4K master outputs</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Commercial music license guidance</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Priority turnaround & dedicated revision</span>
              </li>
            </ul>
          </div>
          <button
            onClick={() => navigate('/explore?cat=Commercial')}
            className="w-full py-2.5 rounded-xl text-xs font-bold bg-[#251B38] hover:bg-[#32234B] text-white border border-[#9B5CFF]/30 transition-colors"
          >
            Find Commercial Pros
          </button>
        </div>
      </div>

      {/* Safety & Milestone Promise */}
      <div className="p-8 rounded-3xl bg-[#171025] border border-[#9B5CFF]/30 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
        <div>
          <Shield className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
          <h4 className="font-bold text-white text-sm">Protected Collaboration</h4>
          <p className="text-xs text-[#A59BB8] mt-1">Funds are released only when you inspect and approve the completed video.</p>
        </div>
        <div>
          <Sparkles className="w-8 h-8 text-[#BB86FF] mx-auto mb-2" />
          <h4 className="font-bold text-white text-sm">No Hidden Fees</h4>
          <p className="text-xs text-[#A59BB8] mt-1">What you propose in your budget is what you pay. Zero surprise surcharges.</p>
        </div>
        <div>
          <Check className="w-8 h-8 text-amber-400 mx-auto mb-2" />
          <h4 className="font-bold text-white text-sm">Revision Guarantee</h4>
          <p className="text-xs text-[#A59BB8] mt-1">Direct feedback rounds with timestamped notes ensure your vision is realized.</p>
        </div>
      </div>
    </div>
  );
};
