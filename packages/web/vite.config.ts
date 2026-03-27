import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
      "/socket.io": {
        target: "http://localhost:3001",
        ws: true,
      },
    },
  },
  resolve: {
    alias: {
      "@clinikchat/shared": path.resolve(__dirname, "../shared/src/index.ts"),
    },
  },
});
