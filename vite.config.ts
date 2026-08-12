import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // No GitHub Pages o app fica em /<repo>/, não na raiz do domínio —
  // por isso o base condicional. Em dev e no build local continua "/".
  // O caminho é sensível a maiúsculas/minúsculas: precisa bater com o
  // nome exato do repositório no GitHub ("O-Avh"), não "o-avh".
  base: process.env.GH_PAGES === 'true' ? '/O-Avh/' : '/',
  plugins: [react(), tailwindcss()],
})
