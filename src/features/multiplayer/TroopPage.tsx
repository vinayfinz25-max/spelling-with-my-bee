import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";

import { PrimaryButton } from "../../components/PrimaryButton";
import {
  summarizeScore,
  type GuessFailureReason,
  type Puzzle,
  type ScoreSummary
} from "../../game";
import { FoundWords } from "../daily/components/FoundWords";
import { LetterBoard } from "../daily/components/LetterBoard";
import { ScorePanel } from "../daily/components/ScorePanel";
import { sanitizeNickname } from "../../lib/sanitize";
import { usePreferencesStore } from "../../stores/preferencesStore";
import {
  cleanRoomCode,
  createTroopRoom,
  getRoomErrorMessage,
  joinTroopRoom,
  loadRoomSnapshot,
  submitRoomGuess,
  type RoomActionResult,
  type RoomLeaderboardEntry
} from "./roomService";

interface TroopPageProps {
  mode: "create" | "join";
}

export default function TroopPage({ mode }: TroopPageProps) {
  const navigate = useNavigate();
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
  const [roomSession, setRoomSession] = useState<RoomActionResult | null>(null);
  const [foundWords, setFoundWords] = useState<readonly string[]>([]);
  const [leaderboard, setLeaderboard] = useState<
    readonly RoomLeaderboardEntry[]
  >([]);
  const [roomGuess, setRoomGuess] = useState("");
  const [roomFeedback, setRoomFeedback] = useState("Build a troop word.");
  const [lastFailureReason, setLastFailureReason] =
    useState<GuessFailureReason | null>(null);
  const [isCheckingWord, setIsCheckingWord] = useState(false);
  const [isRefreshingRoom, setIsRefreshingRoom] = useState(false);
  const [shuffledOuterLetters, setShuffledOuterLetters] = useState<
    readonly string[]
  >([]);

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

  useEffect(() => {
    if (!isCreateMode) {
      setRoomCode(initialRoomCode);
    }
  }, [initialRoomCode, isCreateMode]);

  useEffect(() => {
    if (roomSession === null) {
      return undefined;
    }

    const activeSession = roomSession;
    let isActive = true;

    async function refreshSnapshot() {
      setIsRefreshingRoom(true);

      try {
        const snapshot = await loadRoomSnapshot(
          activeSession.roomId,
          activeSession.userId
        );

        if (!isActive) {
          return;
        }

        setFoundWords(snapshot.foundWords);
        setLeaderboard(snapshot.leaderboard);
      } catch (error) {
        if (isActive) {
          setErrorMessage(getRoomErrorMessage(error));
        }
      } finally {
        if (isActive) {
          setIsRefreshingRoom(false);
        }
      }
    }

    void refreshSnapshot();
    const intervalId = window.setInterval(() => {
      void refreshSnapshot();
    }, 5_000);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
    };
  }, [roomSession]);

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
        setRoomCode(result.roomCode);
        startRoomSession(result);
        void navigate(`/troop/${result.roomCode}`, { replace: true });
        setStatusMessage("Troop created. Share the link with your friends.");
      } else {
        setJoinedRoomCode(result.roomCode);
        startRoomSession(result);
        setStatusMessage("You are in. Start finding words.");
      }
    } catch (error) {
      setErrorMessage(getRoomErrorMessage(error));
      setStatusMessage("");
    } finally {
      setIsSubmitting(false);
    }
  }

  function startRoomSession(session: RoomActionResult) {
    setRoomSession(session);
    setFoundWords([]);
    setLeaderboard([
      {
        foundCount: 0,
        nickname: cleanedNickname,
        score: 0,
        userId: session.userId
      }
    ]);
    setShuffledOuterLetters(session.puzzle.outerLetters);
    setRoomGuess("");
    setRoomFeedback("Build a troop word.");
    setLastFailureReason(null);
  }

  function refreshRoomNow() {
    if (roomSession === null) {
      return;
    }

    setIsRefreshingRoom(true);
    void loadRoomSnapshot(roomSession.roomId, roomSession.userId)
      .then((snapshot) => {
        setFoundWords(snapshot.foundWords);
        setLeaderboard(snapshot.leaderboard);
      })
      .catch((error: unknown) => {
        setErrorMessage(getRoomErrorMessage(error));
      })
      .finally(() => {
        setIsRefreshingRoom(false);
      });
  }

  async function submitTroopGuess() {
    if (
      roomSession === null ||
      isCheckingWord ||
      roomGuess.trim().length === 0
    ) {
      return;
    }

    setIsCheckingWord(true);
    setRoomFeedback("Checking word...");
    setLastFailureReason(null);

    try {
      const result = await submitRoomGuess({
        foundWords,
        puzzle: roomSession.puzzle,
        roomId: roomSession.roomId,
        userId: roomSession.userId,
        word: roomGuess
      });

      if (result.status === "rejected") {
        setLastFailureReason(result.reason);
        setRoomFeedback(getFailureMessage(result.reason));
        return;
      }

      setFoundWords((words) => [...words, result.word].sort());
      setRoomGuess("");
      setRoomFeedback(
        result.isPangram
          ? `Troop pangram! +${String(result.points)}`
          : `Nice troop find. +${String(result.points)}`
      );
      refreshRoomNow();
    } catch (error) {
      setLastFailureReason("dictionary-unavailable");
      setRoomFeedback(getRoomErrorMessage(error));
    } finally {
      setIsCheckingWord(false);
    }
  }

  const roomScoreSummary =
    roomSession === null
      ? null
      : summarizeScore(roomSession.puzzle, foundWords);

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
              placeholder="aish"
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

      {roomSession !== null && roomScoreSummary !== null ? (
        <TroopRoom
          feedback={roomFeedback}
          foundWords={foundWords}
          guess={roomGuess}
          isCheckingWord={isCheckingWord}
          isRefreshingRoom={isRefreshingRoom}
          leaderboard={leaderboard}
          lastFailureReason={lastFailureReason}
          puzzle={roomSession.puzzle}
          roomCode={roomSession.roomCode}
          scoreSummary={roomScoreSummary}
          shareUrl={`${window.location.origin}/troop/${roomSession.roomCode}`}
          shuffledOuterLetters={shuffledOuterLetters}
          onAppendLetter={(letter) => {
            setRoomGuess((currentGuess) =>
              cleanGuess(`${currentGuess}${letter}`)
            );
            setRoomFeedback(`Added ${letter.toUpperCase()}.`);
            setLastFailureReason(null);
          }}
          onRefresh={refreshRoomNow}
          onRemoveLastLetter={() => {
            setRoomGuess((currentGuess) => currentGuess.slice(0, -1));
          }}
          onShuffleLetters={() => {
            setShuffledOuterLetters((letters) => rotateLetters(letters));
          }}
          onSubmitGuess={() => {
            void submitTroopGuess();
          }}
        />
      ) : null}
    </main>
  );
}

