import { readFileSync } from 'node:fs'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from '@modelcontextprotocol/ext-apps/server'
import { z } from 'zod'
import { createMcpToolDefinitions } from '../shared/tools/definitions.js'
import { toolResult } from './actions.js'

export const RESOURCE_URI = 'ui://shopwave/store.html'
export function createMcpServer(actions, html = readFileSync(new URL('../dist/mcp-app/index.html', import.meta.url), 'utf8')) {
  const server = new McpServer({ name: 'shopwave-demo', version: '1.0.0' })
  registerAppResource(server, 'shopwave-store', RESOURCE_URI, {}, async () => ({
    contents: [{
      uri: RESOURCE_URI, mimeType: RESOURCE_MIME_TYPE, text: html,
      _meta: { ui: { prefersBorder: true, csp: { resourceDomains: ['https://images.unsplash.com'] } } },
    }],
  }))
  for (const { name, title, description, inputSchema, readOnly } of createMcpToolDefinitions(z)) {
    registerAppTool(server, name, {
      title, description, inputSchema,
      annotations: { readOnlyHint: readOnly, destructiveHint: name === 'place_order', openWorldHint: false },
      _meta: { ui: { resourceUri: RESOURCE_URI } },
    }, async args => toolResult(actions, name, args))
  }
  return server
}
