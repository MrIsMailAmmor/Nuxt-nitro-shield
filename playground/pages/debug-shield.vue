<template>
  <div
    style="
      padding: 2rem;
      font-family: sans-serif;
      max-width: 600px;
      margin: auto;
    "
  >
    <h2>🛡️ Nitro Shield Test Dashboard</h2>

    <div
      style="
        margin: 1rem 0;
        padding-bottom: 1rem;
        border-bottom: 1px solid #ccc;
      "
    >
      <button
        @click="fetchData"
        style="
          margin-right: 10px;
          padding: 5px 10px;
          cursor: pointer;
          background: #f0f0f0;
          border: 1px solid #ccc;
          border-radius: 4px;
        "
      >
        🔄 Refresh Logs
      </button>
      <button
        @click="nuke"
        style="
          color: white;
          background: red;
          border: none;
          padding: 5px 10px;
          cursor: pointer;
          border-radius: 4px;
        "
      >
        ⚠️ Clear All Blocks
      </button>
    </div>

    <div v-if="logs && logs.entries.length > 0">
      <h3>🚨 Tracked & Blocked IPs:</h3>
      <ul style="list-style: none; padding: 0">
        <li
          v-for="log in logs.entries"
          :key="log.ip"
          style="
            background: #f9f9f9;
            padding: 15px;
            margin-bottom: 15px;
            border-left: 5px solid red;
            border-radius: 4px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          "
        >
          <div
            style="
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 10px;
            "
          >
            <strong style="font-size: 1.2em">{{ log.ip }}</strong>
            <span
              :style="{
                color: log.isBanned ? 'red' : 'orange',
                fontWeight: 'bold',
              }"
            >
              {{ log.isBanned ? "BANNED 🛑" : "WARNING ⚠️" }}
            </span>
          </div>

          <div
            style="
              font-size: 0.9em;
              background: #eee;
              padding: 10px;
              border-radius: 4px;
              margin-bottom: 10px;
            "
          >
            <p style="margin: 0 0 5px 0">
              <strong>Requests:</strong> {{ log.requests }}
            </p>
            <p style="margin: 0 0 5px 0" v-if="log.expiresAt">
              <strong>Ban Expires:</strong>
              {{ new Date(log.expiresAt).toLocaleString() }}
            </p>
            <p style="margin: 0" v-if="log.timeLeftSeconds">
              <strong>Time Left:</strong> {{ log.timeLeftSeconds }} seconds
            </p>
          </div>

          <button
            @click="unblock(log.ip)"
            style="
              cursor: pointer;
              background: white;
              border: 1px solid #ccc;
              padding: 5px 10px;
              border-radius: 4px;
            "
          >
            🔓 Lift Ban
          </button>
        </li>
      </ul>
    </div>

    <div
      v-else
      style="
        background: #e6ffe6;
        padding: 1rem;
        border-left: 4px solid green;
        border-radius: 4px;
      "
    >
      <p style="margin: 0">
        ✅ No IPs are currently blocked. The server is safe.
      </p>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { ShieldStatus } from "../../src/runtime/composables/useShield";

const { getLogs, unblockIp, clearAll } = useShield();
const logs = ref<ShieldStatus>();

const fetchData = async () => {
  try {
    logs.value = await getLogs();
    console.log("Fetched logs:", logs.value.entries);
  } catch (error) {
    console.error("Fetch failed! Is the token correct in nuxt.config?", error);
  }
};

const unblock = async (ip: string) => {
  await unblockIp(ip);
  await fetchData(); // Refresh the list after unblocking
};

const nuke = async () => {
  if (confirm("Clear all shield data?")) {
    await clearAll();
    await fetchData();
  }
};

// Fetch data as soon as the component loads
onMounted(() => {
  fetchData();
});
</script>
