import React, { useState, useEffect, useRef, useCallback } from 'react';
import { InfiniteChapter, WriterStats } from '../game/missionEngine';
import { soundEngine } from '../audio/soundEngine';
import { Sparkles, Check, Bookmark, RotateCcw, Award } from 'lucide-react';

interface TypewriterConsoleProps {
  chapter: InfiniteChapter;
  stats: WriterStats;
  onTypeChar: (char: string) => void;
  onCarriageReturn: () => void;
  onChapterComplete: () => void;
  onAddWords: (count: number) => void;
  onIncrementEpiphany: () => void;
  customPrompt?: string;
  onOpenCodex?: () => void;
}

export const TypewriterConsole: React.FC<TypewriterConsoleProps> = ({
  chapter,
  stats,
  onTypeChar,
  onCarriageReturn,
  onChapterComplete,
  onAddWords,
  onIncrementEpiphany,
  customPrompt,
  onOpenCodex,
}) => {
  const [typedContent, setTypedContent] = useState('');
  const [isFreeWrite, setIsFreeWrite] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [lastCharCount, setLastCharCount] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Objectives calculation
  const wordCount = typedContent.trim() ? typedContent.trim().split(/\s+/).length : 0;
  const wordObjective = chapter.objectives.find((o) => o.id === 'words');
  const targetWords = wordObjective ? wordObjective.target : 50;
  const isWordTargetMet = wordCount >= targetWords;
  const isFlowTargetMet = stats.flowState >= 65;

  // Check overall chapter completion
  const handleCompleteCheck = useCallback(() => {
    if (isWordTargetMet && !showCelebration) {
      soundEngine.playEpiphanyChime();
      setShowCelebration(true);
      setTimeout(() => {
        onChapterComplete();
        setShowCelebration(false);
        setTypedContent('');
      }, 2500);
    }
  }, [isWordTargetMet, showCelebration, onChapterComplete]);

  // Handle typing inside textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Escape or special keys
    if (e.key === 'Enter') {
      soundEngine.playCarriageBell();
      onCarriageReturn();
      return;
    }

    if (e.key.length === 1) {
      soundEngine.playKeyClick();
      onTypeChar(e.key);

      // Periodically trigger carriage bell on long lines
      if (typedContent.length > 0 && typedContent.length % 55 === 0) {
        soundEngine.playCarriageBell();
        onCarriageReturn();
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setTypedContent(newText);

    // Calculate delta words
    const wordsNow = newText.trim() ? newText.trim().split(/\s+/).length : 0;
    const wordsBefore = lastCharCount;
    if (wordsNow > wordsBefore) {
      onAddWords(wordsNow - wordsBefore);
      setLastCharCount(wordsNow);
    }

    // Check if target met
    if (wordsNow >= targetWords && !showCelebration) {
      handleCompleteCheck();
    }
  };

  // Keyboard shortcut listener to auto-focus when clicking anywhere on desk
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        textareaRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  return (
    <div className="fixed top-20 left-6 right-6 md:right-auto md:w-[480px] z-10 select-none pointer-events-auto">
      {/* Chapter Parchment Card */}
      <div className="bg-[#141720]/95 border border-[#332a22] rounded-xl p-5 shadow-2xl transition-all">
        {/* Chapter Header */}
        <div className="mb-4 pb-3 border-b border-[#2d241c]">
          <div className="flex items-center justify-between text-xs text-[#9c8f7d] mb-1">
            <span>Chapter {chapter.chapterNumber}</span>
            <span aria-hidden="true">·</span>
            <span>{chapter.genre}</span>
            <span aria-hidden="true">·</span>
            <span className="text-[#d4af37]">{chapter.objectives[0].target} words needed</span>
          </div>

          <h2 className="font-literary text-2xl text-[#f5efe3] tracking-tight">
            {chapter.title}
          </h2>
          <p className="text-xs text-[#b8ab97] italic mt-1 font-literary">
            &ldquo;{chapter.themeQuote.text}&rdquo; — {chapter.themeQuote.author}
          </p>
        </div>

        {/* Guided prompt, 2B Codex prompt, or free write toggle */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-wider text-[#7e7363] font-medium">
              {isFreeWrite ? 'Free Writing Manuscript' : customPrompt ? '2B Codex Inscription' : 'Chapter Inscription'}
            </span>
            {onOpenCodex && !isFreeWrite && (
              <button
                onClick={onOpenCodex}
                className="text-[10px] text-[#d4af37] bg-[#1d222e] hover:bg-[#283042] px-1.5 py-0.5 rounded border border-[#382f25] cursor-pointer"
              >
                2B Codes
              </button>
            )}
          </div>
          <button
            onClick={() => setIsFreeWrite(!isFreeWrite)}
            className="text-[11px] text-[#d4af37] hover:underline cursor-pointer"
          >
            {isFreeWrite ? 'Use Prompt' : 'Switch to Free Write'}
          </button>
        </div>

        {/* Suggested inspiration text if in prompt mode */}
        {!isFreeWrite && (
          <div className="bg-[#0c0e14] p-3 rounded-lg border border-[#251f19] mb-3 text-xs leading-relaxed text-[#b5a793] font-literary">
            {customPrompt || chapter.promptText}
          </div>
        )}

        {/* Live Typing Parchment Area */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={typedContent}
            onKeyDown={handleKeyDown}
            onChange={handleChange}
            placeholder="Strike the keys to type your story into the platen..."
            rows={4}
            className="w-full bg-[#0a0c10] border border-[#30261f] rounded-lg p-3 text-sm text-[#f5efe3] font-typewriter placeholder-[#52483d] focus:outline-none focus:border-[#d4af37] resize-none leading-relaxed transition-colors shadow-inner"
          />

          {/* Word count, typing velocity and status footer */}
          <div className="flex items-center justify-between text-xs text-[#8c8070] mt-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono tabular-nums text-[#d4af37]">
                {wordCount} / {targetWords} words
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-[#a69986]">
                {stats.typingVelocity} CPM
              </span>
              {stats.isMuseActive && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-[#f7e6a7] font-literary italic text-xs flex items-center gap-1 animate-pulse">
                    <Sparkles className="w-3 h-3 text-[#d4af37]" />
                    Muse In Flow
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setTypedContent('')}
                title="Clear current paragraph"
                className="hover:text-[#f5efe3] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              {isWordTargetMet && (
                <button
                  onClick={handleCompleteCheck}
                  className="px-2.5 py-1 text-[11px] font-semibold text-[#111317] bg-[#d4af37] hover:bg-[#e4c254] rounded transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Publish Chapter</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Current Chapter Objectives Breakdown */}
        <div className="mt-4 pt-3 border-t border-[#251f19] space-y-1.5">
          <div className="text-[11px] uppercase tracking-wider text-[#7e7363] font-medium mb-1">
            Infinite Objectives
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-[#a69986]">{chapter.objectives[0].label}</span>
            <div className="flex items-center gap-1 text-[#d4af37] font-mono tabular-nums">
              <span>{wordCount} / {targetWords}</span>
              {isWordTargetMet && <Check className="w-3.5 h-3.5 text-emerald-400 inline" />}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-[#a69986]">{chapter.objectives[1].label}</span>
            <div className="flex items-center gap-1 text-[#d4af37] font-mono tabular-nums">
              <span>{stats.flowState}% / 65%</span>
              {isFlowTargetMet && <Check className="w-3.5 h-3.5 text-emerald-400 inline" />}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-[#a69986]">{chapter.objectives[2].label}</span>
            <div className="flex items-center gap-1 text-[#d4af37] font-mono tabular-nums">
              <span>{stats.unlockedAccolades.length} sparks</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chapter Completion Wax Seal Celebration Modal */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 pointer-events-auto">
          <div className="bg-[#141720] border-2 border-[#d4af37] rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl text-center transform scale-100 transition-all">
            {/* Red Wax Seal Motif */}
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#9a2828] border-4 border-[#b53434] shadow-lg flex items-center justify-center text-[#f7e6a7]">
              <Bookmark className="w-9 h-9" />
            </div>

            <h3 className="font-literary text-3xl text-[#f5efe3] mb-1">
              Chapter {chapter.chapterNumber} Inscribed!
            </h3>
            <p className="text-sm text-[#d4af37] font-literary italic mb-4">
              &ldquo;{chapter.title}&rdquo;
            </p>

            <div className="p-3 bg-[#0a0d12] rounded-lg border border-[#2d251d] text-xs text-[#b8ab97] font-literary mb-6">
              New Metaphor Discovered: &ldquo;{chapter.epiphanyReward}&rdquo;
            </div>

            <div className="text-xs text-[#7e7363]">
              Advancing to Chapter {chapter.chapterNumber + 1}...
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
