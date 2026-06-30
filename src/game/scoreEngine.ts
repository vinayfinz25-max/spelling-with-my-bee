import type { Puzzle, Rank, ScoreSummary } from "./types";

export const ranks: readonly Rank[] = [
  { name: "Starter", threshold: 0 },
  { name: "Buzzing", threshold: 10 },
  { name: "Forager", threshold: 25 },
  { name: "Comb Builder", threshold: 45 },
  { name: "Nectar Pro", threshold: 70 },
  { name: "Hive Mind", threshold: 100 },
  { name: "Royal Jelly", threshold: 140 }
] as const;

export function scoreWord(word: string, letters: readonly string[]): number {
  const baseScore = word.length === 4 ? 1 : word.length;
  const pangramBonus = isScoringPangram(word, letters) ? 7 : 0;

  return baseScore + pangramBonus;
}

export function summarizeScore(
  puzzle: Puzzle,
  foundWords: readonly string[]
): ScoreSummary {
  const score = foundWords.reduce(
    (total, word) => total + scoreWord(word, puzzle.letters),
    0
  );
  return {
    score,
    foundCount: foundWords.length,
    rank: getRank(score)
  };
}

export function getRank(score: number): Rank {
  return [...ranks]
    .reverse()
    .find((rank) => score >= rank.threshold) ?? ranks[0];
}

function isScoringPangram(word: string, letters: readonly string[]): boolean {
  const uniqueLetters = new Set(word);

  return letters.every((letter) => uniqueLetters.has(letter));
}
