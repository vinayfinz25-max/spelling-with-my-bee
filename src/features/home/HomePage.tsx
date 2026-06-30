import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router";

import { appRoutes } from "../../app/routes";
import { PrimaryButton } from "../../components/PrimaryButton";
import { hasUsableNickname, sanitizeNickname } from "../../lib/sanitize";
import { usePreferencesStore } from "../../stores/preferencesStore";

const modeLinks = [
  {
    title: "Daily",
    detail: "Fresh puzzle, local progress.",
    to: appRoutes.daily
  },
  {
    title: "Apes Together Strong",
    detail: "Private room for friends.",
    to: appRoutes.troopNew
  }
] as const;

export default function HomePage() {
  const navigate = useNavigate();
  const storedNickname = usePreferencesStore((state) => state.nickname);
  const setStoredNickname = usePreferencesStore((state) => state.setNickname);
  const [nickname, setNickname] = useState(storedNickname);
  const [didSaveNickname, setDidSaveNickname] = useState(false);

  const cleanedNickname = sanitizeNickname(nickname);
  const canContinue = hasUsableNickname(cleanedNickname);

  function saveNickname() {
    if (!canContinue) {
      return;
    }

    setStoredNickname(cleanedNickname);
    setDidSaveNickname(true);
  }

  function openMode(route: string) {
    if (!canContinue) {
      return;
    }

    saveNickname();
    void navigate(route);
  }

  return (
    <main className="px-4 pb-28 pt-10 sm:pb-16">
      <section className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_420px] lg:items-center">
        <div className="flex flex-col gap-7">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-5"
            initial={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <h1 className="max-w-3xl text-5xl font-black leading-tight tracking-normal text-primary-text sm:text-6xl">
              Spelling with my bee
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-secondary-text">
              who tf pays for wordle ???
            </p>
          </motion.div>

          <div className="grid gap-3 sm:grid-cols-2">
            {modeLinks.map((mode) => (
              <PrimaryButton
                className="min-h-24 flex-col items-start text-left disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!canContinue}
                key={mode.to}
                title={canContinue ? undefined : "Enter a nickname first"}
                onClick={() => {
                  openMode(mode.to);
                }}
              >
                <span className="text-base">{mode.title}</span>
                <span className="mt-1 text-sm font-medium text-primary-text/70">
                  {mode.detail}
                </span>
              </PrimaryButton>
            ))}
          </div>
        </div>

        <motion.form
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-lg border border-border bg-white p-5 shadow-sm"
          initial={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          onSubmit={(event) => {
            event.preventDefault();
            saveNickname();
          }}
        >
          <label
            className="mb-2 block text-sm font-bold text-primary-text"
            htmlFor="nickname"
          >
            Nickname
          </label>
          <input
            autoComplete="nickname"
            className="min-h-12 w-full rounded-lg border border-border bg-background px-4 text-base text-primary-text outline-none transition focus:border-blue-accent focus:ring-2 focus:ring-blue-accent/30"
            id="nickname"
            maxLength={24}
            placeholder="aish"
            value={nickname}
            onChange={(event) => {
              setNickname(event.target.value);
            }}
          />
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-sm text-secondary-text">
              {didSaveNickname
                ? `Saved as ${cleanedNickname}`
                : canContinue
                  ? "Ready"
                  : "Required"}
            </p>
            <PrimaryButton disabled={!canContinue} type="submit">
              Save
            </PrimaryButton>
          </div>
        </motion.form>
      </section>
    </main>
  );
}
