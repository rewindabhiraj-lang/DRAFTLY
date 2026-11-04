import React from 'react';
import { Youtube, Instagram, Twitter, Shield, Heart } from 'lucide-react';

interface FooterProps {
  navigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ navigate }) => {
  return (
    <footer className="w-full border-t border-[#9B5CFF]/20 bg-[#080611] text-[#A59BB8] pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-[#171025]">
          {/* Brand info */}
          <div className="lg:col-span-2 space-y-4">
            <div
              onClick={() => navigate('/')}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <img
                src="https://i.postimg.cc/NjqbtJKN/Neon-Purple-Draftly-Crown-Logo.png"
                alt="DRAFTLY"
                className="h-10 w-auto object-contain filter drop-shadow-[0_0_12px_rgba(187,134,255,0.4)]"
              />
              <span className="text-2xl font-extrabold tracking-wider text-white font-['Manrope']">
                DRAFTLY
              </span>
            </div>
            <p className="text-sm text-[#A59BB8] max-w-sm leading-relaxed">
              Creative Talent. Extraordinary Results. The premier curated marketplace connecting creators, brands, and agencies with elite video editors.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-xl bg-[#171025] hover:bg-[#251B38] text-[#A59BB8] hover:text-[#BB86FF] transition-colors border border-[#9B5CFF]/20"
                aria-label="YouTube"
              >
                <Youtube className="w-4 h-4" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-xl bg-[#171025] hover:bg-[#251B38] text-[#A59BB8] hover:text-[#BB86FF] transition-colors border border-[#9B5CFF]/20"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-xl bg-[#171025] hover:bg-[#251B38] text-[#A59BB8] hover:text-[#BB86FF] transition-colors border border-[#9B5CFF]/20"
                aria-label="Twitter"
              >
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Marketplace
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  onClick={() => navigate('/explore')}
                  className="hover:text-white transition-colors"
                >
                  Explore Editors
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/how-it-works')}
                  className="hover:text-white transition-colors"
                >
                  How It Works
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/pricing')}
                  className="hover:text-white transition-colors"
                >
                  Pricing Guide
                </button>
              </li>

            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Specialties
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button onClick={() => navigate('/explore?cat=Cinematic')} className="hover:text-white">
                  Cinematic Films
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/explore?cat=Reels')} className="hover:text-white">
                  Shorts & Reels
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/explore?cat=Anime')} className="hover:text-white">
                  Anime AMVs
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/explore?cat=Motion+Graphics')} className="hover:text-white">
                  Motion Graphics
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/explore?cat=Commercial')} className="hover:text-white">
                  Commercial Ads
                </button>
              </li>
            </ul>
          </div>

          {/* Company & Legal */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Company
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button onClick={() => navigate('/about')} className="hover:text-white">
                  About Us
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/contact')} className="hover:text-white">
                  Contact Support
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/terms')} className="hover:text-white">
                  Terms & Conditions
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/privacy')} className="hover:text-white">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/admin')} className="text-xs text-[#251B38] hover:text-[#A59BB8] transition-colors">
                  Portal
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#A59BB8]/70 gap-4">
          <p>© {new Date().getFullYear()} DRAFTLY. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            Crafted for Extraordinary Creative Talent
          </p>
        </div>
      </div>
    </footer>
  );
};
