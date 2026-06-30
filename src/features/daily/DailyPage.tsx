import { motion } from "framer-motion";

import { PrimaryButton } from "../../components/PrimaryButton";
import { PeekingBeeLottie } from "../../components/lottie/PeekingBeeLottie";
import { FoundWords } from "./components/FoundWords";
import { LetterBoard } from "./components/LetterBoard";
import { ScorePanel } from "./components/ScorePanel";
import { useDailyGame } from "./useDailyGame";

export default function DailyPage() {
  const dailyGame = useDailyGame();
  const feedbackTone =
    dailyGame.lastGuessResult?.status === "rejected"
      ? "text-error"
      : "text-success";

  return (
    <main className="px-4 pb-28 pt-8 sm:pb-16">
      <section className="mx-auto mb-6 max-w-6xl">
        <div className="relative overflow-hidden rounded-lg border border-border bg-white px-5 py-6 shadow-sm sm:px-8 sm:py-7">
          <div className="relative z-10 flex max-w-[calc(100%-5.5rem)] flex-col gap-3 sm:max-w-[calc(100%-7rem)]">
            <p className="text-sm font-bold uppercase tracking-wide text-blue-accent">
              Daily puzzle
            </p>
            <h1 className="text-4xl font-black leading-tight tracking-normal text-primary-text sm:text-6xl">
              Spelling with my bee
            </h1>
          </div>
          <PeekingBee />
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-6">
          <section className="rounded-lg border border-border bg-white p-5 shadow-sm">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-blue-accent">
                  Today&apos;s board
                </p>
                <p className="mt-2 text-sm font-semibold text-secondary-text">
                  {dailyGame.puzzle.date} - {dailyGame.puzzle.dictionaryVersion}
                </p>
              </div>
              <span className="rounded-lg bg-background px-3 py-2 text-sm font-bold text-secondary-text">
                {dailyGame.scoreSummary.rank.name}
              </span>
            </div>

            <div className="grid gap-5">
              <div className="rounded-lg border border-border bg-background p-4">
                <p className="sr-only" id="current-word-label">
                  Current word
                </p>
                <div
                  aria-labelledby="current-word-label"
                  className="grid min-h-14 place-items-center rounded-lg border border-border bg-white px-4 text-center text-3xl font-black lowercase tracking-normal text-primary-text"
                  role="status"
                >
                  {dailyGame.guess.length > 0 ? (
                    dailyGame.guess
                  ) : (
                    <span className="text-base font-semibold text-secondary-text">
                      tap letters
                    </span>
                  )}
                </div>
                <motion.p
                  animate={{ opacity: 1, y: 0 }}
                  aria-live="polite"
                  className={`mt-3 min-h-5 text-center text-sm font-bold ${feedbackTone}`}
                  initial={{ opacity: 0, y: 4 }}
                  key={dailyGame.feedback}
                  transition={{ duration: 0.18 }}
                >
                  {dailyGame.feedback}
                </motion.p>
              </div>

              <LetterBoard
                centerLetter={dailyGame.puzzle.centerLetter}
                outerLetters={dailyGame.shuffledOuterLetters}
                onLetterPress={dailyGame.appendLetter}
              />

              <div className="grid grid-cols-3 gap-2">
                <button
                  className="min-h-11 rounded-lg border border-border bg-white px-3 text-sm font-bold text-primary-text transition hover:border-blue-accent focus:outline-none focus:ring-2 focus:ring-blue-accent focus:ring-offset-2"
                  type="button"
                  onClick={dailyGame.removeLastLetter}
                >
                  Delete
                </button>
                <button
                  className="min-h-11 rounded-lg border border-border bg-white px-3 text-sm font-bold text-primary-text transition hover:border-blue-accent focus:outline-none focus:ring-2 focus:ring-blue-accent focus:ring-offset-2"
                  type="button"
                  onClick={dailyGame.shuffleLetters}
                >
                  Shuffle
                </button>
                <PrimaryButton
                  disabled={dailyGame.isCheckingWord || dailyGame.guess.length === 0}
                  onClick={() => {
                    void dailyGame.submitGuess();
                  }}
                >
                  {dailyGame.isCheckingWord ? "Checking" : "Enter"}
                </PrimaryButton>
              </div>
            </div>
          </section>

          <FoundWords foundWords={dailyGame.foundWords} />
        </div>

        <ScorePanel scoreSummary={dailyGame.scoreSummary} />
      </section>
    </main>
  );
}

function PeekingBee() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -right-8 top-1/2 z-0 size-32 -translate-y-1/2 overflow-hidden sm:size-40"
    >
      <PeekingBeeLottie className="h-full w-full" />
    </div>
  );
}
