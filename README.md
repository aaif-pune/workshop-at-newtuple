# ShopWave: a storefront an AI agent can operate (WebMCP)

Frontend-only demo. No backend, no database, no API keys. The shop is one JSON
document (seeded from `src/data/products.json`, then stored in your browser's
`localStorage`). The React UI and the WebMCP tools use the same `src/api.js`.

## Run

```bash
npm install
npm run dev
```

Opens http://localhost:5173 (Node 22+). A small pill (bottom-left) shows **WebMCP: N tools live** when your browser exposes `document.modelContext`.

## Component library (widgets)

Everything on screen is built from small widgets in `src/widgets/` that only take props and never touch the store,
so any of them can show any data: `Card`, `CardGrid`, `Hero`, `Carousel`, `TileRow`, `DataTable`, `FilterPanel`,
`ListRow`, `Stat`, `Stepper`, `Badge`, `Photo`, `SectionHeader`, `NotificationList`.
Open **Component library** in the footer (`#/widgets`) to see them with recipe, task and event data instead of products,
each with a code snippet. Example:

```jsx
import { Card, CardGrid } from './widgets'
<CardGrid min={220}>{recipes.map((r) => <Card key={r.id} image={r.img} title={r.name} price={r.time + ' min'} />)}</CardGrid>
```

The store's product card (`src/views/ProductCard.jsx`) is just `<Card>` filled with product data.

## Photos

Product photos are free-to-use [Unsplash](https://unsplash.com) images, loaded by URL (`image` field in
`src/data/products.json`), so the laptop needs internet. If a photo fails to load, a neutral placeholder is shown.
To use your own, put files in `public/` and set `image` to `/yourfile.jpg`. New products added by the agent can pass an `image` URL too.

## Category themes

The store re-skins itself for what you browse: pick a category, or search for something (e.g. "yoga mat" gives the
Sport look, "kettle" gives Home). Each theme has its own colours, shapes, hero photo and announcement bar. Agent searches
trigger the same change. Themes live in `src/themes.js` and `[data-theme=...]` blocks in `src/style.css`.

## Where is my data? (localStorage)

Everything lives in your browser's `localStorage` under the key `shopwave:v3`, per origin (host **and** port).
It **survives reloads and browser restarts**. It resets when you click **Reset demo data** (footer), open the site
with `?reset` (e.g. `http://localhost:5173/?reset`), clear site data in DevTools, or use a private window.

## What is in the shop

Home with hero and category tiles, header search, product pages (`#/product/ID`), cart, separate checkout, order confirmation, category / availability / price filters, sort, variants with live quantity and
status (`in_stock`, `low_stock` at 5 or fewer, `out_of_stock`), wishlist, cart, checkout form
(name, email, phone, address, city, postal code), orders, and an **Inventory** tab with
restock and add product (footer link → `#/admin`). Use **Reset demo data** (footer) to restore the seed data.

## Demo script (say these to the agent, with the store open in its browser)

1. "Find wireless noise-cancelling headphones in black." → agent searches; it is **out of stock**.
2. "Notify me when it is back." → `notify_when_available`; Inventory now shows 🔥 **High demand**.
3. "Check inventory for high-demand items and add 20 units of the black headphones." → `restock_variant`;
   a **Back in stock** notification slides in and lands in the bell menu (header), and the request is fulfilled.
4. "Check it again." → now in stock. "Wishlist it" or "I want 2." → `add_to_wishlist` / `add_to_cart`.
5. "Add a new product: Smart Water Bottle, Electronics, 500 ml variant at ₹1,299, 7 units." → `add_product`; a **New product added** notification appears.
6. "Place the order." → agent must **ask you** for name, email, phone, address, city, postal code, then `place_order`.

## Layout: shop vs. agent add-ons

- `src/`: the shop. It knows nothing about MCP or agents.
- `agent/tools.js`: the tool definitions (the file to edit in the lab), shared by every agent add-on. `createTools(api, show)` takes the shop api and an optional UI-steering function, so the same tools can run in the browser or in a Node MCP server.
- `agent/webmcp/`: registers the tools with the browser and shows the status pill. Hooked in by one line in `src/main.jsx`.
- `agent/mcp-server/`: the same tools as a stdio (or HTTP) MCP server, with an MCP Apps view built from `src/widgets/` (see below). Own `package.json`; the shop never imports it.

**Plain shop, no agent:** delete `agent/` and the `import '../agent/webmcp'` line in `src/main.jsx`.

## WebMCP tools (`agent/tools.js`)

`search_products`, `get_product`, `check_availability`, `add_to_wishlist`, `remove_from_wishlist`,
`get_wishlist`, `notify_when_available`, `get_notifications`, `get_inbox`, `get_inventory`, `restock_variant`, `add_product`,
`add_to_cart`, `get_cart`, `remove_from_cart`, `place_order`, `get_orders`,
and for Session 4 `audit_aeo`, `preview_aeo_update`, `set_aeo_metadata` (see below).

Each tool is `{ name, description, properties, run }`. `run` calls `api.*`. Several tools also
switch the visible tab so the audience sees what the agent is doing.

## WebMCP and ChatGPT: setup and troubleshooting

The page looks for `document.modelContext` (current spec) and falls back to `navigator.modelContext`
(older drafts), and keeps retrying for about 15 seconds in case the browser injects it late.
The bottom-left pill shows what it found; hover it for details.

