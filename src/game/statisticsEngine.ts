import type { DailyProgress, Puzzle } from "./types";

export function createEmptyProgress(puzzle: Puzzle): DailyProgress {
  return {
    puzzleId: puzzle.id,
    foundWords: [],
    updatedAt: new Date().toISOString()
  };
}

export function addFoundWord(
  progress: DailyProgress,
  word: string
): DailyProgress {
  if (progress.foundWords.includes(word)) {
    return progress;
  }

  return {
    ...progress,
    foundWords: [...progress.foundWords, word].sort(),
    updatedAt: new Date().toISOString()
  };
}
