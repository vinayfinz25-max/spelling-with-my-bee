import {
  createDailyPuzzle,
  englishDictionary,
  validateGuess,
  type GuessResult,
  type Puzzle
} from "../../game";
import { sanitizeNickname } from "../../lib/sanitize";
import { getSupabaseClient } from "../../lib/supabase/client";

const roomCodePattern = /^[A-Z0-9]{5,8}$/;
const defaultNickname = "Bee Friend";
const maxCodeAttempts = 5;

export type RoomRole = "player" | "spectator";

export interface RoomActionResult {
  readonly puzzle: Puzzle;
  readonly roomCode: string;
  readonly roomId: string;
  readonly userId: string;
}

export interface RoomLeaderboardEntry {
  readonly foundCount: number;
  readonly nickname: string;
  readonly score: number;
  readonly userId: string;
}

export interface RoomSnapshot {
  readonly foundWords: readonly string[];
  readonly leaderboard: readonly RoomLeaderboardEntry[];
}

export type RoomErrorCode =
  | "duplicate-code"
  | "invalid-room-code"
  | "missing-supabase"
  | "room-not-found"
  | "supabase-auth"
  | "supabase-write";

export class RoomServiceError extends Error {
  readonly code: RoomErrorCode;

  constructor(code: RoomErrorCode, message: string) {
    super(message);
    this.name = "RoomServiceError";
    this.code = code;
  }
}

interface SupabaseUser {
  readonly id: string;
}

interface SupabaseError {
  readonly code?: string;
  readonly message: string;
}

interface SupabaseAuthResponse {
  readonly data: {
    readonly user: SupabaseUser | null;
  };
  readonly error: SupabaseError | null;
}

interface SupabaseSingleResponse<TData> {
  readonly data: TData | null;
  readonly error: SupabaseError | null;
}

interface SupabaseMutationResponse {
  readonly error: SupabaseError | null;
}

interface RoomRecord {
  readonly center_letter: string;
  readonly code: string;
  readonly dictionary_version: string;
  readonly id: string;
  readonly outer_letters: readonly string[];
  readonly puzzle_date: string;
}

interface RoomMemberRow {
  readonly nickname: string;
  readonly role: RoomRole;
  readonly user_id: string;
}

interface RoomGuessRow {
  readonly created_at: string;
  readonly points: number;
  readonly user_id: string;
  readonly word: string;
}

interface SupabaseListResponse<TData> {
  readonly data: readonly TData[] | null;
  readonly error: SupabaseError | null;
}

interface SupabaseRoomClient {
  readonly auth: {
    getUser: () => Promise<SupabaseAuthResponse>;
    signInAnonymously: () => Promise<SupabaseAuthResponse>;
  };
  from: (table: string) => {
    insert: (payload: Record<string, unknown>) => {
      select: (columns: string) => {
        single: () => Promise<SupabaseSingleResponse<RoomRecord>>;
      };
    };
    select: (columns: string) => {
      eq: (column: string, value: unknown) => {
        maybeSingle: () => Promise<SupabaseSingleResponse<RoomRecord>>;
      };
    };
    upsert: (
      payload: Record<string, unknown>,
      options?: { readonly onConflict?: string }
    ) => Promise<SupabaseMutationResponse>;
  };
}

interface RoomServiceDependencies {
  readonly client?: SupabaseRoomClient | null;
  readonly createPuzzle?: () => Puzzle;
  readonly generateCode?: () => string;
}

interface CreateRoomInput {
  readonly nickname: string;
}

interface JoinRoomInput {
  readonly nickname: string;
  readonly roomCode: string;
  readonly role?: RoomRole;
}

export async function createTroopRoom(
  input: CreateRoomInput,
  dependencies: RoomServiceDependencies = {}
): Promise<RoomActionResult> {
  const client = getRoomClient(dependencies.client);
  const user = await getAnonymousUser(client);
  const puzzle = (dependencies.createPuzzle ?? createDailyPuzzle)();
  const nickname = getSafeNickname(input.nickname);
  const generateCode = dependencies.generateCode ?? generateRoomCode;

  for (let attempt = 0; attempt < maxCodeAttempts; attempt += 1) {
    const code = cleanRoomCode(generateCode());

    if (!roomCodePattern.test(code)) {
      continue;
    }

    const room = await insertRoom(client, user.id, puzzle, code);

    if (room === null) {
      continue;
    }

    await upsertRoomMember(client, room.id, user.id, nickname, "player");

    return {
      puzzle,
      roomCode: room.code,
      roomId: room.id,
      userId: user.id
    };
  }

  throw new RoomServiceError(
    "duplicate-code",
    "Could not find a free room code. Try again."
  );
}

