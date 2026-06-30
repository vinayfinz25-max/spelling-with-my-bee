import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { sanitizeNickname } from "../lib/sanitize";

type ThemePreference = "light" | "dark";

interface PreferencesState {
  nickname: string;
  theme: ThemePreference;
  setNickname: (nickname: string) => void;
  toggleTheme: () => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      nickname: "",
      theme: "light",
      setNickname: (nickname) => {
        set({ nickname: sanitizeNickname(nickname) });
      },
      toggleTheme: () => {
        set((state) => ({ theme: state.theme === "light" ? "dark" : "light" }));
      }
    }),
    {
      name: "spelling-with-my-bee/preferences",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        nickname: state.nickname,
        theme: state.theme
      })
    }
  )
);
