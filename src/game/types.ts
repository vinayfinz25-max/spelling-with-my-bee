export type Letter = string;

export interface Puzzle {
  id: string;
  date: string;
  centerLetter: Letter;
  outerLetters: readonly Letter[];
  letters: readonly Letter[];
  dictionaryVersion: string;
}

export interface PuzzleSeed {
  id: string;
  centerLetter: Letter;
  outerLetters: readonly Letter[];
}

export type GuessFailureReason =
  | "already-found"
  | "not-in-dictionary"
  | "dictionary-unavailable"
  | "too-short"
  | "missing-center-letter"
  | "uses-invalid-letter";

export type GuessResult =
  | {
      status: "accepted";
      word: string;
      points: number;
      isPangram: boolean;
    }
  | {
      status: "rejected";
      word: string;
      reason: GuessFailureReason;
    };

export interface ScoreSummary {
  score: number;
  foundCount: number;
  rank: Rank;
}

export interface Rank {
  name: string;
  threshold: number;
}

export interface DailyProgress {
  puzzleId: string;
  foundWords: readonly string[];
  updatedAt: string;
}
