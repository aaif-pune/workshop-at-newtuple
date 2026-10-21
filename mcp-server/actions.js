import { createStore } from '../shared/store.js'
import { createToolHandlers } from '../shared/tools/handlers.js'

export function createDemoStore() {
  const memory = new Map()
  return createStore({ getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value) })
}

// One shop per Node process. No browser globals, database, or user sessions.
export function createActions(store = createDemoStore()) {
  const handlers = createToolHandlers(store)
  const snapshot = (view, extra = {}) => ({
    view, categories: store.categories(), cart: handlers.get_cart(),
    wishlist: handlers.get_wishlist(), ...extra,
  })
  return {
    search_products: args => snapshot('catalog', { products: handlers.search_products(args), filters: args }),
    get_product: ({ product_id }) => snapshot('product', { product: handlers.get_product({ product_id }) }),
    check_availability: ({ variant_id }) => {
      const variant = handlers.check_availability({ variant_id })
      return snapshot('product', { product: handlers.get_product({ product_id: variant.product_id }), variant })
    },
    get_cart: () => snapshot('cart'),
    add_to_cart: ({ variant_id, quantity }) => { handlers.add_to_cart({ variant_id, quantity }); return snapshot('cart') },
    set_cart_quantity: ({ variant_id, quantity }) => { handlers.set_cart_quantity({ variant_id, quantity }); return snapshot('cart') },
    remove_from_cart: ({ variant_id }) => { handlers.remove_from_cart({ variant_id }); return snapshot('cart') },
    get_wishlist: () => snapshot('wishlist'),
    add_to_wishlist: ({ variant_id }) => { handlers.add_to_wishlist({ variant_id }); return snapshot('wishlist') },
    remove_from_wishlist: ({ variant_id }) => { handlers.remove_from_wishlist({ variant_id }); return snapshot('wishlist') },
    set_aeo_metadata: args => {
      const result = handlers.set_aeo_metadata(args)
      return snapshot('product', { product: handlers.get_product({ product_id: result.product_id }),
        message: `AEO metadata saved: ${result.updated.join(', ')}.${result.warnings.length ? ' ' + result.warnings.join(' ') : ''}` })
    },
    show_checkout: () => {
      if (!handlers.get_cart().items.length) throw new Error('Add a product to your cart before checkout.')
      return snapshot('checkout')
    },
    place_order: ({ customer, confirmed }) => {
      if (confirmed !== true) throw new Error('Review the cart and confirm this demo order first.')
      const order = handlers.place_order(customer)
      // Personal form fields are not returned to the model or other UI instances.
      const { customer: _customer, ...summary } = order
      return snapshot('confirmation', { order: summary })
    },
    get_orders: () => snapshot('orders', {
      orders: handlers.get_orders().map(({ customer: _customer, ...order }) => order),
    }),
  }
}

export function toolResult(actions, name, args = {}) {
  try {
    if (!Object.hasOwn(actions, name)) throw new Error(`Unknown tool: ${name}`)
    const data = actions[name](args)
    return { content: [{ type: 'text', text: JSON.stringify(data) }], structuredContent: data }
  } catch (error) {
    return { isError: true, content: [{ type: 'text', text: error.message }] }
  }
}
