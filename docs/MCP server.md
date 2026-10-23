# MCP server and MCP App prompts

Paste these prompts into your coding agent **one at a time**, in the same chat and repository. Let it finish each stage and check the result before pasting the next. These prompts continue the [WebMCP exercise](webmcp_prompt.md): start with your working WebMCP storefront or the completed `webmcp` checkpoint. Keep the website working. If you switch branches, keep this page open; this guide is stored on `main`.

The goal is the structure and behavior of the finished `mcp-server` branch. Agents may format the code differently. Do not switch to that branch or copy its files while doing the exercise.

| Stage | What the agent builds | Checkpoint |
| --- | --- | --- |
| 1 | Shared MCP contracts and server actions | `search_products` returns a catalog view |
| 2 | Node MCP server and bundled UI resource | `/health` works and tools are discoverable |
| 3 | Interactive React MCP App | Product, wishlist and cart buttons work |
| 4 | Checkout and local preview | A confirmed demo order appears |

Use Node 22.12 or newer. Work in the repository root. If your coding agent asks to install the three MCP packages, allow it. This demo needs no database, model API key, payment service or separate REST API.

## Stage 1: Share the shop logic

```text
We finished WebMCP in this React ShopWave repo. Keep all website tools and
shopping behavior working. Build the shared MCP layer; do not add a database
or separate REST API, and do not copy the completed mcp-server branch.

1. Keep shared/store.js as the one source of catalog, stock, cart and order
   rules. Do not duplicate those rules in the MCP files.
2. Keep the existing WebMCP JSON Schema profiles in
   shared/tools/definitions.js. Add a separate `mcp` profile for each of the
   12 shopping tools. Export createMcpToolDefinitions(z), returning names,
   titles, descriptions, readOnly flags and Zod input schemas.
3. Add one MCP-only tool, show_checkout. The 13 MCP tools are:
   search_products, get_product, check_availability, get_cart, add_to_cart,
   set_cart_quantity, remove_from_cart, get_wishlist, add_to_wishlist,
   remove_from_wishlist, show_checkout, place_order, get_orders.
   IDs are positive integers. Add-to-cart quantity is 1..1000;
   set_cart_quantity allows 0..1000, where 0 removes the line. Search prices
   are nonnegative numbers. Search status is in_stock, low_stock or
   out_of_stock; sort is relevance, price_asc, price_desc or name.
   No-argument tools have empty schemas. Validate customer email and all
   required fields; confirmed is a Zod literal true.
4. Use shared/tools/handlers.js for store calls. Create
   mcp-server/actions.js with createDemoStore(), createActions(store), and
   toolResult(actions, name, args). createDemoStore uses a Map with
   getItem/setItem, passed to createStore; no database or browser globals.
5. Each action returns a view name plus the data for that view. Include
   categories, current cart and wishlist in each successful result. Use
   catalog, product, cart, wishlist, checkout, confirmation and orders views.
   toolResult returns text content AND structuredContent; errors return
   isError and readable text.
6. show_checkout must reject an empty cart. place_order must require
   `{ customer, confirmed: true }`; customer has name, email, phone,
   address, city, postal_code. Never return customer fields in the order
   result or get_orders. No payment, shipment or email.

Use Zod only on the MCP side. Keep the website's existing tool schemas and
behavior unchanged. Do not add inventory, alerts, product editing, reset or
comparison tools. Run the storefront build. Then call toolResult locally for
search_products and show me its view and product count.
```

**Expected:** `search_products` produces `view: "catalog"`; an empty cart makes `show_checkout` return a tool error. The website still builds.

## Stage 2: Expose the MCP server

```text
Continue from Stage 1. Add the remote MCP server and a minimal buildable UI
shell. Keep the 13 tools and existing website behavior. Use these exact paths:

- mcp-server/index.js: Node HTTP entry point.
- mcp-server/server.js: MCP tool and UI-resource registration.
- mcp-app/index.html and mcp-app/main.jsx: a minimal React shell for now.
- mcp-app/vite.config.js: build one self-contained HTML file at
  dist/mcp-app/index.html, with its script and CSS inlined.

Install @modelcontextprotocol/sdk 1.25.3, @modelcontextprotocol/ext-apps
1.1.2, and zod 4.1.13. In package.json set:
build:storefront = vite build
build:mcp = vite build --config mcp-app/vite.config.js
build = npm run build:storefront && npm run build:mcp
start:mcp = node mcp-server/index.js
dev:mcp = npm run build:mcp && node --watch mcp-server/index.js
Keep the existing dev and preview scripts.

In server.js, use McpServer plus registerAppTool and registerAppResource
from @modelcontextprotocol/ext-apps/server. Register the HTML resource at
ui://shopwave/store.html with RESOURCE_MIME_TYPE. Register every tool from
createMcpToolDefinitions(z). Give each tool `_meta.ui.resourceUri` pointing
to that resource. Pass tool calls to toolResult(actions, name, args). Mark
read-only tools with readOnlyHint; mark place_order destructive. Permit
https://images.unsplash.com in the UI resource's CSP for sample photos.

In index.js, read the built HTML and createActions() ONCE when Node starts.
Listen on 127.0.0.1:3001 by default. GET /health returns JSON with ok:true.
POST /mcp uses StreamableHTTPServerTransport with
sessionIdGenerator: undefined and enableJsonResponse: true. Create a new
transport and McpServer per request, but pass the same actions object so
ChatGPT and Claude share one demo cart. Reject other methods and browser
Origin requests. Close request-scoped transport/server objects on response
close. Do not add user sessions, authentication or a database.

Run npm run build:mcp and npm run start:mcp. Check /health and perform an MCP
tools/list request; verify that it returns the 13 names above. Do not infer
success from reading the source. Fix build or startup errors before stopping.
The UI may only show a placeholder at this stage.
```

