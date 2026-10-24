# WebMCP prompts

Three short prompts, one per stage. Paste them into your coding agent (Claude, ChatGPT, or any open-source agent) one at a time, in this repo. Run the build and test each stage before you move to the next.

| Stage | Shopper step | Tools you add | Total |
| --- | --- | --- | --- |
| 1. Discover | Find a product | `search_products`, `get_product`, `check_availability` | 3 |
| 2. Decide | Save it, put it in the cart | wishlist (3) and cart (4) tools | 10 |
| 3. Buy | Order it, see the summary | `place_order`, `get_orders` | 12 |

## Stage 1: Discover

```text
This is a React storefront. Shop logic is in src/api.js.
Add src/webmcp.js, started from src/App.jsx, and register three read-only
WebMCP tools using api.js:
- search_products: query, category, status, min_price, max_price, sort.
  The query should search all of a product's details, not just its name:
  name, category, description, specs, FAQ questions and answers, and
  variant labels and SKUs. Ignore upper/lower case. A shopper asking for
  "noise cancelling" or "40 hour battery" should find products that only
  mention it in specs or FAQ.
- get_product: product_id
- check_availability: variant_id

Show results on the site (search opens the home page with those filters,
get_product opens the product page). Use document.modelContext, falling back
to navigator.modelContext, and add window.storefrontTools for console testing.
No other tools yet. Run the build and tell me how to test.
```

**Try it in ChatGPT:**

> Find wireless headphones under ₹9,000 and show me the details of the best one that's in stock.

## Stage 2: Decide

```text
Extend src/webmcp.js and keep the existing tools. Add seven tools using
api.js, all on a variant_id:

- get_wishlist (read-only), add_to_wishlist, remove_from_wishlist
- get_cart (read-only), add_to_cart (variant_id, quantity),
  set_cart_quantity (variant_id, quantity; 0 removes), remove_from_cart

Mark the read-only ones as read-only. Return the store's errors (out of stock,
only N left) to the agent as plain text. Open the cart or wishlist page after
a successful call, never after a failure. Add them to window.storefrontTools.
No checkout yet.
```

**Try it in ChatGPT:**

> Save the blue ones to my wishlist, add 2 to my cart, then make it 3. Is the black one available?

## Stage 3: Buy

```text
Extend src/webmcp.js and keep the existing tools. Add two tools using api.js:

- place_order: name, email, phone, address, city, postal_code (all required)
- get_orders: read-only order summary

The place_order description must tell the agent to ask the user for every
field, never invent details, and confirm the cart and total first. Return the
store's errors as text. After a successful order, open the orders page.
Add both to window.storefrontTools. No payment or email.
```

**Try it in ChatGPT:**

> Buy what's in my cart. Ask me for my delivery details first. Then show my order.

## Stuck? Try these in order

### Level 1: the fix-it prompt (any stage)

```text
My src/webmcp.js doesn't work. Run the build, check the browser console,
tell me the first error, and fix only that. Don't rewrite working tools.
```

### Level 2: match what you see

| What you see | Paste this |
| --- | --- |
| A tool errors or does nothing | `Call storefrontTools.search_products({ query: "headphones" }) in the console and fix whatever fails.` Use your own tool name. |
| The tool works but the website doesn't change | `The tool runs but the page doesn't follow it. Make it open the right page after a successful call.` |
| The footer says "WebMCP: not detected" | `Check that document.modelContext or navigator.modelContext exists and that registration runs on page load.` If neither exists, your browser has no WebMCP. Keep testing from the console with `storefrontTools`. |
| ChatGPT ignores the tools | `Make each tool description say plainly when to use it.` Also check that you are in the ChatGPT desktop app's built-in browser, not Chrome. |
| The build fails after an agent edit | `Undo your last change and try a smaller one.` |

### Level 3: catch up

- Pair up: one person drives, one reads.
- Compare with the finished `webmcp` branch.
- Watch the presenter's screen and rejoin at the next stage.

Stuck for more than 3 minutes? Paste the fix-it prompt. If that doesn't help, share the exact error with the presenter.
