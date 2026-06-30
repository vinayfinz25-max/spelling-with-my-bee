import { normalizeWord } from "./dictionary";
import type { GuessResult, Puzzle } from "./types";
import { scoreWord } from "./scoreEngine";

const minimumWordLength = 4;

export interface WordDictionary {
  isEnglishWord: (word: string) => Promise<"yes" | "no" | "unavailable">;
}

export async function validateGuess(
  puzzle: Puzzle,
  rawGuess: string,
  foundWords: readonly string[],
  dictionary: WordDictionary
): Promise<GuessResult> {
  const structuralResult = validateStructuralGuess(puzzle, rawGuess, foundWords);

  if (structuralResult.status === "rejected") {
    return structuralResult;
  }

  const dictionaryResult = await dictionary.isEnglishWord(structuralResult.word);

  if (dictionaryResult === "unavailable") {
    return {
      status: "rejected",
      word: structuralResult.word,
      reason: "dictionary-unavailable"
    };
  }

  if (dictionaryResult === "no") {
    return {
      status: "rejected",
      word: structuralResult.word,
      reason: "not-in-dictionary"
    };
  }

  return structuralResult;
}

export function validateStructuralGuess(
  puzzle: Puzzle,
  rawGuess: string,
  foundWords: readonly string[]
): GuessResult {
  const word = normalizeWord(rawGuess);

  if (word.length < minimumWordLength) {
    return { status: "rejected", word, reason: "too-short" };
  }

  if (!word.includes(puzzle.centerLetter)) {
    return { status: "rejected", word, reason: "missing-center-letter" };
  }

  if (!usesOnlyPuzzleLetters(word, puzzle.letters)) {
    return { status: "rejected", word, reason: "uses-invalid-letter" };
  }

  if (foundWords.includes(word)) {
    return { status: "rejected", word, reason: "already-found" };
  }

  return {
    status: "accepted",
    word,
    points: scoreWord(word, puzzle.letters),
    isPangram: isPangram(word, puzzle.letters)
  };
}

export function usesOnlyPuzzleLetters(
  word: string,
  letters: readonly string[]
): boolean {
  const allowedLetters = new Set(letters);

  return Array.from(word).every((letter) => allowedLetters.has(letter));
}

export function isPangram(word: string, letters: readonly string[]): boolean {
  const wordLetters = new Set(word);

  return letters.every((letter) => wordLetters.has(letter));
}
