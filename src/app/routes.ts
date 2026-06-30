export const appRoutes = {
  home: "/",
  daily: "/daily",
  troopNew: "/troop/new",
  troopRoom: "/troop/:roomCode"
} as const;

export type AppRoute = (typeof appRoutes)[keyof typeof appRoutes];
