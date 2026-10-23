// Agent tool definitions, shared by every agent add-on (WebMCP in the browser, an MCP server in Node).
// Each tool = name + description + JSON schema + an async function that calls the shop api.
// `api` is injected so the same tools run against the browser api or a Node store;
// `show` lets a host steer the visible UI (no-op where there is no UI).

const int = { type: 'integer' }
const str = { type: 'string' }
// Session 4: the listing fields an AEO update may change (shared by preview_aeo_update and set_aeo_metadata).
const aeoFields = {
  product_id: int,
  summary: { ...str, description: 'The "In short" answer: one or two sentences on what it is, who it is for and what makes it different, with numbers' },
  faqs: {
    type: 'array', items: { type: 'object', properties: { q: str, a: str }, required: ['q', 'a'] },
    description: 'Added to the existing FAQs (a question already there gets the new answer); at most 8 in total',
  },
  faqs_mode: { type: 'string', enum: ['add', 'replace'], description: '"add" (default), or "replace" to rewrite the whole FAQ list (also how to remove one)' },
  keywords: { type: 'array', items: str, description: 'Replaces the keyword list' },
  best_for: { type: 'array', items: str, description: 'Use cases, e.g. trekking, office, gym; replaces the list' },
  about: { type: 'array', items: str, description: '"About this item": 3 to 6 short bullet points, one fact each; replaces the list' },
  seo_title: { ...str, description: 'Page title for search results, about 60 characters' },
  meta_description: { ...str, description: 'Search result snippet, about 160 characters' },
  specs: {
    type: 'object', additionalProperties: str,
    description: 'Key facts as name: value, merged into the existing ones (an empty value removes a fact), e.g. {"weight": "350 g", "leak_proof": "Yes"}. '
      + 'The page groups them: Measurements (capacity, weight, dimensions), Style (colour), Materials & Care (material, care), '
      + 'Features & Specs (insulation, leak_proof, battery), Item details (warranty, country_of_origin); other names go to Other details',
  },
  description: { ...str, description: 'The product description: 80 to 600 characters of concrete detail' },
}
const aeoChanges = ({ product_id, change_id, confirmed, ...changes }) => changes
export const ok = (data) => ({ content: [{ type: 'text', text: JSON.stringify(data) }] })
export const fail = (e) => ({ content: [{ type: 'text', text: JSON.stringify({ error: e.message }) }], isError: true })

