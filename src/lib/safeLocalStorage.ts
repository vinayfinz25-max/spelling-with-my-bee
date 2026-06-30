export function readJsonFromStorage<T>(
  key: string,
  fallback: T,
  isValid: (value: unknown) => value is T
): T {
  try {
    const storedValue = window.localStorage.getItem(key);

    if (storedValue === null) {
      return fallback;
    }

    const parsedValue: unknown = JSON.parse(storedValue);

    return isValid(parsedValue) ? parsedValue : fallback;
  } catch {
    return fallback;
  }
}

export function writeJsonToStorage(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can fail in private browsing or quota-limited environments.
  }
}
