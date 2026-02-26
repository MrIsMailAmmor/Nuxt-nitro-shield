import { $fetch } from "@nuxt/test-utils";

export const cleanIpCache = async () => {
  const token = "123456789";
  try {
    return await $fetch("/api/shield/status", {
      method: "DELETE", // 👈 Assure-toi que c'est bien DELETE
      query: {
        // 👈 Nitro préfère que les params soient ici
        token,
        all: "true",
      },
    });
  } catch (e) {
    console.error("Failed to clean storage:", e);
  }
};
