// Tool catalog for the website (WebMCP). Each entry is a browser JSON Schema profile:
// a description for the agent, input properties and a read-only flag.
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
  },
  get_wishlist: {
    web: {
      "description": "List wishlist items with current stock.",
      "readOnly": true,
      "properties": {}
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
  },
  get_cart: {
    web: {
      "description": "Show the cart with totals.",
      "readOnly": true,
      "properties": {}
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
  },
  get_orders: {
    web: {
      "description": "List placed orders, newest first.",
      "readOnly": true,
      "properties": {}
    },
  },
}

export const webToolDefinitions = Object.entries(toolDefinitions)
  .filter(([, definition]) => definition.web)
  .map(([name, definition]) => ({ name, ...definition.web }))
