import React from 'react';
import {
  CheckCircle2,
  Sliders,
  Users,
  Scissors,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Film,
} from 'lucide-react';

interface HowItWorksPageProps {
  navigate: (path: string) => void;
}

export const HowItWorksPage: React.FC<HowItWorksPageProps> = ({ navigate }) => {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#171025] border border-[#9B5CFF]/30 text-xs font-semibold text-[#BB86FF] mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Frictionless Post-Production</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white font-['Manrope']">
          How DRAFTLY Works
        </h1>
        <p className="text-sm text-[#A59BB8] mt-2">
          From finding the right creative eye to getting your finished 4K master exported and approved.
        </p>
      </div>

      {/* 4 Steps Detailed */}
      <div className="space-y-12">
        {[
          {
            num: '01',
            title: 'Explore & Inspect Verified Editors',
            desc: 'Every editor on DRAFTLY passes manual video quality and portfolio verification. Filter by your target genre (Gaming AMV, Viral 9:16 Shorts, Narrative Cinematic, Motion Graphics), rate, and software stack.',
            icon: Sliders,
            highlights: ['Vetted real showreels', 'Transparent hourly and starting rates', 'Software tags (Premiere, DaVinci, Blender)'],
          },
          {
            num: '02',
            title: 'Define Project Scope & Send Proposal',
            desc: 'Click Hire Now on your chosen editor. Input your project title, target deadline, budget, and raw footage links (Google Drive, Dropbox, Frame.io). The editor receives instant notifications to review your brief.',
            icon: Scissors,
            highlights: ['Guaranteed escrow protection', 'Customizable delivery timelines', 'Direct attachment references'],
          },
          {
            num: '03',
            title: 'Collaborate with Real-Time Communication',
            desc: 'Once the editor accepts your request, your project channel opens. Exchange timestamped feedback, music options, color palette directions, and export format specifications in real time.',
            icon: Users,
            highlights: ['Direct chat channel', 'Timestamped cut review', 'No messy email chains'],
          },
          {
            num: '04',
            title: 'Review Deliverables, Request Revisions, & Approve',
            desc: 'The editor delivers high-res exports. If adjustments are needed, submit timestamped revision notes. When you are 100% satisfied, approve the delivery and leave a verified review to help the creator grow.',
            icon: CheckCircle2,
            highlights: ['Revision cycles included', '1-click completion sign-off', 'Verified rating feedback'],
          },
        ].map((step, idx) => {
          const Icon = step.icon;
          return (
            <div
              key={idx}
              className="p-8 rounded-3xl bg-[#171025] border border-[#9B5CFF]/20 hover:border-[#BB86FF]/40 transition-all grid grid-cols-1 md:grid-cols-12 gap-8 items-center"
            >
              <div className="md:col-span-4 flex items-center gap-6">
                <span className="text-5xl sm:text-6xl font-black text-[#9B5CFF]/40 font-mono">
                  {step.num}
                </span>
                <div className="w-14 h-14 rounded-2xl bg-[#100B1C] border border-[#9B5CFF]/30 flex items-center justify-center text-[#BB86FF] shadow-lg">
                  <Icon className="w-7 h-7" />
                </div>
              </div>

              <div className="md:col-span-8 space-y-3">
                <h3 className="text-xl font-bold text-white font-['Manrope']">{step.title}</h3>
                <p className="text-xs sm:text-sm text-[#A59BB8] leading-relaxed">{step.desc}</p>
                <div className="flex flex-wrap gap-2 pt-2">
                  {step.highlights.map((h, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg text-xs bg-[#100B1C] text-white border border-[#251B38] flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>{h}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA Box */}
      <div className="mt-16 text-center">
        <button
          onClick={() => navigate('/explore')}
          className="px-8 py-4 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-[#9B5CFF] to-[#7A22FF] hover:brightness-110 shadow-[0_0_25px_rgba(155,92,255,0.4)] transition-all inline-flex items-center gap-2"
        >
          <span>Explore Video Editors</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