- **Pill says "N tools live"**: the browser accepted the tools. Prompt the agent normally.
- **Pill says "not detected"**: this browser does not expose WebMCP to the page. Open DevTools and run
  `console.log(document.modelContext, navigator.modelContext)`. Both `undefined` means the browser (or your account)
  does not have WebMCP on.
- **Agent uses the visible UI instead of tools**: normal fallback when no tools are registered. Tell it:
  "Use this site's tools, do not click through the page."
- Reported requirements for ChatGPT "site tools" (verify in OpenAI's release notes): the ChatGPT **desktop app's
  built-in browser**, a supported model (GPT-5.6 Sol or Terra, not Luna), not an Enterprise/Edu workspace, and gradual rollout per account.
- Plain Chrome: enable `chrome://flags/#enable-webmcp-testing`, relaunch, then check the console command above.
- No WebMCP at all? Test any tool from DevTools: `await storefrontTools.search_products({ query: "headphones" })`.

## Other

- Data lives per browser profile and per origin. Open the same `localhost` URL in the agent's browser and your own, and they are separate shops.
- Data is not shared between different ports or browsers.

## MCP server (`agent/mcp-server/`)

Same 20 tools as WebMCP, served over stdio to any MCP client (Claude Desktop, Claude Code, VS Code, ChatGPT apps...),
or over HTTP with `npm run start:http` for remote hosts (see "Remote hosts" below).
`search_products`, `get_product`, `get_cart`, `add_to_cart`, `remove_from_cart`, `get_inventory`, `get_orders` and the three
AEO tools also return an interactive view (MCP Apps) drawn with the shop's widgets; its Add to cart / Notify me / Remove /
Approve and apply buttons call tools back.

```bash
cd agent/mcp-server
npm install
npm run build   # bundles the view (needs the root npm install too: it reuses the shop's vite, react, widgets)
```

Client config (use absolute paths):

```json
{ "mcpServers": { "shopwave": {
  "command": "/ABS/PATH/agent/mcp-server/node_modules/.bin/tsx",
  "args": ["/ABS/PATH/agent/mcp-server/server.js"]
} } }
```

Claude Code: `claude mcp add shopwave -- /ABS/PATH/agent/mcp-server/node_modules/.bin/tsx /ABS/PATH/agent/mcp-server/server.js`

Its data is in `agent/mcp-server/shop-data.json` (created on first change; `npm run reset` deletes it). It is **not** the browser
shop's data: the browser keeps its own copy in localStorage. After updating the seed (e.g. to this Session 4 version),
run `npm run reset` once so the server does not keep an older copy.

### Remote hosts: claude.ai and ChatGPT (HTTP)

```bash
cd agent/mcp-server
npm run start:http   # http://127.0.0.1:3001/mcp, health check at /health (PORT=… to change)
ngrok http 3001      # second terminal; use https://<your-ngrok-domain>/mcp
```

- **Claude:** Customize → Connectors → Add custom connector → the `/mcp` URL, **No sign-in**. Then turn it on in a new chat (+ → Connectors).
- **ChatGPT:** Settings → Plugins → Add → custom MCP server → the `/mcp` URL, authentication **None**, then **Connect**. Start a Work chat and pick it with `@`.
- After changing tools, disconnect and reconnect (or refresh) the connector so the host reloads the tool list.
- The endpoint has no authentication: share the tunnel URL only for the workshop and stop ngrok afterwards.

## Session 4: AEO (get found, get chosen)

A buyer asks an AI which water bottle to buy for a trek; it picks a rival. We audit our listing, add the seller's
facts with a person approving the exact change, ask again, and the AI picks our bottle. The step-by-step run sheet with
prompts is the Session 4 guide (shared separately).

What it adds:

- **Data** (`src/data/products.json`): a `seller` and `kind` on products, five rival water bottles (#28-#32), and AEO fields
  on a product's `aeo` object: `summary` ("In short"), `faqs`, `keywords`, `best_for`, `about` ("About this item"),
  `seo_title`, `meta_description`. Our bottle #21 starts thin.
- **Logic** (`src/services/aeo.js`, pure functions): a six-check audit with must-have facts per kind of product
  (`KEY_SPECS`), Product information gaps, a fix drafted only from existing facts, previews with a `change_id`,
  and schema.org Product/Offer/FAQPage JSON-LD. Search also matches the AEO text and ranks by relevance.
- **Tools** (`agent/tools.js`, for WebMCP and the MCP server):
  - `audit_aeo` (read-only): score out of 6, rules, gaps, rivals compared and questions for the seller.
  - `preview_aeo_update` (read-only): exact changes, new facts to confirm, warnings and a `change_id`. Rejects naming a rival.
  - `set_aeo_metadata`: applies exactly the approved preview (`change_id` and `confirmed: true`), once. FAQs are added
    by default (`faqs_mode: "replace"` rewrites them); an empty spec value removes a fact.
- **Shop**: a Human view / AI view toggle on product pages (`#/product/21?view=ai`), "In short", "About this item",
  grouped Product information and FAQs, plus JSON-LD (`#ld-json`), the SEO title and the meta description in the page head.
- **MCP App**: the audit scorecard, and the preview with **Approve and apply**.

Check it:

1. `http://localhost:5173/?reset#/product/21?view=ai` shows 0/6.
2. Reset between rehearsals: `?reset` on the shop, `npm run reset` (then restart) for the MCP server.

The shop's own search stands in for an answer engine, and JSON-LD added by JavaScript is invisible to crawlers that read
raw HTML (render it on the server in production). Publish true facts about your own product, never claims about competitors.
