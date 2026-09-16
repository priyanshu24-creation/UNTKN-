import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  vite: {
    server: {
      fs: {
        allow: [".."],
      },
    },
    build: {
      rollupOptions: {
        external: ["@supabase/supabase-js", "zod"],
      },
    },
  },

  nitro: {
    preset: "node-server",
  },

  tanstackStart: {
    server: {
      entry: "server",
    },
  },
});
