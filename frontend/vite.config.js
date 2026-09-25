import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "electron-file-protocol",
      transformIndexHtml(html) {
        return html.replace(/ crossorigin/g, "");
      }
    }
  ],
  base: "./",
  server: { port: 5173, proxy: { "/api": "http://127.0.0.1:8000", "/health": "http://127.0.0.1:8000" } },
});
