import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  root: "github-pages",
  publicDir: "../public",
  base: "/claude-training-hub/",
  build: {
    outDir: "../dist-pages",
    emptyOutDir: true,
  },
});
