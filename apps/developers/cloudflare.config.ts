import { bindings, defineConfig, defineWorker } from "cf/config";

export default defineConfig({
  worker: defineWorker({
    name: "developers",
    entrypoint: "vinext/server/fetch-handler",
    compatibilityDate: "2026-10-03",
    compatibilityFlags: ["nodejs_compat"],
    // The site is a static export (see next.config.ts): assets serve every page, `/page/` goes to `/page`,
    // and a path with no asset gets 404.html. scripts/finalize-static-site.mjs swaps the Worker for a stub.
    assets: { htmlHandling: "drop-trailing-slash", notFoundHandling: "404-page" },
    env: {
      ASSETS: bindings.assets(),
    },
  }),
});
