import { resolve } from "node:path";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setup, $fetch } from "@nuxt/test-utils/e2e";
import { cleanIpCache } from "./testUtils/utils";

describe("Module Integration", async () => {
  await setup({
    // On utilise resolve() qui gère les espaces et les backslashes Windows
    server: true,
    rootDir: resolve(__dirname, "../playground"),
  });
  beforeEach(() => {
    cleanIpCache();
  });
  it("devrait répondre avec succès", async () => {
    const html = await $fetch("/");
    expect(html).toBeDefined();
  });
});
