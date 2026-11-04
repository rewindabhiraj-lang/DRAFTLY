import React from 'react';
import { Film, Home, ArrowLeft } from 'lucide-react';

interface NotFoundPageProps {
  navigate: (path: string) => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ navigate }) => {
  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16 text-center">
      <div className="max-w-md space-y-5">
        <div className="w-20 h-20 rounded-3xl bg-[#171025] border border-[#9B5CFF]/30 flex items-center justify-center text-[#BB86FF] mx-auto shadow-[0_0_30px_rgba(155,92,255,0.3)]">
          <Film className="w-10 h-10" />
        </div>
        <span className="text-5xl font-black text-[#BB86FF] font-mono block">404</span>
        <h1 className="text-2xl font-bold text-white font-['Manrope']">
          Frame Out of Bounds
        </h1>
        <p className="text-xs sm:text-sm text-[#A59BB8] leading-relaxed">
          The scene or timeline you are searching for does not exist on DRAFTLY. Let's get you back to the main reel.
        </p>
        <div className="pt-2 flex items-center justify-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#9B5CFF] to-[#7A22FF] hover:brightness-110 shadow-lg flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Return Home</span>
          </button>
        </div>
      </div>
    </div>
  );
};
