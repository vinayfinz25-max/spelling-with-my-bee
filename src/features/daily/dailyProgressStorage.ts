import type { DailyProgress, Puzzle } from "../../game";
import { createEmptyProgress } from "../../game";
import { readJsonFromStorage, writeJsonToStorage } from "../../lib/safeLocalStorage";

const storagePrefix = "spelling-with-my-bee/daily-progress";

export function readDailyProgress(puzzle: Puzzle): DailyProgress {
  return readJsonFromStorage(
    getProgressStorageKey(puzzle),
    createEmptyProgress(puzzle),
    isDailyProgressForPuzzle(puzzle)
  );
}

export function writeDailyProgress(progress: DailyProgress): void {
  writeJsonToStorage(`${storagePrefix}/${progress.puzzleId}`, progress);
}

function getProgressStorageKey(puzzle: Puzzle): string {
  return `${storagePrefix}/${puzzle.id}`;
}

function isDailyProgressForPuzzle(
  puzzle: Puzzle
): (value: unknown) => value is DailyProgress {
  return (value: unknown): value is DailyProgress => {
    if (typeof value !== "object" || value === null) {
      return false;
    }

    const candidate = value as Record<string, unknown>;

    return (
      candidate.puzzleId === puzzle.id &&
      Array.isArray(candidate.foundWords) &&
      candidate.foundWords.every((word) => typeof word === "string") &&
      typeof candidate.updatedAt === "string"
    );
  };
}
