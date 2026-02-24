import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";
import { setup, $fetch } from "@nuxt/test-utils/e2e";

describe("Middleware Rate Limiter", async () => {
  // 1. On indique explicitement où se trouve l'application Nuxt à tester
  await setup({
    rootDir: fileURLToPath(new URL("../playground", import.meta.url)),
    server: true,
  });

  // 2. Ton test ici...
  it("devrait charger la page", async () => {
    const html = await $fetch("/");
    expect(html).toContain("div"); // Exemple basique
  });

  it("devrait bloquer les requêtes après la limite de 5", async () => {
    // On invente une IP unique juste pour ce test pour partir de zéro
    const headers = { "x-test-ip": "robot-testeur-1" };

    // 1. Les 5 premières requêtes doivent passer
    for (let i = 0; i < 5; i++) {
      const response = await $fetch("/", { headers });
      expect(response).toBeDefined();
    }

    // 2. La 6ème requête DOIT échouer et être interceptée par le catch
    try {
      await $fetch("/", { headers });

      // Si on arrive ici, le middleware n'a pas fait son job
      expect.fail("La 6ème requête aurait dû être bloquée !");
    } catch (error: any) {
      // 3. ofetch stocke le code HTTP dans error.status
      expect(error.status).toBe(429);
    }
  });
});
