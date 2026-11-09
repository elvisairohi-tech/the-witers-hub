import React from 'react';
import { Volume2, VolumeX, Feather } from 'lucide-react';

export type ActiveTab = 'desk' | 'missions' | 'codex' | 'library' | 'sanctuary';

interface TopBarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  careerWords: number;
  currentChapterNum: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onBeginNewChapter: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onTabChange,
  careerWords,
  currentChapterNum,
  isMuted,
  onToggleMute,
  onBeginNewChapter,
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 z-30 px-6 flex items-center justify-between gap-8 border-b border-[#2a241e]/60 bg-[#0c0e12]/90 select-none">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <Feather className="w-5 h-5 text-[#d4af37]" />
        <span className="font-literary text-2xl tracking-wide text-[#f5efe3] whitespace-nowrap">
          The Writer&apos;s Opus
        </span>
      </div>

      {/* Zone 2: 5 clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#9a9184]">
        <button
          onClick={() => onTabChange('desk')}
          className={`cursor-pointer transition-colors whitespace-nowrap ${
            activeTab === 'desk' ? 'text-[#f5efe3] border-b-2 border-[#d4af37] pb-1' : 'hover:text-[#f5efe3]'
          }`}
        >
          The Desk
        </button>
        <button
          onClick={() => onTabChange('missions')}
          className={`cursor-pointer transition-colors whitespace-nowrap ${
            activeTab === 'missions' ? 'text-[#f5efe3] border-b-2 border-[#d4af37] pb-1' : 'hover:text-[#f5efe3]'
          }`}
        >
          Infinite Missions
        </button>
        <button
          onClick={() => onTabChange('codex')}
          className={`cursor-pointer transition-colors whitespace-nowrap ${
            activeTab === 'codex' ? 'text-[#f5efe3] border-b-2 border-[#d4af37] pb-1' : 'hover:text-[#f5efe3]'
          }`}
        >
          2B Codex
        </button>
        <button
          onClick={() => onTabChange('library')}
          className={`cursor-pointer transition-colors whitespace-nowrap ${
            activeTab === 'library' ? 'text-[#f5efe3] border-b-2 border-[#d4af37] pb-1' : 'hover:text-[#f5efe3]'
          }`}
        >
          The Library
        </button>
        <button
          onClick={() => onTabChange('sanctuary')}
          className={`cursor-pointer transition-colors whitespace-nowrap ${
            activeTab === 'sanctuary' ? 'text-[#f5efe3] border-b-2 border-[#d4af37] pb-1' : 'hover:text-[#f5efe3]'
          }`}
        >
          Sanctuary
        </button>
      </nav>

      {/* Zone 3: 1 primary action & quiet status */}
      <div className="flex items-center gap-4 shrink-0">
        {/* Tabular unboxed metadata */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-[#8c8273]">
          <span className="font-mono tabular-nums text-[#d4af37]">Ch. {currentChapterNum}</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums">{careerWords.toLocaleString()} words</span>
        </div>

        <button
          onClick={onToggleMute}
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          className="p-2 text-[#9a9184] hover:text-[#f5efe3] transition-colors rounded-lg bg-[#181a20]/70 border border-[#2b2520] cursor-pointer"
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[#d4af37]" />}
        </button>

        <button
          onClick={onBeginNewChapter}
          className="px-4 py-2 text-xs font-medium text-[#111317] bg-[#d4af37] hover:bg-[#e4c254] transition-colors rounded-lg whitespace-nowrap cursor-pointer shadow-sm font-sans"
        >
          Begin Chapter
        </button>
      </div>
    </header>
  );
};
