import { createDailyPuzzle, type Puzzle } from "../../game";
import { sanitizeNickname } from "../../lib/sanitize";
import { getSupabaseClient } from "../../lib/supabase/client";

const roomCodePattern = /^[A-Z0-9]{5,8}$/;
const defaultNickname = "Bee Friend";
const maxCodeAttempts = 5;

export type RoomRole = "player" | "spectator";

export interface RoomActionResult {
  readonly roomCode: string;
  readonly roomId: string;
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
  readonly code: string;
  readonly id: string;
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
      roomCode: room.code,
      roomId: room.id
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
    .select("id, code")
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
    roomCode: data.code,
    roomId: data.id
  };
}

export function cleanRoomCode(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 8);
}

export function getRoomErrorMessage(error: unknown): string {
  if (error instanceof RoomServiceError) {
    if (error.code === "missing-supabase") {
      return "Room play needs Supabase keys in Vercel before it can go live.";
    }

    return error.message;
  }

  return "Something went wrong with the room. Please try again.";
}

function getRoomClient(
  injectedClient: SupabaseRoomClient | null | undefined
): SupabaseRoomClient {
  const client = injectedClient === undefined ? getSupabaseClient() : injectedClient;

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
    .select("id, code")
    .single();

  if (error === null) {
    return data;
  }

  if (error.code === "23505") {
    return null;
  }

  throw toWriteError(error.message);
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

function toWriteError(message: string): RoomServiceError {
  return new RoomServiceError("supabase-write", message);
}
