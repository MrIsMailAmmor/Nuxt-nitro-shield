// src/runtime/server/utils/shield.ts

// 1. The Core Logic (Easily Testable)
// We pass the storage engine in as an argument, so we can fake it in Vitest!
export const createShieldStatusAPI = (storage: any) => {
  return {
    getIpStatus: async (ip: string) => {
      const data = await storage.getItem(ip);
      return data || null;
    },
    unblockIp: async (ip: string) => {
      await storage.removeItem(ip);
      return true;
    },
    banIp: async (ip: string, reason: string = "Manual Server Ban") => {
      const banData = {
        ip,
        requests: 9999,
        isBanned: true,
        reason,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      };
      await storage.setItem(ip, banData);
      return banData;
    },
  };
};

// 2. The Nitro Wrapper (For Production)
export const useShieldStatus = () => {
  // @ts-ignore - Nitro auto-imports useStorage globally during a real build
  const storage = useStorage("shield");

  return createShieldStatusAPI(storage);
};
