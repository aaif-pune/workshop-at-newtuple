// MCP server add-on: exposes the shared agent tools (../tools.js) over stdio, backed by the shop's
// own store logic. Tools that have a view also return a UI (MCP Apps) built from the shop's widgets.
// Its data lives in shop-data.json, separate from the browser shop's localStorage.
// `--http` serves the same tools over Streamable HTTP (POST /mcp, GET /health) for remote hosts
// such as claude.ai and ChatGPT, e.g. through `ngrok http 3001`.
import fs from 'node:fs'
import http from 'node:http'
import { McpServer, createMcpHandler } from '@modelcontextprotocol/server'
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio'
import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from '@modelcontextprotocol/ext-apps/server'
import { fromJSONSchema } from 'zod'
import { createStore } from '../../src/services/store.js'
import { createTools, fail, ok } from '../tools.js'

// ponytail: whole shop rewritten to one file per change, fine for a demo, use a DB if it ever gets real traffic
const file = new URL('./shop-data.json', import.meta.url)
const store = createStore({
  getItem: () => (fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null),
  setItem: (_, v) => fs.writeFileSync(file, v),
})
const api = { ...store, searchProducts: store.search } // same names as src/api.js

const UI = 'ui://shopwave/view.html'
const WITH_VIEW = new Set(['search_products', 'get_product', 'get_cart', 'add_to_cart', 'remove_from_cart', 'get_inventory', 'get_orders',
  'audit_aeo', 'preview_aeo_update', 'set_aeo_metadata'])
const read = (name) => fs.readFileSync(new URL('./dist/' + name, import.meta.url), 'utf8')
const page = () => `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>${read('view.css')}</style></head><body><div id="root"></div>
<script type="module">${read('view.js').replace(/<\/script/gi, '<\\/script')}</script></body></html>`

// A fresh server per stdio connection or per HTTP request; they all share the store above.
function createServer() {
  const server = new McpServer({ name: 'shopwave', version: '1.0.0' })

  registerAppResource(server, 'ShopWave view', UI, { description: 'Products, cart, inventory, orders and AEO audits rendered with ShopWave widgets' }, async () => ({
    contents: [{ uri: UI, mimeType: RESOURCE_MIME_TYPE, text: page(), _meta: { ui: { csp: { resourceDomains: ['https://images.unsplash.com'] } } } }],
  }))

  for (const t of createTools(api)) {
    const config = {
      description: t.description,
      inputSchema: fromJSONSchema({ type: 'object', properties: t.properties, required: t.required || [] }),
      annotations: { readOnlyHint: !!t.readOnly },
    }
    // structuredContent tells the view which tool produced the data.
    const run = async (args) => {
      try { const data = await t.run(args || {}); return { ...ok(data), structuredContent: { tool: t.name, data } } } catch (e) { return fail(e) }
    }
    if (WITH_VIEW.has(t.name)) registerAppTool(server, t.name, { ...config, _meta: { ui: { resourceUri: UI } } }, run)
    else server.registerTool(t.name, config, run)
  }
  return server
}

if (process.argv.includes('--http')) {
  // No auth: a demo endpoint. Share the tunnel URL only for the workshop and stop it afterwards.
  const port = Number(process.env.PORT || 3001)
  const mcp = createMcpHandler(createServer)
  http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
      if (url.pathname === '/health') { res.writeHead(200, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ ok: true, name: 'shopwave' })) }
      if (url.pathname !== '/mcp') { res.writeHead(404); return res.end() }
      const body = ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(await Array.fromAsync(req))
      const response = await mcp.fetch(new Request(url, { method: req.method, headers: req.headers, body }))
      res.writeHead(response.status, Object.fromEntries(response.headers))
      if (response.body) for await (const chunk of response.body) res.write(chunk)
      res.end()
    } catch (e) {
      console.error(e)
      if (!res.headersSent) res.writeHead(500)
      res.end()
    }
  }).listen(port, '127.0.0.1', () => console.log(`ShopWave MCP over HTTP: http://127.0.0.1:${port}/mcp (health: /health)`))
} else {
  await createServer().connect(new StdioServerTransport())
}
