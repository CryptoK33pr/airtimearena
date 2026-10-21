// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command }) => ({
  base: command === "build" ? "/airtimearena/" : "/",
  plugins: [react()],
  // NO "define" block that overwrites process.env
  optimizeDeps: {
    include: ["wagmi", "ethers", "viem"],
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
}));