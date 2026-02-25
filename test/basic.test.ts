import { resolve } from "node:path";
import { describe, it, expect } from "vitest";
import { setup, $fetch } from "@nuxt/test-utils/e2e";

describe("Module Integration", async () => {
  await setup({
    // On utilise resolve() qui gère les espaces et les backslashes Windows
    rootDir: resolve(__dirname, "../playground"),
    server: true,
  });

  it("devrait répondre avec succès", async () => {
    const html = await $fetch("/");
    expect(html).toBeDefined();
  });
});
