import { resolve } from "node:path";

const rateLimitConfig = {
  enabled: true,
  defaultLimit: {
    max: 10,
    timeWindow: 60000,
  },
  whitelist: [],
  verbose: true,
  honeypots: [],
  statusPage: {
    enabled: true,
    token: "123456789",
  },
  sensitiveRoutes: [],
};

const config = (config: {}) => {
  const rootDir = resolve(process.cwd(), "playground");
  return {
    server: true,
    rootDir,
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
          ...rateLimitConfig,
          ...config,
        },
      },
    },
  };
};

export { config };
