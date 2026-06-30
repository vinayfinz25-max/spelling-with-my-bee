# Milestone 2: Game Engine and Playable Daily Mode

## Scope

- Pure TypeScript game engine under `src/game`.
- Deterministic daily puzzle generation.
- Curated dictionary puzzle pack with validated answer sets.
- Guess validation for length, center letter, allowed letters, duplicates, and answer list.
- Score engine with pangram bonus and rank calculation.
- Statistics helpers.
- Daily mode wired to the engine.
- Local progress saved with defensive LocalStorage parsing.

## Verification

Run these commands from the project directory:

```bash
pnpm lint
pnpm test
pnpm build
```

Browser smoke test:

- Open `/daily`.
- Submit `arch` for the 2026-06-30 puzzle.
- Confirm the word is accepted, score increases, and the word appears in the found list.