interface TroopRoomProps {
  feedback: string;
  foundWords: readonly string[];
  guess: string;
  isCheckingWord: boolean;
  isRefreshingRoom: boolean;
  leaderboard: readonly RoomLeaderboardEntry[];
  lastFailureReason: GuessFailureReason | null;
  puzzle: Puzzle;
  roomCode: string;
  scoreSummary: ScoreSummary;
  shareUrl: string;
  shuffledOuterLetters: readonly string[];
  onAppendLetter: (letter: string) => void;
  onRefresh: () => void;
  onRemoveLastLetter: () => void;
  onShuffleLetters: () => void;
  onSubmitGuess: () => void;
}

function TroopRoom({
  feedback,
  foundWords,
  guess,
  isCheckingWord,
  isRefreshingRoom,
  leaderboard,
  lastFailureReason,
  puzzle,
  roomCode,
  scoreSummary,
  shareUrl,
  shuffledOuterLetters,
  onAppendLetter,
  onRefresh,
  onRemoveLastLetter,
  onShuffleLetters,
  onSubmitGuess
}: TroopRoomProps) {
  const feedbackTone =
    lastFailureReason === null ? "text-success" : "text-error";

  return (
    <section className="mx-auto mt-6 grid max-w-6xl gap-6 lg:grid-cols-[1fr_320px]">
      <div className="grid gap-6">
        <section className="rounded-lg border border-border bg-white p-5 shadow-sm">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-blue-accent">
                Room {roomCode}
              </p>
              <h2 className="mt-2 text-2xl font-black text-primary-text">
                Troop board
              </h2>
              <a
                className="mt-2 block break-words text-sm font-bold text-blue-accent"
                href={shareUrl}
              >
                {shareUrl}
              </a>
            </div>
            <button
              className="min-h-10 rounded-lg border border-border bg-background px-3 text-sm font-bold text-primary-text transition hover:border-blue-accent focus:outline-none focus:ring-2 focus:ring-blue-accent focus:ring-offset-2"
              type="button"
              onClick={onRefresh}
            >
              {isRefreshingRoom ? "Refreshing" : "Refresh"}
            </button>
          </div>

          <div className="grid gap-5">
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="sr-only" id="troop-current-word-label">
                Current troop word
              </p>
              <div
                aria-labelledby="troop-current-word-label"
                className="grid min-h-14 place-items-center rounded-lg border border-border bg-white px-4 text-center text-3xl font-black lowercase tracking-normal text-primary-text"
                role="status"
              >
                {guess.length > 0 ? (
                  guess
                ) : (
                  <span className="text-base font-semibold text-secondary-text">
                    tap letters
                  </span>
                )}
              </div>
              <p
                aria-live="polite"
                className={`mt-3 min-h-5 text-center text-sm font-bold ${feedbackTone}`}
              >
                {feedback}
              </p>
            </div>

            <LetterBoard
              centerLetter={puzzle.centerLetter}
              outerLetters={shuffledOuterLetters}
              onLetterPress={onAppendLetter}
            />

            <div className="grid grid-cols-3 gap-2">
              <button
                className="min-h-11 rounded-lg border border-border bg-white px-3 text-sm font-bold text-primary-text transition hover:border-blue-accent focus:outline-none focus:ring-2 focus:ring-blue-accent focus:ring-offset-2"
                type="button"
                onClick={onRemoveLastLetter}
              >
                Delete
              </button>
              <button
                className="min-h-11 rounded-lg border border-border bg-white px-3 text-sm font-bold text-primary-text transition hover:border-blue-accent focus:outline-none focus:ring-2 focus:ring-blue-accent focus:ring-offset-2"
                type="button"
                onClick={onShuffleLetters}
              >
                Shuffle
              </button>
              <PrimaryButton
                disabled={isCheckingWord || guess.length === 0}
                onClick={onSubmitGuess}
              >
                {isCheckingWord ? "Checking" : "Enter"}
              </PrimaryButton>
            </div>
          </div>
        </section>

        <FoundWords foundWords={foundWords} />
      </div>

      <div className="grid gap-6">
        <ScorePanel scoreSummary={scoreSummary} />
        <Leaderboard entries={leaderboard} />
      </div>
    </section>
  );
}

