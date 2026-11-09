import React, { useState, useEffect } from 'react';
import { X, Play, Pause, RotateCcw, Wind, Moon, Feather } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

interface SanctuaryZenProps {
  isOpen: boolean;
  onClose: () => void;
}

const CONTEMPLATIONS = [
  "Protect the time and space in which you write. Keep everybody away from it, even the people who are most dear to you.",
  "Write while the heat is in you. The writer who postpones the recording of his thoughts uses an iron that has cooled.",
  "The secret to writing is that you cannot wait for inspiration. You must go after it with a club.",
  "A quiet room, a steady rain outside, and a single lantern—this is all the soul ever needed to find its voice.",
  "Every sentence typed is an anchor dropped into the sea of time, declaring: I was here, and I saw beauty.",
];

export const SanctuaryZen: React.FC<SanctuaryZenProps> = ({ isOpen, onClose }) => {
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');

  // Pomodoro countdown
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((s) => s - 1);
      }, 1000);
    } else if (secondsLeft === 0) {
      soundEngine.playCarriageBell();
      setIsActive(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, secondsLeft]);

  // Breathing pacer cycle (4s inhale, 4s hold, 4s exhale)
  useEffect(() => {
    if (!isOpen) return;
    const breathInterval = setInterval(() => {
      setBreathPhase((prev) => {
        if (prev === 'Inhale') return 'Hold';
        if (prev === 'Hold') return 'Exhale';
        return 'Inhale';
      });
    }, 4000);
    return () => clearInterval(breathInterval);
  }, [isOpen]);

  if (!isOpen) return null;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#090b0e]/95 p-4 select-none">
      <div className="max-w-xl w-full text-center relative py-8 px-6">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-2 text-[#8c8070] hover:text-[#f5efe3] hover:bg-[#151922] rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center justify-center gap-2 text-xs text-[#d4af37] mb-2">
          <Moon className="w-4 h-4" />
          <span className="uppercase tracking-widest font-medium">The Writer&apos;s Sanctuary</span>
        </div>

        <h2 className="font-literary text-4xl text-[#f5efe3] mb-3 tracking-tight">
          Solitude & Deep Flow
        </h2>

        {/* Breathing Orb */}
        <div className="my-8 flex flex-col items-center justify-center">
          <div
            className={`w-32 h-32 rounded-full border border-[#d4af37]/40 flex items-center justify-center transition-all duration-1000 shadow-2xl ${
              breathPhase === 'Inhale'
                ? 'scale-110 bg-[#d4af37]/10 border-[#d4af37]'
                : breathPhase === 'Hold'
                ? 'scale-110 bg-[#d4af37]/15 border-[#e4c254]'
                : 'scale-90 bg-transparent border-[#806b32]'
            }`}
          >
            <div className="text-center">
              <Wind className="w-5 h-5 text-[#d4af37] mx-auto mb-1 animate-pulse" />
              <div className="text-xs uppercase tracking-widest text-[#f5efe3] font-medium">
                {breathPhase}
              </div>
            </div>
          </div>
          <span className="text-[11px] text-[#736858] mt-3">Rhythmic Deep Breathing for Creative Clarity</span>
        </div>

        {/* Pomodoro Focus Timer */}
        <div className="my-6 p-4 rounded-xl bg-[#12151d] border border-[#26201a] max-w-xs mx-auto">
          <div className="text-[11px] uppercase tracking-wider text-[#827564] mb-1">
            Midnight Focus Timer
          </div>
          <div className="font-mono tabular-nums text-4xl text-[#f5efe3] font-light mb-3">
            {timeFormatted}
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setIsActive(!isActive)}
              className="p-2 text-[#111317] bg-[#d4af37] hover:bg-[#e4c254] rounded-lg transition-colors cursor-pointer"
            >
              {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={() => {
                setIsActive(false);
                setSecondsLeft(25 * 60);
              }}
              className="p-2 text-[#998b79] hover:text-[#f5efe3] bg-[#1a1e27] hover:bg-[#252b38] rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Rotating Contemplation */}
        <div
          onClick={() => setQuoteIdx((q) => (q + 1) % CONTEMPLATIONS.length)}
          className="mt-6 p-4 rounded-xl bg-[#0f1118] border border-[#231e18] cursor-pointer hover:border-[#382f25] transition-colors"
        >
          <p className="font-literary text-base italic text-[#c7baa7] leading-relaxed">
            &ldquo;{CONTEMPLATIONS[quoteIdx]}&rdquo;
          </p>
          <div className="text-[11px] text-[#6e6354] mt-2">Click to contemplate next thought</div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 text-xs text-[#d4af37] hover:underline cursor-pointer"
        >
          Return to the Typewriter Desk
        </button>
      </div>
    </div>
  );
};
