# ShopWave: website tools with WebMCP

The website below is a frontend-only demo. No database or API keys. The shop is one JSON
document (seeded from `shared/products.json`, then stored in your browser's `localStorage`).
The React UI and the WebMCP tools use the same `src/api.js`.

## Run the website

```bash
npm install
npm run dev
```

Opens http://localhost:5173 (Node 22.12+). The footer shows **WebMCP: N tools live** (12 tools) when your browser exposes `document.modelContext` or `navigator.modelContext`.

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
`shared/products.json`), so the laptop needs internet. If a photo fails to load, a neutral placeholder is shown.
To use your own, put files in `public/` and set `image` to `/yourfile.jpg`.

## Category themes

The store re-skins itself for what you browse: pick a category, or search for something (e.g. "yoga mat" gives the
Sport look, "kettle" gives Home). Each theme has its own colours, shapes, hero photo and announcement bar.
Themes live in `src/themes.js` and `[data-theme=...]` blocks in `src/style.css`.

## Where is my data? (localStorage)

Everything lives in your browser's `localStorage` under the key `shopwave:v2`, per origin (host **and** port).
It **survives reloads and browser restarts**. It resets when you click **Reset demo data** (footer), open the site
with `?reset` (e.g. `http://localhost:5173/?reset`), clear site data in DevTools, or use a private window.

## What is in the shop

Home with hero and category tiles, header search, product pages (`#/product/ID`, photo gallery), category,
availability and price filters, sort, variants with live quantity and status (`in_stock`, `low_stock` at 5 or
fewer, `out_of_stock`), a wishlist, a cart with quantity controls, a separate checkout form (name, email, phone,
address, city, postal code) and an order confirmation with an order list. Use **Reset demo data** (footer) to
restore the seed data.

## Demo script (say these to the agent, with the store open in its browser)

1. "Find wireless noise-cancelling headphones in black." The agent searches. The black one is **out of stock**.
2. "Which colour is available? Save it to my wishlist." The agent checks stock and saves the variant.
3. "Add 2 to my cart, then make it 3." `add_to_cart`, then `set_cart_quantity`; the cart page updates.
4. "Buy them." The agent must **ask you** for name, email, phone, address, city and postal code, then calls
   `place_order`. The order summary page opens.

## WebMCP tools

Discover: `search_products`, `get_product`, `check_availability`, `add_to_wishlist`, `remove_from_wishlist`, `get_wishlist`.
Cart: `add_to_cart`, `set_cart_quantity`, `get_cart`, `remove_from_cart`.
Buy: `place_order`, `get_orders`.

Tool definitions live in `shared/tools/definitions.js`. `shared/tools/handlers.js` calls the store rules.
`src/webmcp-tools.js` adds website navigation (so people can watch the agent work) and `src/webmcp.js`
registers the tools in the browser. There are no tools that edit products, stock or the catalog.

## WebMCP and ChatGPT: setup and troubleshooting

The page looks for `document.modelContext` (current spec) and falls back to `navigator.modelContext`
(older drafts), and keeps retrying for about 15 seconds in case the browser injects it late.
The footer pill shows what it found; hover it for details.

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
