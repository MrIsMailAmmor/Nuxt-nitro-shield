import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit, cleanupExpiredFiles } from "../src/core";
import { cleanIpCache } from "./testUtils/utils";

describe("Rate Limit Core Logic", () => {
  let mockStorage: Record<string, any> = {};
  // Simulation d'un stockage simple
  const getItem = async (key: string) => mockStorage[key] || null;
  const setItem = async (key: string, value: any) => {
    mockStorage[key] = value;
  };

  beforeEach(() => {
    mockStorage = {}; // Reset du stockage avant chaque test
    cleanIpCache();
  });

  it("devrait autoriser la première requête", async () => {
    const result = await checkRateLimit(getItem, setItem, "127.0.0.1", {
      defaultLimit: {
        max: 2,
        timeWindow: 1000,
      },
    });
    expect(result.currentCount).toBe(1);
    expect(result.isBlocked).toBe(false);
  });

  it("devrait bloquer après avoir dépassé la limite", async () => {
    const options = { defaultLimit: { max: 1, timeWindow: 1000 } };

    await checkRateLimit(getItem, setItem, "127.0.0.1", options); // Requête 1
    const result = await checkRateLimit(getItem, setItem, "127.0.0.1", options); // Requête 2

    expect(result.currentCount).toBe(2);
    expect(result.isBlocked).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it("devrait réinitialiser après le délai imparti", async () => {
    const options = { defaultLimit: { max: 1, timeWindow: 10 } }; // 10ms pour aller vite

    await checkRateLimit(getItem, setItem, "127.0.0.1", options);

    // On attend 20ms
    await new Promise((resolve) => setTimeout(resolve, 20));

    const result = await checkRateLimit(getItem, setItem, "127.0.0.1", options);
    expect(result.currentCount).toBe(1); // Compteur repart à 1
    expect(result.isBlocked).toBe(false);
  });

  it("should remove expired records and keep active ones", async () => {
    const now = Date.now();

    // Simuler un stockage avec une entrée expirée et une active
    const mockDb = new Map();
    mockDb.set("rate-limit:expired", { count: 10, resetTime: now - 1000 }); // Expire il y a 1s
    mockDb.set("rate-limit:active", { count: 1, resetTime: now + 10000 }); // Expire dans 10s

    const storageInterface = {
      getKeys: async () => Array.from(mockDb.keys()),
      getItem: async (key: string) => mockDb.get(key),
      removeItem: async (key: string) => {
        mockDb.delete(key);
      },
    };

    // Exécuter le nettoyage
    const result = await cleanupExpiredFiles(storageInterface);

    // ✅ Vérifications
    expect(result.cleaned).toBe(1);
    expect(mockDb.has("rate-limit:expired")).toBe(false);
    expect(mockDb.has("rate-limit:active")).toBe(true);
  });
});
