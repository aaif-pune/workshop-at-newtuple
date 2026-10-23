import { createStore } from '../shared/store.js'
import { createToolHandlers } from '../shared/tools/handlers.js'

export function createDemoStore() {
  // createStore only needs getItem/setItem. A Map gives this workshop a
  // process-local shop without adding a database or browser storage.
  const memory = new Map()
  return createStore({ getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value) })
}

// One shop per Node process. No browser globals, database, or user sessions.
export function createActions(store = createDemoStore()) {
  const handlers = createToolHandlers(store)
  // Add shared navigation data to every result so the widget can update its
  // cart and wishlist counts without making extra calls.
  const snapshot = (view, extra = {}) => ({
    view, categories: store.categories(), cart: handlers.get_cart(),
    wishlist: handlers.get_wishlist(), ...extra,
  })
  return {
    // Handlers perform commerce operations; actions choose the widget view.
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
    show_checkout: () => {
      // Showing the form does not place an order.
      if (!handlers.get_cart().items.length) throw new Error('Add a product to your cart before checkout.')
      return snapshot('checkout')
    },
    place_order: ({ customer, confirmed }) => {
      // Enforce confirmation here as well as in the form so direct tool calls
      // cannot skip the review step.
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
    // Text is readable by the assistant; structuredContent drives the widget.
    return { content: [{ type: 'text', text: JSON.stringify(data) }], structuredContent: data }
  } catch (error) {
    // Return a tool error to the host instead of failing the HTTP request.
    return { isError: true, content: [{ type: 'text', text: error.message }] }
  }
}
