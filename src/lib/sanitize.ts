const repeatedWhitespace = /\s+/g;

export function sanitizeNickname(value: string): string {
  return stripControlCharacters(value)
    .replace(repeatedWhitespace, " ")
    .trim()
    .slice(0, 24);
}

export function hasUsableNickname(value: string): boolean {
  return sanitizeNickname(value).length > 0;
}

function stripControlCharacters(value: string): string {
  return Array.from(value)
    .filter((character) => {
      const code = character.charCodeAt(0);

      return code > 31 && code !== 127;
    })
    .join("");
}
