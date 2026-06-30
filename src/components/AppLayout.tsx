import { NavLink, Outlet } from "react-router";

import { appRoutes } from "../app/routes";
import { usePreferencesStore } from "../stores/preferencesStore";

const navigationItems = [
  { label: "Daily", to: appRoutes.daily },
  { label: "Troop", to: appRoutes.troopNew }
] as const;

export function AppLayout() {
  const theme = usePreferencesStore((state) => state.theme);
  const toggleTheme = usePreferencesStore((state) => state.toggleTheme);

  return (
    <div className={theme}>
      <div className="min-h-screen bg-background text-primary-text transition-colors duration-200">
        <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
            <NavLink
              className="text-xl font-black tracking-normal text-primary-text sm:text-2xl"
              to={appRoutes.home}
            >
              Spelling with my bee
            </NavLink>
            <nav aria-label="Primary navigation" className="hidden gap-2 sm:flex">
              {navigationItems.map((item) => (
                <NavLink
                  className={({ isActive }) =>
                    [
                      "rounded-lg px-3 py-2 text-sm font-semibold transition",
                      isActive
                        ? "bg-primary-yellow text-primary-text"
                        : "text-secondary-text hover:bg-white"
                    ].join(" ")
                  }
                  key={item.to}
                  to={item.to}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <button
              aria-label="Toggle color theme"
              className="grid size-10 place-items-center rounded-lg border border-border bg-white text-sm font-bold text-primary-text shadow-sm transition hover:border-blue-accent focus:outline-none focus:ring-2 focus:ring-blue-accent focus:ring-offset-2"
              type="button"
              onClick={toggleTheme}
            >
              {theme === "dark" ? "L" : "D"}
            </button>
          </div>
        </header>
        <Outlet />
        <nav
          aria-label="Mobile navigation"
          className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-2 border-t border-border bg-white sm:hidden"
        >
          {navigationItems.map((item) => (
            <NavLink
              className={({ isActive }) =>
                [
                  "px-3 py-3 text-center text-sm font-semibold",
                  isActive
                    ? "bg-primary-yellow text-primary-text"
                    : "text-secondary-text"
                ].join(" ")
              }
              key={item.to}
              to={item.to}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
