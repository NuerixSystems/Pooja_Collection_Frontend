import { describe, expect, it } from 'vitest';
import { getPriceBounds, getProducts } from '../services/catalog';
import { RESET_PATCH, clampPrice, countActiveFilters, parseShopFilters, withFilters } from './shopFilters';

// Fixture catalogue (test/fixtures.js): prices 199 x2, 299 x2, 399 x2, 499 x1 across 7 categories.
const names = (list) => list.map((p) => p.slug);
const params = (qs) => new URLSearchParams(qs);

describe('price bounds', () => {
  it('come from the real catalogue prices', () => {
    expect(getPriceBounds()).toEqual({ min: 199, max: 499 });
  });
});

describe('price filtering (catalogue)', () => {
  it('is inclusive at both ends', () => {
    expect(getProducts({ minPrice: 399 })).toHaveLength(3);
    expect(getProducts({ maxPrice: 299 })).toHaveLength(4);
    expect(getProducts({ minPrice: 299, maxPrice: 399 })).toHaveLength(4);
  });
  it('returns nothing for a range with no products', () => {
    expect(getProducts({ minPrice: 300, maxPrice: 350 })).toHaveLength(0);
  });
  it('treats a missing limit as no limit', () => {
    expect(getProducts({ minPrice: undefined, maxPrice: undefined })).toHaveLength(7);
  });
});

describe('category filtering (catalogue)', () => {
  it('filters by one or several categories', () => {
    expect(names(getProducts({ categorySlugs: ['rings'] }))).toEqual(['gold-tulip-rings-3-set']);
    expect(getProducts({ categorySlugs: ['rings', 'earrings'] })).toHaveLength(2);
  });
  it('an empty selection means every category', () => {
    expect(getProducts({ categorySlugs: [] })).toHaveLength(7);
  });
  it('still supports the single categorySlug used by category pages', () => {
    expect(getProducts({ categorySlug: 'watches' })).toHaveLength(1);
  });
});

describe('combined filters and sorting (catalogue)', () => {
  it('applies category, price and search together', () => {
    expect(getProducts({ categorySlugs: ['necklaces', 'rings'], minPrice: 250, maxPrice: 300 })).toHaveLength(2);
    expect(getProducts({ categorySlugs: ['watches'], maxPrice: 300 })).toHaveLength(0);
    expect(getProducts({ query: 'bracelet', maxPrice: 250 })).toHaveLength(1);
  });
  it('sorts by price both ways after filtering', () => {
    const asc = getProducts({ minPrice: 299, sort: 'price-asc' }).map((p) => p.price);
    const desc = getProducts({ minPrice: 299, sort: 'price-desc' }).map((p) => p.price);
    expect(asc).toEqual([299, 299, 399, 399, 499]);
    expect(desc).toEqual([499, 399, 399, 299, 299]);
  });
});

describe('parseShopFilters', () => {
  const bounds = { min: 199, max: 499 };
  it('reads categories, price and sort', () => {
    const f = parseShopFilters(params('category=rings&category=earrings&minPrice=250&maxPrice=450&sort=price-desc'), bounds);
    expect(f.categories).toEqual(['rings', 'earrings']);
    expect(f.minPrice).toBe(250);
    expect(f.maxPrice).toBe(450);
    expect(f.sort).toBe('price-desc');
  });
  it('drops unknown categories and unknown sort values', () => {
    const f = parseShopFilters(params('category=dresses&category=rings&sort=newest'), bounds);
    expect(f.categories).toEqual(['rings']);
    expect(f.sort).toBe('');
  });
  it('clamps out-of-range prices and swaps a reversed range', () => {
    expect(parseShopFilters(params('minPrice=10&maxPrice=9999'), bounds)).toEqual(expect.objectContaining({ minPrice: null, maxPrice: null }));
    const swapped = parseShopFilters(params('minPrice=450&maxPrice=250'), bounds);
    expect(swapped.minPrice).toBe(250);
    expect(swapped.maxPrice).toBe(450);
  });
  it('ignores junk price values', () => {
    const f = parseShopFilters(params('minPrice=abc&maxPrice='), bounds);
    expect(f.minPrice).toBeNull();
    expect(f.maxPrice).toBeNull();
  });
  it('keeps the search query and collection', () => {
    const f = parseShopFilters(params('q=ring&collection=best'), bounds);
    expect(f.query).toBe('ring');
    expect(f.collection).toBe('best');
  });
});

describe('withFilters / reset', () => {
  it('sets and removes parameters without touching search or collection', () => {
    const next = withFilters(params('q=ring&collection=best'), { categories: ['rings'], minPrice: 250, sort: 'price-asc' });
    expect(next.get('q')).toBe('ring');
    expect(next.get('collection')).toBe('best');
    expect(next.getAll('category')).toEqual(['rings']);
    expect(next.get('minPrice')).toBe('250');
    expect(next.get('sort')).toBe('price-asc');
  });
  it('RESET_PATCH clears every filter and the sort but keeps q and collection', () => {
    const start = params('q=ring&collection=best&category=rings&minPrice=250&maxPrice=450&sort=price-asc');
    const next = withFilters(start, RESET_PATCH);
    expect(next.toString()).toBe('q=ring&collection=best');
  });
  it('replaces the category list instead of appending to it', () => {
    const next = withFilters(params('category=rings'), { categories: ['earrings', 'watches'] });
    expect(next.getAll('category')).toEqual(['earrings', 'watches']);
  });
});

describe('helpers', () => {
  it('counts active filters (categories once, price once, sort never)', () => {
    expect(countActiveFilters({ categories: [], minPrice: null, maxPrice: null, sort: 'price-asc' })).toBe(0);
    expect(countActiveFilters({ categories: ['a', 'b'], minPrice: 250, maxPrice: null })).toBe(2);
  });
  it('clampPrice keeps typed values inside the catalogue range', () => {
    expect(clampPrice('50', { low: 199, high: 499 })).toBe(199);
    expect(clampPrice('9000', { low: 199, high: 499 })).toBe(499);
    expect(clampPrice('', { low: 199, high: 499 })).toBeNull();
  });
});
