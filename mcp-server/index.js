import { createServer } from 'node:http'
import { readFileSync } from 'node:fs'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { createMcpServer } from './server.js'
import { createActions } from './actions.js'

const port = Number(process.env.MCP_PORT || 3001)
const host = process.env.MCP_HOST || '127.0.0.1'
const html = readFileSync(new URL('../dist/mcp-app/index.html', import.meta.url), 'utf8')
const actions = createActions()
// Stateless MCP transport; the demo shop itself persists in memory until restart/reset.
const http = createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname
  if (pathname === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    return res.end(JSON.stringify({ ok: true, name: 'shopwave-demo' }))
  }
  if (pathname !== '/mcp') { res.writeHead(404); return res.end('Use /mcp for MCP or /health for health checks.') }
  if (req.method !== 'POST') { res.writeHead(405, { Allow: 'POST' }); return res.end('Stateless MCP accepts POST requests.') }
  // Remote MCP hosts connect server-to-server. Do not allow arbitrary browser origins.
  if (req.headers.origin) { res.writeHead(403); return res.end('Browser-origin requests are not supported; use an MCP host.') }
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true })
  const server = createMcpServer(actions, html)
  res.on('close', () => { void transport.close(); void server.close() })
  try {
    await server.connect(transport)
    await transport.handleRequest(req, res)
  } catch (error) {
    console.error('MCP request failed:', error.message)
    if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'application/json' })
    if (!res.writableEnded) res.end(JSON.stringify({ error: 'MCP request failed' }))
  }
})
http.listen(port, host, () => console.log(`ShopWave MCP: http://${host}:${port}/mcp\nDemo data is in memory. Restart the process to restore it.`))
http.on('error', error => { console.error(error.message); process.exitCode = 1 })
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { http.close(); http.closeAllConnections() })
