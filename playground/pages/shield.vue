<template>
  <div class="min-h-screen bg-slate-50 p-8 font-sans text-slate-900">
    <div class="mx-auto max-w-6xl">
      <header class="mb-8 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-slate-900">
            🛡️ Nitro Shield Dashboard
          </h1>
          <p class="text-slate-500 text-sm">
            Real-time IP monitoring and rate-limiting control.
          </p>
        </div>
        <div class="flex gap-3">
          <button
            @click="() => refresh()"
            :disabled="pending"
            class="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold shadow-sm border border-slate-200 hover:bg-slate-50 transition"
          >
            <span :class="{ 'animate-spin': pending }">🔄</span> Refresh
          </button>
          <button
            @click="clearAll"
            class="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 transition"
          >
            Clear All Data
          </button>
        </div>
      </header>

      <div v-if="data" class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p class="text-sm font-medium text-slate-500">Total Tracked IPs</p>
          <p class="text-3xl font-bold">{{ data.metrics.totalTrackedIPs }}</p>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p class="text-sm font-medium text-slate-500">Currently Banned</p>
          <p class="text-3xl font-bold text-red-600">
            {{ data.metrics.bannedCount }}
          </p>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p class="text-sm font-medium text-slate-500">Active Offenders</p>
          <p class="text-3xl font-bold text-amber-500">
            {{ data.metrics.activeOffenders }}
          </p>
        </div>
      </div>

      <div
        class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
      >
        <table class="w-full text-left text-sm">
          <thead
            class="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500"
          >
            <tr>
              <th class="px-6 py-4 font-semibold">IP Address</th>
              <th class="px-6 py-4 font-semibold">Request Count</th>
              <th class="px-6 py-4 font-semibold">Status</th>
              <th class="px-6 py-4 font-semibold">Time Remaining</th>
              <th class="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="entry in data?.entries"
              :key="entry.ip"
              class="hover:bg-slate-50 transition"
            >
              <td class="px-6 py-4 font-mono font-medium text-slate-700">
                {{ entry.ip }}
              </td>
              <td class="px-6 py-4">
                <span class="font-semibold">{{ entry.requests }}</span>
              </td>
              <td class="px-6 py-4">
                <span
                  v-if="entry.isBanned"
                  class="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800"
                >
                  Banned
                </span>
                <span
                  v-else-if="entry.requests > 40"
                  class="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800"
                >
                  Warning
                </span>
                <span
                  v-else
                  class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800"
                >
                  Safe
                </span>
              </td>
              <td class="px-6 py-4 text-slate-500 italic">
                {{ entry.timeLeftSeconds }}s
              </td>
              <td class="px-6 py-4 text-right">
                <button
                  @click="unshieldIp(entry.ip)"
                  class="text-slate-400 hover:text-red-600 transition p-1"
                >
                  🗑️
                </button>
              </td>
            </tr>
            <tr v-if="!data?.entries.length">
              <td
                colspan="5"
                class="px-6 py-12 text-center text-slate-400 italic"
              >
                No IPs are currently being tracked. Your fortress is quiet.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 1. Configuration & State
interface ShieldEntry {
  ip: string;
  requests: number;
  isBanned: boolean;
  expiresAt: string;
  timeLeftSeconds: number;
  isExpired: boolean;
}

interface ShieldData {
  metrics: {
    totalTrackedIPs: number;
    bannedCount: number;
    activeOffenders: number;
  };
  entries: ShieldEntry[];
}

const token = ref("123456789"); // In a real app, this would be an env var or login-protected
const { data, refresh, pending } = await useFetch<ShieldData>(
  "/api/shield/status",
  {
    query: { token },
  },
);

// 2. Actions: Delete Single IP
async function unshieldIp(ip: string) {
  if (!confirm(`Are you sure you want to unblock ${ip}?`)) return;

  await $fetch("/api/shield/status", {
    method: "DELETE",
    query: { token: token.value, ip },
  });
  refresh();
}

// 3. Actions: Clear All Storage
async function clearAll() {
  if (!confirm("🚨 This will unblock EVERYONE. Are you sure?")) return;

  await $fetch("/api/shield/status", {
    method: "DELETE",
    query: { token: token.value, all: "true" },
  });
  refresh();
}
</script>