export const createTools = (api, show = () => {}) => [
  {
    name: 'search_products',
    description: 'Search the ShopWave catalog. Returns products with variants, price, quantity and stock status (in_stock, low_stock, out_of_stock) and a high_demand flag. All filters are optional.',
    readOnly: true,
    properties: {
      query: { ...str, description: 'Free text, e.g. "wireless headphones"' },
      category: { ...str, description: 'One of: Electronics, Fashion, Home & Kitchen, Beauty, Sports & Fitness, Books, Toys & Games, Grocery' },
      status: { type: 'string', enum: ['in_stock', 'low_stock', 'out_of_stock'], description: 'Only products having a variant in this status' },
      min_price: { type: 'number' }, max_price: { type: 'number' },
      sort: { type: 'string', enum: ['relevance', 'price_asc', 'price_desc', 'name'] },
    },
    run: async (a) => {
      show({ view: 'shop', filters: { query: a.query || '', category: a.category || '', status: a.status || '', min_price: a.min_price ?? '', max_price: a.max_price ?? '', sort: a.sort || 'relevance' } })
      return api.searchProducts(a)
    },
  },
  {
    name: 'get_product', description: 'Get one product with all its variants, specs and stock.', readOnly: true,
    properties: { product_id: int }, required: ['product_id'],
    run: async (a) => { const r = await api.getProduct(a.product_id); show({ view: 'product', productId: a.product_id }); return r },
  },
  {
    name: 'check_availability', description: 'Check live quantity and stock status of one variant.', readOnly: true,
    properties: { variant_id: int }, required: ['variant_id'],
    run: async (a) => { const r = await api.getVariant(a.variant_id); show({ view: 'product', productId: r.product_id }); return r },
  },
  {
    name: 'add_to_wishlist', description: 'Save a variant to the wishlist.',
    properties: { variant_id: int }, required: ['variant_id'],
    run: async (a) => { const r = await api.addToWishlist(a.variant_id); show({ view: 'wishlist' }); return r },
  },
  {
    name: 'remove_from_wishlist', description: 'Remove a variant from the wishlist.',
    properties: { variant_id: int }, required: ['variant_id'],
    run: async (a) => api.removeFromWishlist(a.variant_id),
  },
  { name: 'get_wishlist', description: 'List wishlist items with current stock.', readOnly: true, properties: {}, run: async () => api.getWishlist() },
  {
    name: 'notify_when_available',
    description: 'Register a "notify me" request for an OUT OF STOCK variant. This also flags the variant as high demand in inventory.',
    properties: { variant_id: int }, required: ['variant_id'],
    run: async (a) => api.notifyWhenAvailable(a.variant_id),
  },
  {
    name: 'get_inbox', description: 'Read the shopper\'s in-app notifications (bell icon): back-in-stock alerts, new products, order confirmations. Newest first.', readOnly: true, properties: {},
    run: async () => { show({ panel: 'inbox' }); return api.getInbox() },
  },
  { name: 'get_notifications', description: 'List the shopper\'s notify-me requests (not the inbox) and whether they are pending or fulfilled.', readOnly: true, properties: {}, run: async () => api.getNotifications() },
  {
    name: 'get_inventory',
    description: 'Inventory management view: every variant with quantity, status and demand. Use filter to focus.',
    readOnly: true,
    properties: { filter: { type: 'string', enum: ['all', 'needs_attention', 'out_of_stock', 'low_stock', 'high_demand'] } },
    run: async (a) => { show({ view: 'inventory' }); return api.getInventory(a) },
  },
  {
    name: 'restock_variant',
    description: 'Inventory manager action: add units to a variant using quantities the user provides. Fulfils waiting notify-me requests and sends an in-app notification (bell icon) to the shopper.',
    properties: { variant_id: int, quantity: { ...int, description: 'Units to add (1-10000)' } }, required: ['variant_id', 'quantity'],
    run: async (a) => api.restock(a.variant_id, a.quantity),
  },
  {
    name: 'add_product',
    description: 'Inventory manager action: create a brand-new product with its variants and opening stock, using details the user provides. Sends an in-app notification to the shopper.',
    properties: {
      name: str, category: { ...str, description: 'Existing category (Electronics, Fashion, Home & Kitchen, Beauty, Sports & Fitness, Books, Toys & Games, Grocery) or a new one' },
      description: str,
      image: { ...str, description: 'Optional photo URL (https://...)' },
      variants: {
        type: 'array', minItems: 1,
        items: { type: 'object', properties: { label: str, price: { type: 'number', description: 'Price in INR' }, quantity: { ...int, description: 'Opening stock' } }, required: ['label', 'price', 'quantity'] },
      },
    },
    required: ['name', 'category', 'variants'],
    run: async (a) => { const r = await api.addProduct(a); show({ view: 'product', productId: r.id }); return r },
  },
  {
    name: 'add_to_cart', description: 'Add units of an in-stock variant to the cart.',
    properties: { variant_id: int, quantity: int }, required: ['variant_id', 'quantity'],
    run: async (a) => { const r = await api.addToCart(a.variant_id, a.quantity); show({ view: 'cart' }); return r },
  },
  { name: 'get_cart', description: 'Show the cart with totals.', readOnly: true, properties: {}, run: async () => api.getCart() },
  {
    name: 'remove_from_cart', description: 'Remove a variant from the cart.',
    properties: { variant_id: int }, required: ['variant_id'],
    run: async (a) => api.removeFromCart(a.variant_id),
  },
  {
    name: 'place_order',
    description: 'Place the order for the current cart. ASK THE USER for every field first; never invent customer details. Fails if a field is missing or stock changed.',
    properties: {
      name: { ...str, description: 'Full name' }, email: str, phone: str,
      address: { ...str, description: 'Street address' }, city: str, postal_code: str,
    },
    required: ['name', 'email', 'phone', 'address', 'city', 'postal_code'],
    run: async (a) => { const r = await api.placeOrder(a); show({ view: 'orders', placed: r.id }); return r },
  },
  { name: 'get_orders', description: 'List placed orders, newest first.', readOnly: true, properties: {}, run: async () => { show({ view: 'orders' }); return api.getOrders() } },

  // ---- Session 4: AEO (get found, get chosen) ----
  {
    name: 'audit_aeo',
    description: 'Check how ready one listing is for AI answer engines. Returns a score out of 6 with the failing checks and the rules to pass, '
      + 'the competing listings it was compared with, Product information gaps per group, and a suggested fix drafted ONLY from facts '
      + 'already on the listing, plus questions for the seller. Never fill a gap with a guess: ask the seller. Read-only.',
    readOnly: true,
    properties: { product_id: int, question: { ...str, description: 'Optional buyer question the audit is for, e.g. "water bottle for a trek under 1500" (kept with the result for context)' } },
    required: ['product_id'],
    run: async (a) => { const r = await api.auditAeo(a.product_id, a.question); show({ view: 'product', productId: a.product_id, aiView: true }); return r },
  },
  {
    name: 'preview_aeo_update',
    description: 'Preview an update to a listing\'s AI-facing information WITHOUT saving it. ONLY use facts the user gave you; text naming a competing '
      + 'seller or listing is rejected. Returns the exact changes, new_facts (every fact added, changed or removed: the user confirms each came '
      + 'from the seller), warnings (unbacked numbers, SEO title or meta description too long), the score before and after, and a change_id. '
      + 'Show the user the changes, then apply with set_aeo_metadata using the same fields and the change_id.',
    readOnly: true,
    properties: aeoFields, required: ['product_id'],
    run: async (a) => { const r = await api.previewAeoUpdate(a.product_id, aeoChanges(a)); show({ view: 'product', productId: a.product_id, aiView: true }); return r },
  },
  {
    name: 'set_aeo_metadata',
    description: 'The only tool that writes catalog content. Applies an update previewed with preview_aeo_update after the user approved those exact '
      + 'changes: send the same fields, the preview\'s change_id and confirmed: true. A different change, or a listing changed since, is rejected. '
      + 'Returns the changes, warnings and the score before and after.',
    properties: {
      ...aeoFields,
      change_id: { ...str, description: 'change_id returned by preview_aeo_update for these exact changes' },
      confirmed: { type: 'boolean', description: 'true only after the user approved these exact changes' },
    },
    required: ['product_id', 'change_id', 'confirmed'],
    run: async (a) => {
      if (a.confirmed !== true) throw new Error('Show the user the exact changes from preview_aeo_update and get their approval first, then call again with confirmed: true.')
      const r = await api.setAeoMetadata(a.product_id, { change_id: a.change_id, ...aeoChanges(a) })
      show({ view: 'product', productId: a.product_id, aiView: true }); return r
    },
  },
]
