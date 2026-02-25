import { defineVitestConfig } from "@nuxt/test-utils/config";

export default defineVitestConfig({
  test: {
    environment: "nuxt",
    environmentOptions: {
      nuxt: {
        rootDir: "./playground",
      },
    },
    // On désactive le multithreading qui peut poser problème avec les chemins Windows
    pool: "forks",
  },
  // On neutralise les defines qui causent l'erreur "false"
  define: {
    "import.meta.test": "true",
  },
  resolve: {
    alias: {
      "bun:test": "node:events",
      // On force les alias de racine pour éviter les problèmes d'espaces
      "~": "./",
      "@": "./",
    },
  },
});
