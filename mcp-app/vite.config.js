import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

// Inline the generated entry and styles: the MCP UI resource must be self-contained.
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [react(), {
    name: 'inline-mcp-app',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const html = Object.values(bundle).find(asset => asset.fileName.endsWith('.html'))
      if (!html) return
      let source = String(html.source)
      for (const [name, asset] of Object.entries(bundle)) {
        if (asset.type === 'chunk' && asset.isEntry) {
          source = source.replace(/<script type="module"[^>]*src="[^"]+"[^>]*><\/script>/, () => `<script type="module">${asset.code.replace(/<\/script/gi, '<\\/script')}</script>`)
          delete bundle[name]
        } else if (name.endsWith('.css')) {
          source = source.replace(/<link rel="stylesheet"[^>]*>/, () => `<style>${asset.source}</style>`)
          delete bundle[name]
        }
      }
      html.source = source
    },
  }],
  build: {
    outDir: fileURLToPath(new URL('../dist/mcp-app', import.meta.url)),
    emptyOutDir: true, cssCodeSplit: false, assetsInlineLimit: 1000000,
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
})
