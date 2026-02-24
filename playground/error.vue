<template>
  <div
    class="min-h-screen bg-[#050505] flex items-center justify-center p-6 font-sans antialiased overflow-hidden selection:bg-white/10"
  >
    <div
      class="absolute top-0 -left-4 w-72 h-72 bg-white/5 rounded-full blur-[120px] pointer-events-none"
    ></div>
    <div
      class="absolute bottom-0 -right-4 w-96 h-96 bg-white/5 rounded-full blur-[150px] pointer-events-none"
    ></div>

    <div
      class="relative max-w-2xl w-full text-center space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000"
    >
      <div class="relative inline-block">
        <h1
          class="text-[12rem] md:text-[16rem] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white/80 to-transparent opacity-20 select-none"
        >
          {{ error?.statusCode }}
        </h1>
        <div class="absolute inset-0 flex items-center justify-center">
          <span
            class="text-4xl md:text-6xl font-light tracking-[0.2em] uppercase text-white drop-shadow-2xl"
          >
            {{ error?.statusCode === 429 ? "Limitation" : "Erreur" }}
          </span>
        </div>
      </div>

      <div class="space-y-6">
        <h2 class="text-2xl md:text-4xl font-light text-white/90">
          <span v-if="error?.statusCode === 429">
            On dirait que vous avez un
            <span class="font-bold italic text-white">très gros débit</span>.
          </span>
          <span v-else>Une petite turbulence sur le serveur...</span>
        </h2>

        <div class="flex justify-center">
          <div
            class="h-[1px] w-24 bg-gradient-to-r from-transparent via-white/40 to-transparent"
          ></div>
        </div>

        <p
          class="text-lg text-white/50 max-w-md mx-auto leading-relaxed font-light"
        >
          {{ error?.statusMessage || error?.message }}
          <br />
          <span
            v-if="error?.statusCode === 429"
            class="text-sm mt-4 block text-white/30 uppercase tracking-widest"
          >
            Veuillez patienter 60 secondes
          </span>
        </p>
      </div>

      <div class="pt-8">
        <button
          @click="handleError"
          class="group relative px-12 py-4 bg-white text-black font-bold uppercase tracking-widest text-sm transition-all duration-300 hover:scale-105 active:scale-95 overflow-hidden"
        >
          <span class="relative z-10">Réessayer l'accès</span>
          <div
            class="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"
          ></div>
        </button>
      </div>

      <p class="pt-12 text-[10px] uppercase tracking-[0.5em] text-white/20">
        System Security Module • Node Nitro Runtime
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { NuxtError } from "#app";

defineProps<{
  error: NuxtError;
}>();

const handleError = () => clearError({ redirect: "/" });
</script>

<style>
/* On utilise un peu de CSS natif pour l'animation d'entrée si Tailwind n'est pas configuré avec des plugins d'animation */
.animate-in {
  animation: fadeIn 1.2s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
