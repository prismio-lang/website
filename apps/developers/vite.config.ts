import { defineConfig, type Plugin } from "vite";
import vinext from "vinext";
import { cloudflare } from "@cloudflare/vite-plugin";
import { staticAssetsAdapter } from "@vinext/cloudflare/cache/static-assets-adapter";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

function staticDocsAssetsPlugin(): Plugin {
  return {
    name: "static-docs-assets",
    buildStart() {
      try {
        execFileSync(process.execPath, [join(import.meta.dirname, "scripts/generate-static-assets.mjs")], {
          stdio: "inherit",
        });
      } catch (err) {
        console.warn("[static-docs-assets] Warning: failed to generate static docs assets:", err);
      }
    },
  };
}

export default defineConfig({
  plugins: [
    staticDocsAssetsPlugin(),
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
