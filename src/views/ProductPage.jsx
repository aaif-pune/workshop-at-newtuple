import { useEffect, useState } from 'react'
import { Heart, Truck, ShieldCheck } from 'lucide-react'
import { api } from '../api'
import { useApi } from '../hooks'
import { navigate } from '../router'
import { CardGrid, Photo, Stepper } from '../widgets'
import { Empty, StockBadge, money } from '../components'
import ProductCard from './ProductCard'

export default function ProductPage({ id, run, setFilters }) {
  const p = useApi(() => api.getProduct(id).catch(() => false), [id], null)
  const related = useApi(() => api.searchProducts({}).then((l) => (p ? l.filter((x) => x.category === p.category && x.id !== p.id).slice(0, 4) : [])), [id, p && p.category], [])
  const [sel, setSel] = useState(null)
  const [qty, setQty] = useState(1)
  const [shot, setShot] = useState(0)
  useEffect(() => setShot(0), [id])
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
      <div className="pdpgrid">
        <div className="gallery">
          <Photo src={p.images[Math.min(shot, p.images.length - 1)] || null} alt={p.name} w={900} ratio="1/1" className="pdp-photo" />
          {p.images.length > 1 && (
            <div className="thumbs" role="tablist" aria-label="Product photos">
              {p.images.map((src, i) => (
                <button key={src} role="tab" aria-selected={i === shot} aria-label={`Photo ${i + 1}`} className={i === shot ? 'on' : ''} onClick={() => setShot(i)}>
                  <Photo src={src} alt="" w={120} ratio="1/1" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="pinfo">
          <span className="w-eyebrow">{p.category}</span>
          <h1>{p.name}</h1>
          <p className="desc">{p.description}</p>
          <div className="price big">{money(v.price)} <span className="sub">per unit, delivery included</span></div>
          <div className="row">
            <StockBadge v={v} />
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
              <p><strong>Currently unavailable.</strong> This option is out of stock.</p>
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

      {Object.keys(p.specs).length > 0 && (
        <section className="specs"><h2>Specifications</h2>
          <table><tbody>{Object.entries(p.specs).map(([k, val]) => <tr key={k}><th>{k.replace(/_/g, ' ')}</th><td>{val}</td></tr>)}</tbody></table>
        </section>
      )}
      {related.length > 0 && <section><h2>More in {p.category}</h2><CardGrid min={220}>{related.map((r) => <ProductCard key={r.id} p={r} run={run} />)}</CardGrid></section>}
    </div>
  )
}
