// MCP App view: shows tool results inside the chat host's iframe using the shop's own widgets.
// Buttons call server tools back through the host.
import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@modelcontextprotocol/ext-apps'
import { Badge, Card, CardGrid, DataTable, ListRow, SectionHeader } from '../../../src/widgets'
import { DemandBadge, StockBadge, money } from '../../../src/components'
import { label } from '../../../src/services/aeo'
import '../../../src/style.css'
import '../../../src/widgets/widgets.css'

const app = new App({ name: 'ShopWave', version: '1.0.0' })
// Keep the latest result outside React so one arriving before the first render is not lost.
let last = null, render = () => {}
app.addEventListener('toolresult', (r) => { last = r; render(r) })
app.connect()

const VIEW = { search_products: 'products', get_product: 'products', get_cart: 'cart', add_to_cart: 'cart', remove_from_cart: 'cart', get_inventory: 'inventory', get_orders: 'orders',
  audit_aeo: 'aeo', set_aeo_metadata: 'aeo', preview_aeo_update: 'aeo_preview' }

// Session 4: before/after values in a change table.
const shown = (v) => (v == null || v === '' ? '—' : Array.isArray(v) ? v.map((x) => (typeof x === 'object' ? `${x.q} ${x.a}` : x)).join(' · ') || '—' : String(v))
const changeTable = (changes) => <DataTable rowKey="field" rows={changes} columns={[
  { key: 'field', header: 'Field' }, { key: 'before', header: 'Before', render: (r) => shown(r.before) }, { key: 'after', header: 'After', render: (r) => shown(r.after) },
]} />
const warningList = (warnings) => warnings.map((w) => <p key={w} className="w-empty"><Badge tone="warn">Check</Badge> {w}</p>)
// Tool errors are JSON ({ error }); input-validation errors from the host or SDK are plain text.
const errorText = (r) => { const t = r.content?.[0]?.text || 'Request failed'; try { return JSON.parse(t).error || t } catch { return t } }

