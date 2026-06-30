import { useMemo, useState } from "react";

import {
  addFoundWord,
  createDailyPuzzle,
  englishDictionary,
  summarizeScore,
  validateGuess,
  type GuessFailureReason,
  type GuessResult
} from "../../game";
import { readDailyProgress, writeDailyProgress } from "./dailyProgressStorage";

interface DailyGameState {
  guess: string;
  feedback: string;
  puzzle: ReturnType<typeof createDailyPuzzle>;
  foundWords: readonly string[];
  shuffledOuterLetters: readonly string[];
  scoreSummary: ReturnType<typeof summarizeScore>;
  lastGuessResult: GuessResult | null;
  isCheckingWord: boolean;
  appendLetter: (letter: string) => void;
  removeLastLetter: () => void;
  clearGuess: () => void;
  shuffleLetters: () => void;
  submitGuess: () => Promise<void>;
}

export function useDailyGame(): DailyGameState {
  const puzzle = useMemo(() => createDailyPuzzle(), []);
  const [progress, setProgress] = useState(() => readDailyProgress(puzzle));
  const [guess, setGuess] = useState("");
  const [feedback, setFeedback] = useState("Find a word to begin.");
  const [lastGuessResult, setLastGuessResult] = useState<GuessResult | null>(
    null
  );
  const [isCheckingWord, setIsCheckingWord] = useState(false);
  const [shuffledOuterLetters, setShuffledOuterLetters] = useState(
    puzzle.outerLetters
  );

  const scoreSummary = useMemo(
    () => summarizeScore(puzzle, progress.foundWords),
    [progress.foundWords, puzzle]
  );

  return {
    guess,
    feedback,
    puzzle,
    foundWords: progress.foundWords,
    shuffledOuterLetters,
    scoreSummary,
    lastGuessResult,
    isCheckingWord,
    appendLetter: (letter) => {
      setGuess((currentGuess) => cleanGuess(`${currentGuess}${letter}`));
      setFeedback(`Added ${letter.toUpperCase()}.`);
      setLastGuessResult(null);
    },
    removeLastLetter: () => {
      setGuess((currentGuess) => currentGuess.slice(0, -1));
    },
    clearGuess: () => {
      setGuess("");
    },
    shuffleLetters: () => {
      setShuffledOuterLetters((letters) => rotateLetters(letters));
    },
    submitGuess: async () => {
      if (isCheckingWord) {
        return;
      }

      setIsCheckingWord(true);
      setFeedback("Checking word...");

      const result = await validateGuess(
        puzzle,
        guess,
        progress.foundWords,
        englishDictionary
      );
      setLastGuessResult(result);
      setIsCheckingWord(false);

      if (result.status === "rejected") {
        setFeedback(getFailureMessage(result.reason));
        return;
      }

      const nextProgress = addFoundWord(progress, result.word);
      setProgress(nextProgress);
      writeDailyProgress(nextProgress);
      setGuess("");
      setFeedback(
        result.isPangram
          ? `Full bloom! +${String(result.points)}`
          : `Nice find. +${String(result.points)}`
      );
    }
  };
}

function cleanGuess(value: string): string {
  return value.replace(/[^a-zA-Z]/g, "").toLowerCase().slice(0, 24);
}

function rotateLetters(letters: readonly string[]): readonly string[] {
  if (letters.length <= 1) {
    return letters;
  }

  return [...letters.slice(1), letters[0]];
}

function getFailureMessage(reason: GuessFailureReason): string {
  const messages: Record<GuessFailureReason, string> = {
    "already-found": "Already found.",
    "dictionary-unavailable": "Dictionary check is unavailable.",
    "not-in-dictionary": "Not found in the English dictionary.",
    "too-short": "Use at least four letters.",
    "missing-center-letter": "Use the center letter.",
    "uses-invalid-letter": "Use only today's letters."
  };

  return messages[reason];
}
