import { useEffect, useState } from 'react'
import { Heart, Package, Search, ShoppingCart } from 'lucide-react'
import { api } from './api'
import { useApi } from './hooks'
import { navigate, useRoute } from './router'
import { onUIRequest } from './ui-bus'
import { startWebMCP, tools } from './webmcp'
import { DEFAULT_THEME, inferCategory, themeFor } from './themes'
import Home, { DEFAULT_FILTERS } from './views/Home'
import ProductPage from './views/ProductPage'
import Wishlist from './views/Wishlist'
import Cart from './views/Cart'
import Checkout from './views/Checkout'
import Orders from './views/Orders'
import Widgets from './views/Widgets'

const VIEW_PATH = { shop: '/', cart: '/cart', wishlist: '/wishlist', orders: '/orders', checkout: '/checkout' }

export default function App() {
  const route = useRoute()
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState(null)
  const [themeCat, setThemeCat] = useState('')
  const [mcp, setMcp] = useState({ supported: false, count: 0, where: '', error: '' })
  useEffect(() => startWebMCP(setMcp), [])

  useEffect(() => onUIRequest((d) => {
    if (d.filters) { setFilters({ ...DEFAULT_FILTERS, ...d.filters }); setSearch(d.filters.query || '') }
    if (d.view === 'product') navigate('/product/' + d.productId)
    else if (d.view === 'orders' && d.placed) navigate('/orders?placed=' + d.placed)
    else if (d.view) navigate(VIEW_PATH[d.view] || '/')
  }), [])

  const categories = useApi(api.categories, [], [])
  const wishlist = useApi(api.getWishlist, [], [])
  const cart = useApi(api.getCart, [], { item_count: 0 })
  const results = useApi(() => api.searchProducts(filters), [JSON.stringify(filters)], [])
  const product = useApi(() => (route.page === 'product' ? api.getProduct(route.id).catch(() => null) : Promise.resolve(null)), [route.page, route.id], null)

  // Re-skin the store for the category being browsed.
  const inferred = inferCategory({ page: route.page, product, filters, results })
  useEffect(() => { if (inferred !== null) setThemeCat(inferred) }, [inferred])
  const theme = themeFor(themeCat)
  useEffect(() => { document.documentElement.dataset.theme = theme.key }, [theme.key])

  const flash = (msg, action) => { if (!msg) return; setToast({ msg, action }); clearTimeout(flash.t); flash.t = setTimeout(() => setToast(null), 3500) }
  const run = async (fn, okMsg) => {
    try {
      const r = await fn()
      flash(okMsg, okMsg === 'Added to cart' ? { label: 'View cart', to: '/cart' } : null)
      return r ?? true
    } catch (e) { flash(e.message); return null }
  }
  const goShop = () => { navigate('/'); setTimeout(() => document.getElementById('shop')?.scrollIntoView(), 0) }
  const submitSearch = (e) => { e.preventDefault(); setFilters({ ...DEFAULT_FILTERS, query: search }); goShop() }
  const pickCategory = (c) => { setFilters({ ...DEFAULT_FILTERS, category: c }); setSearch(''); goShop() }

  const t = theme === DEFAULT_THEME ? DEFAULT_THEME : theme
  const ctx = { filters, setFilters, run, theme: t, products: results }
  return (
    <>
      <div className="announce">{t.announce}</div>
      <header className="top">
        <a className="brand" href="#/" onClick={() => { setFilters(DEFAULT_FILTERS); setSearch('') }}>
          ShopWave<i>.</i>{t.label && <small>{t.label}</small>}
        </a>
        <form className="searchbar" role="search" onSubmit={submitSearch}>
          <input type="search" placeholder="Search headphones, shoes, kettle, books…" aria-label="Search products" value={search} onChange={(e) => setSearch(e.target.value)} />
          <button type="submit" aria-label="Search"><Search size={18} /></button>
        </form>
        <nav className="icons" aria-label="Account">
          <a href="#/orders"><Package size={19} /><span>Orders</span></a>
          <a href="#/wishlist"><Heart size={19} /><span>Wishlist</span>{wishlist.length > 0 && <b>{wishlist.length}</b>}</a>
          <a href="#/cart"><ShoppingCart size={19} /><span>Cart</span>{cart.item_count > 0 && <b>{cart.item_count}</b>}</a>
        </nav>
      </header>
      <nav className="catnav" aria-label="Categories">
        <button className={!themeCat ? 'on' : ''} onClick={() => pickCategory('')}>All</button>
        {categories.map((c) => <button key={c} className={themeCat === c ? 'on' : ''} onClick={() => pickCategory(c)}>{c}</button>)}
      </nav>

      <main>
        {route.page === 'home' && <Home {...ctx} />}
        {route.page === 'product' && <ProductPage id={route.id} run={run} setFilters={setFilters} />}
        {route.page === 'wishlist' && <Wishlist run={run} />}
        {route.page === 'cart' && <Cart run={run} />}
        {route.page === 'checkout' && <Checkout />}
        {route.page === 'orders' && <Orders placed={route.params.get('placed')} />}
        {route.page === 'widgets' && <Widgets />}
      </main>

      {!mcp.supported && <p className="hint">WebMCP is not available in this browser. Test tools in DevTools: <code>await storefrontTools.search_products({'{query:"headphones"}'})</code></p>}
      <footer className="foot">
        <div>
          <strong>ShopWave</strong>
          <span>A demo store for the agentic commerce workshop. No real orders or payments. Photos from Unsplash.</span>
        </div>
        <div className="footlinks">
          <a href="#/widgets">Component library</a>
          <button onClick={() => confirm('Reset all demo data?') && run(api.reset, 'Demo data reset')}>Reset demo data</button>
          <span className={'pill ' + (mcp.supported ? 'good' : 'warn')} title={mcp.supported ? `via ${mcp.where}\n` + tools.map((x) => x.name).join('\n') : mcp.error || 'document.modelContext not found in this browser'}>
            WebMCP: {mcp.supported ? `${mcp.count} tools live` : 'not detected'}
          </span>
        </div>
      </footer>

      {toast && <div className="toast" role="alert">{toast.msg}{toast.action && <a href={'#' + toast.action.to}>{toast.action.label}</a>}</div>}
    </>
  )
}
