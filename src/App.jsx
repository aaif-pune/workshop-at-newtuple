import { useEffect, useRef, useState } from 'react'
import { Heart, Package, Search, ShoppingCart } from 'lucide-react'
import { api } from './api'
import { useApi } from './hooks'
import { navigate, useRoute } from './router'
import { onUIRequest } from './ui-bus'
import { DEFAULT_THEME, inferCategory, themeFor } from './themes'
import { Bell_, Popups } from './Notifications'
import Home, { DEFAULT_FILTERS } from './views/Home'
import ProductPage from './views/ProductPage'
import Wishlist from './views/Wishlist'
import Cart from './views/Cart'
import Checkout from './views/Checkout'
import Orders from './views/Orders'
import Inventory from './views/Inventory'
import Widgets from './views/Widgets'

const VIEW_PATH = { shop: '/', cart: '/cart', wishlist: '/wishlist', orders: '/orders', inventory: '/admin', checkout: '/checkout' }

export default function App() {
  const route = useRoute()
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState(null)
  const [inboxOpen, setInboxOpen] = useState(false)
  const [popups, setPopups] = useState([])
  const [themeCat, setThemeCat] = useState('')
  useEffect(() => onUIRequest((d) => {
    if (d.filters) { setFilters({ ...DEFAULT_FILTERS, ...d.filters }); setSearch(d.filters.query || '') }
    if (d.panel === 'inbox') setInboxOpen(true)
    if (d.view === 'product') navigate('/product/' + d.productId + (d.aiView ? '?view=ai' : ''))
    else if (d.view === 'orders' && d.placed) navigate('/orders?placed=' + d.placed)
    else if (d.view) navigate(VIEW_PATH[d.view] || '/')
  }), [])

  const categories = useApi(api.categories, [], [])
  const wishlist = useApi(api.getWishlist, [], [])
  const cart = useApi(api.getCart, [], { item_count: 0 })
  const inbox = useApi(api.getInbox, [], [])
  const results = useApi(() => api.searchProducts(filters), [JSON.stringify(filters)], [])
  const product = useApi(() => (route.page === 'product' ? api.getProduct(route.id).catch(() => null) : Promise.resolve(null)), [route.page, route.id], null)

  // Re-skin the store for the category being browsed.
  const inferred = inferCategory({ page: route.page, product, filters, results })
  useEffect(() => { if (inferred !== null) setThemeCat(inferred) }, [inferred])
  const theme = themeFor(themeCat)
  useEffect(() => { document.documentElement.dataset.theme = theme.key }, [theme.key])

  // Pop a card when a new in-app notification arrives (not for ones already there at load).
  const seen = useRef(null)
  useEffect(() => {
    if (seen.current === null) { seen.current = new Set(inbox.map((n) => n.id)); return }
    const fresh = inbox.filter((n) => !seen.current.has(n.id))
    if (!fresh.length) return
    fresh.forEach((n) => seen.current.add(n.id))
    setPopups((p) => [...fresh, ...p].slice(0, 3))
    fresh.forEach((n) => setTimeout(() => setPopups((p) => p.filter((x) => x.id !== n.id)), 8000))
  }, [inbox])
  const dismissPopup = (id) => setPopups((p) => p.filter((x) => x.id !== id))

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
          <Bell_ items={inbox} open={inboxOpen} setOpen={setInboxOpen} />
          <a href="#/orders"><Package size={19} /><span>Orders</span></a>
          <a href="#/wishlist"><Heart size={19} /><span>Wishlist</span>{wishlist.length > 0 && <b>{wishlist.length}</b>}</a>
          <a href="#/cart"><ShoppingCart size={19} /><span>Cart</span>{cart.item_count > 0 && <b>{cart.item_count}</b>}</a>
        </nav>
      </header>
      <nav className="catnav" aria-label="Categories">
        <button className={!themeCat ? 'on' : ''} onClick={() => pickCategory('')}>All</button>
        {categories.map((c) => <button key={c} className={themeCat === c ? 'on' : ''} onClick={() => pickCategory(c)}>{c}</button>)}
      </nav>

      <main onClick={() => inboxOpen && setInboxOpen(false)}>
        {route.page === 'home' && <Home {...ctx} />}
        {route.page === 'product' && <ProductPage id={route.id} run={run} setFilters={setFilters} aiView={route.params.get('view') === 'ai'} />}
        {route.page === 'wishlist' && <Wishlist run={run} />}
        {route.page === 'cart' && <Cart run={run} />}
        {route.page === 'checkout' && <Checkout />}
        {route.page === 'orders' && <Orders placed={route.params.get('placed')} />}
        {route.page === 'admin' && <Inventory run={run} />}
        {route.page === 'widgets' && <Widgets />}
      </main>

      <footer className="foot">
        <div>
          <strong>ShopWave</strong>
          <span>A demo store. No real orders or payments. Photos from Unsplash.</span>
        </div>
        <div className="footlinks">
          <a href="#/admin">Inventory manager</a>
          <a href="#/widgets">Component library</a>
          <button onClick={() => confirm('Reset all demo data?') && run(api.reset, 'Demo data reset')}>Reset demo data</button>
        </div>
      </footer>

      {!inboxOpen && <Popups items={popups} dismiss={dismissPopup} />}
      {toast && <div className="toast" role="alert">{toast.msg}{toast.action && <a href={'#' + toast.action.to}>{toast.action.label}</a>}</div>}
    </>
  )
}