export async function joinTroopRoom(
  input: JoinRoomInput,
  dependencies: RoomServiceDependencies = {}
): Promise<RoomActionResult> {
  const client = getRoomClient(dependencies.client);
  const code = cleanRoomCode(input.roomCode);

  if (!roomCodePattern.test(code)) {
    throw new RoomServiceError(
      "invalid-room-code",
      "Use the room code your friend shared."
    );
  }

  const user = await getAnonymousUser(client);
  const nickname = getSafeNickname(input.nickname);
  const { data, error } = await client
    .from("rooms")
    .select(
      "id, code, puzzle_date, center_letter, outer_letters, dictionary_version"
    )
    .eq("code", code)
    .maybeSingle();

  if (error !== null) {
    throw toWriteError(error.message);
  }

  if (data === null) {
    throw new RoomServiceError(
      "room-not-found",
      "That room code was not found."
    );
  }

  await upsertRoomMember(
    client,
    data.id,
    user.id,
    nickname,
    input.role ?? "player"
  );

  return {
    puzzle: createPuzzleFromRoom(data),
    roomCode: data.code,
    roomId: data.id,
    userId: user.id
  };
}

export async function loadRoomSnapshot(
  roomId: string,
  currentUserId: string,
  dependencies: RoomServiceDependencies = {}
): Promise<RoomSnapshot> {
  const client = getRoomClient(dependencies.client);
  const [members, guesses] = await Promise.all([
    loadRoomMembers(client, roomId),
    loadRoomGuesses(client, roomId)
  ]);

  const nicknames = new Map(
    members.map((member) => [member.user_id, member.nickname])
  );
  const totals = new Map<
    string,
    { foundCount: number; nickname: string; score: number; userId: string }
  >();

  for (const member of members) {
    totals.set(member.user_id, {
      foundCount: 0,
      nickname: member.nickname,
      score: 0,
      userId: member.user_id
    });
  }

  for (const guess of guesses) {
    const current = totals.get(guess.user_id) ?? {
      foundCount: 0,
      nickname: nicknames.get(guess.user_id) ?? "Bee Friend",
      score: 0,
      userId: guess.user_id
    };

    totals.set(guess.user_id, {
      ...current,
      foundCount: current.foundCount + 1,
      score: current.score + guess.points
    });
  }

  return {
    foundWords: guesses
      .filter((guess) => guess.user_id === currentUserId)
      .map((guess) => guess.word)
      .sort(),
    leaderboard: [...totals.values()].sort(
      (first, second) =>
        second.score - first.score ||
        first.nickname.localeCompare(second.nickname)
    )
  };
}

export async function submitRoomGuess(
  input: {
    readonly foundWords: readonly string[];
    readonly puzzle: Puzzle;
    readonly roomId: string;
    readonly userId: string;
    readonly word: string;
  },
  dependencies: RoomServiceDependencies = {}
): Promise<GuessResult> {
  const result = await validateGuess(
    input.puzzle,
    input.word,
    input.foundWords,
    englishDictionary
  );

  if (result.status === "rejected") {
    return result;
  }

  const client = getRoomClient(dependencies.client);
  const guesses = client.from("room_guesses") as unknown as {
    insert: (
      payload: Record<string, unknown>
    ) => Promise<SupabaseMutationResponse>;
  };
  const { error } = await guesses.insert({
    points: result.points,
    room_id: input.roomId,
    user_id: input.userId,
    word: result.word
  });

  if (error !== null) {
    if (error.code === "23505") {
      return {
        status: "rejected",
        word: result.word,
        reason: "already-found"
      };
    }

    throw toWriteError(error.message);
  }

  return result;
}

export function cleanRoomCode(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 8);
}

export function getRoomErrorMessage(error: unknown): string {
  if (error instanceof RoomServiceError) {
    if (error.code === "missing-supabase") {
      return "Room play needs Supabase keys in Vercel before it can go live.";
    }

    if (
      error.code === "supabase-auth" &&
      error.message.toLowerCase().includes("anonymous sign-ins are disabled")
    ) {
      return "Enable Anonymous sign-ins in Supabase Auth to use instant troop rooms.";
    }

    return error.message;
  }

  return "Something went wrong with the room. Please try again.";
}

