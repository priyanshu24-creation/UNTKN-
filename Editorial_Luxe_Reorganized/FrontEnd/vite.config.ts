import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  vite: {
    server: {
      fs: {
        allow: [".."],
      },
    },

    // Force server dependencies to be bundled.
    ssr: {
      noExternal: ["@supabase/supabase-js", "zod"],
    },
  },

  nitro: {
    preset: "node-server",
    externals: {
      inline: ["@supabase/supabase-js", "zod"],
    },
  },

  tanstackStart: {
    server: {
      entry: "server",
    },
  },
});
