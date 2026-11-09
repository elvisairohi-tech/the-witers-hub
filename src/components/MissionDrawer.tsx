import React from 'react';
import { InfiniteChapter, WriterStats } from '../game/missionEngine';
import { Award, BookOpen, CheckCircle, Compass, Sparkles, X, ChevronRight } from 'lucide-react';

interface MissionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  chapter: InfiniteChapter;
  stats: WriterStats;
  onNextChapter: () => void;
}

export const MissionDrawer: React.FC<MissionDrawerProps> = ({
  isOpen,
  onClose,
  chapter,
  stats,
  onNextChapter,
}) => {
  if (!isOpen) return null;

  const milestones = [
    { target: 100, label: 'The Solitary Scribe', done: stats.careerWords >= 100 },
    { target: 500, label: 'Midnight Draftsman', done: stats.careerWords >= 500 },
    { target: 2000, label: 'Literary Journal Feature', done: stats.careerWords >= 2000 },
    { target: 10000, label: 'First Bound Novella', done: stats.careerWords >= 10000 },
    { target: 50000, label: 'The Magnum Opus', done: stats.careerWords >= 50000 },
  ];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4 select-none">
      <div className="bg-[#12151c] border border-[#352c22] rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-[#8c8172] hover:text-[#f5efe3] hover:bg-[#1f2430] rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Drawer Header */}
        <div className="flex items-center gap-2.5 text-xs text-[#d4af37] mb-1">
          <Compass className="w-4 h-4" />
          <span className="font-sans font-medium uppercase tracking-wider">The Infinite Odyssey</span>
        </div>
        <h2 className="font-literary text-3xl text-[#f5efe3] tracking-tight">
          Infinite Missions of the Writer&apos;s Life
        </h2>
        <p className="text-xs text-[#9c8f7d] mt-1 leading-relaxed">
          Every author&apos;s life is an unbounded series of chapters—from the fear of the blank vellum
          to midnight revisions and the golden breakthrough. The mission engine produces perpetual chapters.
        </p>

        {/* Current Mission Spotlight */}
        <div className="mt-6 p-4 rounded-xl bg-[#181d27] border border-[#382f25]">
          <div className="flex items-center justify-between text-xs text-[#9e917f] mb-2">
            <span>Current Mission: Chapter {chapter.chapterNumber}</span>
            <span className="text-[#d4af37] font-medium">{chapter.genre}</span>
          </div>

          <h3 className="font-literary text-xl text-[#f5efe3] mb-1">
            {chapter.title}
          </h3>
          <p className="text-xs text-[#b8ab97] italic font-literary mb-3">
            {chapter.subtitle}
          </p>

          <div className="space-y-2 mt-3 pt-3 border-t border-[#29231c]">
            {chapter.objectives.map((obj) => (
              <div key={obj.id} className="flex items-center justify-between text-xs">
                <span className="text-[#c7baa7]">{obj.label}</span>
                <span className="font-mono tabular-nums text-[#d4af37]">
                  Target: {obj.target} {obj.unit}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-[#7e7363]">
              Completion Reward: +{chapter.rewardAcclaim} Acclaim &middot; Epiphany Metaphor
            </span>
            <button
              onClick={() => {
                onClose();
              }}
              className="px-3 py-1.5 text-xs font-semibold text-[#111317] bg-[#d4af37] hover:bg-[#e4c254] rounded-lg transition-colors cursor-pointer"
            >
              Resume Writing
            </button>
          </div>
        </div>

        {/* Career Milestones */}
        <div className="mt-6">
          <div className="text-xs font-medium uppercase tracking-wider text-[#8a7e6f] mb-3 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Lifetime Word Count Milestones</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {milestones.map((ms, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg border flex items-center justify-between text-xs ${
                  ms.done
                    ? 'bg-[#18261e] border-[#294232] text-[#c9e8d4]'
                    : 'bg-[#0f1117] border-[#26201a] text-[#7d7365]'
                }`}
              >
                <div>
                  <div className="font-medium text-[#f5efe3]">{ms.label}</div>
                  <div className="text-[11px] font-mono tabular-nums">{ms.target.toLocaleString()} words</div>
                </div>
                {ms.done ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                ) : (
                  <span className="text-[11px] text-[#635b51]">In Progress</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Collected Metaphors Grimoire */}
        <div className="mt-6">
          <div className="text-xs font-medium uppercase tracking-wider text-[#8a7e6f] mb-3 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Collected Literary Metaphors ({stats.collectedMetaphors.length})</span>
          </div>

          <div className="space-y-2">
            {stats.collectedMetaphors.map((meta, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-[#0e1017] border border-[#26201a] text-xs text-[#b8ab97] font-literary italic"
              >
                &ldquo;{meta}&rdquo;
              </div>
            ))}
          </div>
        </div>

        {/* Skip to Next Infinite Chapter option */}
        <div className="mt-6 pt-4 border-t border-[#29231c] flex items-center justify-between">
          <span className="text-xs text-[#7e7363]">
            Want a new creative direction?
          </span>
          <button
            onClick={() => {
              onNextChapter();
              onClose();
            }}
            className="px-3 py-1.5 text-xs text-[#d4af37] hover:text-[#f5efe3] border border-[#3b3227] hover:bg-[#1a1e27] rounded-lg transition-colors cursor-pointer flex items-center gap-1"
          >
            <span>Generate Next Chapter ({chapter.chapterNumber + 1})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
