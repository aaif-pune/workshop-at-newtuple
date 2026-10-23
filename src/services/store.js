// Storefront business logic. Pure JS, no React, no network.
// The whole shop is one JSON document: seeded from products.json, then kept in
// `storage` (localStorage in the browser). Every operation reads the fresh
// document, changes it and writes it back, so several tabs stay consistent.
import seed from '../data/products.json'
import { aeoOf, aeoText, auditProduct, jsonLd, planAeoUpdate, relevanceScore } from './aeo.js'

// v3: Session 4 adds sellers, AEO fields and rival listings to the seed.
const KEY = 'shopwave:v3'
export const LOW_STOCK_AT = 5

const clone = (v) => JSON.parse(JSON.stringify(v))
const int = (v, name) => {
  const n = Number(v)
  if (!Number.isInteger(n)) throw new Error(`${name} must be an integer`)
  return n
}
const uid = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
const stockStatus = (q) => (q <= 0 ? 'out_of_stock' : q <= LOW_STOCK_AT ? 'low_stock' : 'in_stock')

const freshState = () => ({
  products: clone(seed),
  wishlist: [], // variant ids
  cart: [], // { variant_id, quantity }
  orders: [],
  notifications: [], // { id, variant_id, status: pending|fulfilled, created_at }
  inbox: [], // in-app notifications { id, type, title, message, product_id, read, created_at }
})

