// The storefront "API". Same shape as a REST client (async, JSON in, JSON out),
// but the data lives in a JSON document in localStorage, so there is no server.
// The React UI (and any add-on, e.g. agent/) goes through this one file.
import { createStore } from './services/store'

const memory = new Map()
const storage = (() => {
  try { localStorage.setItem('__t', '1'); localStorage.removeItem('__t'); return localStorage } catch {
    return { getItem: (k) => memory.get(k) ?? null, setItem: (k, v) => memory.set(k, v) }
  }
})()

export const store = createStore(storage)
// Handy for workshops: open the site with ?reset to start from the seed data.
if (new URLSearchParams(location.search).has('reset')) {
  store.reset()
  history.replaceState(null, '', location.pathname + location.hash)
}
// Another tab changed the data: re-render everything here too.
window.addEventListener('storage', () => store.notify())

const wrap = (fn) => async (...args) => fn(...args)
export const api = {
  categories: wrap(store.categories),
  searchProducts: wrap(store.search),
  getProduct: wrap(store.getProduct),
  getVariant: wrap(store.getVariant),
  getWishlist: wrap(store.getWishlist),
  addToWishlist: wrap(store.addToWishlist),
  removeFromWishlist: wrap(store.removeFromWishlist),
  notifyWhenAvailable: wrap(store.notifyWhenAvailable),
  getNotifications: wrap(store.getNotifications),
  getInventory: wrap(store.getInventory),
  restock: wrap(store.restock),
  addProduct: wrap(store.addProduct),
  getInbox: wrap(store.getInbox),
  markRead: wrap(store.markRead),
  clearInbox: wrap(store.clearInbox),
  getCart: wrap(store.getCart),
  addToCart: wrap(store.addToCart),
  setCartQuantity: wrap(store.setCartQuantity),
  removeFromCart: wrap(store.removeFromCart),
  placeOrder: wrap(store.placeOrder),
  getOrders: wrap(store.getOrders),
  reset: wrap(store.reset),
  // Session 4: AEO
  auditAeo: wrap(store.auditAeo),
  previewAeoUpdate: wrap(store.previewAeoUpdate),
  setAeoMetadata: wrap(store.setAeoMetadata),
  getAiView: wrap(store.getAiView),
}
