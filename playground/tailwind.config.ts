// playground/tailwind.config.ts
import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  content: ['./error.vue', './app.vue', './pages/**/*.vue'],
  theme: {
    extend: {},
  },
  plugins: [],
}
