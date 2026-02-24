export default defineEventHandler(async (event) => {
  const url = event.node.req.url || "";

  // 🛑 Le filtre : on ignore le favicon et les fichiers internes de Nuxt
  if (
    url.startsWith("/_nuxt") ||
    url.startsWith("/__nuxt") ||
    url.includes("favicon.ico")
  ) {
    return; // On sort du middleware sans rien faire (ni compter, ni bloquer)
  }
  if (!url.startsWith("/api/")) {
    return; // On ignore aussi les API pour ce test, mais tu peux les inclure si tu veux
  }
  const config = useRuntimeConfig();
  const ip =
    getHeader(event, "x-test-ip") || getRequestIP(event) || "ip-locale";
  const storage = useStorage();
  const key = `rate-limit:${ip}`;

  // On lit les données, qui seront maintenant un objet et plus un simple nombre
  const data = (await storage.getItem(key)) as {
    count: number;
    startTime: number;
  } | null;

  const now = Date.now();
  const timeWindow = config.rateLimit?.timeWindow || 60000;
  const maxRequests = config.rateLimit?.maxRequests || 5;

  let currentCount = 0;

  if (data) {
    // ÉTAPE A : L'utilisateur a déjà visité le site
    // On vérifie si la fenêtre de temps (1 minute) est écoulée
    if (now - data.startTime > timeWindow) {
      // Le temps est écoulé ! On lui pardonne et on recommence à 1
      currentCount = 1;
      await storage.setItem(key, { count: currentCount, startTime: now });
      console.warn(`🛑 Accès refusé pour : ${ip}`);
    } else {
      // Le temps n'est pas écoulé, on continue de compter
      currentCount = data.count + 1;

      if (currentCount > maxRequests) {
        console.warn(`🛑 Accès refusé pour : ${ip}`);
        throw createError({
          statusCode: 429,
          message: "Trop de requêtes, réessaie dans une minute !",
        });
      }
      // On sauvegarde le nouveau compte, en gardant l'heure de départ initiale
      await storage.setItem(key, {
        count: currentCount,
        startTime: data.startTime,
      });
    }
  } else {
    console.log(`👋 Première visite de : ${ip}`);
    // ÉTAPE B : C'est la toute première visite de l'utilisateur
    currentCount = 1;
    await storage.setItem(key, { count: currentCount, startTime: now });
  }

  console.log(`⏱️ [Rate Limiter] IP: ${ip} | Visites: ${currentCount}`);
});
