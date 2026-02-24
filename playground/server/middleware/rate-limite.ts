export default defineEventHandler(async (event) => {
  const url = event.node.req.url || "";

  // 1. Filtres de sécurité et de performance
  if (
    url.startsWith("/_nuxt") ||
    url.startsWith("/__nuxt") ||
    url.includes("favicon.ico")
  ) {
    return;
  }

  // Note : si tu veux que ta page d'accueil soit aussi protégée,
  // commente les lignes suivantes. Sinon, seules les routes /api/* sont limitées.
  if (!url.startsWith("/api/")) {
    return;
  }

  // 2. Récupération de la config et des outils
  const config = useRuntimeConfig();
  const storage = useStorage();
  const ip =
    getHeader(event, "x-test-ip") || getRequestIP(event) || "ip-locale";
  const key = `rate-limit:${ip}`;

  const maxRequests = config.rateLimit?.maxRequests || 5;
  const timeWindow = config.rateLimit?.timeWindow || 60000;
  const now = Date.now();

  // 3. Récupération de l'état actuel
  const data = (await storage.getItem(key)) as {
    count: number;
    startTime: number;
  } | null;

  let currentCount = 0;
  let startTime = now;

  // 4. Logique du compteur
  if (data) {
    if (now - data.startTime > timeWindow) {
      // Fenêtre expirée : on repart à zéro
      currentCount = 1;
      startTime = now;
      await storage.setItem(key, { count: currentCount, startTime });
    } else {
      // Fenêtre active : on incrémente
      currentCount = data.count + 1;
      startTime = data.startTime;
      await storage.setItem(key, { count: currentCount, startTime });
    }
  } else {
    // Premier passage
    currentCount = 1;
    await storage.setItem(key, { count: currentCount, startTime: now });
  }

  // 5. Calcul des Headers (Avant le throw d'erreur !)
  const remaining = Math.max(0, maxRequests - currentCount);
  const resetTime = Math.ceil((startTime + timeWindow - now) / 1000);

  setHeaders(event, {
    "X-RateLimit-Limit": maxRequests.toString(),
    "X-RateLimit-Remaining": remaining.toString(),
    "X-RateLimit-Reset": resetTime.toString(),
  });

  // 6. Sanction si dépassement
  if (currentCount > maxRequests) {
    console.warn(`🛑 Accès refusé pour : ${ip} (Limite atteinte)`);
    throw createError({
      statusCode: 429,
      statusMessage: "Trop de requêtes, réessaie dans une minute !",
    });
  }

  console.log(
    `⏱️ [Rate Limiter] IP: ${ip} | Visites: ${currentCount}/${maxRequests}`,
  );
});
