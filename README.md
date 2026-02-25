# 🛡️ Nuxt Nitro Shield

A lightweight, persistent, and "smart" rate-limiting module for Nuxt 3 and Nitro. Protect your API routes from bots and brute-force attacks with built-in Honeypot support.

Features
🚀 Fast & Lightweight: Minimal overhead on your Nitro server.

💾 Persistent: Supports multiple storage drivers (FS, Redis, Memory) via Nitro Storage.

🪤 Honeypot: Instantly ban bots trying to access sensitive "trap" routes (e.g., /.env, /admin.php).

⚪ IP Whitelisting: Grant unlimited access to trusted IPs.

📊 Status API: Secured dashboard to monitor blocked IPs in real-time.

📝 Pro Logging: Clear, scoped logs using consola.



# Quick Setup
Installation (Internal use for now):
Add the module to your nuxt.config.ts:
```
TypeScript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['./modules/nuxt-nitro-shield/src/module'],

  rateLimit: {
    maxRequests: 10,
    timeWindow: 60000, // 1 minute
    whitelist: ['127.0.0.1'],
    honeypots: ['/admin.php', '/.env', '/wp-login.php'],
    statusPage: {
      enabled: true,
      token: 'your-secure-token'
    }
  },

  // Persistence configuration
  nitro: {
    storage: {
      shield: {
        driver: 'fs',
        base: './.data/shield'
      }
    }
  }
})
```


## Configuration Options

| Option       | Type      | Default                                   | Description |
|-------------|-----------|-------------------------------------------|-------------|
| `maxRequests` | number    | `5`                                       | Maximum number of requests allowed within the time window. |
| `timeWindow`  | number    | `60000`                                   | Time window in milliseconds. |
| `whitelist`   | string[]  | `[]`                                      | List of IP addresses that bypass the rate limiter. |
| `honeypots`   | string[]  | `['/admin.php', '/wp-login.php']`         | Routes that trigger an immediate 24-hour ban when accessed. |
| `verbose`     | boolean   | `true`                                    | Enable or disable console logging for monitoring and debugging. |
| `statusPage`  | object    | `{ enabled: true, token: 'your-token' }`  | Enables a secure endpoint to check current blocked IPs. |


## 📊 Monitoring

Access the security status endpoint:


GET ```/api/shield/status?token=your-secure-token```


This endpoint allows you to check:
- Currently blocked IPs
- Active rate limit data
- Shield activity (if enabled)

Make sure to keep your token secure.

---

## 📦 Package Configuration

To make the module ready for installation via `npm install`, ensure your root `package.json` is configured as follows:

```json
{
  "name": "nuxt-nitro-shield",
  "version": "1.0.0",
  "type": "module",
  "exports": {
    ".": "./src/module.ts"
  },
  "dependencies": {
    "@nuxt/kit": "^3.0.0",
    "consola": "^3.0.0"
  }
}

```

This configuration ensures:

- ESM support (type: module)

- Proper entry point export for Nuxt

- Required runtime dependencies

