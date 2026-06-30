import { dictionaryVersion, puzzleSeeds } from "./dictionary";
import type { Puzzle, PuzzleSeed } from "./types";

const millisecondsPerDay = 86_400_000;
const epochDate = Date.UTC(2026, 0, 1);

export function createDailyPuzzle(date = new Date()): Puzzle {
  const dateKey = toUtcDateKey(date);
  const seed = selectSeed(dateKey);

  return createPuzzleFromSeed(seed, dateKey);
}

export function createPuzzleFromSeed(seed: PuzzleSeed, dateKey: string): Puzzle {
  const letters = [seed.centerLetter, ...seed.outerLetters].map((letter) =>
    letter.toLowerCase()
  );

  return {
    id: `${dateKey}-${seed.id}-${dictionaryVersion}`,
    date: dateKey,
    centerLetter: seed.centerLetter.toLowerCase(),
    outerLetters: seed.outerLetters.map((letter) => letter.toLowerCase()),
    letters,
    dictionaryVersion
  };
}

export function toUtcDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function selectSeed(dateKey: string): PuzzleSeed {
  const dayNumber = Math.floor(
    (Date.parse(`${dateKey}T00:00:00.000Z`) - epochDate) / millisecondsPerDay
  );
  const index = positiveModulo(dayNumber, puzzleSeeds.length);

  return puzzleSeeds[index];
}

function positiveModulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}
