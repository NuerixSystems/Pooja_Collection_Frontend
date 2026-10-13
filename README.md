# Pooja Collection storefront

Customer-facing fashion jewellery storefront. React 19 + React Router 7 + Vite, with a FastAPI + PostgreSQL
backend in [`backend/`](backend/README.md) (catalogue, orders, customer accounts).

The frontend needs the backend: `VITE_CRM_API_URL` must point at it (categories, products, images and orders all come from there).

```bash
# terminal 1: backend  (see backend/README.md for first-time setup)
cd backend && uvicorn app.main:app --reload --port 8000
# terminal 2: frontend (npm run dev uses http://localhost:8000 via .env.development)
npm run dev
```

## Commands

```bash
npm install
npm run dev          # local dev server
npm test             # run the test suite once (Vitest + Testing Library)
npm run test:watch   # re-run tests on change
npm run build        # production build into dist/
npm run preview      # serve dist/ locally (includes SPA fallback)
```

Environment variables (see `.env.example`): `VITE_TENANT_ID` and `VITE_CRM_API_URL` (backend base URL, e.g. `http://localhost:8000`).
`npm run dev` reads `.env.development`, which points at the local backend; tests and production builds do not.
For a deployed build, set `VITE_CRM_API_URL` to your backend's public URL.

## Project layout

```
src/
  App.jsx               routes + page-level error boundary
  main.jsx              providers + top-level error boundary
  components/           header, panels, product card, quantity stepper, CatalogGate (loads the catalogue), error boundary
  pages/                Home, Shop, CategoryPage, ProductPage, Cart, Checkout, OrderSuccess, ...
  context/              StoreContext (cart + wishlist), cartReducer (pure logic), UIContext (open panel)
  services/catalog.js   the only place components read catalogue data (loaded from the backend)
  services/orders.js    order placement (backend POST /api/orders)
  services/api.js       fetch wrapper for the backend; auth.js / session.js = customer login
  utils/checkout.js     checkout fields, validation, Indian mobile normalisation
```

There is no bundled catalogue and no image files in this project: **categories, products and images all come from the backend.**

## Catalogue data

`GET /api/catalog` (served from the database) returns `{ categories, products }`; every category and product carries an
`image` path such as `/media/products/<slug>.webp`, which the storefront resolves against `VITE_CRM_API_URL`.
`CatalogGate` (wrapping the app in `main.jsx`) loads it before anything renders; if the backend can't be reached the
shopper sees a "Try again" screen instead of stale data. Components never fetch it themselves, they use `services/catalog.js`.
Tests feed the same shape in through `setCatalog()` (`src/test/fixtures.js`).

To change what the shop sells, edit `backend/data/catalog.json`, put the pictures in `backend/media/`, and run
`python -m app.seed` (see the backend README). Nothing changes in the frontend.

- **Dresses is excluded** by `EXCLUDED_CATEGORY_SLUGS` in `src/config/index.js`, regardless of what the backend returns.
- **Product URLs use the slug** (`/product/<slug>`).
- **Customer-facing wording.** The backend seed refuses names, descriptions or tags containing supplier/platform names
  or unverified brand claims (`BLOCKED_TERMS` in `backend/app/seed.py`), and the storefront tests check every visible field.

### Designs (variants)

A product only offers a design choice when the backend lists designs for it explicitly (seed file or admin API):

```json
{ "id": "silver-bow-ring-with-stones", "...": "...",
  "designs": [{ "id": "bow", "label": "Bow" }, { "id": "leaf", "label": "Leaf" }] }
```

When `designs` is present, the product page requires one to be chosen before adding to cart, cards link to the
product page instead of adding directly, and cart lines, checkout and the saved order carry the chosen design.
**Only list designs the shop has confirmed are available.** The storefront has no per-design stock, and design names
should never be inferred from description text.

Currently **no product has a `designs` list**, because the sheet only says things like "multiple designs" without naming them.
See "Known gaps" below.

## Cart, checkout and orders

- **Quantity guard.** Each cart line is limited to `CART.maxQtyPerLine` (10, in `src/config/index.js`). The stepper disables
  `+` at the limit and the store refuses to go past it. **This is a UI convenience only, not stock validation.**
  The storefront has no stock data. The backend re-checks product, design, price and quantity on every order and
  recomputes the total; client-sent prices are ignored. (It still has no stock counts.)
- **Mobile numbers.** Accepts 10-digit Indian mobiles starting 6-9, with optional `+91` (or `91`), and spaces or hyphens
  (`+91 98765 43210`). The normalised 10-digit number is validated and stored.
- **Validation focus.** A failed submit focuses the first invalid field in on-screen order, after the error state renders.
- **Orders.** Checkout posts to `POST /api/orders` and shows the server's order (errors such as
  "no longer available" are shown on the checkout page; a retry after a dropped connection can't double-order).
  There is no browser-only demo mode any more. The confirmation page reads a copy of the server's order cached on this device.
- **Still stored in the browser:** the cart and wishlist, the login token, and that confirmation copy (`localStorage`).
  The catalogue is never stored in the browser.

## Error handling

`ErrorBoundary` wraps the whole app (`main.jsx`) and, separately, the routed page area (`App.jsx`). A crash on one page
shows a recovery message while the header, menu and cart stay usable, and navigating to another page clears the error.
It logs to `console.error`, which is the place to hook in error reporting later.

## Deploying: single-page-app rewrites

This is a client-side routed SPA. Routes such as `/product/bracelet-watch-set`, `/category/rings` and `/checkout`
exist only in the browser, so the host **must serve `index.html` for any path that isn't a real file**. Without that rule,
opening or refreshing a deep link returns a 404 (the home page still works, which makes it easy to miss).

Serve the contents of `dist/` and add the rule for your host:

**Netlify / Cloudflare Pages** (the rule below is already in `public/_redirects`, and Vite copies it to `dist/`; this is the project's assumed host, since none is configured yet):
```
/*    /index.html   200
```
(Cloudflare Pages already treats a build with no top-level `404.html` as an SPA, but the rule above is harmless.)

**Vercel**: `vercel.json`
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

**Nginx**
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

**Apache** (`.htaccess` in the web root)
```apache
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

**Firebase Hosting**: `firebase.json`
```json
{ "hosting": { "public": "dist", "rewrites": [{ "source": "**", "destination": "/index.html" }] } }
```

**S3 + CloudFront**: set the distribution's custom error responses for 403 and 404 to return `/index.html` with status 200.

**GitHub Pages** has no rewrite support. Use a host above, or copy `index.html` to `404.html` (works, but the
response status is 404, which is poor for SEO).

The app is served from the domain root. If you deploy under a sub-path, set `base` in `vite.config.js` and a
matching `basename` on `BrowserRouter`.

**Check after every deploy:** open `/product/gold-tulip-rings-3-set` directly in a fresh tab and refresh it. It should load, not 404.

## Known gaps

- **No design lists.** No product lists selectable designs yet. Add them through the admin API (see backend README) and the
  required-selection flow switches on automatically.
- **No stock counts.** The backend validates price/design/quantity but doesn't track inventory.
- **No payment step.** Orders are placed as "Placed" and handled by the shop (no online payment yet).
- **One product per category.** The catalogue is deliberately trimmed to 7 products, one in each of the 7 categories.
#   P o o j a _ C o l l e c t i o n _ F r o n t e n d  
 