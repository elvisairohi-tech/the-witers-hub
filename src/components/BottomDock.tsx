import React, { useState } from 'react';
import { Camera, Coffee, CornerDownLeft, Eye, EyeOff, Sparkles, Binary } from 'lucide-react';
import { CameraPreset } from '../three/WriterScene';

interface BottomDockProps {
  currentCamera: CameraPreset;
  onCameraChange: (preset: CameraPreset) => void;
  onCarriageReturn: () => void;
  onSipCoffee: () => void;
  coffeeLevel: number;
  flowState: number;
  onCollectSparkle: () => void;
  typingVelocity?: number;
  isMuseActive?: boolean;
  onOpenCodex?: () => void;
}

export const BottomDock: React.FC<BottomDockProps> = ({
  currentCamera,
  onCameraChange,
  onCarriageReturn,
  onSipCoffee,
  coffeeLevel,
  flowState,
  onCollectSparkle,
  typingVelocity = 0,
  isMuseActive = false,
  onOpenCodex,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center transition-all duration-300 max-w-[min(940px,94vw)] w-full pointer-events-auto ${
        isCollapsed ? 'translate-y-[calc(100%-28px)]' : 'translate-y-0'
      }`}
    >
      {/* Collapse / Expand Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="px-3 py-1 text-[11px] font-medium tracking-wide text-[#a89d8d] bg-[#14171e] hover:text-[#f5efe3] hover:bg-[#1a1e27] border border-b-0 border-[#2f2720] rounded-t-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-md select-none"
      >
        {isCollapsed ? (
          <>
            <Eye className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Show Dock</span>
          </>
        ) : (
          <>
            <EyeOff className="w-3.5 h-3.5" />
            <span>Hide Controls (Cinema Mode)</span>
          </>
        )}
      </button>

      {/* Main Dock Container */}
      <div className="w-full bg-[#12151c] border border-[#2e261f] rounded-xl p-3 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        {/* Camera Preset Segmented Control */}
        <div className="flex items-center gap-1 bg-[#090b0e] p-1 rounded-lg border border-[#221c17]">
          <div className="px-2 py-1 text-xs text-[#736859] flex items-center gap-1 hidden sm:flex">
            <Camera className="w-3.5 h-3.5 text-[#d4af37]" />
            <span className="font-sans">View</span>
          </div>

          <button
            onClick={() => onCameraChange('desk')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              currentCamera === 'desk'
                ? 'bg-[#2a221b] text-[#f5efe3] shadow-sm'
                : 'text-[#9e9282] hover:text-[#f5efe3]'
            }`}
          >
            Study Desk
          </button>
          <button
            onClick={() => onCameraChange('typewriter')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              currentCamera === 'typewriter'
                ? 'bg-[#2a221b] text-[#f5efe3] shadow-sm'
                : 'text-[#9e9282] hover:text-[#f5efe3]'
            }`}
          >
            Typewriter Macro
          </button>
          <button
            onClick={() => onCameraChange('window')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              currentCamera === 'window'
                ? 'bg-[#2a221b] text-[#f5efe3] shadow-sm'
                : 'text-[#9e9282] hover:text-[#f5efe3]'
            }`}
          >
            Rain Window
          </button>
          <button
            onClick={() => onCameraChange('epiphany')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              currentCamera === 'epiphany'
                ? 'bg-[#2a221b] text-[#f5efe3] shadow-sm'
                : 'text-[#9e9282] hover:text-[#f5efe3]'
            }`}
          >
            Mindscape
          </button>
        </div>

        {/* Functional Actions */}
        <div className="flex items-center gap-2">
          {/* Carriage Return Bell button */}
          <button
            onClick={onCarriageReturn}
            title="Carriage Return (Ding)"
            className="px-3 py-1.5 text-xs font-medium text-[#f5efe3] bg-[#1a1e27] hover:bg-[#252b38] border border-[#352c23] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <CornerDownLeft className="w-3.5 h-3.5 text-[#d4af37]" />
            <span className="hidden sm:inline">Carriage Return</span>
          </button>

          {/* Coffee Sip button */}
          <button
            onClick={onSipCoffee}
            title="Drink dark roast coffee to restore mental fortitude"
            className="px-3 py-1.5 text-xs font-medium text-[#f5efe3] bg-[#1a1e27] hover:bg-[#252b38] border border-[#352c23] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Coffee className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Sip Coffee ({coffeeLevel}%)</span>
          </button>

          {/* Capture Sparkle button */}
          <button
            onClick={onCollectSparkle}
            title="Collect drifting inspiration spark"
            className="px-3 py-1.5 text-xs font-medium text-[#111317] bg-[#d4af37] hover:bg-[#e4c254] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="font-semibold">Capture Spark</span>
          </button>

          {/* 2B Codex button */}
          {onOpenCodex && (
            <button
              onClick={onOpenCodex}
              title="Open Two Billion Codex Generator"
              className="px-3 py-1.5 text-xs font-medium text-[#f5efe3] bg-[#1a1e27] hover:bg-[#252b38] border border-[#352c23] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Binary className="w-3.5 h-3.5 text-[#d4af37]" />
              <span className="hidden sm:inline">2B Codex</span>
            </button>
          )}
        </div>

        {/* Flow state & typing velocity meter */}
        <div className="hidden lg:flex items-center gap-3 text-xs text-[#8c8273]">
          <div className="flex items-center gap-2">
            <span>Velocity</span>
            <span className="font-mono tabular-nums text-[#d4af37]">{typingVelocity} CPM</span>
          </div>

          <span aria-hidden="true">·</span>

          <div className="flex items-center gap-2">
            <span>Flow</span>
            <div className="w-20 h-2 bg-[#090b0e] rounded-full overflow-hidden border border-[#2b241e]">
              <div
                className="h-full bg-gradient-to-r from-[#8c6b23] to-[#d4af37] transition-all duration-300"
                style={{ width: `${flowState}%` }}
              />
            </div>
            <span className="font-mono tabular-nums text-[#d4af37]">{flowState}%</span>
          </div>

          {isMuseActive && (
            <div className="flex items-center gap-1 text-[#f7e6a7] font-serif italic text-xs animate-pulse">
              <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Muse Active (+2x Flow)</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
