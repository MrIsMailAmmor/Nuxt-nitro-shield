const config = {
  maxRequests: 10,
  timeWindow: 60 * 1000, // 1 minute
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