**Expected:** `http://127.0.0.1:3001/health` returns `{"ok":true,"name":"shopwave-demo"}`. Opening `/mcp` in a browser can say that POST is required; that does not mean startup failed.

## Stage 3: Put the store inside the chat

```text
Continue from Stage 2. Replace the placeholder in mcp-app/main.jsx with
the interactive ShopWave React UI. Add mcp-app/bridge.js and mcp-app/style.css.
Reuse the existing components in src/widgets/ and their CSS. Do not create
another shop API or copy business rules into React.

The bridge is standard MCP Apps JSON-RPC over parent.postMessage, not
window.openai and not a direct fetch to /mcp. It must:
- send ui/initialize, then ui/notifications/initialized;
- receive ui/notifications/tool-result and pass structuredContent to React;
- send tools/call for button clicks and match replies by request ID;
- show host/tool errors, report size changes and clean up listeners/timers.

Render from structuredContent.view. Build these views:
- catalog: search/filter/sort and product cards; View options calls get_product;
- product: photo, specifications, variant selector, quantity, Add to cart,
  Save/Unsave;
- wishlist: saved variants and Add to cart/Remove;
- cart: rows, quantity controls, remove, server-calculated total.

Each button must call a named MCP tool through bridge.callTool. Keep prices,
stock and totals from server results. Show loading, empty and error states.
Add mcp-app/preview.html and mcp-app/preview.js as a local host simulator.
Its parent page answers ui/initialize, delivers an initial
ui/notifications/tool-result, routes tools/call to the SAME actions via
toolResult, and responds to size changes. Set preview:mcp in package.json
to `vite --host 127.0.0.1 --open /mcp-app/preview.html`. Build the app and
use this preview to verify View options, wishlist and cart. The preview
bypasses server-side Zod validation.
Do not add inventory, alerts, product editing, reset or comparison screens.
```

**Expected:** product cards appear when `search_products` returns, and clicks call `get_product`, `add_to_wishlist` or `add_to_cart` through the bridge.

## Stage 4: Checkout and rehearse

```text
Finish the same MCP App. Add a checkout view opened by show_checkout.
Show the current cart and total, then collect six fictional customer fields:
name, email, phone, address, city, postal_code. Require an explicit review
checkbox. Only then call place_order with
`{ customer: { name, email, phone, address, city, postal_code }, confirmed: true }`.
Do not invent customer details. No payment, shipment or email. On success,
show a confirmation view with the order ID and cleared cart. Add an Orders
view with summaries but no customer details. Keep server-side confirmation and
validation; the checkbox alone is not enough.

Run npm run build and fix failures. In the preview verify:
View options -> Add to cart -> Checkout -> confirmed demo order -> Orders.
Also try checkout with an empty cart and place_order without confirmation.
Add scripts/build-preview.mjs and a build:preview script to make a static
dist/mcp-preview/preview.html with the bundled app beside it.
Keep the working website unchanged. List files created and any remaining
differences from these requirements.
```

**Expected:** a confirmed order gets an ID, clears the cart and reduces stock. An unconfirmed order fails. Restarting Node resets its in-memory shop.

## Try it in ChatGPT and Claude

After the local checks, run `npm run build:mcp` and `npm run start:mcp`. In another terminal run `ngrok http 3001`. Add the HTTPS tunnel URL **with `/mcp` appended** as a custom MCP connection in each host. Keep both processes running. Use fictional customer details.

> Use ShopWave Demo to show me wireless headphones under ₹9,000 in its interactive interface. Let me choose a variant and add one to the cart.

Then open checkout, confirm a demo order and ask for recent orders. The two hosts use the same Node shop but have separate conversations. The website's browser storage is separate too. See the finished branch's `workshop/MCP-SETUP.md` if your presenter has shared it.

## Stuck? Paste this

```text
Fix only the current stage. Run its build/check, show me the FIRST failing
command and error, and make the smallest change that fixes it. Do not rewrite
working WebMCP tools or add features outside this prompt. Then rerun the
check and report what passed.
```

If the UI works in the preview but not in ChatGPT or Claude, check that the host discovered all 13 tools, the resource URI is `ui://shopwave/store.html`, the app was rebuilt before Node started, and the connection points to the current HTTPS `/mcp` URL. A new conversation or refreshed connection may be needed after changing tool metadata.

If you fall behind, compare with the completed `mcp-server` branch and rejoin the next demonstration. That checkpoint contains the finished implementation; these prompts aim for the same files and behavior rather than identical formatting.
