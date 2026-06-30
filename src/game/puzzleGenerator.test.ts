import { describe, expect, it } from "vitest";

import { puzzleSeeds } from "./dictionary";
import { createDailyPuzzle, createPuzzleFromSeed, toUtcDateKey } from "./puzzleGenerator";

describe("createDailyPuzzle", () => {
  it("creates a stable puzzle for the same UTC date", () => {
    const first = createDailyPuzzle(new Date("2026-06-30T02:00:00.000Z"));
    const second = createDailyPuzzle(new Date("2026-06-30T22:00:00.000Z"));

    expect(first).toEqual(second);
  });

  it("uses an ISO UTC date key", () => {
    expect(toUtcDateKey(new Date("2026-06-30T23:59:59.000Z"))).toBe(
      "2026-06-30"
    );
  });
});

describe("puzzle seeds", () => {
  it("contains exactly seven unique letters per puzzle", () => {
    for (const seed of puzzleSeeds) {
      const puzzle = createPuzzleFromSeed(seed, "2026-06-30");

      expect(new Set(puzzle.letters).size).toBe(7);
      expect(puzzle.outerLetters).toHaveLength(6);
      expect(puzzle.letters).toContain(puzzle.centerLetter);
    }
  });
});