function getRoomClient(
  injectedClient: SupabaseRoomClient | null | undefined
): SupabaseRoomClient {
  const client =
    injectedClient === undefined ? getSupabaseClient() : injectedClient;

  if (client === null) {
    throw new RoomServiceError(
      "missing-supabase",
      "Supabase is not configured."
    );
  }

  return client as SupabaseRoomClient;
}

async function getAnonymousUser(
  client: SupabaseRoomClient
): Promise<SupabaseUser> {
  const currentUser = await client.auth.getUser();

  if (currentUser.error !== null && !isMissingAuthSession(currentUser.error)) {
    throw new RoomServiceError("supabase-auth", currentUser.error.message);
  }

  if (currentUser.data.user !== null) {
    return currentUser.data.user;
  }

  const anonymousUser = await client.auth.signInAnonymously();

  if (anonymousUser.error !== null || anonymousUser.data.user === null) {
    throw new RoomServiceError(
      "supabase-auth",
      anonymousUser.error?.message ?? "Anonymous sign-in failed."
    );
  }

  return anonymousUser.data.user;
}

function isMissingAuthSession(error: SupabaseError): boolean {
  return error.message.toLowerCase().includes("auth session missing");
}

async function insertRoom(
  client: SupabaseRoomClient,
  userId: string,
  puzzle: Puzzle,
  code: string
): Promise<RoomRecord | null> {
  const { data, error } = await client
    .from("rooms")
    .insert({
      center_letter: puzzle.centerLetter,
      code,
      created_by: userId,
      dictionary_version: puzzle.dictionaryVersion,
      outer_letters: puzzle.outerLetters,
      puzzle_date: puzzle.date
    })
    .select(
      "id, code, puzzle_date, center_letter, outer_letters, dictionary_version"
    )
    .single();

  if (error === null) {
    return data;
  }

  if (error.code === "23505") {
    return null;
  }

  throw toWriteError(error.message);
}

async function loadRoomMembers(
  client: SupabaseRoomClient,
  roomId: string
): Promise<readonly RoomMemberRow[]> {
  const query = client.from("room_members") as unknown as {
    select: (columns: string) => {
      eq: (
        column: string,
        value: unknown
      ) => Promise<SupabaseListResponse<RoomMemberRow>>;
    };
  };
  const { data, error } = await query
    .select("user_id, nickname, role")
    .eq("room_id", roomId);

  if (error !== null) {
    throw toWriteError(error.message);
  }

  return data ?? [];
}

async function loadRoomGuesses(
  client: SupabaseRoomClient,
  roomId: string
): Promise<readonly RoomGuessRow[]> {
  const query = client.from("room_guesses") as unknown as {
    select: (columns: string) => {
      eq: (column: string, value: unknown) => {
        order: (
          column: string,
          options: { readonly ascending: boolean }
        ) => Promise<SupabaseListResponse<RoomGuessRow>>;
      };
    };
  };
  const { data, error } = await query
    .select("user_id, word, points, created_at")
    .eq("room_id", roomId)
    .order("created_at", { ascending: false });

  if (error !== null) {
    throw toWriteError(error.message);
  }

  return data ?? [];
}

async function upsertRoomMember(
  client: SupabaseRoomClient,
  roomId: string,
  userId: string,
  nickname: string,
  role: RoomRole
): Promise<void> {
  const { error } = await client.from("room_members").upsert(
    {
      nickname,
      role,
      room_id: roomId,
      user_id: userId
    },
    { onConflict: "room_id,user_id" }
  );

  if (error !== null) {
    throw toWriteError(error.message);
  }
}

function getSafeNickname(value: string): string {
  return sanitizeNickname(value) || defaultNickname;
}

function generateRoomCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const values = crypto.getRandomValues(new Uint32Array(5));

  return Array.from(values, (value) => alphabet[value % alphabet.length]).join(
    ""
  );
}

function createPuzzleFromRoom(room: RoomRecord): Puzzle {
  const centerLetter = room.center_letter.toLowerCase();
  const outerLetters = room.outer_letters.map((letter) => letter.toLowerCase());
  const letters = [centerLetter, ...outerLetters];

  return {
    centerLetter,
    date: room.puzzle_date,
    dictionaryVersion: room.dictionary_version,
    id: `${room.puzzle_date}-${room.code}-${room.dictionary_version}`,
    letters,
    outerLetters
  };
}

function toWriteError(message: string): RoomServiceError {
  return new RoomServiceError("supabase-write", message);
}
