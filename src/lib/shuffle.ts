export const DISPLAY_LABELS = ["A", "B", "C", "D", "E"];

/** Hash FNV-1a 32 bit per derivare seed stabili da stringhe. */
export function seedFromString(value: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * PRNG deterministico (mulberry32) più uniforme sui bit bassi
 * rispetto a un LCG semplice: riduce bias su array piccoli (A/B/C).
 */
function createMulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher-Yates deterministica con PRNG seedato — ordine stabile per domanda. */
export function seededShuffle<T>(array: T[], seed: number): T[] {
  const result = [...array];
  const nextRandom = createMulberry32(seed);
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(nextRandom() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Fisher-Yates completamente casuale — usato per sorteggiare l'esame. */
export function randomShuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
