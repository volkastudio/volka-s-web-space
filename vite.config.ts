import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    // `server.entry` points Start at src/server.ts (our SSR error wrapper).
    tanstackStart({ server: { entry: "server" } }),
    // Nitro produces the deployable server output. No preset is hard-coded:
    // on Vercel it is detected automatically at build time, and for any other
    // host set NITRO_PRESET (e.g. NITRO_PRESET=node-server for a VPS/Railway/Fly).
    nitro(),
    viteReact(),
    tailwindcss(),
  ],
});
