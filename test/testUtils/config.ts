const config = {
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

export { config };
