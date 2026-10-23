// WebMCP add-on: registers the shared agent tools with the browser (document.modelContext)
// so an in-browser agent (ChatGPT) can call them, and shows a status pill.
// The shop never imports this; remove the folder and its import in src/main.jsx to drop it.
import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { api } from '../../src/api'
import { showInUI } from '../../src/ui-bus'
import { createTools, ok, fail } from '../tools'
import './webmcp.css'

const tools = createTools(api, showInUI)

const getCtx = () => {
  // Current spec: document.modelContext. Older drafts / early Chrome: navigator.modelContext.
  if (document.modelContext) return { ctx: document.modelContext, where: 'document.modelContext' }
  if (navigator.modelContext) return { ctx: navigator.modelContext, where: 'navigator.modelContext' }
  return null
}

const definitions = () => tools.map((t) => ({
  name: t.name,
  description: t.description,
  inputSchema: { type: 'object', properties: t.properties, required: t.required || [] },
  annotations: { readOnlyHint: !!t.readOnly },
  execute: async (input) => {
    try { return ok(await t.run(input || {})) } catch (e) { return fail(e) }
  },
}))

// Registers every tool with the browser. registerTool may throw (older builds) or
// return a rejected Promise (newer builds), so we await inside try/catch.
async function register(found) {
  const { ctx, where } = found
  const defs = definitions()
  if (typeof ctx.registerTool === 'function') {
    let count = 0, lastError = ''
    for (const d of defs) {
      try { await ctx.registerTool(d); count++ } catch (e) {
        // Already registered (hot reload / re-run) counts as present.
        if (/already|duplicate/i.test(String(e?.message))) count++
        else { lastError = `${d.name}: ${e?.message || e}`; console.warn('[WebMCP] registerTool failed', d.name, e) }
      }
    }
    return { supported: count > 0, count, where, error: lastError }
  }
  if (typeof ctx.provideContext === 'function') {
    await ctx.provideContext({ tools: defs })
    return { supported: true, count: defs.length, where: where + ' (provideContext)', error: '' }
  }
  return { supported: false, count: 0, where, error: 'modelContext found but has no registerTool/provideContext' }
}

// Starts WebMCP. The agent browser may inject modelContext a moment after page load,
// so keep looking for ~15 s. onStatus fires whenever the status changes.
function startWebMCP(onStatus) {
  // Handy in DevTools even when the browser has no WebMCP:
  window.storefrontTools = Object.fromEntries(tools.map((t) => [t.name, (args = {}) => t.run(args).then(ok, fail)]))
  let stopped = false, tries = 0
  const attempt = async () => {
    if (stopped) return true
    const found = getCtx()
    if (!found) return false
    try {
      const st = await register(found)
      console.info('[WebMCP]', st.supported ? `registered ${st.count} tools via ${st.where}` : 'not registered', st.error || '')
      onStatus(st)
      return st.supported
    } catch (e) {
      console.warn('[WebMCP] registration error', e)
      onStatus({ supported: false, count: 0, where: found.where, error: String(e?.message || e) })
      return true
    }
  }
  const timer = setInterval(async () => {
    tries++
    if ((await attempt()) || tries > 30) clearInterval(timer)
  }, 500)
  attempt().then((done) => {
    if (done) clearInterval(timer)
    else if (!getCtx()) console.info('[WebMCP] document.modelContext / navigator.modelContext not found (yet)')
  })
  return () => { stopped = true; clearInterval(timer) }
}

function Status() {
  const [mcp, setMcp] = useState({ supported: false, count: 0, where: '', error: '' })
  useEffect(() => startWebMCP(setMcp), [])
  const title = mcp.supported
    ? `via ${mcp.where}\n` + tools.map((x) => x.name).join('\n')
    : (mcp.error || 'document.modelContext not found in this browser') + '\nTest tools in DevTools: await storefrontTools.search_products({query:"headphones"})'
  return <span className={'webmcp-pill ' + (mcp.supported ? 'good' : 'warn')} title={title}>WebMCP: {mcp.supported ? `${mcp.count} tools live` : 'not detected'}</span>
}

const el = document.body.appendChild(document.createElement('div'))
createRoot(el).render(<Status />)
