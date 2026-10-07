import { defineConfig, type Plugin } from "vite";
import vinext from "vinext";
import { cloudflare } from "@cloudflare/vite-plugin";
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
    vinext(),
    cloudflare({
      viteEnvironment: {
        name: "rsc",
        childEnvironments: ["ssr"],
      },
    }),
  ],
});
