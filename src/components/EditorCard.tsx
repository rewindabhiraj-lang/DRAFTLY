import React from 'react';
import { Star, Heart, ExternalLink, Briefcase, CheckCircle2, Clock } from 'lucide-react';
import { EditorProfile } from '../types';
import { formatCurrency } from '../utils/marketplace';

interface EditorCardProps {
  editor: EditorProfile;
  isSaved?: boolean;
  onToggleSave?: (editorId: string) => void;
  onViewProfile: (editor: EditorProfile) => void;
  onHire: (editor: EditorProfile) => void;
}

export const EditorCard: React.FC<EditorCardProps> = ({
  editor,
  isSaved = false,
  onToggleSave,
  onViewProfile,
  onHire,
}) => {
  const isAvailable = editor.availability === 'Available Now';

  return (
    <div className="group relative rounded-2xl bg-[#171025] border border-[#9B5CFF]/20 hover:border-[#BB86FF]/50 p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_0_30px_rgba(155,92,255,0.2)] hover:-translate-y-1">
      {/* Top Header: Avatar, Name, Availability, Bookmark */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <img
                src={editor.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
                alt={editor.fullName}
                className="w-14 h-14 rounded-2xl object-cover border border-[#9B5CFF]/30 shadow-md group-hover:border-[#BB86FF] transition-colors"
              />
              <span
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#171025] ${
                  isAvailable ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
                title={editor.availability}
              />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h3
                  onClick={() => onViewProfile(editor)}
                  className="font-bold text-white text-base hover:text-[#BB86FF] cursor-pointer transition-colors"
                >
                  {editor.fullName}
                </h3>
                {editor.rating >= 4.8 && (
                  <span title="Top Rated Pro">
                    <CheckCircle2 className="w-4 h-4 text-[#BB86FF]" />
                  </span>
                )}
              </div>
              <p className="text-xs text-[#A59BB8] line-clamp-1 mt-0.5">
                {editor.title}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center text-amber-400 text-xs font-semibold gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{editor.rating.toFixed(1)}</span>
                  <span className="text-[#A59BB8] font-normal">({editor.reviewCount})</span>
                </div>
                <span className="text-xs text-[#A59BB8]">•</span>
                <span className="text-xs text-[#A59BB8] flex items-center gap-1">
                  <Briefcase className="w-3 h-3 text-[#BB86FF]" />
                  {editor.experience}
                </span>
              </div>
            </div>
          </div>

          {/* Bookmark Button */}
          {onToggleSave && (
            <button
              onClick={() => onToggleSave(editor.id)}
              className={`p-2 rounded-xl transition-colors border ${
                isSaved
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                  : 'bg-[#100B1C] border-[#9B5CFF]/20 text-[#A59BB8] hover:text-white hover:border-[#BB86FF]/40'
              }`}
              aria-label="Save Editor"
            >
              <Heart className={`w-4 h-4 ${isSaved ? 'fill-rose-400' : ''}`} />
            </button>
          )}
        </div>

        {/* Bio Preview */}
        <p className="text-xs text-[#A59BB8] leading-relaxed line-clamp-2 mb-4">
          {editor.bio}
        </p>

        {/* Categories & Skills */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {editor.categories.slice(0, 2).map((cat, idx) => (
            <span
              key={idx}
              className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#9B5CFF]/15 text-[#BB86FF] border border-[#9B5CFF]/30"
            >
              {cat}
            </span>
          ))}
          {editor.skills.slice(0, 3).map((skill, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded-full text-[11px] bg-[#100B1C] text-[#A59BB8] border border-[#251B38]"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Footer: Starting price & Action buttons */}
      <div className="pt-4 border-t border-[#251B38] flex items-center justify-between gap-2">
        <div>
          <span className="text-[10px] uppercase text-[#A59BB8] block tracking-wider">
            Starting from
          </span>
          <span className="text-lg font-extrabold text-white">
            {formatCurrency(editor.startingPrice)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onViewProfile(editor)}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-[#BB86FF] hover:text-white bg-[#100B1C] hover:bg-[#251B38] border border-[#9B5CFF]/30 transition-all"
          >
            Profile
          </button>
          <button
            onClick={() => onHire(editor)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#9B5CFF] to-[#7A22FF] hover:brightness-110 active:scale-95 shadow-[0_0_15px_rgba(155,92,255,0.4)] transition-all"
          >
            Hire Now
          </button>
        </div>
      </div>
    </div>
  );
};
