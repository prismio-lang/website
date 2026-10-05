import { defineConfig, type Plugin } from "vite";
import vinext from "vinext";
import { cloudflare } from "@cloudflare/vite-plugin";
import { staticAssetsAdapter } from "@vinext/cloudflare/cache/static-assets-adapter";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

function staticWebAssetsPlugin(): Plugin {
  return {
    name: "static-web-assets",
    buildStart() {
      try {
        execFileSync(process.execPath, [join(import.meta.dirname, "scripts/generate-static-assets.mjs")], {
          stdio: "inherit",
        });
      } catch (err) {
        console.warn("[static-web-assets] Warning: failed to generate static web assets:", err);
      }
    },
  };
}

export default defineConfig({
  plugins: [
    staticWebAssetsPlugin(),
    // vinext auto-injects @mdx-js/rollup with plugins from next.config
    vinext({
      cache: { cdn: staticAssetsAdapter() },
      prerender: { routes: "*" },
    }),
    cloudflare({
      viteEnvironment: {
        name: "rsc",
        childEnvironments: ["ssr"],
      },
    }),
  ],
});
