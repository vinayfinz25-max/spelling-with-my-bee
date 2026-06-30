import { describe, expect, it } from "vitest";

import { createPuzzleFromSeed } from "./puzzleGenerator";
import { scoreWord, summarizeScore } from "./scoreEngine";

const puzzle = createPuzzleFromSeed(
  {
    id: "score-test",
    centerLetter: "a",
    outerLetters: ["c", "e", "h", "r", "s", "t"]
  },
  "2026-06-30"
);

describe("scoreWord", () => {
  it("scores four-letter words as one point", () => {
    expect(scoreWord("arch", puzzle.letters)).toBe(1);
  });

  it("adds seven points for pangrams", () => {
    expect(scoreWord("teachers", puzzle.letters)).toBe(15);
  });
});

describe("summarizeScore", () => {
  it("summarizes open-ended progress", () => {
    expect(summarizeScore(puzzle, ["arch", "teachers"])).toMatchObject({
      score: 16,
      foundCount: 2,
      rank: { name: "Buzzing", threshold: 10 }
    });
  });
});
