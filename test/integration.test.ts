// test/integration.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { setup, fetch } from "@nuxt/test-utils";
import { resolve } from "node:path";
import { config } from "./testUtils/config";

describe("Shield Intelligent Routing", async () => {
  // We setup the Nuxt environment with our specific config
  await setup({
    server: true,
    rootDir: resolve(__dirname, "../playground"),
    nuxtConfig: {
      nitro: {
        storage: {
          shield: {
            driver: "memory",
          },
        },
      },
      runtimeConfig: {
        rateLimit: {
          ...config,
          sensitiveRoutes: [{ path: "/api/auth", max: 2 }],
          honeypots: ["/admin.php"],
          defaultLimit: {
            max: 10,
            timeWindow: 60000,
          },
        },
      },
    },
  });
  it("should allow more requests on global routes than sensitive ones", async () => {
    // 1. Test the sensitive route (Limit: 2)
    const res1 = await fetch("/api/auth");
    const res2 = await fetch("/api/auth");
    const res3 = await fetch("/api/auth");

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
    expect(res3.status).toBe(429); // 🛑 Third request must be blocked

    const data = await res3.json();
    expect(data.message).toContain("Too Many Requests");
  });

  it("should still allow access to global routes even if sensitive limit is hit", async () => {
    // Context: The IP has already made 3 requests total in the previous test.
    // Since the global limit is 10, /api/global should still work.

    const resGlobal = await fetch("/api/test");

    // ✅ Should be 200 because 3 requests < 10 global limit
    expect(resGlobal.status).toBe(200);

    // Check headers to see if the global limit is being used
    expect(resGlobal.headers.get("X-RateLimit-Limit")).toBe("10");
  });

  it("should ban IP instantly when a honeypot route is touched", async () => {
    const clientIP = "1.2.3.4";

    // 1. L'intrus touche le piège
    const trapRes = await fetch("/admin.php", {
      headers: { "X-Forwarded-For": clientIP },
    });
    expect(trapRes.status).toBe(418); // Le code "Teapot" qu'on a choisi

    // 2. L'intrus essaie maintenant d'accéder à une route normale
    const normalRes = await fetch("/api/test", {
      headers: { "X-Forwarded-For": clientIP },
    });

    // ✅ Il doit être bloqué immédiatement même s'il n'a fait qu'une seule requête sur l'API
    expect(normalRes.status).toBe(429);
    const data = await normalRes.json();
    expect(data.statusMessage).toBe("Access Denied");
  });
});
