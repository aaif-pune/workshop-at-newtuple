# ShopWave: a storefront for agentic commerce

The website below is a frontend-only demo. No database or API keys. The shop is one JSON
document (seeded from `shared/products.json`, then stored in your browser's `localStorage`).
The React UI reads and writes it through `src/api.js`, which wraps the business rules in `shared/store.js`.

This is the starting point of the workshop: a working shop that people use by hand. Agents get their own
ways in later, one session at a time.

## Run the website

```bash
npm install
npm run dev
```

Opens http://localhost:5173 (Node 22.12+).

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

## Other

- Data lives per browser profile and per origin. Open the same `localhost` URL in two browsers and they are separate shops.
- Data is not shared between different ports or browsers.
