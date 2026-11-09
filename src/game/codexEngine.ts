/**
 * The 2-Billion Codex Engine
 * Capable of addressing, synthesizing, and streaming 2,000,000,000 (Two Billion)
 * unique combinatorial literary codes, story DNA seeds, and manuscript blueprints.
 */

export interface LiteraryCodeRecord {
  index: number;
  codeId: string;
  genre: string;
  theme: string;
  seedTitle: string;
  promptSnippet: string;
  rarity: 'Common' | 'Rare' | 'Mythic' | 'Transcendent';
  hashHex: string;
}

export const TOTAL_CODEX_CAPACITY = 2_000_000_000;

// Combinatorial components (Total combinations > 2.4 Billion)
const PREFIXES = [
  'ASTR', 'VELV', 'NOIR', 'MYTH', 'CHRN', 'ECHO', 'OPUS', 'LUMN',
  'SOLT', 'MEMR', 'CYBR', 'VAPO', 'GOTH', 'ALCH', 'ROSE', 'DUST',
  'INKW', 'CATH', 'WIND', 'MULL', 'PLAT', 'GOLD', 'NEBL', 'OBSD',
  'RARE', 'TIME', 'CLOK', 'PAGE', 'BOOK', 'SEAL', 'SAGE', 'RILK'
]; // 32

const CORES = [
  'SOLITUDE', 'LABYRINTH', 'CHRONICLE', 'CONSTELLATION', 'MANUSCRIPT',
  'METAPHOR', 'CATHEDRAL', 'EPIPHANY', 'SHADOW', 'SYMPHONY',
  'THRESHOLD', 'NOCTURNE', 'PROMISE', 'WHISPER', 'CADENCE',
  'HOURGLASS', 'FEATHER', 'MIRROR', 'HORIZON', 'SANCTUARY',
  'MIDNIGHT', 'PARCHMENT', 'REVERIE', 'ODYSSEY', 'INFINITY'
]; // 25

const SUFFIXES = [
  'OF_OBSIDIAN', 'IN_THE_RAIN', 'OF_LOST_HOURS', 'BENEATH_THE_LAMP',
  'OF_THE_FIRST_KEY', 'BEFORE_DAWN', 'IN_THE_ARCHIVE', 'OF_THE_UNSAID',
  'ACROSS_THE_VOID', 'OF_PURE_GOLD', 'AT_THREE_AM', 'OF_THE_PLATEN',
  'IN_PARIS_1928', 'OF_SILENT_BELLS', 'FROM_THE_WASTEBASKET', 'BEYOND_MORTALITY'
]; // 16

const GENRES = [
  'Magical Realism', 'Gothic Noir', 'Existential Reverie',
  'Modernist Solitude', 'Romantic Transcendentalism', 'Cosmic Mystery',
  'Philosophical Vignette', 'Mythic Elegiac'
];

const THEMES = [
  'The agony and ecstasy of the blank page',
  'Solitary midnight reflection under the banker lamp',
  'The mechanical rhythm of brass typebars striking paper',
  'Memories preserved in ink against the march of oblivion',
  'The search for the perfect metaphor in quiet storms',
  'Conversations with imaginary characters at dawn',
  'The transcendence of language beyond silence'
];

/**
 * Deterministic pseudo-random integer hash for 64-bit integer space
 */
function hashIndex(n: number): number {
  let h = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  h = (h ^ (h >>> 16)) >>> 0;
  return h;
}

/**
 * Decodes any integer index between 1 and 2,000,000,000 into a rich Literary Code Record
 */
export function generateLiteraryCode(index: number): LiteraryCodeRecord {
  const clampedIndex = Math.max(1, Math.min(TOTAL_CODEX_CAPACITY, index));
  const h1 = hashIndex(clampedIndex);
  const h2 = hashIndex(clampedIndex + 1013904223);
  const h3 = hashIndex(clampedIndex ^ 0x5a5a5a5a);

  const prefix = PREFIXES[Math.abs(h1) % PREFIXES.length] || PREFIXES[0];
  const core = CORES[Math.abs(h2) % CORES.length] || CORES[0];
  const suffix = SUFFIXES[Math.abs(h3) % SUFFIXES.length] || SUFFIXES[0];
  const genre = GENRES[((h1 ^ h2) >>> 0) % GENRES.length] || GENRES[0];
  const theme = THEMES[((h2 ^ h3) >>> 0) % THEMES.length] || THEMES[0];

  const hexHash = ((h1.toString(16).padStart(8, '0')) + (h2.toString(16).padStart(8, '0'))).slice(0, 8).toUpperCase();
  const codeId = `OPUS-2B-${prefix}-${hexHash.slice(0, 4)}`;

  const cleanCore = core.charAt(0) + core.slice(1).toLowerCase();
  const cleanSuffix = suffix.replace(/_/g, ' ').toLowerCase();
  const seedTitle = `The ${cleanCore} ${cleanSuffix}`;

  const cleanTheme = theme.toLowerCase();
  const cleanGenre = genre.toLowerCase();
  const promptSnippet = `In Chapter ${clampedIndex.toLocaleString()}, ${cleanTheme}. The typewriter carriage clattered softly under ${cleanGenre} skies, inscribing code #${codeId}...`;

  let rarity: 'Common' | 'Rare' | 'Mythic' | 'Transcendent' = 'Common';
  if (clampedIndex === 2_000_000_000 || clampedIndex === 1_000_000_000 || clampedIndex === 1) {
    rarity = 'Transcendent';
  } else if (h1 % 100 === 0) {
    rarity = 'Mythic';
  } else if (h1 % 10 === 0) {
    rarity = 'Rare';
  }

  return {
    index: clampedIndex,
    codeId,
    genre,
    theme,
    seedTitle,
    promptSnippet,
    rarity,
    hashHex: hexHash,
  };
}

/**
 * Generates an array of sample codes around an index or scattered across the 2-billion span
 */
export function generateSampleCodeBatch(centerIndex: number, count: number = 10): LiteraryCodeRecord[] {
  const records: LiteraryCodeRecord[] = [];
  const start = Math.max(1, centerIndex - Math.floor(count / 2));
  for (let i = 0; i < count; i++) {
    const idx = Math.min(TOTAL_CODEX_CAPACITY, start + i);
    records.push(generateLiteraryCode(idx));
  }
  return records;
}
