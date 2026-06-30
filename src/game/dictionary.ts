import type { PuzzleSeed } from "./types";

export const dictionaryVersion = "dictionary-api-2026-06-30";

export const puzzleSeeds: readonly PuzzleSeed[] = [
  {
    id: "sunlit-archive",
    centerLetter: "a",
    outerLetters: ["c", "e", "h", "r", "s", "t"]
  },
  {
    id: "bright-bleat",
    centerLetter: "e",
    outerLetters: ["a", "b", "l", "r", "s", "t"]
  },
  {
    id: "clover-mint",
    centerLetter: "o",
    outerLetters: ["c", "l", "m", "n", "r", "t"]
  },
  {
    id: "gentle-flair",
    centerLetter: "i",
    outerLetters: ["a", "f", "g", "l", "n", "r"]
  }
] as const;

export function normalizeWord(word: string): string {
  return word.trim().toLowerCase();
}
