// Standard MCP Apps JSON-RPC bridge. No ChatGPT- or Claude-specific globals.
// Based on the official MCP Apps flow: initialize, tool-result notifications, tools/call.
export function createBridge(onResult, onStatus, targetWindow = window) {
  let nextId = 0, connected = false, disposed = false
  const pending = new Map()
  const send = message => targetWindow.parent.postMessage({ jsonrpc: '2.0', ...message }, '*')
  const request = (method, params) => new Promise((resolve, reject) => {
    const id = ++nextId
    const timer = setTimeout(() => { pending.delete(id); reject(new Error('The host did not respond. Retry or reconnect the app.')) }, 30000)
    pending.set(id, { resolve, reject, timer })
    send({ id, method, params })
  })
  const receive = event => {
    if (event.source !== targetWindow.parent) return
    const message = event.data
    if (message?.jsonrpc !== '2.0') return
    if (message.id != null && pending.has(message.id)) {
      const entry = pending.get(message.id)
      clearTimeout(entry.timer); pending.delete(message.id)
      message.error ? entry.reject(new Error(message.error.message || 'Host request failed')) : entry.resolve(message.result)
    } else if (message.method === 'ui/notifications/tool-result') {
      onResult(message.params)
    } else if (message.method === 'ui/notifications/tool-cancelled') {
      onStatus('The request was cancelled. Try again.')
    } else if (message.method === 'ui/resource-teardown' && message.id != null) {
      send({ id: message.id, result: {} })
    }
  }
  targetWindow.addEventListener('message', receive)
  return {
    async connect() {
      if (targetWindow.parent === targetWindow) { onStatus('Open this store from an MCP host, or use the local preview.'); return }
      try {
        await request('ui/initialize', { appInfo: { name: 'shopwave', version: '1.0.0' }, appCapabilities: {}, protocolVersion: '2026-01-26' })
        if (disposed) return
        connected = true
        send({ method: 'ui/notifications/initialized', params: {} })
        onStatus('')
      } catch (error) { if (!disposed) onStatus(error.message) }
    },
    async callTool(name, args = {}) {
      if (!connected) throw new Error('The app is not connected yet. Please retry in a moment.')
      let result
      try {
        result = await request('tools/call', { name, arguments: args })
      } catch (error) {
        if (/unknown tool|tool[^\n]*not found/i.test(error.message)) {
          throw new Error(`Your chat connection could not find "${name}". Refresh the ShopWave connection's tools (or remove and add the connection again), then open a new chat and select ShopWave. Reloading this widget alone will not update the tool list.`)
        }
        throw error
      }
      onResult(result)
      if (result.isError) throw new Error(result.content?.find(item => item.type === 'text')?.text || 'Tool failed')
      return result
    },
    resize(height) { if (connected) send({ method: 'ui/notifications/size-changed', params: { height } }) },
    dispose() {
      disposed = true; connected = false
      targetWindow.removeEventListener('message', receive)
      for (const entry of pending.values()) { clearTimeout(entry.timer); entry.reject(new Error('App closed')) }
      pending.clear()
    },
  }
}
