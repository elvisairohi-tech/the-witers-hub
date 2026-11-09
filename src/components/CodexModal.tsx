import React, { useState, useEffect, useRef } from 'react';
import {
  TOTAL_CODEX_CAPACITY,
  generateLiteraryCode,
  generateSampleCodeBatch,
  LiteraryCodeRecord,
} from '../game/codexEngine';
import { soundEngine } from '../audio/soundEngine';
import {
  Binary,
  Sparkles,
  Zap,
  Download,
  Copy,
  Check,
  X,
  Compass,
  ArrowRight,
  BookOpen,
  Award
} from 'lucide-react';

interface CodexModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInscribePrompt: (promptText: string) => void;
  onUnlockAccolade: (name: string) => void;
}

export const CodexModal: React.FC<CodexModalProps> = ({
  isOpen,
  onClose,
  onInscribePrompt,
  onUnlockAccolade,
}) => {
  const [currentCount, setCurrentCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('writers_opus_codex_count');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0); // 0 to 1
  const [activeCode, setActiveActiveCode] = useState<LiteraryCodeRecord>(() =>
    generateLiteraryCode(1_248_910_421)
  );
  const [sampleBatch, setSampleBatch] = useState<LiteraryCodeRecord[]>(() =>
    generateSampleCodeBatch(1_248_910_421, 6)
  );
  const [inspectIndexInput, setInspectIndexInput] = useState('1248910421');
  const [copied, setCopied] = useState(false);
  const [showApexCelebration, setShowApexCelebration] = useState(false);

  const animFrameRef = useRef<number | null>(null);

  // Save codex count
  useEffect(() => {
    try {
      localStorage.setItem('writers_opus_codex_count', currentCount.toString());
    } catch {
      // ignore
    }
  }, [currentCount]);

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  if (!isOpen) return null;

  // The grand 2-billion build-up generator
  const startTwoBillionBuildUp = () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setGenerationProgress(0);

    const startTime = performance.now();
    const durationMs = 4500; // 4.5 seconds of exhilarating ramp-up
    let lastTickTime = 0;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const rawProgress = Math.min(1, elapsed / durationMs);

      // Exponential ease-in-out curve for dramatic build up
      const curvedProgress =
        rawProgress < 0.5
          ? 4 * rawProgress * rawProgress * rawProgress
          : 1 - Math.pow(-2 * rawProgress + 2, 3) / 2;

      const newCount = Math.floor(curvedProgress * TOTAL_CODEX_CAPACITY);
      setCurrentCount(newCount);
      setGenerationProgress(curvedProgress);

      // Play audio ramp tick every ~70ms with rising frequency
      if (now - lastTickTime > 75) {
        soundEngine.playCodexRampTick(curvedProgress);
        lastTickTime = now;

        // Sample a live rotating code
        if (newCount > 0) {
          const liveRecord = generateLiteraryCode(newCount);
          setActiveActiveCode(liveRecord);
        }
      }

      if (rawProgress < 1) {
        animFrameRef.current = requestAnimationFrame(tick);
      } else {
        // Complete the build-up!
        setCurrentCount(TOTAL_CODEX_CAPACITY);
        setGenerationProgress(1);
        setIsGenerating(false);

        // Apex completion sounds and celebration
        soundEngine.playCodexApexCompletion();
        setShowApexCelebration(true);
        onUnlockAccolade('Architect of Two Billion Worlds');

        // Refresh sample batch at 2 billion
        setSampleBatch(generateSampleCodeBatch(TOTAL_CODEX_CAPACITY - 5, 6));
        setActiveActiveCode(generateLiteraryCode(TOTAL_CODEX_CAPACITY));

        setTimeout(() => {
          setShowApexCelebration(false);
        }, 3500);
      }
    };

    animFrameRef.current = requestAnimationFrame(tick);
  };

  const handleInspectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(inspectIndexInput.replace(/,/g, ''), 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= TOTAL_CODEX_CAPACITY) {
      const code = generateLiteraryCode(parsed);
      setActiveActiveCode(code);
      setSampleBatch(generateSampleCodeBatch(parsed, 6));
    }
  };

  const handleRandomSeed = () => {
    const randomIdx = Math.floor(Math.random() * TOTAL_CODEX_CAPACITY) + 1;
    setInspectIndexInput(randomIdx.toString());
    const code = generateLiteraryCode(randomIdx);
    setActiveActiveCode(code);
    setSampleBatch(generateSampleCodeBatch(randomIdx, 6));
    soundEngine.playKeyClick();
  };

  const handleCopyCodes = () => {
    const text = sampleBatch
      .map(
        (c) =>
          `Code #${c.index.toLocaleString()} [${c.codeId}] - "${c.seedTitle}" (${c.genre})\nPrompt: ${c.promptSnippet}\n`
      )
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadRegistry = () => {
    const sample = generateSampleCodeBatch(activeCode.index, 50);
    const content = `THE WRITER'S OPUS — TWO BILLION CODEX REGISTRY\nGenerated Capacity: ${TOTAL_CODEX_CAPACITY.toLocaleString()} Unique Literary Codes\nActive Inspection Index: ${activeCode.index.toLocaleString()}\n\n` +
      sample
        .map(
          (c) =>
            `----------------------------------------\nINDEX: #${c.index.toLocaleString()} of 2,000,000,000\nREGISTRY ID: ${c.codeId}\nRARITY: ${c.rarity}\nGENRE: ${c.genre}\nTITLE: ${c.seedTitle}\nTHEME: ${c.theme}\nPROMPT: ${c.promptSnippet}\n`
        )
        .join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `The_Writers_Opus_2_Billion_Codex_Sample.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const percentProgress = ((currentCount / TOTAL_CODEX_CAPACITY) * 100).toFixed(1);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 p-4 select-none">
      <div className="bg-[#10131a] border border-[#382f25] rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-[#8c8172] hover:text-[#f5efe3] hover:bg-[#1f2430] rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 text-xs text-[#d4af37] mb-1">
          <Binary className="w-4 h-4" />
          <span className="font-sans font-medium uppercase tracking-wider">
            The Combinatorial Matrix of Babel
          </span>
        </div>
        <h2 className="font-literary text-3xl sm:text-4xl text-[#f5efe3] tracking-tight">
          Two Billion Literary Codes
        </h2>
        <p className="text-xs text-[#9e917f] mt-1 leading-relaxed">
          In Jorge Luis Borges&apos; infinite library, every permutation of thought exists.
          This generator builds up and registers 2,000,000,000 discrete story blueprints,
          narrative ciphers, and atmospheric seeds.
        </p>

        {/* Build-Up Surge Hero Box */}
        <div className="mt-5 p-5 rounded-xl bg-[#161a24] border border-[#382e23] relative overflow-hidden">
          {/* Subtle gold grid background */}
          <div className="flex items-center justify-between text-xs text-[#9e917f] mb-2">
            <span className="uppercase tracking-wider font-medium text-[#d4af37]">
              Build-Up Permutation Generator
            </span>
            <span className="font-mono tabular-nums text-[#f5efe3]">
              {percentProgress}% Generated
            </span>
          </div>

          {/* Big Counter readout */}
          <div className="font-mono tabular-nums text-3xl sm:text-5xl font-bold tracking-tight text-[#fbf8f2] my-2">
            {currentCount.toLocaleString()}
            <span className="text-sm sm:text-base font-normal text-[#8c8070] ml-2">
              / 2,000,000,000 codes
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-3 bg-[#0a0c10] rounded-full overflow-hidden border border-[#2b241e] my-3">
            <div
              className="h-full bg-gradient-to-r from-[#997818] via-[#d4af37] to-[#fff1b8] transition-all duration-75"
              style={{ width: `${(currentCount / TOTAL_CODEX_CAPACITY) * 100}%` }}
            />
          </div>

          {/* Action to trigger 2 Billion build-up */}
          <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
            <div className="text-xs text-[#8c8070]">
              {isGenerating ? (
                <span className="text-[#d4af37] animate-pulse flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  Generating two billion code permutations at warp velocity...
                </span>
              ) : currentCount >= TOTAL_CODEX_CAPACITY ? (
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  All 2,000,000,000 codes indexed and synthesized!
                </span>
              ) : (
                <span>Launch the build-up to generate all 2,000,000,000 codes</span>
              )}
            </div>

            <button
              onClick={startTwoBillionBuildUp}
              disabled={isGenerating}
              className={`px-5 py-2.5 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
                isGenerating
                  ? 'bg-[#2b251e] text-[#736858] cursor-not-allowed'
                  : 'bg-[#d4af37] hover:bg-[#e4c254] text-[#111317] shadow-lg transform hover:scale-105 active:scale-95'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>
                {currentCount >= TOTAL_CODEX_CAPACITY
                  ? 'Regenerate 2 Billion Codes'
                  : 'Generate 2 Billion Build-Up'}
              </span>
            </button>
          </div>
        </div>

        {/* Individual Code Inspector */}
        <div className="mt-6 p-4 rounded-xl bg-[#141720] border border-[#2d251d]">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="text-xs font-medium uppercase tracking-wider text-[#d4af37] flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5" />
              <span>Inspect Code by Index (1 to 2,000,000,000)</span>
            </div>

            <form onSubmit={handleInspectSubmit} className="flex items-center gap-2">
              <input
                type="text"
                value={inspectIndexInput}
                onChange={(e) => setInspectIndexInput(e.target.value)}
                placeholder="Index (e.g. 1,000,000,000)"
                className="px-3 py-1 bg-[#090b0e] border border-[#30261f] rounded-lg text-xs font-mono text-[#f5efe3] focus:outline-none focus:border-[#d4af37] w-36"
              />
              <button
                type="submit"
                className="px-2.5 py-1 text-xs bg-[#222834] hover:bg-[#2e3646] text-[#f5efe3] rounded-lg transition-colors cursor-pointer"
              >
                Inspect
              </button>
              <button
                type="button"
                onClick={handleRandomSeed}
                className="px-2.5 py-1 text-xs bg-[#1f221a] hover:bg-[#2c3224] text-[#d4af37] border border-[#3b3a27] rounded-lg transition-colors cursor-pointer"
              >
                Random
              </button>
            </form>
          </div>

          {/* Active Inspected Code Card */}
          <div className="p-3.5 rounded-lg bg-[#0c0e14] border border-[#231d17]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-[#d4af37] font-semibold">
                  {activeCode.codeId}
                </span>
                <span className="text-[11px] font-mono text-[#736859]">
                  # {activeCode.index.toLocaleString()}
                </span>
              </div>
              <span
                className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                  activeCode.rarity === 'Transcendent'
                    ? 'bg-amber-900/40 text-amber-300 border border-amber-600/50'
                    : activeCode.rarity === 'Mythic'
                    ? 'bg-purple-900/40 text-purple-300 border border-purple-600/50'
                    : activeCode.rarity === 'Rare'
                    ? 'bg-blue-900/40 text-blue-300 border border-blue-600/50'
                    : 'text-[#8c8070]'
                }`}
              >
                {activeCode.rarity}
              </span>
            </div>

            <h4 className="font-literary text-lg text-[#f5efe3] font-semibold mt-1">
              {activeCode.seedTitle}
            </h4>

            <div className="flex items-center gap-2 text-[11px] text-[#8e816f] mt-0.5 mb-2">
              <span>{activeCode.genre}</span>
              <span aria-hidden="true">·</span>
              <span>Theme: {activeCode.theme}</span>
            </div>

            <p className="text-xs text-[#b8ab97] font-literary italic bg-[#10131a] p-2.5 rounded border border-[#221c16] mb-3">
              &ldquo;{activeCode.promptSnippet}&rdquo;
            </p>

            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-[#635a4d]">
                Hash: 0x{activeCode.hashHex}
              </span>
              <button
                onClick={() => {
                  onInscribePrompt(activeCode.promptSnippet);
                  onClose();
                }}
                className="px-3 py-1 text-xs font-medium text-[#111317] bg-[#d4af37] hover:bg-[#e4c254] rounded transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Inscribe Prompt to Desk</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sample Stream Batch */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-[#8a7e6f] mb-3">
            <span>Sampled Registry Batch</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyCodes}
                className="hover:text-[#f5efe3] transition-colors flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                onClick={handleDownloadRegistry}
                className="hover:text-[#f5efe3] transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>Download Sample</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {sampleBatch.map((item) => (
              <div
                key={item.index}
                onClick={() => setActiveActiveCode(item)}
                className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                  activeCode.index === item.index
                    ? 'bg-[#1b212c] border-[#d4af37]'
                    : 'bg-[#0e1017] border-[#221b15] hover:border-[#3d3224]'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] text-[#8c8070] mb-0.5">
                  <span className="font-mono text-[#d4af37]">{item.codeId}</span>
                  <span className="font-mono">#{item.index.toLocaleString()}</span>
                </div>
                <div className="font-literary text-sm text-[#f5efe3] truncate">
                  {item.seedTitle}
                </div>
                <div className="text-[11px] text-[#736859] truncate">{item.genre}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2 Billion Apex Celebration Modal */}
      {showApexCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 pointer-events-auto">
          <div className="bg-[#141720] border-2 border-[#d4af37] rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#d4af37]/20 border-2 border-[#d4af37] flex items-center justify-center text-[#d4af37]">
              <Award className="w-10 h-10" />
            </div>

            <h3 className="font-literary text-3xl text-[#f5efe3] mb-1">
              Two Billion Codes Synthesized!
            </h3>
            <p className="text-sm text-[#d4af37] font-literary italic mb-4">
              All 2,000,000,000 story permutations registered into the Infinite Opus.
            </p>

            <div className="p-3 bg-[#0a0d12] rounded-lg border border-[#2d251d] text-xs text-[#b8ab97] font-literary mb-2">
              Accolade Unlocked: &ldquo;Architect of Two Billion Worlds&rdquo;
            </div>
            <div className="text-xs text-[#7e7363]">
              +500 Literary Acclaim Awarded
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
