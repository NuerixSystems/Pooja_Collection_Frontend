import PriceRangeFilter from './PriceRangeFilter';
import './ShopFilters.css';

// Filter controls shared by the desktop sidebar (changes apply live) and the mobile drawer (changes are held
// in a draft until Apply). `value` is { categories, minPrice, maxPrice }; `onChange` receives a partial patch.
// Availability is intentionally absent: the catalogue API exposes no stock data (see the README note).
export default function ShopFilters({ value, onChange, bounds, categories, idPrefix = 'filters' }) {
  const toggleCategory = (slug) => {
    const has = value.categories.includes(slug);
    onChange({ categories: has ? value.categories.filter((s) => s !== slug) : [...value.categories, slug] });
  };

  return (
    <div className="shop-filters">
      {bounds && bounds.min < bounds.max && (
        <details className="filter-group" open>
          <summary>Price</summary>
          <PriceRangeFilter
            bounds={bounds}
            value={{ min: value.minPrice, max: value.maxPrice }}
            onChange={({ min, max }) => onChange({ minPrice: min, maxPrice: max })}
          />
        </details>
      )}

      {categories.length > 0 && (
        <details className="filter-group" open>
          <summary>Category</summary>
          <ul className="filter-list">
            {categories.map((c) => (
              <li key={c.slug}>
                <label className="filter-check" htmlFor={`${idPrefix}-cat-${c.slug}`}>
                  <input
                    id={`${idPrefix}-cat-${c.slug}`} type="checkbox"
                    checked={value.categories.includes(c.slug)} onChange={() => toggleCategory(c.slug)}
                  />
                  <span className="filter-check__name">{c.name}</span>
                  <span className="filter-check__count">{c.shown}</span>
                </label>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
