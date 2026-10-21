# ShopWave MCP server and in-chat store

This branch brings the same sample catalog into an interactive conversation. The website uses WebMCP; the Node process exposes MCP tools and an MCP Apps UI. No model API key, database, authentication service, or payment integration is required by this code.

The agent can do what a shopper does: browse and filter, save to a wishlist, manage a cart, check out and read its order summary. The only tool that writes catalog data is `set_aeo_metadata` (answer-engine metadata, see the README). There are no tools that edit products or stock.

## Folder map

| Folder | Responsibility |
| --- | --- |
| `src/` | Website, reusable React widgets, WebMCP registration |
| `shared/` | Sample catalog, store rules, shared tool definitions and commerce handlers |
| `mcp-server/` | Node HTTP transport, validated MCP tools, in-memory demo state |
| `mcp-app/` | Embedded React store, standard host message bridge, local simulator |
| `workshop/` | This guide |

### How WebMCP and MCP Apps share tools

- `shared/tools/definitions.js` is the tool catalog. Each tool has browser and/or MCP metadata, including the MCP server's stricter Zod validation. Zod is supplied by the server, not bundled into the website.
- `shared/tools/handlers.js` maps tool arguments to the shared store operations. Both adapters use these handlers with their own store instance.
- `src/webmcp-tools.js` adds website navigation; `src/webmcp.js` registers the 13 browser tools.
- `mcp-server/actions.js` adds widget views, the confirmation check and customer-data redaction. `mcp-server/server.js` registers the 14 MCP tools and the UI resource using the shared catalog.

The browser uses localStorage; the MCP process uses memory shared by its connected hosts. Sharing code does not merge those stores. WebMCP checkout takes flat customer fields; MCP checkout requires `{ customer, confirmed: true }`. `show_checkout` exists only on the MCP side because it opens the checkout form in the chat.

| Stage | MCP tools |
| --- | --- |
| Discover | `search_products`, `get_product`, `check_availability`, `get_wishlist`, `add_to_wishlist`, `remove_from_wishlist` |
| Cart | `get_cart`, `add_to_cart`, `set_cart_quantity`, `remove_from_cart` |
| Buy | `show_checkout`, `place_order`, `get_orders` |
| Catalog content | `set_aeo_metadata` |

## Install

Use Node **22.12 or newer** (`nvm use` selects Node 22 if nvm is installed).

```sh
npm install
npm run build
```

## Rehearse the UI locally

```sh
npm run preview:mcp
```

Open `http://localhost:5173/mcp-app/preview.html`. The iframe contains the real embedded UI. Its parent simulates a chat host and uses the same store actions. Use the selector to simulate a new assistant tool result; click inside the widget to exercise `tools/call`.

This simulator is a development aid, not proof of real-host compatibility. It bypasses server-side Zod validation, so also try the real server.

For a static simulator:

```sh
npm run build:preview
```

Open `dist/mcp-preview/preview.html` in a browser that allows local HTML with a sibling iframe. External product photos still need internet; their component has a fallback.

## Start the real MCP server

```sh
npm run build:mcp
npm run start:mcp
```

- MCP endpoint: `http://127.0.0.1:3001/mcp`
- Health check: `http://127.0.0.1:3001/health`
- `npm run dev:mcp` builds the UI and starts Node in watch mode. After editing UI code, rerun this command to rebuild it.
- `MCP_PORT` overrides the default port; `MCP_HOST` overrides the loopback bind address.
- The stateless HTTP transport accepts MCP POST requests. GET streaming is not used.

The website is optional for this session. Run `npm run dev` separately if you want to compare it with the chat experience.

## Connect ChatGPT and Claude

### 1. Start the public tunnel

Keep `npm run start:mcp` running in its terminal. Open a second terminal and run:

```sh
ngrok http 3001
```

Ngrok will show a forwarding address similar to:

```text
https://your-domain.ngrok-free.app → http://localhost:3001
```

Replace the example domain everywhere below with the HTTPS address ngrok gives you. Keep both terminals open. If ngrok reports an account or authentication error, complete its account setup and configure its authtoken locally, then retry. Never paste that token into chats.

### 2. Check the connection

Open the public health URL in a browser:

```text
https://your-domain.ngrok-free.app/health
```

Expected response:

```json
{"ok":true,"name":"shopwave-demo"}
```

The connector URL uses **`/mcp`**, not `/health`:

```text
https://your-domain.ngrok-free.app/mcp
```

Opening `/mcp` directly in a browser may return "Stateless MCP accepts POST requests." That is expected. A health response proves reachability, not successful MCP discovery or UI rendering.

### 3. Connect ChatGPT

