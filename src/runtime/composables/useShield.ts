import { useRuntimeConfig } from "#imports";

export interface ShieldStatus {
  status: "active" | "inactive";
  timestamp: string;
  metrics: {
    totalTrackedIPs: number;
    bannedCount: number;
    activeOffenders: number;
  };
  entries: {
    ip: string;
    requests: number;
    isBanned: boolean;
    expiresAt: string;
    timeLeftSeconds: number;
    isExpired: boolean;
  }[];
}
export const useShield = () => {
  const token = useRuntimeConfig().public.shieldToken; // Récupéré de la config

  // Une seule fonction pour agir sur le stockage
  const manageStorage = async (action: "delete" | "clear", ip?: string) => {
    return await $fetch("/api/shield/status", {
      method: "DELETE",
      query: {
        token,
        ip,
        all: action === "clear" ? "true" : "false",
      },
    });
  };

  // Une fonction pour lire les données
  const fetchLogs = async (): Promise<ShieldStatus> => {
    return await $fetch("/api/shield/status", { query: { token } });
  };

  return {
    unblockIp: (ip: string) => manageStorage("delete", ip),
    clearAll: () => manageStorage("clear"),
    getLogs: fetchLogs,
  };
};
