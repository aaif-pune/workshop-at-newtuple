import { build } from 'vite'
import { copyFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
const destination = fileURLToPath(new URL('../dist/mcp-preview', import.meta.url))
await build({
  configFile: fileURLToPath(new URL('../mcp-app/vite.config.js', import.meta.url)),
  build: { outDir: destination, rollupOptions: { input: fileURLToPath(new URL('../mcp-app/preview.html', import.meta.url)) } },
})
await copyFile(new URL('../dist/mcp-app/index.html', import.meta.url), `${destination}/index.html`)
console.log(`Local simulator: ${destination}/preview.html`)
