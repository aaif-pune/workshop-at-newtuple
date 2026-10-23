import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// Bundles the MCP App view (React + shop widgets) into dist/view.js + dist/view.css; server.js inlines both into one page.
const here = (p) => new URL(p, import.meta.url).pathname
export default defineConfig({
  plugins: [react()],
  define: { 'process.env.NODE_ENV': '"production"' },
  build: { minify: true, outDir: here('../dist'), emptyOutDir: true, lib: { entry: here('./main.jsx'), formats: ['es'], fileName: () => 'view.js', cssFileName: 'view' } },
})
