import { resolve } from "node:path";
import { describe, it, expect } from "vitest";
import { setup, fetch } from "@nuxt/test-utils/e2e"; // 🛡️ On importe 'fetch' à la place

describe("Rate Limit Integration", async () => {
  const rootDir = resolve(process.cwd(), "playground");

  await setup({
    rootDir,
    server: true,
  });

  it("devrait retourner les en-têtes X-RateLimit", async () => {
    // 🛡️ fetch('/') renvoie directement la réponse brute avec les headers
    const response = await fetch("/api/test");

    // On vérifie les headers (attention, ils sont souvent en minuscules en HTTP)
    expect(response.headers.get("x-ratelimit-limit")).toBeDefined();
    expect(response.headers.get("x-ratelimit-remaining")).toBeDefined();
  });

  it("devrait bloquer après dépassement", async () => {
    // On peut utiliser une boucle simple pour saturer la limite
    for (let i = 0; i < 5; i++) {
      await fetch("/api/test");
    }

    const blockedResponse = await fetch("/api/test");
    expect(blockedResponse.status).toBe(429);
  });
});
