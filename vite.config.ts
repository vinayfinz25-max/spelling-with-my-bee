import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  envPrefix: ["VITE_", "NEXT_PUBLIC_"],
  plugins: [react(), tailwindcss()],
  build: {
    target: "es2022"
  },
  server: {
    port: 5173,
    strictPort: false
  }
});
