// Transport-independent commerce operations. Each adapter supplies its own store:
// localStorage in the website, process memory in the MCP server.
// Keep UI navigation, confirmation policy and response formatting in adapters.
export function createToolHandlers(store) {
  return {
    search_products: args => store.search(args),
    get_product: ({ product_id }) => store.getProduct(product_id),
    check_availability: ({ variant_id }) => store.getVariant(variant_id),
    get_wishlist: () => store.getWishlist(),
    add_to_wishlist: ({ variant_id }) => store.addToWishlist(variant_id),
    remove_from_wishlist: ({ variant_id }) => store.removeFromWishlist(variant_id),
    get_cart: () => store.getCart(),
    add_to_cart: ({ variant_id, quantity }) => store.addToCart(variant_id, quantity),
    set_cart_quantity: ({ variant_id, quantity }) => store.setCartQuantity(variant_id, quantity),
    remove_from_cart: ({ variant_id }) => store.removeFromCart(variant_id),
    place_order: customer => store.placeOrder(customer),
    get_orders: () => store.getOrders(),
    set_aeo_metadata: args => store.setMetadata(args),
  }
}
