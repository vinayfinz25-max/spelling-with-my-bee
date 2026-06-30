import { describe, expect, it } from "vitest";

import { appRoutes } from "./routes";

describe("appRoutes", () => {
  it("keeps the core milestone routes stable", () => {
    expect(appRoutes).toEqual({
      home: "/",
      daily: "/daily",
      troopNew: "/troop/new",
      troopRoom: "/troop/:roomCode"
    });
  });
});
