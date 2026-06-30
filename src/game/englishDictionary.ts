import { normalizeWord } from "./dictionary";
import type { WordDictionary } from "./validator";

const fallbackWords = new Set([
  "able",
  "arch",
  "area",
  "bleat",
  "chase",
  "earth",
  "heart",
  "race",
  "react",
  "search",
  "stare",
  "teach",
  "teacher",
  "teachers",
  "trace"
]);

const cache = new Map<string, "yes" | "no">();

export const englishDictionary: WordDictionary = {
  async isEnglishWord(word: string): Promise<"yes" | "no" | "unavailable"> {
    const normalizedWord = normalizeWord(word);

    if (fallbackWords.has(normalizedWord)) {
      return "yes";
    }

    const cachedResult = cache.get(normalizedWord);

    if (cachedResult !== undefined) {
      return cachedResult;
    }

    try {
      const response = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(
          normalizedWord
        )}`
      );
      const result = response.ok ? "yes" : "no";

      cache.set(normalizedWord, result);

      return result;
    } catch {
      return "unavailable";
    }
  }
};
