# 🛡️ Nuxt Nitro Shield

A lightweight, robust, and highly configurable security layer for Nuxt 3 and Nuxt 4 and Nitro. Protect your API routes from brute-force attacks, ban malicious bots instantly with honeypots, and manage IP blocks in real-time.

## ✨ Features

* 🚀 **Edge-Ready & Fast:** Runs seamlessly in Nitro middleware with minimal overhead.
* 💾 **Persistent Storage:** Native integration with Nitro Storage (Memory, FileSystem, Redis, Cloudflare KV).
* 🪤 **Honeypot Traps:** Instantly ban bots scanning for sensitive files (e.g., `/.env`, `/wp-admin`).
* ⚖️ **Smart Rate Limiting:** Configurable sliding-window limits for global traffic and high-risk routes.
* 🛠️ **Developer Tools:** Auto-imported Vue composables (`useShield`) and Nitro utilities (`useShieldStatus`).
* 📊 **Admin Dashboard API:** Built-in endpoints to monitor and manage blocked IPs securely.

---

## 📦 Installation

Add the module to your Nuxt project:

Here are the updated **Installation** and **Configuration Options** sections for your `README.md`. I have updated the code block to use the correct `runtimeConfig` structure and expanded the table to include every single option you just listed.

## 📦 Installation

Add the module to your Nuxt project:

```bash
npm install nuxt-nitro-shield

```

Register the module and configure your options in your `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  modules: ['nuxt-nitro-shield'],

  runtimeConfig: {
    public: {
      // The token used by the frontend to authenticate with the admin API
      shieldToken: "123456789", 
    },
    
    // Server-side private configurations
    rateLimit: {
      enabled: true,
      defaultLimit: {
        max: 5, // Default maximum requests
        timeWindow: 60000, // 1 minute default (in milliseconds)
      },
      whitelist: ["127.0.0.1", "::1", "8.8.8.8"],
      excludedRoutes: ["/_nuxt/**", "/favicon.ico"],
      verbose: true,
      honeypots: ["/admin.php", "/wp-login.php", "/.env", "/backup.sql"],
      statusPage: {
        enabled: true,
        token: "123456789", // Must match public.shieldToken for dashboard access
      },
      sensitiveRoutes: [],
    },
  },
})

```


## ⚙️ Configuration Options

All shield settings are configured inside your `nuxt.config.ts` under the `runtimeConfig` object.

| Option | Type | Default / Example | Description |
| --- | --- | --- | --- |
| `public.shieldToken` | `string` | `"123456789"` | Exposed to the frontend. Required for the `useShield` composable to authenticate requests to the dashboard API. |
| `rateLimit.enabled` | `boolean` | `true` | Globally enable or disable the entire shield middleware. |
| `rateLimit.defaultLimit` | `object` | `{ max: 5, timeWindow: 60000 }` | The standard rate limit applied to all non-excluded routes. |
| `rateLimit.whitelist` | `string[]` | `["127.0.0.1", "::1", "8.8.8.8"]` | IP addresses that completely bypass all rate limits and honeypots. |
| `rateLimit.excludedRoutes` | `string[]` | `["/_nuxt/**", "/favicon.ico"]` | Route patterns that the shield will completely ignore. |
| `rateLimit.verbose` | `boolean` | `true` | Enables detailed logging in your server terminal when IPs are blocked or banned. |
| `rateLimit.honeypots` | `string[]` | `["/admin.php", "/.env", ...]` | Traps for malicious bots. Accessing these triggers an immediate maximum penalty ban. |
| `rateLimit.sensitiveRoutes` | `object[]` | `[{ path: "/api/auth", max: 10 }]` | Specific, stricter limits for high-risk endpoints (e.g., login or password reset routes). |
| `rateLimit.statusPage` | `object` | `{ enabled: true, token: "..." }` | Configuration for the built-in management API. The token here acts as the server-side password. |

```

```

## 💻 Usage: Frontend (Vue)

The module auto-imports the `useShield` composable for use in your Vue components. It allows you to build a custom admin dashboard to manage the shield state.

```vue
<script setup>
const { getLogs, unblockIp, clearAll } = useShield()

// Fetch all currently tracked and banned IPs
const checkStatus = async () => {
  const logs = await getLogs()
  console.log(logs)
}

// Unblock a specific IP
const pardonUser = async (ipAddress) => {
  await unblockIp(ipAddress)
}
</script>

```

---

## 🔌 Usage: Backend (Nitro)

For custom server-side logic, the module auto-imports `useShieldStatus` into your Nitro environment. You can use this to manually ban users directly from your API routes (e.g., after 5 failed login attempts).

```typescript
// server/api/login.post.ts
export default defineEventHandler(async (event) => {
  const { banIp, getIpStatus } = useShieldStatus()
  const clientIp = getRequestIP(event)

  const isBanned = await getIpStatus(clientIp)
  if (isBanned?.isBanned) {
    throw createError({ statusCode: 403, message: 'IP Banned' })
  }

  const loginSuccess = false; // Simulate failed login

  if (!loginSuccess) {
    // Manually trigger a ban from the server
    await banIp(clientIp, 'Suspicious login activity')
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  return { success: true }
})

```

---

## 🗄️ Storage Drivers

By default, the shield uses Nitro's memory or filesystem driver. For production environments (especially serverless or edge deployments), you should configure a persistent storage driver like Redis.

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    storage: {
      shield: {
        driver: 'redis',
        url: process.env.REDIS_URL
      }
    }
  }
})

```

*Note: If your chosen driver supports native TTL (like Redis or Cloudflare KV), the shield will automatically optimize itself to use it.*

---

## 📄 License

MIT License


