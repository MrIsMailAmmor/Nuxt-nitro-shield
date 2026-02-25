import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit } from "../src/core";

describe("Rate Limit Core Logic", () => {
  let mockStorage: Record<string, any> = {};

  // Simulation d'un stockage simple
  const getItem = async (key: string) => mockStorage[key] || null;
  const setItem = async (key: string, value: any) => {
    mockStorage[key] = value;
  };

  beforeEach(() => {
    mockStorage = {}; // Reset du stockage avant chaque test
  });

  it("devrait autoriser la première requête", async () => {
    const result = await checkRateLimit(getItem, setItem, "127.0.0.1", {
      maxRequests: 2,
      timeWindow: 1000,
    });
    expect(result.currentCount).toBe(1);
    expect(result.isBlocked).toBe(false);
  });

  it("devrait bloquer après avoir dépassé la limite", async () => {
    const options = { maxRequests: 1, timeWindow: 1000 };

    await checkRateLimit(getItem, setItem, "127.0.0.1", options); // Requête 1
    const result = await checkRateLimit(getItem, setItem, "127.0.0.1", options); // Requête 2

    expect(result.currentCount).toBe(2);
    expect(result.isBlocked).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it("devrait réinitialiser après le délai imparti", async () => {
    const options = { maxRequests: 1, timeWindow: 10 }; // 10ms pour aller vite

    await checkRateLimit(getItem, setItem, "127.0.0.1", options);

    // On attend 20ms
    await new Promise((resolve) => setTimeout(resolve, 20));

    const result = await checkRateLimit(getItem, setItem, "127.0.0.1", options);
    expect(result.currentCount).toBe(1); // Compteur repart à 1
    expect(result.isBlocked).toBe(false);
  });
});
