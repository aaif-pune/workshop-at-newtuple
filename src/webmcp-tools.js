// Website-specific navigation around the shared commerce handlers.
import { webToolDefinitions } from '../shared/tools/definitions.js'
import { createToolHandlers } from '../shared/tools/handlers.js'

export function createWebTools(store, showInUI) {
  const handlers = createToolHandlers(store)
  // Navigation stays here, including whether it happens before or after execution.
  const runs = {
    search_products: async (a) => {
      showInUI({ view: 'shop', filters: { query: a.query || '', category: a.category || '', status: a.status || '', min_price: a.min_price ?? '', max_price: a.max_price ?? '', sort: a.sort || 'relevance' } })
      return handlers.search_products(a)
    },
    get_product: async (a) => { const r = await handlers.get_product(a); showInUI({ view: 'product', productId: a.product_id }); return r },
    check_availability: async (a) => { const r = await handlers.check_availability(a); showInUI({ view: 'product', productId: r.product_id }); return r },
    add_to_wishlist: async (a) => { const r = await handlers.add_to_wishlist(a); showInUI({ view: 'wishlist' }); return r },
    remove_from_wishlist: async (a) => handlers.remove_from_wishlist(a),
    get_wishlist: async () => handlers.get_wishlist(),
    add_to_cart: async (a) => { const r = await handlers.add_to_cart(a); showInUI({ view: 'cart' }); return r },
    set_cart_quantity: async (a) => { const r = await handlers.set_cart_quantity(a); showInUI({ view: 'cart' }); return r },
    get_cart: async () => handlers.get_cart(),
    remove_from_cart: async (a) => handlers.remove_from_cart(a),
    place_order: async (a) => { const r = await handlers.place_order(a); showInUI({ view: 'orders', placed: r.id }); return r },
    get_orders: async () => { showInUI({ view: 'orders' }); return handlers.get_orders() },
    set_aeo_metadata: async (a) => { const r = await handlers.set_aeo_metadata(a); showInUI({ view: 'product', productId: a.product_id }); return r },
  }

  return webToolDefinitions.map(definition => ({ ...definition, run: runs[definition.name] }))
}
