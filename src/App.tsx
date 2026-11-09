import React, { useState, useEffect, useRef, useCallback } from 'react';
import { WriterScene, CameraPreset } from './three/WriterScene';
import { generateInfiniteChapter, INITIAL_WRITER_STATS, InfiniteChapter, WriterStats } from './game/missionEngine';
import { soundEngine } from './audio/soundEngine';
import { TopBar, ActiveTab } from './components/TopBar';
import { BottomDock } from './components/BottomDock';
import { TypewriterConsole } from './components/TypewriterConsole';
import { MissionDrawer } from './components/MissionDrawer';
import { LibraryModal } from './components/LibraryModal';
import { SanctuaryZen } from './components/SanctuaryZen';
import { TitleScreen } from './components/TitleScreen';
import { CodexModal } from './components/CodexModal';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<WriterScene | null>(null);

  // Game flow state
  const [gameState, setGameState] = useState<'title' | 'playing'>('title');
  const [activeTab, setActiveTab] = useState<ActiveTab>('desk');
  const [currentCamera, setCurrentCamera] = useState<CameraPreset>('desk');
  const [isMuted, setIsMuted] = useState(false);
  const [customCodexPrompt, setCustomCodexPrompt] = useState<string>('');

  // Writer stats & Infinite Mission state
  const [stats, setStats] = useState<WriterStats>(() => {
    try {
      const saved = localStorage.getItem('writers_opus_stats');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_WRITER_STATS;
  });

  const [currentChapter, setCurrentChapter] = useState<InfiniteChapter>(() =>
    generateInfiniteChapter(stats.currentChapterNum)
  );

  const [currentDraftText, setCurrentDraftText] = useState('');

  // Save stats to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('writers_opus_stats', JSON.stringify(stats));
    } catch {
      // ignore
    }
  }, [stats]);

  // Initialize Three.js scene once in isolated container
  useEffect(() => {
    if (!canvasMountRef.current) return;

    const scene = new WriterScene(canvasMountRef.current, {
      onEpiphanyClick: (index) => {
        soundEngine.playEpiphanyChime();
        setStats((prev) => ({
          ...prev,
          inspirationLevel: Math.min(100, prev.inspirationLevel + 15),
          flowState: Math.min(100, prev.flowState + 10),
          royaltiesEarned: prev.royaltiesEarned + 50,
        }));
      },
    });
    sceneRef.current = scene;

    return () => {
      scene.dispose();
      sceneRef.current = null;
    };
  }, []);

  // Handle camera changes
  const handleCameraChange = (preset: CameraPreset) => {
    setCurrentCamera(preset);
    sceneRef.current?.setCameraPreset(preset);
  };

  // Keystroke timestamps tracking for typing velocity and rhythm calculation
  const keystrokeTimesRef = useRef<number[]>([]);
  const museTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear muse timer on unmount
  useEffect(() => {
    return () => {
      if (museTimeoutRef.current) clearTimeout(museTimeoutRef.current);
    };
  }, []);

  // Extended Keystroke handler: calculates average CPM and rewards rhythmic consistency with temporary Muse status
  const handleTypeChar = useCallback((char: string) => {
    sceneRef.current?.triggerTypeStroke(char);

    const now = performance.now();
    const times = keystrokeTimesRef.current;
    times.push(now);

    // Retain keystrokes within rolling 10-second window
    const rollingWindowMs = 10000;
    while (times.length > 0 && times[0] < now - rollingWindowMs) {
      times.shift();
    }

    // Calculate average typing speed (Characters Per Minute / CPM)
    let calculatedCpm = 0;
    if (times.length >= 2) {
      const elapsedMinutes = (now - times[0]) / 60000;
      if (elapsedMinutes > 0) {
        calculatedCpm = Math.min(800, Math.round((times.length - 1) / elapsedMinutes));
      }
    } else {
      calculatedCpm = 75; // Initial instantaneous estimate
    }

    // Evaluate rhythmic consistency
    // Rhythmic consistency requires at least 4 intervals (5 keystrokes)
    // where inter-keystroke intervals show steady cadence (low coefficient of variation)
    let isRhythmic = false;
    if (times.length >= 5) {
      const intervals: number[] = [];
      for (let i = 1; i < times.length; i++) {
        intervals.push(times[i] - times[i - 1]);
      }
      const meanInterval = intervals.reduce((acc, val) => acc + val, 0) / intervals.length;

      // Active typing cadence (between 70ms and 1100ms per keystroke)
      if (meanInterval >= 70 && meanInterval <= 1100) {
        const variance =
          intervals.reduce((acc, val) => acc + Math.pow(val - meanInterval, 2), 0) /
          intervals.length;
        const stdDev = Math.sqrt(variance);
        const cv = stdDev / meanInterval; // Coefficient of variation

        // A CV < 0.72 indicates strong rhythmic consistency; high CPM also grants threshold leeway
        if (cv < 0.72 || (calculatedCpm >= 130 && cv < 0.85)) {
          isRhythmic = true;
        }
      }
    }

    // Update stats with typingVelocity metric and reward with temporary 'muse' status
    setStats((prev) => {
      const shouldActivateMuse = isRhythmic || (Boolean(prev.isMuseActive) && calculatedCpm >= 95);
      const flowMultiplier = shouldActivateMuse ? 1.5 : 0.5;
      const newFlow = Math.min(100, prev.flowState + flowMultiplier);
      const newInspiration = shouldActivateMuse
        ? Math.min(100, prev.inspirationLevel + 0.3)
        : prev.inspirationLevel;

      return {
        ...prev,
        typingVelocity: calculatedCpm,
        isMuseActive: shouldActivateMuse,
        flowState: newFlow,
        inspirationLevel: newInspiration,
      };
    });

    // Reset inactivity timer: muse status cools down after 3.5s of silence
    if (museTimeoutRef.current) {
      clearTimeout(museTimeoutRef.current);
    }
    museTimeoutRef.current = setTimeout(() => {
      setStats((prev) => ({
        ...prev,
        isMuseActive: false,
        typingVelocity: Math.round(prev.typingVelocity * 0.4),
      }));

      // Further decay velocity to 0 if still idle
      setTimeout(() => {
        setStats((prev) => ({
          ...prev,
          typingVelocity: 0,
        }));
      }, 2000);
    }, 3500);
  }, []);

  // Carriage return
  const handleCarriageReturn = useCallback(() => {
    soundEngine.playCarriageBell();
    sceneRef.current?.carriageReturn();
  }, []);

  // Word count added
  const handleAddWords = useCallback((count: number) => {
    setStats((prev) => ({
      ...prev,
      careerWords: prev.careerWords + count,
      flowState: Math.min(100, prev.flowState + 2),
    }));
  }, []);

  // Sip Dark Roast Coffee
  const handleSipCoffee = () => {
    soundEngine.playKeyClick();
    setStats((prev) => ({
      ...prev,
      coffeeLevel: prev.coffeeLevel <= 15 ? 100 : Math.max(0, prev.coffeeLevel - 15),
      inspirationLevel: Math.min(100, prev.inspirationLevel + 12),
      flowState: Math.min(100, prev.flowState + 8),
    }));
  };

  // Collect inspiration spark
  const handleCollectSparkle = () => {
    soundEngine.playEpiphanyChime();
    setStats((prev) => ({
      ...prev,
      inspirationLevel: Math.min(100, prev.inspirationLevel + 20),
      flowState: Math.min(100, prev.flowState + 15),
      royaltiesEarned: prev.royaltiesEarned + 100,
    }));
  };

  // Toggle Mute
  const handleToggleMute = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  // Chapter completed -> Advance to Next Infinite Chapter!
  const handleChapterComplete = () => {
    const nextChapterNum = stats.currentChapterNum + 1;
    const nextChapterData = generateInfiniteChapter(nextChapterNum);

    setStats((prev) => ({
      ...prev,
      currentChapterNum: nextChapterNum,
      chaptersCompleted: prev.chaptersCompleted + 1,
      royaltiesEarned: prev.royaltiesEarned + currentChapter.rewardAcclaim,
      collectedMetaphors: [...prev.collectedMetaphors, currentChapter.epiphanyReward],
      flowState: Math.max(40, prev.flowState - 20),
    }));

    setCurrentChapter(nextChapterData);
    setCurrentDraftText('');
    sceneRef.current?.updatePaperTexture('Chapter ' + nextChapterNum + ' begun...');
  };

  // Manual advance to next chapter from drawer
  const handleNextChapterDirect = () => {
    handleChapterComplete();
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#090b0e] text-[#f5efe3]">
      {/* 1. Isolated 3D Canvas Mount (stable ref outside React state loops) */}
      <div
        ref={canvasMountRef}
        className="absolute inset-0 w-full h-full z-0 pointer-events-auto"
      />

      {/* 2. Title Screen State (Game Shell Contract) */}
      {gameState === 'title' && (
        <TitleScreen
          onStart={() => setGameState('playing')}
          careerWords={stats.careerWords}
        />
      )}

      {/* 3. In-Game State & HUD */}
      {gameState === 'playing' && (
        <>
          {/* Top Bar with Single Wordmark, Clean Links & Primary CTA */}
          <TopBar
            activeTab={activeTab}
            onTabChange={(tab) => setActiveTab(tab)}
            careerWords={stats.careerWords}
            currentChapterNum={stats.currentChapterNum}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onBeginNewChapter={() => setActiveTab('missions')}
          />

          {/* Typewriter Interactive Console (The Writing Desk) */}
          {activeTab === 'desk' && (
            <TypewriterConsole
              chapter={currentChapter}
              stats={stats}
              onTypeChar={handleTypeChar}
              onCarriageReturn={handleCarriageReturn}
              onChapterComplete={handleChapterComplete}
              onAddWords={handleAddWords}
              onIncrementEpiphany={handleCollectSparkle}
              customPrompt={customCodexPrompt}
              onOpenCodex={() => setActiveTab('codex')}
            />
          )}

          {/* Unified Collapsible Bottom Dock (Three.js Skill §5) */}
          <BottomDock
            currentCamera={currentCamera}
            onCameraChange={handleCameraChange}
            onCarriageReturn={handleCarriageReturn}
            onSipCoffee={handleSipCoffee}
            coffeeLevel={stats.coffeeLevel}
            flowState={stats.flowState}
            onCollectSparkle={handleCollectSparkle}
            typingVelocity={stats.typingVelocity}
            isMuseActive={stats.isMuseActive}
            onOpenCodex={() => setActiveTab('codex')}
          />

          {/* Modals & Sub-views */}
          <MissionDrawer
            isOpen={activeTab === 'missions'}
            onClose={() => setActiveTab('desk')}
            chapter={currentChapter}
            stats={stats}
            onNextChapter={handleNextChapterDirect}
          />

          <CodexModal
            isOpen={activeTab === 'codex'}
            onClose={() => setActiveTab('desk')}
            onInscribePrompt={(promptText) => {
              setCustomCodexPrompt(promptText);
              sceneRef.current?.updatePaperTexture(promptText.slice(0, 110) + '...');
              soundEngine.playCarriageBell();
            }}
            onUnlockAccolade={(name) => {
              setStats((prev) => {
                if (prev.unlockedAccolades.includes(name)) return prev;
                return {
                  ...prev,
                  unlockedAccolades: [...prev.unlockedAccolades, name],
                  royaltiesEarned: prev.royaltiesEarned + 500,
                };
              });
            }}
          />

          <LibraryModal
            isOpen={activeTab === 'library'}
            onClose={() => setActiveTab('desk')}
            stats={stats}
            currentDraftText={currentDraftText}
          />

          <SanctuaryZen
            isOpen={activeTab === 'sanctuary'}
            onClose={() => setActiveTab('desk')}
          />
        </>
      )}
    </div>
  );
}
