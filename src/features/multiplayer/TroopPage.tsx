import { useMemo, useState } from "react";
import { useParams } from "react-router";

import { PrimaryButton } from "../../components/PrimaryButton";
import { sanitizeNickname } from "../../lib/sanitize";
import { usePreferencesStore } from "../../stores/preferencesStore";
import {
  cleanRoomCode,
  createTroopRoom,
  getRoomErrorMessage,
  joinTroopRoom
} from "./roomService";

interface TroopPageProps {
  mode: "create" | "join";
}

export default function TroopPage({ mode }: TroopPageProps) {
  const params = useParams();
  const isCreateMode = mode === "create";
  const storedNickname = usePreferencesStore((state) => state.nickname);
  const setStoredNickname = usePreferencesStore((state) => state.setNickname);
  const initialRoomCode = useMemo(
    () => cleanRoomCode(params.roomCode ?? ""),
    [params.roomCode]
  );
  const [nickname, setNickname] = useState(storedNickname);
  const [roomCode, setRoomCode] = useState(initialRoomCode);
  const [createdRoomCode, setCreatedRoomCode] = useState("");
  const [joinedRoomCode, setJoinedRoomCode] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cleanedNickname = sanitizeNickname(nickname);
  const cleanedRoomCode = cleanRoomCode(roomCode);
  const activeRoomCode = createdRoomCode || joinedRoomCode;
  const shareUrl =
    activeRoomCode.length > 0
      ? `${window.location.origin}/troop/${activeRoomCode}`
      : "";
  const canSubmit =
    cleanedNickname.length > 0 &&
    !isSubmitting &&
    (isCreateMode || cleanedRoomCode.length >= 5);

  async function handleSubmit(event: { preventDefault: () => void }) {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    setStoredNickname(cleanedNickname);
    setIsSubmitting(true);
    setErrorMessage("");
    setStatusMessage(
      isCreateMode ? "Creating your troop..." : "Joining the troop..."
    );

    try {
      const result = isCreateMode
        ? await createTroopRoom({ nickname: cleanedNickname })
        : await joinTroopRoom({
            nickname: cleanedNickname,
            roomCode: cleanedRoomCode
          });

      if (isCreateMode) {
        setCreatedRoomCode(result.roomCode);
        setStatusMessage("Troop created. Share the link with your friends.");
      } else {
        setJoinedRoomCode(result.roomCode);
        setStatusMessage("You are in. Live gameplay comes next.");
      }
    } catch (error) {
      setErrorMessage(getRoomErrorMessage(error));
      setStatusMessage("");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="px-4 pb-28 pt-8 sm:pb-16">
      <section className="relative mx-auto max-w-5xl overflow-hidden rounded-lg border border-border bg-white p-5 shadow-sm sm:p-8">
        <ApeMascot />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_320px] lg:items-end">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-wide text-blue-accent">
              {isCreateMode ? "Create troop" : "Join troop"}
            </p>
            <h1 className="mt-3 text-5xl font-black leading-tight text-primary-text sm:text-6xl">
              Apes Together Strong
            </h1>
            <p className="mt-4 text-base leading-7 text-secondary-text sm:text-lg">
              Start a private room for friends, share a short code, and watch
              the leaderboard move as everyone finds words.
            </p>
          </div>

          <form
            className="rounded-lg border border-border bg-background/95 p-4 shadow-sm backdrop-blur"
            onSubmit={(event) => {
              void handleSubmit(event);
            }}
          >
            <h2 className="text-xl font-black text-primary-text">
              {isCreateMode ? "Create troop" : "Join troop"}
            </h2>
            <label
              className="mb-2 mt-5 block text-sm font-bold text-primary-text"
              htmlFor="nickname"
            >
              Nickname
            </label>
            <input
              autoComplete="nickname"
              className="min-h-12 w-full rounded-lg border border-border bg-white px-4 text-primary-text outline-none focus:border-blue-accent focus:ring-2 focus:ring-blue-accent/30"
              id="nickname"
              maxLength={24}
              placeholder="Honey Ace"
              value={nickname}
              onChange={(event) => {
                setNickname(event.target.value);
              }}
            />
            <label
              className="mb-2 mt-5 block text-sm font-bold text-primary-text"
              htmlFor="room-code"
            >
              {isCreateMode ? "Room code" : "Shared room code"}
            </label>
            <input
              className="min-h-12 w-full rounded-lg border border-border bg-white px-4 text-primary-text outline-none focus:border-blue-accent focus:ring-2 focus:ring-blue-accent/30"
              disabled={isCreateMode}
              id="room-code"
              inputMode="text"
              placeholder={isCreateMode ? "Generated for you" : "BEE42"}
              value={isCreateMode ? createdRoomCode : roomCode}
              onChange={(event) => {
                setRoomCode(cleanRoomCode(event.target.value));
              }}
            />
            <PrimaryButton
              className="mt-4 w-full disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!canSubmit}
              type="submit"
            >
              {isSubmitting
                ? "Working..."
                : isCreateMode
                  ? "Create"
                  : "Join"}
            </PrimaryButton>
            {statusMessage.length > 0 ? (
              <p className="mt-4 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm font-semibold text-primary-text">
                {statusMessage}
              </p>
            ) : null}
            {errorMessage.length > 0 ? (
              <p className="mt-4 rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-sm font-semibold text-primary-text">
                {errorMessage}
              </p>
            ) : null}
            {shareUrl.length > 0 ? (
              <div className="mt-4 rounded-lg border border-border bg-white p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-secondary-text">
                  Share link
                </p>
                <a
                  className="mt-2 block break-words text-sm font-bold text-blue-accent"
                  href={shareUrl}
                >
                  {shareUrl}
                </a>
              </div>
            ) : null}
          </form>
        </div>
      </section>
    </main>
  );
}

function ApeMascot() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -right-10 -top-8 h-72 w-72 opacity-15 sm:opacity-25"
    >
      <div className="absolute left-8 top-16 size-20 rounded-full border-4 border-primary-text bg-secondary-text" />
      <div className="absolute right-8 top-16 size-20 rounded-full border-4 border-primary-text bg-secondary-text" />
      <div className="absolute inset-x-10 top-10 h-44 rounded-[4rem] border-4 border-primary-text bg-secondary-text" />
      <div className="absolute left-24 top-24 size-5 rounded-full bg-primary-text" />
      <div className="absolute right-24 top-24 size-5 rounded-full bg-primary-text" />
      <div className="absolute inset-x-20 top-32 h-20 rounded-[2rem] border-4 border-primary-text bg-primary-yellow" />
      <div className="absolute left-[7.35rem] top-36 h-4 w-6 rounded-full bg-primary-text" />
      <div className="absolute right-[7.35rem] top-36 h-4 w-6 rounded-full bg-primary-text" />
      <div className="absolute left-1/2 top-44 h-4 w-14 -translate-x-1/2 rounded-b-full border-b-4 border-primary-text" />
      <div className="absolute left-20 top-48 h-24 w-32 rounded-[2.5rem] border-4 border-primary-text bg-secondary-text" />
    </div>
  );
}
