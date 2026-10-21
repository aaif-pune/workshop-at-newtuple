// Shared tool catalog. Profiles deliberately preserve each interface's contract.
// Browser schemas remain JSON Schema; MCP schemas retain their Zod validation.
// Zod is injected only by the server, so the website does not bundle it.
export const toolDefinitions = {
  search_products: {
    web: {
      "description": "Search the ShopWave catalog. Returns products with variants, price, quantity and stock status (in_stock, low_stock, out_of_stock). All filters are optional.",
      "readOnly": true,
      "properties": {
        "query": {
          "type": "string",
          "description": "Free text, e.g. \"wireless headphones\""
        },
        "category": {
          "type": "string",
          "description": "One of: Electronics, Fashion, Home & Kitchen, Beauty, Sports & Fitness, Books, Toys & Games, Grocery"
        },
        "status": {
          "type": "string",
          "enum": [
            "in_stock",
            "low_stock",
            "out_of_stock"
          ],
          "description": "Only products having a variant in this status"
        },
        "min_price": {
          "type": "number"
        },
        "max_price": {
          "type": "number"
        },
        "sort": {
          "type": "string",
          "enum": [
            "relevance",
            "price_asc",
            "price_desc",
            "name"
          ]
        }
      }
    },
    mcp: { title: 'Browse products', description: 'Search or show all ShopWave demo products. Returns interactive product cards. Prices are INR. All filters are optional.', readOnly: true,
      schema: ({ z }) => ({
    query: z.string().optional(), category: z.string().optional(),
    status: z.enum(['in_stock', 'low_stock', 'out_of_stock']).optional(),
    min_price: z.number().nonnegative().optional(), max_price: z.number().nonnegative().optional(),
    sort: z.enum(['relevance', 'price_asc', 'price_desc', 'name']).optional(),
  }),
    },
  },
  get_product: {
    web: {
      "description": "Get one product with all its variants, specs and stock.",
      "readOnly": true,
      "properties": {
        "product_id": {
          "type": "integer"
        }
      },
      "required": [
        "product_id"
      ]
    },
    mcp: { title: 'Product details', description: 'Show product specifications and selectable variants.', readOnly: true,
      schema: ({ id }) => ({ product_id: id }),
    },
  },
  check_availability: {
    web: {
      "description": "Check live quantity and stock status of one variant.",
      "readOnly": true,
      "properties": {
        "variant_id": {
          "type": "integer"
        }
      },
      "required": [
        "variant_id"
      ]
    },
    mcp: { title: 'Check availability', description: 'Read current stock for a variant and show its product.', readOnly: true,
      schema: ({ id }) => ({ variant_id: id }),
    },
  },
  add_to_wishlist: {
    web: {
      "description": "Save a variant to the wishlist.",
      "properties": {
        "variant_id": {
          "type": "integer"
        }
      },
      "required": [
        "variant_id"
      ]
    },
    mcp: { title: 'Save product', description: 'Save a product variant to the demo wishlist.', readOnly: false,
      schema: ({ id }) => ({ variant_id: id }),
    },
  },
  remove_from_wishlist: {
    web: {
      "description": "Remove a variant from the wishlist.",
      "properties": {
        "variant_id": {
          "type": "integer"
        }
      },
      "required": [
        "variant_id"
      ]
    },
    mcp: { title: 'Remove saved product', description: 'Remove a variant from the demo wishlist.', readOnly: false,
      schema: ({ id }) => ({ variant_id: id }),
    },
  },
  get_wishlist: {
    web: {
      "description": "List wishlist items with current stock.",
      "readOnly": true,
      "properties": {}
    },
    mcp: { title: 'View wishlist', description: 'Show saved variants with current stock.', readOnly: true,
      schema: () => ({}),
    },
  },
  add_to_cart: {
    web: {
      "description": "Add units of an in-stock variant to the cart.",
      "properties": {
        "variant_id": {
          "type": "integer"
        },
        "quantity": {
          "type": "integer"
        }
      },
      "required": [
        "variant_id",
        "quantity"
      ]
    },
    mcp: { title: 'Add to cart', description: 'Add units of an available variant to the demo cart. Does not place an order.', readOnly: false,
      schema: ({ id, quantity }) => ({ variant_id: id, quantity }),
    },
  },
  set_cart_quantity: {
    web: {
      "description": "Set the total quantity of an item already in the cart. Zero removes the item.",
      "properties": {
        "variant_id": {
          "type": "integer"
        },
        "quantity": {
          "type": "integer",
          "description": "New total quantity (0 removes the item)"
        }
      },
      "required": [
        "variant_id",
        "quantity"
      ]
    },
    mcp: { title: 'Change quantity', description: 'Set the total quantity of an existing cart line. Zero removes the item.', readOnly: false,
      schema: ({ z, id, quantity }) => ({ variant_id: id, quantity: z.number().int().min(0).max(1000) }),
    },
  },
  get_cart: {
    web: {
      "description": "Show the cart with totals.",
      "readOnly": true,
      "properties": {}
    },
    mcp: { title: 'View cart', description: 'Show the current demo cart and server-calculated totals.', readOnly: true,
      schema: () => ({}),
    },
  },
  remove_from_cart: {
    web: {
      "description": "Remove a variant from the cart.",
      "properties": {
        "variant_id": {
          "type": "integer"
        }
      },
      "required": [
        "variant_id"
      ]
    },
    mcp: { title: 'Remove from cart', description: 'Remove a variant from the demo cart.', readOnly: false,
      schema: ({ id }) => ({ variant_id: id }),
    },
  },
  show_checkout: {
    mcp: { title: 'Checkout form', description: 'Open the demo checkout form for the current cart. No payment, shipment or email. Use sample details.', readOnly: true,
      schema: () => ({}),
    },
  },
  place_order: {
    web: {
      "description": "Place the order for the current cart. ASK THE USER for every field first; never invent customer details. Fails if a field is missing or stock changed.",
      "properties": {
        "name": {
          "type": "string",
          "description": "Full name"
        },
        "email": {
          "type": "string"
        },
        "phone": {
          "type": "string"
        },
        "address": {
          "type": "string",
          "description": "Street address"
        },
        "city": {
          "type": "string"
        },
        "postal_code": {
          "type": "string"
        }
      },
      "required": [
        "name",
        "email",
        "phone",
        "address",
        "city",
        "postal_code"
      ]
    },
    mcp: { title: 'Place demo order', description: 'Place a DEMO order after explicit user confirmation. Ask for missing customer fields; never invent them. Decreases demo stock and clears the cart. No payment, shipment or email.', readOnly: false,
      schema: ({ z, customer }) => ({ customer, confirmed: z.literal(true) }),
    },
  },
  get_orders: {
    web: {
      "description": "List placed orders, newest first.",
      "readOnly": true,
      "properties": {}
    },
    mcp: { title: 'Demo orders', description: 'Show demo order history without customer personal details.', readOnly: true,
      schema: () => ({}),
    },
  },
}

export const webToolDefinitions = Object.entries(toolDefinitions)
  .filter(([, definition]) => definition.web)
  .map(([name, definition]) => ({ name, ...definition.web }))

// Preserve the server's existing discovery order.
const mcpToolOrder = ["search_products","get_product","check_availability","get_cart","add_to_cart","set_cart_quantity","remove_from_cart","get_wishlist","add_to_wishlist","remove_from_wishlist","show_checkout","place_order","get_orders"]

export function createMcpToolDefinitions(z) {
  const id = z.number().int().positive()
  const quantity = z.number().int().min(1).max(1000)
  const customer = z.object({
    name: z.string().trim().min(1), email: z.string().trim().email(),
    phone: z.string().trim().min(7), address: z.string().trim().min(1),
    city: z.string().trim().min(1), postal_code: z.string().trim().min(1),
  })
  const context = { z, id, quantity, customer }
  return mcpToolOrder.map(name => {
    const { schema, ...metadata } = toolDefinitions[name].mcp
    return { name, ...metadata, inputSchema: schema(context) }
  })
}
