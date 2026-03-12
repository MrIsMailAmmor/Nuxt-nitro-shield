import { createConfigForNuxt } from "@nuxt/eslint-config/flat";

export default createConfigForNuxt({
  // This tells the config to automatically ignore your build folders
  dirs: {
    src: ["./src"],
  },
}).append({
  // These are your custom overrides
  rules: {
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unused-vars": "off",
    "@typescript-eslint/ban-ts-comment": "off",
    "no-console": "warn",
    "vue/multi-word-component-names": "off",
  },
});
