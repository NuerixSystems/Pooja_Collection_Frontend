// Shop page filter state <-> URL query string. Pure functions, no React, so they are easy to test.
// URL shape (all optional):  /shop?q=ring&collection=best&category=rings&category=earrings&minPrice=200&maxPrice=450&sort=price-asc
// `q` and `collection` belong to the existing search / collection features and are never touched by filters.

import { getCategory } from '../services/catalog';

export const SORT_OPTIONS = [
  { value: '', label: 'Featured' }, // the store's own catalogue order (existing behaviour)
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
];
const SORT_VALUES = new Set(SORT_OPTIONS.map((o) => o.value));

const toInt = (value) => {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n) : null;
};

/**
 * Read the filter state from URL params. Unknown categories and unknown sort values are ignored; prices are
 * clamped into `bounds`; a value equal to the catalogue limit means "no limit" and comes back as null.
 */
export function parseShopFilters(params, bounds) {
  const categories = [...new Set(params.getAll('category'))].filter((slug) => getCategory(slug));

  let min = toInt(params.get('minPrice'));
  let max = toInt(params.get('maxPrice'));
  if (bounds) {
    if (min !== null) min = Math.min(Math.max(min, bounds.min), bounds.max);
    if (max !== null) max = Math.min(Math.max(max, bounds.min), bounds.max);
  }
  if (min !== null && max !== null && min > max) [min, max] = [max, min];
  if (bounds) {
    if (min === bounds.min) min = null;
    if (max === bounds.max) max = null;
  }

  const sort = SORT_VALUES.has(params.get('sort') || '') ? params.get('sort') || '' : '';
  return { query: params.get('q') || '', collection: params.get('collection') || '', sort, categories, minPrice: min, maxPrice: max };
}

/** Copy of `params` with the given filter values applied. null / '' / [] remove the matching URL parameter. */
export function withFilters(params, patch) {
  const next = new URLSearchParams(params);
  if ('sort' in patch) {
    if (patch.sort) next.set('sort', patch.sort); else next.delete('sort');
  }
  if ('categories' in patch) {
    next.delete('category');
    (patch.categories || []).forEach((slug) => next.append('category', slug));
  }
  if ('minPrice' in patch) {
    if (patch.minPrice === null || patch.minPrice === undefined) next.delete('minPrice'); else next.set('minPrice', String(patch.minPrice));
  }
  if ('maxPrice' in patch) {
    if (patch.maxPrice === null || patch.maxPrice === undefined) next.delete('maxPrice'); else next.set('maxPrice', String(patch.maxPrice));
  }
  return next;
}

/** Number of active sidebar filters (categories count once; the price range counts once). Sorting is not a filter. */
export const countActiveFilters = (f) => (f.categories.length ? 1 : 0) + (f.minPrice !== null || f.maxPrice !== null ? 1 : 0);

/** Values that put every filter and the sort back to default. Search text and collection are kept. */
export const RESET_PATCH = { sort: '', categories: [], minPrice: null, maxPrice: null };

/** Clamp a typed value into the catalogue range and keep it on the right side of the other handle. */
export function clampPrice(raw, { low, high }) {
  const n = toInt(raw);
  if (n === null) return null;
  return Math.min(Math.max(n, low), high);
}
