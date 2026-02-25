import { defineNuxtPlugin } from "~/.nuxt/imports";

export default defineNuxtPlugin((_nuxtApp) => {
  console.log("Plugin injected by my-module!");
});
