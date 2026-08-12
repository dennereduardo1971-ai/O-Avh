import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // No GitHub Pages o app fica em /<repo>/, não na raiz do domínio —
  // por isso o base condicional. Em dev e no build local continua "/".
  base: process.env.GH_PAGES === 'true' ? '/o-avh/' : '/',
  plugins: [react(), tailwindcss()],
})