interface LeaderboardProps {
  entries: readonly RoomLeaderboardEntry[];
}

function Leaderboard({ entries }: LeaderboardProps) {
  return (
    <aside className="rounded-lg border border-border bg-white p-5 shadow-sm">
      <h2 className="text-lg font-black text-primary-text">Leaderboard</h2>
      {entries.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-border bg-background p-4 text-sm text-secondary-text">
          Scores will appear here.
        </p>
      ) : (
        <ol className="mt-4 grid gap-3">
          {entries.map((entry, index) => (
            <li
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-3"
              key={entry.userId}
            >
              <div>
                <p className="font-black text-primary-text">
                  {String(index + 1)}. {entry.nickname}
                </p>
                <p className="text-sm font-semibold text-secondary-text">
                  {entry.foundCount} words
                </p>
              </div>
              <span className="text-lg font-black text-primary-text">
                {entry.score}
              </span>
            </li>
          ))}
        </ol>
      )}
    </aside>
  );
}

function cleanGuess(value: string): string {
  return value.replace(/[^a-zA-Z]/g, "").toLowerCase().slice(0, 24);
}

function rotateLetters(letters: readonly string[]): readonly string[] {
  if (letters.length <= 1) {
    return letters;
  }

  return [...letters.slice(1), letters[0]];
}

function getFailureMessage(reason: GuessFailureReason): string {
  const messages: Record<GuessFailureReason, string> = {
    "already-found": "Already found.",
    "dictionary-unavailable": "Dictionary check is unavailable.",
    "missing-center-letter": "Use the center letter.",
    "not-in-dictionary": "Not found in the English dictionary.",
    "too-short": "Use at least four letters.",
    "uses-invalid-letter": "Use only the room letters."
  };

  return messages[reason];
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
