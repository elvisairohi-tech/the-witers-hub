import React, { useState } from 'react';
import { WriterStats } from '../game/missionEngine';
import { BookOpen, Copy, Download, X, Check, Award, Star } from 'lucide-react';

interface LibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: WriterStats;
  currentDraftText: string;
}

export const LibraryModal: React.FC<LibraryModalProps> = ({
  isOpen,
  onClose,
  stats,
  currentDraftText,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    const fullText = `THE WRITER'S OPUS: INSCRIBED MANUSCRIPTS\nCareer Words: ${stats.careerWords}\nChapters Completed: ${stats.chaptersCompleted}\n\nCollected Metaphors:\n${stats.collectedMetaphors.map((m) => `• "${m}"`).join('\n')}\n\nCurrent Draft:\n${currentDraftText || '(Blank vellum sheet in roller)'}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const fullText = `THE WRITER'S OPUS: INSCRIBED MANUSCRIPTS\nCareer Words: ${stats.careerWords}\nChapters Completed: ${stats.chaptersCompleted}\n\nCollected Metaphors:\n${stats.collectedMetaphors.map((m) => `• "${m}"`).join('\n')}\n\nCurrent Draft:\n${currentDraftText || '(Blank vellum sheet in roller)'}`;
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `The_Writers_Opus_Career_${stats.careerWords}_words.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const publishedWorks = [
    {
      title: 'Nocturnes of the Arched Window',
      year: '1924',
      pages: '142 pp.',
      genre: 'Magical Realism',
      rating: '★★★★★',
      review: '"A startlingly intimate triumph of midnight prose." — The Literary Review',
    },
    {
      title: 'A Taxonomy of Unsent Letters',
      year: '1927',
      pages: '210 pp.',
      genre: 'Epistolary Solitude',
      rating: '★★★★★',
      review: '"Few books linger in the chamber of memory with such quiet ferocity." — Paris Gazette',
    },
    {
      title: 'The Clockwork Metaphor',
      year: '1931',
      pages: '318 pp.',
      genre: 'Modernist Fiction',
      rating: '★★★★☆',
      review: '"Typewriter mechanical rhythm transposed into pure literature." — Book Guild',
    },
  ];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-4 select-none">
      <div className="bg-[#12151c] border border-[#352c22] rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-[#8c8172] hover:text-[#f5efe3] hover:bg-[#1f2430] rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 text-xs text-[#d4af37] mb-1">
          <BookOpen className="w-4 h-4" />
          <span className="font-sans font-medium uppercase tracking-wider">The Author&apos;s Bookshelf</span>
        </div>
        <h2 className="font-literary text-3xl text-[#f5efe3] tracking-tight">
          Library of Inscribed Works
        </h2>
        <p className="text-xs text-[#9c8f7d] mt-1 leading-relaxed">
          The permanent archive of volumes, critical acclaim, and manuscript exports
          accumulated over the infinite journey of your writing life.
        </p>

        {/* Lifetime Summary Strip */}
        <div className="grid grid-cols-3 gap-3 my-5 p-3 rounded-xl bg-[#0b0d13] border border-[#262019] text-center">
          <div>
            <div className="text-[11px] text-[#7e7363] uppercase">Lifetime Inscription</div>
            <div className="font-mono tabular-nums text-lg text-[#d4af37] font-semibold mt-0.5">
              {stats.careerWords.toLocaleString()} <span className="text-xs font-normal text-[#8c8070]">words</span>
            </div>
          </div>
          <div>
            <div className="text-[11px] text-[#7e7363] uppercase">Chapters Written</div>
            <div className="font-mono tabular-nums text-lg text-[#f5efe3] font-semibold mt-0.5">
              {stats.chaptersCompleted + stats.currentChapterNum - 1}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-[#7e7363] uppercase">Literary Acclaim</div>
            <div className="font-mono tabular-nums text-lg text-[#d4af37] font-semibold mt-0.5">
              {stats.royaltiesEarned + stats.careerWords * 4} <span className="text-xs font-normal text-[#8c8070]">pts</span>
            </div>
          </div>
        </div>

        {/* Bound Volumes Showcase */}
        <div className="space-y-3 mb-6">
          <div className="text-xs font-medium uppercase tracking-wider text-[#8a7e6f] flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Bound Editions & Critical Reviews</span>
          </div>

          {publishedWorks.map((work, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-[#171b24] border border-[#30271e] hover:border-[#4d3e2f] transition-colors"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-literary text-lg text-[#f5efe3] font-semibold">
                  {work.title}
                </h4>
                <div className="flex items-center gap-2 text-xs text-[#d4af37]">
                  <span>{work.rating}</span>
                  <span className="text-[#8c8070] font-mono">{work.year}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-[#8e816f] mt-0.5 mb-2">
                <span>{work.genre}</span>
                <span aria-hidden="true">·</span>
                <span>{work.pages}</span>
              </div>

              <p className="text-xs text-[#b8ab97] italic font-literary border-l border-[#3a3024] pl-2.5">
                {work.review}
              </p>
            </div>
          ))}
        </div>

        {/* Export Manuscript Controls */}
        <div className="pt-4 border-t border-[#29231c] flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-[#7e7363]">
            Export your life&apos;s manuscripts as clean plain text
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 text-xs text-[#f5efe3] bg-[#1a1e27] hover:bg-[#252b38] border border-[#382f25] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#d4af37]" />}
              <span>{copied ? 'Copied' : 'Copy Manuscript'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-3 py-1.5 text-xs font-semibold text-[#111317] bg-[#d4af37] hover:bg-[#e4c254] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .TXT</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
