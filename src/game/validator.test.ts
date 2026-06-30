import { describe, expect, it } from "vitest";

import { createPuzzleFromSeed } from "./puzzleGenerator";
import { validateGuess, validateStructuralGuess, type WordDictionary } from "./validator";

const puzzle = createPuzzleFromSeed(
  {
    id: "test",
    centerLetter: "a",
    outerLetters: ["c", "e", "h", "r", "s", "t"]
  },
  "2026-06-30"
);

const acceptingDictionary: WordDictionary = {
  isEnglishWord() {
    return Promise.resolve("yes");
  }
};

const rejectingDictionary: WordDictionary = {
  isEnglishWord() {
    return Promise.resolve("no");
  }
};

describe("validateStructuralGuess", () => {
  it("accepts a structurally valid answer and scores it", () => {
    expect(validateStructuralGuess(puzzle, "ARCH", [])).toEqual({
      status: "accepted",
      word: "arch",
      points: 1,
      isPangram: false
    });
  });

  it("awards pangram status before dictionary lookup", () => {
    expect(validateStructuralGuess(puzzle, "teachers", [])).toMatchObject({
      status: "accepted",
      isPangram: true
    });
  });

  it("rejects duplicate words", () => {
    expect(validateStructuralGuess(puzzle, "arch", ["arch"])).toEqual({
      status: "rejected",
      word: "arch",
      reason: "already-found"
    });
  });

  it("rejects guesses missing the center letter", () => {
    expect(validateStructuralGuess(puzzle, "tree", [])).toEqual({
      status: "rejected",
      word: "tree",
      reason: "missing-center-letter"
    });
  });
});

describe("validateGuess", () => {
  it("accepts structurally valid English words", async () => {
    await expect(validateGuess(puzzle, "arch", [], acceptingDictionary)).resolves.toEqual({
      status: "accepted",
      word: "arch",
      points: 1,
      isPangram: false
    });
  });

  it("rejects structurally valid non-words", async () => {
    await expect(validateGuess(puzzle, "aaaa", [], rejectingDictionary)).resolves.toEqual({
      status: "rejected",
      word: "aaaa",
      reason: "not-in-dictionary"
    });
  });
});
