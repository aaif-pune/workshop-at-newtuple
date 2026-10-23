import { useEffect, useState } from 'react'
import { Heart, Truck, ShieldCheck } from 'lucide-react'
import { api } from '../api'
import { useApi } from '../hooks'
import { navigate } from '../router'
import { CardGrid, Photo, Stepper } from '../widgets'
import { DemandBadge, Empty, StockBadge, money } from '../components'
import ProductCard from './ProductCard'
import AiView from './AiView'
import ProductInfo from './ProductInfo'

// Session 4: publish what machine readers use: schema.org JSON-LD, the SEO title and the meta description.
function usePageMetadata(ai) {
  useEffect(() => {
    if (!ai) return
    const ld = document.createElement('script')
    ld.type = 'application/ld+json'; ld.id = 'ld-json'; ld.textContent = JSON.stringify(ai.json_ld)
    document.head.appendChild(ld)
    const title = document.title
    if (ai.seo_title) document.title = ai.seo_title
    let meta = document.querySelector('meta[name="description"]'), added = false
    const before = meta?.content
    if (ai.meta_description) {
      if (!meta) { meta = document.head.appendChild(Object.assign(document.createElement('meta'), { name: 'description' })); added = true }
      meta.content = ai.meta_description
    }
    return () => {
      ld.remove(); document.title = title
      if (added) meta.remove(); else if (meta && before != null) meta.content = before
    }
  }, [ai])
}

export default function ProductPage({ id, run, setFilters, aiView = false }) {
  const p = useApi(() => api.getProduct(id).catch(() => false), [id], null)
  const related = useApi(() => api.searchProducts({}).then((l) => (p ? l.filter((x) => x.category === p.category && x.id !== p.id).slice(0, 4) : [])), [id, p && p.category], [])
  const [sel, setSel] = useState(null)
  const [qty, setQty] = useState(1)
  const [mode, setMode] = useState(aiView ? 'ai' : 'human')
  useEffect(() => { setMode(aiView ? 'ai' : 'human') }, [id, aiView])
  const ai = useApi(() => api.getAiView(id).catch(() => null), [id], null)
  usePageMetadata(ai)
  if (p === null) return null
  if (p === false) return <Empty>Product not found. <a href="#/">Back to shop</a></Empty>
  const v = p.variants.find((x) => x.id === sel) || p.variants.find((x) => x.quantity > 0) || p.variants[0]
  const q = Math.min(qty, Math.max(1, v.quantity))
  const add = async (then) => { const r = await run(() => api.addToCart(v.id, q), 'Added to cart'); if (r && then) navigate(then) }

  return (
    <div className="pdp">
      <nav className="crumbs" aria-label="Breadcrumb">
        <a href="#/">Home</a> › <a href="#/" onClick={() => setFilters({ query: '', category: p.category, status: '', min_price: '', max_price: '', sort: 'relevance' })}>{p.category}</a> › {p.name}
      </nav>
      <div className="viewtoggle" role="tablist" aria-label="Page view">
        <button role="tab" aria-selected={mode === 'human'} className={'w-btn ' + (mode === 'human' ? 'dark' : 'ghost')} onClick={() => setMode('human')}>Human view</button>
        <button role="tab" aria-selected={mode === 'ai'} className={'w-btn ' + (mode === 'ai' ? 'dark' : 'ghost')} onClick={() => setMode('ai')}>AI view</button>
      </div>
      {mode === 'ai' ? <AiView id={id} ai={ai} /> : (
        <>
          <div className="pdpgrid">
            <Photo src={p.image} alt={p.name} w={900} ratio="1/1" className="pdp-photo" />
            <div className="pinfo">
              <span className="w-eyebrow">{p.category}</span>
              <h1>{p.name}</h1>
              {p.seller && <div className="seller">Sold by <strong>{p.seller}</strong></div>}
              {p.aeo?.summary && <div className="inshort"><strong>In short</strong> {p.aeo.summary}</div>}
              <p className="desc">{p.description}</p>
              <div className="price big">{money(v.price)} <span className="sub">per unit, delivery included</span></div>
              <div className="row">
                <StockBadge v={v} />{v.high_demand && <DemandBadge />}
                {v.status === 'low_stock' && <span className="warn">Only {v.quantity} left</span>}
              </div>

              <div className="optlabel">Variant: <strong>{v.label}</strong></div>
              <div className="opts" role="radiogroup" aria-label="Variant">
                {p.variants.map((x) => (
                  <button key={x.id} role="radio" aria-checked={x.id === v.id} className={'opt' + (x.id === v.id ? ' on' : '') + (x.quantity === 0 ? ' oos' : '')} onClick={() => { setSel(x.id); setQty(1) }}>
                    {x.label}<small>{money(x.price)}{x.quantity === 0 ? ' · sold out' : ''}</small>
                  </button>
                ))}
              </div>

              {v.quantity > 0 ? (
                <>
                  <div className="row start"><Stepper value={q} max={v.quantity} onChange={setQty} /></div>
                  <div className="row start buy">
                    <button className="w-btn primary lg" onClick={() => add()}>Add to cart</button>
                    <button className="w-btn dark lg" onClick={() => add('/checkout')}>Buy now</button>
                  </div>
                </>
              ) : (
                <div className="soldout">
                  <p><strong>Currently unavailable.</strong> Get an alert as soon as it is restocked.</p>
                  <button className="w-btn primary lg" disabled={v.pending_notifications > 0} onClick={() => run(() => api.notifyWhenAvailable(v.id), "We'll notify you when it's back")}>
                    {v.pending_notifications > 0 ? 'Notification set' : 'Notify me when available'}
                  </button>
                </div>
              )}
              <button className={'w-btn ghost wishbtn' + (v.wishlisted ? ' on' : '')} onClick={() => run(() => (v.wishlisted ? api.removeFromWishlist(v.id) : api.addToWishlist(v.id)), v.wishlisted ? '' : 'Saved to wishlist')}>
                <Heart size={16} fill={v.wishlisted ? 'currentColor' : 'none'} /> {v.wishlisted ? 'In your wishlist' : 'Add to wishlist'}
              </button>

              <ul className="assure">
                <li><Truck size={16} /> Ships in 48 hours across India</li>
                <li><ShieldCheck size={16} /> {p.specs.warranty || '1-year'} warranty · SKU {v.sku}</li>
              </ul>
            </div>
          </div>

          {p.aeo?.about?.length > 0 && (
            <section className="about"><h2>About this item</h2><ul>{p.aeo.about.map((t) => <li key={t}>{t}</li>)}</ul></section>
          )}
          <ProductInfo product={p} title="Product information" />
          {p.aeo?.faqs?.length > 0 && (
            <section className="faqs"><h2>Questions buyers ask</h2>
              {p.aeo.faqs.map((f) => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}
            </section>
          )}
        </>
      )}
      {related.length > 0 && <section><h2>More in {p.category}</h2><CardGrid min={220}>{related.map((r) => <ProductCard key={r.id} p={r} run={run} />)}</CardGrid></section>}
    </div>
  )
}
