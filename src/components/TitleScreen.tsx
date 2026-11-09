import React, { useEffect } from 'react';
import { Feather, BookOpen, Sparkles } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

interface TitleScreenProps {
  onStart: () => void;
  careerWords: number;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onStart, careerWords }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        soundEngine.playCarriageBell();
        onStart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStart]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between p-8 sm:p-12 bg-gradient-to-t from-[#090b0e] via-[#090b0e]/80 to-transparent pointer-events-auto select-none">
      {/* Top subtle brand badge */}
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#a89d8d]">
        <Feather className="w-4 h-4 text-[#d4af37]" />
        <span>The Literary Odyssey · Infinite Life</span>
      </div>

      {/* Centerpiece Hero Title Lockup with inline SVG */}
      <div className="flex flex-col items-center text-center max-w-2xl mx-auto my-auto">
        {/* Bespoke inline SVG quill & typewriter insignia */}
        <div className="mb-6">
          <svg
            width="84"
            height="84"
            viewBox="0 0 84 84"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-[#d4af37]"
          >
            <circle cx="42" cy="42" r="39" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
            <circle cx="42" cy="42" r="32" stroke="currentColor" strokeWidth="1" opacity="0.4" />
            {/* Elegant quill & typewriter mechanical hammer motif */}
            <path
              d="M26 58C32 54 38 46 44 34C48 26 54 18 58 14C56 22 50 32 44 38C38 44 32 50 26 58Z"
              fill="currentColor"
              fillOpacity="0.25"
            />
            <path
              d="M58 14C54 18 48 26 44 34C38 46 32 54 26 58L22 62L26 58C28 54 32 48 36 42"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M22 62L24 54L30 60L22 62Z"
              fill="currentColor"
            />
            <circle cx="42" cy="42" r="3" fill="currentColor" />
          </svg>
        </div>

        <h1 className="font-literary text-5xl sm:text-7xl font-normal tracking-tight text-[#fbf8f2] leading-none mb-3">
          The Writer&apos;s Opus
        </h1>

        <p className="font-literary text-lg sm:text-xl text-[#d4af37] italic max-w-xl mx-auto mb-3">
          An infinite journey through the solitary room, the mechanical hammer, and the alchemy of thought.
        </p>

        <p className="text-xs text-[#9c8f7d] max-w-md mx-auto leading-relaxed mb-8">
          Face the blank page, cultivate peak flow, conquer writer&apos;s block, and inscribe infinite chapters
          into the immortal canon of your literary life.
        </p>

        {/* Start CTA Button */}
        <button
          onClick={() => {
            soundEngine.playCarriageBell();
            onStart();
          }}
          className="px-8 py-3.5 text-sm font-semibold tracking-wide text-[#111317] bg-[#d4af37] hover:bg-[#e4c254] transition-all transform hover:scale-105 active:scale-95 rounded-xl shadow-lg cursor-pointer flex items-center gap-2"
        >
          <BookOpen className="w-4 h-4" />
          <span>Enter the Sanctum</span>
          <span className="text-[11px] font-mono text-[#111317]/75 font-normal ml-1">
            [Space / Enter]
          </span>
        </button>
      </div>

      {/* Flat control-hint line as required by Game Craft Guidelines */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between text-xs text-[#736859] pt-4 border-t border-[#241e18] gap-2">
        <div className="flex items-center gap-2">
          <span>Keyboard Type</span>
          <span aria-hidden="true">·</span>
          <span>Enter Carriage Return</span>
          <span aria-hidden="true">·</span>
          <span>Click Spark Inspiration</span>
        </div>

        <div className="flex items-center gap-2.5 font-mono tabular-nums text-xs">
          <span className="text-[#a89d8d]">2,000,000,000 Codes Indexed</span>
          <span aria-hidden="true" className="text-[#524434]">·</span>
          <span className="text-[#d4af37]">Career: {careerWords.toLocaleString()} words inscribed</span>
        </div>
      </div>
    </div>
  );
};