function View() {
  const [result, setResult] = useState(last)
  const [msg, setMsg] = useState('')
  const [approved, setApproved] = useState(false)
  useEffect(() => { render = setResult }, [])
  useEffect(() => setApproved(false), [result])

  // `show`: put the tool's result in this view (the AEO screens move from preview to result).
  const call = async (name, args, okMsg, show = false) => {
    const r = await app.callServerTool({ name, arguments: args })
    if (r.isError) return setMsg(errorText(r))
    setMsg(okMsg)
    if (show || (VIEW[name] === 'cart' && VIEW[result.structuredContent.tool] === 'cart')) setResult(r)
  }

  if (!result) return <p className="w-empty">Loading…</p>
  if (result.isError) return <p className="w-empty">{result.content?.[0]?.text}</p>
  const { tool, data } = result.structuredContent
  const view = VIEW[tool]
  let body

  if (view === 'products') {
    const products = Array.isArray(data) ? data : [data]
    body = (
      <CardGrid min={200}>
        {products.map((p) => {
          const v = p.variants.find((x) => x.quantity > 0) || p.variants[0]
          return (
            <Card key={p.id} image={p.image} title={p.name} eyebrow={p.category}
              price={(p.variants.length > 1 ? 'From ' : '') + money(p.price_from)}
              badges={<>{<StockBadge v={p.variants.length > 1 ? { status: p.status, quantity: 0 } : v} />}{p.high_demand && <DemandBadge />}</>}
              actions={v.quantity > 0
                ? <button className="w-btn primary block" onClick={() => call('add_to_cart', { variant_id: v.id, quantity: 1 }, `Added ${p.name} (${v.label}) to cart`)}>Add to cart</button>
                : <button className="w-btn outline block" onClick={() => call('notify_when_available', { variant_id: v.id }, "We'll notify you when it's back")}>Notify me</button>} />
          )
        })}
      </CardGrid>
    )
  } else if (view === 'cart') {
    body = (
      <>
        <DataTable rowKey="variant_id" rows={data.items} empty="Your cart is empty." columns={[
          { key: 'product_name', header: 'Item', render: (r) => `${r.product_name} (${r.label})` },
          { key: 'quantity', header: 'Qty', align: 'right' },
          { key: 'subtotal', header: 'Subtotal', align: 'right', render: (r) => money(r.subtotal) },
          { key: 'x', header: '', render: (r) => <button className="w-btn outline" onClick={() => call('remove_from_cart', { variant_id: r.variant_id }, 'Removed')}>Remove</button> },
        ]} />
        {data.items.length > 0 && <p style={{ textAlign: 'right', fontWeight: 700 }}>Total {money(data.total)}</p>}
      </>
    )
  } else if (view === 'inventory') {
    body = (
      <DataTable rows={data} empty="No matching variants." columns={[
        { key: 'product_name', header: 'Product', render: (r) => `${r.product_name} (${r.label})` },
        { key: 'status', header: 'Stock', render: (r) => <StockBadge v={r} /> },
        { key: 'high_demand', header: 'Demand', render: (r) => (r.high_demand ? <DemandBadge /> : null) },
      ]} />
    )
  } else if (view === 'orders') {
    body = (
      <DataTable rows={data} empty="No orders yet." columns={[
        { key: 'id', header: 'Order' },
        { key: 'items', header: 'Items', render: (r) => r.items.map((i) => `${i.product_name} ×${i.quantity}`).join(', ') },
        { key: 'total', header: 'Total', align: 'right', render: (r) => money(r.total) },
        { key: 'status', header: 'Status', render: (r) => <Badge tone="good">{r.status}</Badge> },
      ]} />
    )
  } else if (view === 'aeo') {
    const audit = tool === 'set_aeo_metadata' ? data.audit : data
    body = (
      <>
        <SectionHeader title={`AI readiness: ${audit.score}/${audit.max}`}
          sub={`${audit.product_name}${audit.seller ? ` · ${audit.seller}` : ''}${audit.compared_with.length ? ` · compared with ${audit.compared_with.map((c) => c.seller || c.name).join(', ')}` : ''}`} />
        {tool === 'set_aeo_metadata' && <><p className="w-empty">Updated: {data.score_before}/{data.max} → {data.score_after}/{data.max}</p>{changeTable(data.changes)}{warningList(data.warnings)}</>}
        {audit.checks.map((c) => <ListRow key={c.id} title={c.label} meta={c.pass ? 'An AI agent can read this.' : c.fix} badges={<Badge tone={c.pass ? 'good' : 'bad'}>{c.pass ? 'Pass' : 'Missing'}</Badge>} />)}
        {audit.product_information?.some((g) => g.missing.length) && (
          <><p><strong>Product information gaps</strong> (other sellers publish these, or every listing should have them)</p>
            <ul>{audit.product_information.filter((g) => g.missing.length).map((g) => <li key={g.group}>{g.group}: {g.missing.map(label).join(', ')}</li>)}</ul></>
        )}
        {audit.about_this_item && !audit.about_this_item.ok && <p className="w-empty"><Badge tone="warn">Gap</Badge> About this item: {audit.about_this_item.points} of {audit.rules.min_about_points}–{audit.rules.max_about_points} bullet points</p>}
        {audit.suggested_fix.questions_for_seller.length > 0 && (
          <><p><strong>Questions for the seller</strong></p><ul>{audit.suggested_fix.questions_for_seller.map((q) => <li key={q}>{q}</li>)}</ul></>
        )}
        <button className="w-btn outline" onClick={() => call('audit_aeo', { product_id: audit.product_id }, '', true)}>Re-run audit</button>
      </>
    )
  } else if (view === 'aeo_preview') {
    body = (
      <>
        <SectionHeader title={`Proposed update: ${data.score_before}/${data.max} → ${data.score_after}/${data.max}`} sub={`${data.product_name} · nothing is saved until you approve`} />
        {data.new_facts?.length > 0 && (
          <><p><Badge tone="warn">Check</Badge> <strong>New facts: confirm each came from the seller</strong></p>
            <DataTable rowKey="fact" rows={data.new_facts} columns={[
              { key: 'group', header: 'Section' }, { key: 'fact', header: 'Fact' }, { key: 'value', header: 'New value', render: (r) => shown(r.value) }, { key: 'before', header: 'Was', render: (r) => shown(r.before) },
            ]} /></>
        )}
        {data.changes.length ? changeTable(data.changes) : <p className="w-empty">These values are already on the listing. Nothing to change.</p>}
        {warningList(data.warnings)}
        {data.still_failing.map((c) => <ListRow key={c.id} title={c.label} meta={c.fix} badges={<Badge tone="bad">Still missing</Badge>} />)}
        {data.changes.length > 0 && (
          <>
            <label className="aeo-confirm">
              <input type="checkbox" checked={approved} onChange={(e) => setApproved(e.target.checked)} />
              I checked these exact changes. They use only the seller's facts.
            </label>
            <button className="w-btn primary" disabled={!approved}
              onClick={() => call('set_aeo_metadata', { product_id: data.product_id, ...data.proposed, change_id: data.change_id, confirmed: true }, '', true)}>Approve and apply</button>
          </>
        )}
      </>
    )
  } else body = <pre>{JSON.stringify(data, null, 2)}</pre>

  return <div style={{ padding: 12 }}>{msg && <p className="w-empty">{msg}</p>}{body}</div>
}

createRoot(document.getElementById('root')).render(<View />)