export function createStore(storage) {
  const listeners = new Set()

  function load() {
    try {
      const raw = storage.getItem(KEY)
      if (raw) { const s = JSON.parse(raw); s.inbox ||= []; return s }
    } catch { /* corrupt or blocked storage: fall through to a fresh shop */ }
    return freshState()
  }
  function save(state) {
    try { storage.setItem(KEY, JSON.stringify(state)) } catch { /* ignore quota errors */ }
    notify()
  }
  function notify() { listeners.forEach((fn) => fn()) }

  function findVariant(state, variantId) {
    const id = int(variantId, 'variant_id')
    for (const product of state.products) {
      const variant = product.variants.find((v) => v.id === id)
      if (variant) return { product, variant }
    }
    throw new Error(`Variant ${id} not found`)
  }
  const pendingFor = (state, vid) => state.notifications.filter((n) => n.variant_id === vid && n.status === 'pending').length

  function variantView(state, variant) {
    const pending = pendingFor(state, variant.id)
    return {
      id: variant.id, sku: variant.sku, label: variant.label, price: variant.price,
      quantity: variant.quantity,
      status: stockStatus(variant.quantity),
      high_demand: pending > 0,
      pending_notifications: pending,
      wishlisted: state.wishlist.includes(variant.id),
    }
  }
  function productView(state, product) {
    const variants = product.variants.map((v) => variantView(state, v))
    return {
      id: product.id, name: product.name, category: product.category, seller: product.seller || null,
      description: product.description, specs: product.specs, image: product.image || null, variants,
      aeo: aeoOf(product),
      price_from: Math.min(...variants.map((v) => v.price)),
      total_quantity: variants.reduce((s, v) => s + v.quantity, 0),
      status: variants.some((v) => v.status === 'in_stock') ? 'in_stock'
        : variants.some((v) => v.status === 'low_stock') ? 'low_stock' : 'out_of_stock',
      high_demand: variants.some((v) => v.high_demand),
    }
  }

  // ---- catalog ----
  function categories() { return [...new Set(load().products.map((p) => p.category))] }

  function search({ query = '', category = '', status = '', min_price, max_price, sort = 'relevance' } = {}) {
    const state = load()
    const tokens = String(query).toLowerCase().split(/\s+/).filter(Boolean)
    let list = state.products.map((p) => productView(state, p)).filter((p) => {
      const hay = `${p.name} ${p.category} ${p.seller || ''} ${p.description} ${aeoText(p)} ${p.variants.map((v) => v.label + ' ' + v.sku).join(' ')}`.toLowerCase()
      if (!tokens.every((t) => hay.includes(t))) return false
      if (category && p.category.toLowerCase() !== String(category).toLowerCase()) return false
      if (status && !p.variants.some((v) => v.status === status)) return false
      if (min_price != null && min_price !== '' && !p.variants.some((v) => v.price >= Number(min_price))) return false
      if (max_price != null && max_price !== '' && !p.variants.some((v) => v.price <= Number(max_price))) return false
      return true
    })
    if (sort === 'price_asc') list.sort((a, b) => a.price_from - b.price_from)
    else if (sort === 'price_desc') list.sort((a, b) => b.price_from - a.price_from)
    else if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name))
    else if (tokens.length) {
      const score = new Map(list.map((p) => [p.id, relevanceScore(p, tokens)]))
      list.sort((a, b) => score.get(b.id) - score.get(a.id))
    }
    return list
  }

  function getProduct(productId) {
    const state = load()
    const id = int(productId, 'product_id')
    const p = state.products.find((x) => x.id === id)
    if (!p) throw new Error(`Product ${id} not found`)
    return productView(state, p)
  }

  function getVariant(variantId) {
    const state = load()
    const { product, variant } = findVariant(state, variantId)
    return { product_id: product.id, product_name: product.name, image: product.image || null, ...variantView(state, variant) }
  }

  // ---- wishlist ----
  function getWishlist() {
    const state = load()
    return state.wishlist.map((vid) => {
      const { product, variant } = findVariant(state, vid)
      return { product_id: product.id, product_name: product.name, image: product.image || null, ...variantView(state, variant) }
    })
  }
  function addToWishlist(variantId) {
    const state = load()
    const { product, variant } = findVariant(state, variantId)
    if (!state.wishlist.includes(variant.id)) state.wishlist.push(variant.id)
    save(state)
    return { ok: true, message: `${product.name} (${variant.label}) is on the wishlist`, wishlist_size: state.wishlist.length }
  }
  function removeFromWishlist(variantId) {
    const state = load()
    const id = int(variantId, 'variant_id')
    state.wishlist = state.wishlist.filter((v) => v !== id)
    save(state)
    return { ok: true, wishlist_size: state.wishlist.length }
  }

  // ---- notify me ----
  function notifyWhenAvailable(variantId) {
    const state = load()
    const { product, variant } = findVariant(state, variantId)
    if (variant.quantity > 0) throw new Error(`${product.name} (${variant.label}) is already in stock (${variant.quantity} units)`)
    let n = state.notifications.find((x) => x.variant_id === variant.id && x.status === 'pending')
    if (!n) {
      n = { id: uid('NTF'), variant_id: variant.id, status: 'pending', created_at: new Date().toISOString() }
      state.notifications.push(n)
      save(state)
    }
    return { ok: true, notification_id: n.id, message: `You will be notified when ${product.name} (${variant.label}) is back. It is now marked high demand.` }
  }
  function getNotifications() {
    const state = load()
    return state.notifications.map((n) => {
      const { product, variant } = findVariant(state, n.variant_id)
      return { ...n, product_name: product.name, variant_label: variant.label, current_quantity: variant.quantity }
    }).reverse()
  }

  // ---- inventory management ----
  function getInventory({ filter = 'all' } = {}) {
    const state = load()
    let rows = state.products.flatMap((p) => p.variants.map((v) => ({
      product_id: p.id, product_name: p.name, category: p.category, image: p.image || null, ...variantView(state, v),
    })))
    if (filter === 'out_of_stock' || filter === 'low_stock') rows = rows.filter((r) => r.status === filter)
    else if (filter === 'needs_attention') rows = rows.filter((r) => r.status !== 'in_stock')
    else if (filter === 'high_demand') rows = rows.filter((r) => r.high_demand)
    return rows
  }
  function restock(variantId, quantity) {
    const state = load()
    const qty = int(quantity, 'quantity')
    if (qty < 1 || qty > 10000) throw new Error('quantity must be between 1 and 10000')
    const { product, variant } = findVariant(state, variantId)
    variant.quantity += qty
    let fulfilled = 0
    for (const n of state.notifications) {
      if (n.variant_id === variant.id && n.status === 'pending') { n.status = 'fulfilled'; fulfilled++ }
    }
    pushInbox(state, fulfilled
      ? { type: 'restock', title: 'Back in stock', message: `${product.name} (${variant.label}) is available again. You asked to be notified. ${qty} units added.`, product_id: product.id }
      : { type: 'restock', title: 'New stock added', message: `${qty} units of ${product.name} (${variant.label}) added to inventory.`, product_id: product.id })
    save(state)
    return { ok: true, product_name: product.name, variant_label: variant.label, new_quantity: variant.quantity, status: stockStatus(variant.quantity), notifications_fulfilled: fulfilled }
  }
  function addProduct({ name, category, description = '', image = '', variants } = {}) {
    const state = load()
    if (!String(name ?? '').trim()) throw new Error('name is required')
    if (!String(category ?? '').trim()) throw new Error('category is required')
    if (!Array.isArray(variants) || !variants.length) throw new Error('at least one variant {label, price, quantity} is required')
    const clean = String(name).trim()
    if (state.products.some((p) => p.name.toLowerCase() === clean.toLowerCase())) throw new Error(`Product "${clean}" already exists. Use restock_variant to add stock.`)
    const id = Math.max(0, ...state.products.map((p) => p.id)) + 1
    let vid = Math.max(0, ...state.products.flatMap((p) => p.variants.map((v) => v.id)))
    const product = {
      id, name: clean, category: String(category).trim(), description: String(description).trim(), specs: {}, image: String(image || '').trim() || null,
      variants: variants.map((v, i) => {
        const price = Number(v.price), quantity = int(v.quantity ?? 0, 'quantity')
        if (!String(v.label ?? '').trim()) throw new Error('every variant needs a label')
        if (!(price > 0)) throw new Error('every variant needs a price above 0')
        if (quantity < 0 || quantity > 10000) throw new Error('quantity must be between 0 and 10000')
        return { id: ++vid, sku: `SW-${String(id).padStart(3, '0')}-${i + 1}`, label: String(v.label).trim(), price, quantity }
      }),
    }
    state.products.push(product)
    pushInbox(state, { type: 'new_product', title: 'New product added', message: `${product.name} just landed in ${product.category} (${product.variants.length} variant${product.variants.length > 1 ? 's' : ''}).`, product_id: id })
    save(state)
    return productView(state, product)
  }
  // ---- in-app notifications ----
  function pushInbox(state, n) {
    state.inbox.push({ id: uid('NTC'), read: false, created_at: new Date().toISOString(), ...n })
    state.inbox = state.inbox.slice(-50)
  }
  function getInbox() { return load().inbox.slice().reverse() }
  function markRead(id) {
    const state = load()
    state.inbox.forEach((n) => { if (!id || n.id === id) n.read = true })
    save(state)
  }
  function clearInbox() { const state = load(); state.inbox = []; save(state) }

  // ---- cart ----
  function cartView(state) {
    const items = state.cart.map((row) => {
      const { product, variant } = findVariant(state, row.variant_id)
      return {
        variant_id: variant.id, product_id: product.id, product_name: product.name, image: product.image || null, category: product.category, sku: variant.sku,
        label: variant.label, price: variant.price, quantity: row.quantity,
        available: variant.quantity, subtotal: variant.price * row.quantity,
      }
    })
    return { items, item_count: items.reduce((s, i) => s + i.quantity, 0), total: items.reduce((s, i) => s + i.subtotal, 0) }
  }
  function getCart() { return cartView(load()) }
  function addToCart(variantId, quantity = 1) {
    const state = load()
    const qty = int(quantity, 'quantity')
    if (qty < 1 || qty > 1000) throw new Error('quantity must be between 1 and 1000')
    const { product, variant } = findVariant(state, variantId)
    const row = state.cart.find((r) => r.variant_id === variant.id)
    const next = (row ? row.quantity : 0) + qty
    if (variant.quantity <= 0) throw new Error(`${product.name} (${variant.label}) is out of stock. Use notify_when_available instead.`)
    if (next > variant.quantity) throw new Error(`Only ${variant.quantity} units of ${product.name} (${variant.label}) available`)
    if (row) row.quantity = next
    else state.cart.push({ variant_id: variant.id, quantity: qty })
    save(state)
    return cartView(state)
  }
  function setCartQuantity(variantId, quantity) {
    const state = load()
    const qty = int(quantity, 'quantity')
    const { variant } = findVariant(state, variantId)
    if (qty <= 0) state.cart = state.cart.filter((r) => r.variant_id !== variant.id)
    else {
      if (qty > variant.quantity) throw new Error(`Only ${variant.quantity} units available`)
      const row = state.cart.find((r) => r.variant_id === variant.id)
      if (row) row.quantity = qty
    }
    save(state)
    return cartView(state)
  }
  function removeFromCart(variantId) { return setCartQuantity(variantId, 0) }

  // ---- checkout ----
  const REQUIRED = ['name', 'email', 'phone', 'address', 'city', 'postal_code']
  function placeOrder(customer = {}) {
    const state = load()
    const missing = REQUIRED.filter((k) => !String(customer[k] ?? '').trim())
    if (missing.length) throw new Error(`Missing required details: ${missing.join(', ')}. Ask the customer for them.`)
    if (!/^\S+@\S+\.\S+$/.test(customer.email)) throw new Error('email looks invalid')
    if (String(customer.phone).replace(/\D/g, '').length < 7) throw new Error('phone looks invalid')
    const cart = cartView(state)
    if (!cart.items.length) throw new Error('Cart is empty')
    for (const item of cart.items) {
      if (item.quantity > item.available) throw new Error(`Only ${item.available} units of ${item.product_name} (${item.label}) left`)
    }
    for (const item of cart.items) findVariant(state, item.variant_id).variant.quantity -= item.quantity
    const order = {
      id: uid('ORD'), status: 'placed', created_at: new Date().toISOString(),
      items: cart.items.map(({ available, ...rest }) => rest), total: cart.total,
      customer: Object.fromEntries(REQUIRED.map((k) => [k, String(customer[k]).trim()])),
    }
    state.orders.push(order)
    pushInbox(state, { type: 'order', title: 'Order placed', message: `${order.id} · ${order.items.length} item${order.items.length > 1 ? 's' : ''} · confirmation sent to ${order.customer.email}` })
    state.cart = []
    save(state)
    return order
  }
  function getOrders() { return load().orders.slice().reverse() }

  // ---- Session 4: AEO (answer-engine optimisation) ----
  const rawProduct = (state, productId) => {
    const id = int(productId, 'product_id')
    const p = state.products.find((x) => x.id === id)
    if (!p) throw new Error(`Product ${id} not found`)
    return p
  }
  // Competing listings: the same kind of product (e.g. "water bottle") from another seller.
  // A product without a kind or seller has no rivals, so a yoga mat is never compared with bottles.
  const peersOf = (state, p) => (p.kind && p.seller ? state.products.filter((x) => x.id !== p.id &&
    x.category === p.category && x.kind === p.kind && x.seller && x.seller !== p.seller) : [])
  function auditAeo(productId, question = '') {
    const state = load()
    const p = rawProduct(state, productId)
    return auditProduct(p, peersOf(state, p), question)
  }
  // Read-only: what an update would change, and the change_id to apply exactly that.
  function previewAeoUpdate(productId, input = {}) {
    const state = load()
    const p = rawProduct(state, productId)
    return planAeoUpdate(p, peersOf(state, p), input).plan
  }
  function setAeoMetadata(productId, input = {}) {
    const { change_id, ...changes } = input
    if (!change_id) throw new Error('Run preview_aeo_update first, show the user its exact changes, then pass its change_id here.')
    const state = load()
    const p = rawProduct(state, productId)
    const { plan, next } = planAeoUpdate(p, peersOf(state, p), changes)
    if (!plan.changes.length) throw new Error('Nothing to change: the listing already has these values (already applied?).')
    if (change_id !== plan.change_id) throw new Error('These changes differ from the approved preview, or the listing changed since. Preview again and get approval.')
    Object.assign(p, next)
    save(state)
    const audit = auditProduct(p, peersOf(state, p))
    return { ok: true, product_id: p.id, product_name: p.name, score_before: plan.score_before, score_after: audit.score, max: audit.max,
      changes: plan.changes, warnings: plan.warnings, audit }
  }
  // What an AI agent can read about one listing, including schema.org JSON-LD.
  function getAiView(productId) {
    const state = load()
    const p = rawProduct(state, productId)
    const v = productView(state, p)
    return {
      product_id: v.id, name: v.name, seller: v.seller, category: v.category,
      in_short: v.aeo.summary || null, best_for: v.aeo.best_for, keywords: v.aeo.keywords, faqs: v.aeo.faqs, about: v.aeo.about,
      seo_title: v.aeo.seo_title || null, meta_description: v.aeo.meta_description || null,
      facts: v.specs, offers: v.variants.map((x) => ({ label: x.label, price: x.price, status: x.status })),
      json_ld: jsonLd(p),
    }
  }

  function reset() { save(freshState()) }

  return {
    subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn) },
    notify, categories, search, getProduct, getVariant,
    getWishlist, addToWishlist, removeFromWishlist,
    notifyWhenAvailable, getNotifications,
    getInventory, restock, addProduct, getInbox, markRead, clearInbox,
    getCart, addToCart, setCartQuantity, removeFromCart,
    placeOrder, getOrders, reset,
    auditAeo, previewAeoUpdate, setAeoMetadata, getAiView,
  }
}
