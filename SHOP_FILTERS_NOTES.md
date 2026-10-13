# Shop filters (Part 1)

- Filters, sorting and counts run in memory on the catalogue loaded from `GET /api/catalog`; no extra API calls.
- URL params: `category` (repeatable), `minPrice`, `maxPrice`, `sort` (`price-asc` | `price-desc`), plus existing `q` and `collection`.
- **Availability filter is intentionally not shown** (details: `backend/STOCK_SCHEMA_NOTES.md`). `ProductOut` / `Product` expose no stock field. `backend/migrations/001_add_product_stock.sql`
  and `backend/tests/test_stock.py` refer to `pc_products.stock_qty`, but `models.py`, `schemas.py` and `routers/catalog.py` do not include it,
  and that migration sets existing products to 0 (sold out). Add the field to the model/schema/API and load real quantities first.
- **"Newest first" is not shown**: products have no creation date. "Featured" is the store's existing catalogue order.
