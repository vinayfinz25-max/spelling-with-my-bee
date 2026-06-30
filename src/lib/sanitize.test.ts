import { describe, expect, it } from "vitest";

import { hasUsableNickname, sanitizeNickname } from "./sanitize";

describe("sanitizeNickname", () => {
  it("trims repeated whitespace and control characters", () => {
    expect(sanitizeNickname("  Honey\u0000   Ace  ")).toBe("Honey Ace");
  });

  it("limits nicknames to 24 characters", () => {
    expect(sanitizeNickname("abcdefghijklmnopqrstuvwxyz")).toBe(
      "abcdefghijklmnopqrstuvwx"
    );
  });
});

describe("hasUsableNickname", () => {
  it("rejects blank nicknames", () => {
    expect(hasUsableNickname("   ")).toBe(false);
  });

  it("accepts a sanitized nickname", () => {
    expect(hasUsableNickname(" Bee ")).toBe(true);
  });
});
