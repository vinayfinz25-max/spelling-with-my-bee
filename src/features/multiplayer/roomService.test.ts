import { describe, expect, it, vi } from "vitest";

import type { Puzzle } from "../../game";
import {
  cleanRoomCode,
  createTroopRoom,
  joinTroopRoom,
  RoomServiceError
} from "./roomService";

const testPuzzle: Puzzle = {
  centerLetter: "e",
  date: "2026-06-30",
  dictionaryVersion: "test",
  id: "test-puzzle",
  letters: ["e", "a", "b", "c", "d", "f", "g"],
  outerLetters: ["a", "b", "c", "d", "f", "g"]
};

describe("roomService", () => {
  it("cleans room codes for friendly copy and paste", () => {
    expect(cleanRoomCode(" bee-42!! ")).toBe("BEE42");
    expect(cleanRoomCode("abc123456789")).toBe("ABC12345");
  });

  it("creates a room and joins the creator as a player", async () => {
    const client = createFakeRoomClient();

    const result = await createTroopRoom(
      { nickname: "  Queen Bee  " },
      {
        client,
        createPuzzle: () => testPuzzle,
        generateCode: () => "BEE42"
      }
    );

    expect(result).toEqual({ roomCode: "BEE42", roomId: "room-1" });
    expect(client.calls).toEqual([
      {
        payload: {
          center_letter: "e",
          code: "BEE42",
          created_by: "user-1",
          dictionary_version: "test",
          outer_letters: ["a", "b", "c", "d", "f", "g"],
          puzzle_date: "2026-06-30"
        },
        table: "rooms",
        type: "insert"
      },
      {
        payload: {
          nickname: "Queen Bee",
          role: "player",
          room_id: "room-1",
          user_id: "user-1"
        },
        table: "room_members",
        type: "upsert"
      }
    ]);
  });

  it("starts anonymous sign-in when no auth session exists yet", async () => {
    const client = createFakeRoomClient({
      currentUserError: { message: "Auth session missing!" }
    });

    const result = await createTroopRoom(
      { nickname: "Vinay" },
      {
        client,
        createPuzzle: () => testPuzzle,
        generateCode: () => "HIVE7"
      }
    );

    expect(result.roomCode).toBe("HIVE7");
    expect(client.authCalls).toEqual(["getUser", "signInAnonymously"]);
  });

  it("retries room creation when a generated code already exists", async () => {
    const client = createFakeRoomClient({
      duplicateCodes: new Set(["BEE42"])
    });

    const result = await createTroopRoom(
      { nickname: "Vinay" },
      {
        client,
        createPuzzle: () => testPuzzle,
        generateCode: vi
          .fn()
          .mockReturnValueOnce("BEE42")
          .mockReturnValue("HIVE7")
      }
    );

    expect(result.roomCode).toBe("HIVE7");
  });

  it("joins an existing room with a sanitized nickname", async () => {
    const client = createFakeRoomClient();

    const result = await joinTroopRoom(
      { nickname: "  Buzz  Boss  ", roomCode: " hive7 " },
      { client }
    );

    expect(result).toEqual({ roomCode: "HIVE7", roomId: "room-1" });
    expect(client.calls.at(-1)).toEqual({
      payload: {
        nickname: "Buzz Boss",
        role: "player",
        room_id: "room-1",
        user_id: "user-1"
      },
      table: "room_members",
      type: "upsert"
    });
  });

  it("rejects malformed room codes before calling Supabase", async () => {
    const client = createFakeRoomClient();

    await expect(
      joinTroopRoom({ nickname: "Vinay", roomCode: "bad" }, { client })
    ).rejects.toMatchObject({
      code: "invalid-room-code"
    });

    expect(client.calls).toEqual([]);
  });

  it("explains when Supabase is not configured", async () => {
    await expect(
      createTroopRoom({ nickname: "Vinay" }, { client: null })
    ).rejects.toBeInstanceOf(RoomServiceError);
  });
});

interface FakeRoomClientOptions {
  readonly currentUserError?: {
    readonly code?: string;
    readonly message: string;
  };
  readonly duplicateCodes?: Set<string>;
}

function createFakeRoomClient(options: FakeRoomClientOptions = {}) {
  const calls: { payload: unknown; table: string; type: string }[] = [];
  const authCalls: string[] = [];

  return {
    authCalls,
    calls,
    auth: {
      getUser: () => {
        authCalls.push("getUser");

        return Promise.resolve({
          data: {
            user:
              options.currentUserError === undefined ? { id: "user-1" } : null
          },
          error: options.currentUserError ?? null
        });
      },
      signInAnonymously: () => {
        authCalls.push("signInAnonymously");

        return Promise.resolve({
          data: { user: { id: "user-1" } },
          error: null
        });
      }
    },
    from: (table: string) => ({
      insert: (payload: Record<string, unknown>) => {
        const code = typeof payload.code === "string" ? payload.code : "";

        calls.push({ payload, table, type: "insert" });

        return {
          select: () => ({
            single: () => {
              if (options.duplicateCodes?.has(code)) {
                return Promise.resolve({
                  data: null,
                  error: {
                    code: "23505",
                    message: "duplicate key value"
                  }
                });
              }

              return Promise.resolve({
                data: { code, id: "room-1" },
                error: null
              });
            }
          })
        };
      },
      select: () => ({
        eq: (_column: string, value: unknown) => ({
          maybeSingle: () =>
            Promise.resolve({
              data: {
                code: typeof value === "string" ? value : "",
                id: "room-1"
              },
              error: null
            })
        })
      }),
      upsert: (payload: Record<string, unknown>) => {
        calls.push({ payload, table, type: "upsert" });

        return Promise.resolve({ error: null });
      }
    })
  };
}
