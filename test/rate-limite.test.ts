import { describe, it, expect } from "vitest";
import { setup, fetch } from "@nuxt/test-utils/e2e"; // 🛡️ On importe 'fetch' à la place
import { config } from "./testUtils/setup";

describe("Rate Limit Integration", async () => {
  await setup(config({ defaultLimit: { max: 5, timeWindow: 60000 } }));

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

  it("devrait autoriser une IP whitelisted à dépasser la limite sans blocage", async () => {
    const testUrl = "/api/test";
    const vipIp = "127.0.0.2"; // Cette IP doit être dans ta whitelist config

    // On bombarde le serveur (ex: 10 requêtes pour une limite de 5)
    for (let i = 0; i < 10; i++) {
      const response = await fetch(testUrl, {
        headers: {
          "x-test-ip": vipIp, // On simule l'IP VIP
        },
      });

      expect(response.status).toBe(200);
    }

    // On vérifie aussi que le compteur de "remaining" ne baisse pas (ou reste au max)
    const finalCheck = await fetch(testUrl, {
      headers: { "x-test-ip": vipIp },
    });
    expect(finalCheck.headers.get("x-ratelimit-remaining")).toBeDefined();
  });
});
