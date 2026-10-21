import { createActions, toolResult } from '../mcp-server/actions.js'
const actions = createActions()
const frame = document.getElementById('app')
const send = message => frame.contentWindow.postMessage({ jsonrpc: '2.0', ...message }, '*')
const log = document.getElementById('log')
const execute = (name, args = {}) => {
  const result = toolResult(actions, name, args)
  log.textContent = `${name} → ${result.isError ? result.content[0].text : result.structuredContent.view}`
  return result
}
window.addEventListener('message', event => {
  if (event.source !== frame.contentWindow || event.data?.jsonrpc !== '2.0') return
  const { id, method, params } = event.data
  if (method === 'ui/initialize') send({ id, result: { protocolVersion: '2026-01-26', hostInfo: { name: 'shopwave-preview', version: '1.0.0' }, hostCapabilities: { serverTools: {} }, hostContext: { theme: 'light', displayMode: 'inline' } } })
  else if (method === 'ui/notifications/initialized') {
    document.getElementById('send').disabled = false
    send({ method: 'ui/notifications/tool-result', params: execute('search_products') })
  } else if (method === 'tools/call') send({ id, result: execute(params.name, params.arguments) })
  else if (method === 'ui/notifications/size-changed') frame.style.height = `${Math.min(1200, Math.max(500, params.height))}px`
})
document.getElementById('send').onclick = () => send({ method: 'ui/notifications/tool-result', params: execute(document.getElementById('request').value) })
