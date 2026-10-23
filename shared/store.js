// Storefront business logic. Pure JS, no React, no network.
// The whole shop is one JSON document: seeded from products.json, then kept in
// `storage` (localStorage in the browser). Every operation reads the fresh
// document, changes it and writes it back, so several tabs stay consistent.
import seed from './products.json' with { type: 'json' }

const KEY = 'shopwave:v2'
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
})

export function createStore(storage) {
  const listeners = new Set()

  function load() {
    try {
      const raw = storage.getItem(KEY)
      if (raw) return JSON.parse(raw)
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

  function variantView(state, variant) {
    return {
      id: variant.id, sku: variant.sku, label: variant.label, price: variant.price,
      quantity: variant.quantity,
      status: stockStatus(variant.quantity),
      wishlisted: state.wishlist.includes(variant.id),
    }
  }
  function productView(state, product) {
    const variants = product.variants.map((v) => variantView(state, v))
    return {
      id: product.id, name: product.name, category: product.category,
      description: product.description, specs: product.specs, image: product.image || null,
      images: product.images?.length ? product.images : product.image ? [product.image] : [],
      variants,
      price_from: Math.min(...variants.map((v) => v.price)),
      total_quantity: variants.reduce((s, v) => s + v.quantity, 0),
      status: variants.some((v) => v.status === 'in_stock') ? 'in_stock'
        : variants.some((v) => v.status === 'low_stock') ? 'low_stock' : 'out_of_stock',
    }
  }

  // ---- catalog ----
  function categories() { return [...new Set(load().products.map((p) => p.category))] }

  function search({ query = '', category = '', status = '', min_price, max_price, sort = 'relevance' } = {}) {
    const state = load()
    const tokens = String(query).toLowerCase().split(/\s+/).filter(Boolean)
    let list = state.products.map((p) => productView(state, p)).filter((p) => {
      const hay = `${p.name} ${p.category} ${p.description} ${p.variants.map((v) => v.label + ' ' + v.sku).join(' ')}`.toLowerCase()
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
    if (variant.quantity <= 0) throw new Error(`${product.name} (${variant.label}) is out of stock.`)
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
    state.cart = []
    save(state)
    return order
  }
  function getOrders() { return load().orders.slice().reverse() }

  function reset() { save(freshState()) }

  return {
    subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn) },
    notify, categories, search, getProduct, getVariant,
    getWishlist, addToWishlist, removeFromWishlist,
    getCart, addToCart, setCartQuantity, removeFromCart,
    placeOrder, getOrders, reset,
  }
}
