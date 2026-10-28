import { useCallback, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import CategoryChips from '../components/CategoryChips';
import Panel from '../components/Panel';
import ProductGrid from '../components/ProductGrid';
import ShopFilters from '../components/ShopFilters';
import { getCategories, getPriceBounds, getProducts } from '../services/catalog';
import { RESET_PATCH, SORT_OPTIONS, countActiveFilters, parseShopFilters, withFilters } from '../utils/shopFilters';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useMediaQuery } from '../hooks/useMediaQuery';
import './Shop.css';

const TITLES = { new: 'New arrivals', best: 'Best sellers' };

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const isDesktop = useMediaQuery('(min-width: 901px)');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [draft, setDraft] = useState(null); // drawer-only: filters being edited before Apply

  const bounds = useMemo(() => getPriceBounds(), []);
  const filters = useMemo(() => parseShopFilters(params, bounds), [params, bounds]);
  const { query, collection, sort } = filters;

  const title = query ? `Results for “${query}”` : TITLES[collection] || 'Shop all';
  useDocumentTitle(title);

  // Everything is filtered in memory from the already-loaded catalogue, so changing a filter makes no API request.
  const products = useMemo(
    () => getProducts({ query, collection, sort, categorySlugs: filters.categories, minPrice: filters.minPrice ?? undefined, maxPrice: filters.maxPrice ?? undefined }),
    [query, collection, sort, filters.categories, filters.minPrice, filters.maxPrice],
  );
  // Category counts reflect the current search / collection, so a count never promises products that would not show.
  const categoryOptions = useMemo(() => {
    const base = getProducts({ query, collection, minPrice: filters.minPrice ?? undefined, maxPrice: filters.maxPrice ?? undefined });
    const counts = {};
    base.forEach((p) => { counts[p.categorySlug] = (counts[p.categorySlug] || 0) + 1; });
    return getCategories()
      .map((c) => ({ slug: c.slug, name: c.name, shown: counts[c.slug] || 0 }))
      .filter((c) => c.shown > 0 || filters.categories.includes(c.slug));
  }, [query, collection, filters.minPrice, filters.maxPrice, filters.categories]);

  const apply = useCallback((patch) => setParams((prev) => withFilters(prev, patch), { replace: true }), [setParams]);

  const activeCount = countActiveFilters(filters);
  const total = useMemo(() => getProducts({ query, collection }).length, [query, collection]);
  const countText = activeCount ? `Showing ${products.length} of ${total} ${total === 1 ? 'product' : 'products'}` : `${products.length} ${products.length === 1 ? 'product' : 'products'}`;

  const openDrawer = () => { setDraft({ categories: filters.categories, minPrice: filters.minPrice, maxPrice: filters.maxPrice }); setDrawerOpen(true); };
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const applyDraft = () => { apply({ categories: draft.categories, minPrice: draft.minPrice, maxPrice: draft.maxPrice }); setDrawerOpen(false); };
  const resetDraft = () => setDraft({ categories: [], minPrice: null, maxPrice: null });

  const filterControls = (value, onChange, idPrefix) => (
    <ShopFilters value={value} onChange={onChange} bounds={bounds} categories={categoryOptions} idPrefix={idPrefix} />
  );
  const hasFilterUi = Boolean(bounds && bounds.min < bounds.max) || categoryOptions.length > 0;

  const empty = activeCount ? (
    <div className="empty">
      <h2>No products match your filters</h2>
      <p>Try widening the price range or removing a category.</p>
      <button type="button" className="btn" onClick={() => apply(RESET_PATCH)}>Reset filters</button>
    </div>
  ) : (
    <div className="empty"><h2>No products found</h2><p>Try a different search or browse a category.</p><Link to="/" className="btn">Browse categories</Link></div>
  );

  return (
    <div className="container shop-page">
      <section className="section">
        <div className="section-head">
          <h1 className="section-title">{title}</h1>
          <label className="sort">
            <span className="visually-hidden">Sort by</span>
            <select value={sort} onChange={(e) => apply({ sort: e.target.value })}>
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
        </div>
        <CategoryChips />

        <div className="shop-layout">
          {isDesktop && hasFilterUi && (
            <aside className="shop-sidebar" aria-label="Product filters">
              <div className="shop-sidebar__head">
                <h2>Filters</h2>
                {activeCount > 0 && <button type="button" className="filter-clear" onClick={() => apply(RESET_PATCH)}>Clear all</button>}
              </div>
              {filterControls(filters, apply, 'filters')}
            </aside>
          )}

          <div className="shop-results">
            <div className="shop-toolbar">
              {!isDesktop && hasFilterUi && (
                <button type="button" className="btn btn--ghost filters-btn" onClick={openDrawer} aria-haspopup="dialog">
                  Filters{activeCount > 0 && <span className="filters-btn__badge">{activeCount}</span>}
                </button>
              )}
              <p className="shop-count" role="status" aria-live="polite">{countText}</p>
              {activeCount > 0 && !isDesktop && <button type="button" className="filter-clear" onClick={() => apply(RESET_PATCH)}>Clear all</button>}
            </div>
            <ProductGrid products={products} variant="shop" empty={empty} />
          </div>
        </div>
      </section>

      {!isDesktop && draft && (
        <Panel open={drawerOpen} onClose={closeDrawer} side="left" label="Filters">
          <div className="shop-sidebar__head"><h2>Filters</h2></div>
          {filterControls(draft, (patch) => setDraft((d) => ({ ...d, ...patch })), 'drawer')}
          <div className="filter-actions">
            <button type="button" className="btn btn--ghost" onClick={resetDraft}>Reset</button>
            <button type="button" className="btn" onClick={applyDraft}>Apply</button>
          </div>
        </Panel>
      )}
    </div>
  );
}
