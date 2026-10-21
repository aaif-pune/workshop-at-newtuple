import React, { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Card, CardGrid, Badge, DataTable, ListRow, Stepper, SectionHeader, Photo } from '../src/widgets/index.js'
import '../src/widgets/widgets.css'
import './style.css'
import { createBridge } from './bridge.js'

const money = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)
const statusLabel = { in_stock: 'In stock', low_stock: 'Low stock', out_of_stock: 'Out of stock' }
const fields = [['name', 'Full name', 'text'], ['email', 'Email', 'email'], ['phone', 'Phone', 'tel'], ['address', 'Street address', 'text'], ['city', 'City', 'text'], ['postal_code', 'Postal code', 'text']]
const initialFilters = { query: '', category: '', status: '', min_price: '', max_price: '', sort: 'relevance' }
const blankCustomer = () => Object.fromEntries(fields.map(([key]) => [key, '']))

function App() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [connection, setConnection] = useState('Connecting to your chat…')
  const [busy, setBusy] = useState(false)
  const [filters, setFilters] = useState(initialFilters)
  const [variantId, setVariantId] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [shot, setShot] = useState(0)
  const [customer, setCustomer] = useState(blankCustomer)
  const [confirmed, setConfirmed] = useState(false)
  const bridge = useRef(null)
  const busyRef = useRef(false)
  useEffect(() => {
    const client = createBridge(result => {
      if (result?.isError) { setError(result.content?.find(x => x.type === 'text')?.text || 'Request failed'); return }
      const next = result?.structuredContent
      if (!next?.view) return
      setData(next); setError(''); setConfirmed(false)
      if (next.filters) setFilters({ ...initialFilters, ...next.filters })
      if (next.product) { setVariantId(next.variant?.id ?? next.product.variants[0]?.id); setQuantity(1); setShot(0) }
      if (next.view === 'confirmation') setCustomer(blankCustomer())
    }, setConnection)
    bridge.current = client
    void client.connect()
    const observer = new ResizeObserver(() => client.resize(document.documentElement.scrollHeight))
    observer.observe(document.body)
    return () => { observer.disconnect(); client.dispose() }
  }, [])
  const run = async (name, args = {}) => {
    if (busyRef.current) return
    busyRef.current = true; setBusy(true); setError('')
    try { return await bridge.current.callTool(name, args) }
    catch (err) { setError(err.message) }
    finally { busyRef.current = false; setBusy(false) }
  }
  const search = event => {
    event?.preventDefault()
    const args = Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== ''))
    for (const key of ['min_price', 'max_price']) if (args[key] !== undefined) args[key] = Number(args[key])
    if (args.min_price != null && args.max_price != null && args.min_price > args.max_price) { setError('Minimum price must not exceed maximum price.'); return }
    run('search_products', args)
  }
  const cart = data?.cart
  const product = data?.product
  const variant = product?.variants.find(v => v.id === Number(variantId))
  const stock = value => <Badge tone={value === 'out_of_stock' ? 'bad' : value === 'low_stock' ? 'warn' : 'good'}>{statusLabel[value]}</Badge>
  const orderView = order => <article className="order" key={order.id}>
    <div className="row"><strong>{order.id}</strong><Badge tone="good">Demo order placed</Badge></div>
    <p>{new Date(order.created_at).toLocaleString()} · {money(order.total)}</p>
    {order.items.map(item => <p key={item.variant_id}>{item.quantity} × {item.product_name} · {item.label}</p>)}
    <small>No payment taken, shipment arranged, or email sent.</small>
  </article>

  return <main aria-busy={busy}>
    <header><div><span className="eyebrow">AAIF WORKSHOP · SAMPLE CATALOG</span><h1>Shop<span>Wave</span></h1></div><Badge>Demo store</Badge></header>
    <p className="notice">Try a purchase with sample details. No payment or delivery.</p>
    {connection && <p role="status">{connection}</p>}
    {error && <p className="error" role="alert">{error}</p>}
    {data?.message && <p className="notice" role="status">{data.message}</p>}
    <fieldset disabled={busy || !!connection} className="app-controls">
      <nav aria-label="Store navigation">
        <button onClick={() => run('search_products')}>Products</button>
        <button onClick={() => run('get_wishlist')}>Wishlist ({data?.wishlist?.length ?? 0})</button>
        <button onClick={() => run('get_cart')}>Cart ({cart?.item_count ?? 0})</button>
        <button onClick={() => run('get_orders')}>Orders</button>
      </nav>
      {!data && !connection && <button className="w-btn primary" onClick={() => run('search_products')}>Browse products</button>}
      {data?.view === 'catalog' && <>
        <form className="filters" onSubmit={search} aria-label="Search products">
          <label className="search">Search<input type="search" placeholder="Try headphones or yoga" value={filters.query} onChange={e => setFilters({ ...filters, query: e.target.value })}/></label>
          <label>Category<select value={filters.category} onChange={e => setFilters({ ...filters, category: e.target.value })}><option value="">All categories</option>{data.categories.map(c => <option key={c}>{c}</option>)}</select></label>
          <label>Availability<select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}><option value="">All stock</option>{Object.entries(statusLabel).map(([v, text]) => <option key={v} value={v}>{text}</option>)}</select></label>
          <label>Min ₹<input type="number" min="0" value={filters.min_price} onChange={e => setFilters({ ...filters, min_price: e.target.value })}/></label>
          <label>Max ₹<input type="number" min="0" value={filters.max_price} onChange={e => setFilters({ ...filters, max_price: e.target.value })}/></label>
          <label>Sort<select value={filters.sort} onChange={e => setFilters({ ...filters, sort: e.target.value })}><option value="relevance">Relevance</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option><option value="name">Name</option></select></label>
          <button className="w-btn primary">Search</button><button type="button" className="w-btn ghost" onClick={() => run('search_products')}>Clear filters</button>
        </form>
        <SectionHeader title={`${data.products.length} products`} sub="Choose a product to select its variant."/>
        {!data.products.length && <p className="w-empty">No products match. Try changing your filters.</p>}
        <CardGrid min={190} gap={12}>{data.products.map(p => <Card key={p.id} image={p.image} title={p.name} eyebrow={p.category} price={`From ${money(p.price_from)}`} badges={stock(p.status)} actions={<button className="w-btn primary block" onClick={() => run('get_product', { product_id: p.id })}>View options</button>}/>)}</CardGrid>
      </>}
      {data?.view === 'product' && product && <section>
        <div className="detail"><div className="gallery"><Photo src={product.images?.[Math.min(shot, (product.images?.length || 1) - 1)] ?? product.image} alt={product.name}/>
          {product.images?.length > 1 && <div className="thumbs" role="tablist" aria-label="Product photos">{product.images.map((src, i) => <button key={src} role="tab" aria-selected={i === shot} aria-label={`Photo ${i + 1}`} className={i === shot ? 'on' : ''} onClick={() => setShot(i)}><Photo src={src} alt="" w={120} ratio="1/1"/></button>)}</div>}</div><div>
          <span className="eyebrow">{product.category}</span><h2>{product.name}</h2><p>{product.description}</p>{product.metadata?.summary && <p className="quick"><strong>In short:</strong> {product.metadata.summary}</p>}
          <label>Variant<select value={variantId ?? ''} onChange={e => { setVariantId(Number(e.target.value)); setQuantity(1) }}>{product.variants.map(v => <option key={v.id} value={v.id}>{v.label} · {money(v.price)} · {v.quantity} available</option>)}</select></label>
          {variant && <><p>{stock(variant.status)} <strong>{money(variant.price)}</strong></p><div className="row"><Stepper value={quantity} max={Math.max(1, variant.quantity)} onChange={setQuantity}/>{variant.quantity > 0 ? <button className="w-btn primary" onClick={() => run('add_to_cart', { variant_id: variant.id, quantity })}>Add to cart</button> : <button className="w-btn primary" disabled>Out of stock</button>}<button className="w-btn outline" onClick={() => run(variant.wishlisted ? 'remove_from_wishlist' : 'add_to_wishlist', { variant_id: variant.id })}>{variant.wishlisted ? 'Unsave' : 'Save to wishlist'}</button></div></>}
        </div></div>
        <h3>Specifications</h3><DataTable rows={Object.entries(product.specs).map(([key, value]) => ({ key, value }))} rowKey="key" columns={[{ key: 'key', header: 'Specification' }, { key: 'value', header: 'Value' }]}/>
        {product.metadata?.faqs?.length > 0 && <><h3>Questions and answers</h3><div className="faq">{product.metadata.faqs.map(f => <details key={f.question}><summary>{f.question}</summary><p>{f.answer}</p></details>)}</div></>}
      </section>}
      {data?.view === 'wishlist' && <section><h2>Saved for later</h2><div className="stack">{!data.wishlist.length && <p className="w-empty">Your wishlist is empty.</p>}{data.wishlist.map(v => <ListRow key={v.id} image={v.image} title={v.product_name} meta={`${v.label} · ${money(v.price)}`} badges={stock(v.status)} actions={<>{v.quantity > 0 ? <button className="w-btn primary" onClick={() => run('add_to_cart', { variant_id: v.id, quantity: 1 })}>Add to cart</button> : <button className="w-btn primary" disabled>Out of stock</button>}<button className="w-btn ghost" onClick={() => run('remove_from_wishlist', { variant_id: v.id })}>Remove</button></>}/>)}</div></section>}
      {['cart', 'checkout'].includes(data?.view) && <section>
        <h2>{data.view === 'cart' ? 'Your cart' : 'Demo checkout'}</h2>
        {!cart.items.length ? <p className="w-empty">Your cart is empty.</p> : <>
          <div className="stack">{cart.items.map(item => <ListRow key={item.variant_id} image={item.image} title={item.product_name} meta={`${item.label} · ${money(item.price)} each`} right={<><Stepper value={item.quantity} min={0} max={item.available} onChange={quantity => run('set_cart_quantity', { variant_id: item.variant_id, quantity })}/><strong>{money(item.subtotal)}</strong></>} actions={<button className="w-btn ghost" onClick={() => run('remove_from_cart', { variant_id: item.variant_id })}>Remove</button>}/>)}</div>
          <div className="total row"><span>{cart.item_count} items · Free demo delivery</span><strong>Total {money(cart.total)}</strong></div>
          {data.view === 'cart' ? <button className="w-btn primary" onClick={() => run('show_checkout')}>Continue to checkout</button> : <form aria-label="Demo delivery details" onSubmit={event => { event.preventDefault(); run('place_order', { customer, confirmed }) }}>
            <p>Use fictional details. This form creates an in-memory order only.</p><div className="customer">{fields.map(([key, label, type]) => <label key={key}>{label}<input name={key} type={type} autoComplete="off" required value={customer[key]} onChange={e => { setCustomer({ ...customer, [key]: e.target.value }); setConfirmed(false) }}/></label>)}</div>
            <label className="check confirmation"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)}/>I reviewed this cart and confirm a demo order. No payment will be taken.</label>
            <button className="w-btn primary" disabled={!confirmed}>Place demo order · {money(cart.total)}</button>
          </form>}
        </>}
      </section>}
      {data?.view === 'confirmation' && <section><h2>Demo order confirmed</h2>{orderView(data.order)}<button className="w-btn primary" onClick={() => run('search_products')}>Continue shopping</button></section>}
      {data?.view === 'orders' && <section><h2>Demo orders</h2>{data.orders.length ? data.orders.map(orderView) : <p className="w-empty">No orders yet.</p>}</section>}
      <footer><small>Sample data · This demo shop resets when its server restarts.</small>
      </footer>
    </fieldset>
    <div className="progress" role="status" aria-live="polite">{busy ? 'Updating your demo store…' : ''}</div>
  </main>
}
createRoot(document.getElementById('root')).render(<App/> )
