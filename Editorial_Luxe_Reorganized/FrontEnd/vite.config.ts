import { defineConfig as defineViteConfig } from "vite";
import { defineConfig as defineLovableConfig } from "@lovable.dev/vite-tanstack-config";
import { nitro } from "nitro/vite";

export default defineViteConfig(async (env) => {
  const config = await defineLovableConfig({
    tanstackStart: {
      server: {
        entry: "server",
      },
    },

    // Disable Lovable's built-in Cloudflare Nitro.
    // @ts-expect-error
    nitro: false,
  })(env);

  if (env.command === "build") {
    config.plugins = [
      ...(config.plugins ?? []),
      nitro({
        preset: "node-server",
      }),
    ];
  }

  return config;
});