1. Open [ChatGPT Plugins](https://chatgpt.com/plugins).
2. Select **+ → Add custom MCP server**.
3. Name it **ShopWave Demo** and enter the public HTTPS `/mcp` URL.
4. Choose **no authentication** if prompted; this demo has no login service.
5. Review the connection notice, create the plugin, and install it.
6. Open a new conversation, type `@`, and select **ShopWave Demo**.
7. Send: "Use ShopWave Demo to show me all products using its interactive interface."

These steps follow the [official OpenAI connection guide](https://developers.openai.com/plugins/build/app-quickstart). Menus and access can vary by account or workspace. Refresh the connection after changing tool definitions or metadata.

### 4. Connect Claude

For an individual account with custom-connector access:

1. Open **Customize → Connectors**.
2. Select **+ Add → Add custom connector**.
3. Name it **ShopWave Demo** and enter the same public HTTPS `/mcp` URL.
4. Continue through the detected settings and select **No sign in** for authentication.
5. Finish adding the connector.
6. In a new conversation, use **+ → Connectors** to enable ShopWave Demo.
7. Send the same product-list prompt used in ChatGPT.

Organization accounts may require an owner to add the connector first. See [Claude's custom connector guide](https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp). The intended experience is an [interactive connector](https://support.claude.com/en/articles/13454812-use-interactive-connectors-in-claude), not a generated Artifact.

### 5. Exercise both connections

In each host, verify **View options → Add to cart → Checkout**. Use fictional customer details. If placing the demo order, also verify confirmation, cart clearing, stock reduction, and order history. Restart the Node process to reset between demonstrations.

If the tunnel URL changes, update or re-create the host connection with the new `/mcp` URL. Stopping Node or ngrok makes the remote connector unavailable.

### Follow-up prompts: do I need the name every time?

Usually no. Once ShopWave is selected and the conversation is clearly about the store, natural follow-ups such as "Only show Electronics," "Show my cart," or "Open checkout" work. Explicit naming is a routing hint, not a parameter our server needs. The host and model decide whether to call a tool, so a follow-up is not a guarantee of a call or widget display.

For a workshop, start with:

> Use ShopWave Demo for this shopping conversation. Use its tools for product, stock, cart and checkout requests, and show its interactive interface when available.

In a new chat, select the connection again. If the assistant answers generally, searches the web, or chooses another connector, reselect or explicitly name ShopWave. Clicking a widget button calls a named tool through the host and does not need another typed prompt; host permissions still apply.

Both hosts share **server-side demo state**, not conversation history or a user session. The same endpoint points at one in-memory shop. Separate widgets may need a fresh tool call to show changes made in another client.

Both hosts use the same MCP server and standard UI bridge. This implementation does not use `window.openai`. Tool calls return `structuredContent`, and each tool references `ui://shopwave/store.html`. The server provides a self-contained HTML resource. UI button calls travel through the host, not directly to a REST API.

## Demo script

1. "Use ShopWave to show me all products." Verify that product cards appear.
2. "Find products in Electronics under ₹5,000, cheapest first." Verify the filters and sort.
3. Open a product and select an in-stock variant. Save it, then add one unit to the cart.
4. Change the quantity and verify the server-calculated total.
5. "Show my checkout form." Fill it with fictional details such as `Demo Shopper`, `demo@example.com`, `9999999999`, `1 Demo Road`, `Pune`, `411001`.
6. Review the cart, check the confirmation box, and place the demo order.
7. Verify an order ID appears, the cart is empty, and stock has decreased.
8. Open Orders and confirm the summary appears.

Also test a search with no results, an out-of-stock variant, and an excessive requested quantity.

## State and scope

- One Node process is one shared demo shop. All clients connected to it share cart, wishlist, stock and orders.
- Restarting the process restores the seed. There is no persistence or per-user session isolation.
- To show independent shops in ChatGPT and Claude, run separate processes on different ports with separate tunnel URLs, or restart between demos.
- The website keeps its own browser localStorage. It does not synchronize with the Node shop.
- Orders are demo records only. No payment, shipment, or confirmation email is sent.
- Checkout form values are stored in server memory with the order, but omitted from tool response summaries and history. Use fictional data.
- The tunnel exposes an unauthenticated mutable demo. Share it only for the workshop and stop it afterward. It is not a production store.

## Before the event

- Run `npm install` and `npm run build` on a clean clone.
- Test the HTTPS endpoint, UI rendering and button interactions in BOTH actual host accounts.
- Check image loading; resource metadata allows `images.unsplash.com`.
- If the host shows text only, verify the connection exposes MCP Apps, refresh metadata, and check the `ui://` resource. Tool success alone does not prove UI support.
- If a widget is stale, request fresh data or reopen it. Separate widget instances do not receive push synchronization when another client changes the shop.
- Keep a completed copy of this branch and the local simulator ready as a fallback.

## Validation status

Not yet verified from this branch: rendering and button flows in real ChatGPT and Claude accounts. Do that rehearsal before the event.

## Troubleshooting: "Unknown tool" or a missing tool

A host can keep an older tool list for a connection. Refresh the ShopWave connection's tool metadata. If tools are still missing, remove and add the connection again with the same `/mcp` URL, then start a new conversation and select ShopWave. Restarting Node or clicking the same button again does not refresh the host's cached tool list. The widget explains these recovery steps for an unknown-tool error and never retries a mutation automatically.
