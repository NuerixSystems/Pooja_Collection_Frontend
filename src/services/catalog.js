// Catalogue access layer. Components only talk to this file.
// There is no bundled catalogue: categories, products and image URLs all come from the backend
// (GET /catalog, backed by the database). main.jsx calls hydrateCatalog() before the first render and shows a
// retry screen if the backend can't be reached.

import { CRM, EXCLUDED_CATEGORY_SLUGS, HIDDEN_TAGS } from '../config';

const excluded = new Set(EXCLUDED_CATEGORY_SLUGS);
const hiddenTags = new Set(HIDDEN_TAGS.map((t) => t.toLowerCase()));
const isAllowed = (slug) => !excluded.has(String(slug).toLowerCase());

// Image paths from the API are relative to the backend (e.g. /media/pooja/products/x.webp).
export const imageUrl = (path) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${(CRM.mediaUrl || CRM.apiUrl).replace(/\/+$/, '')}${path.startsWith('/') ? '' : '/'}${path}`;
};

// A product only has selectable designs when the data lists them explicitly as [{ id, label }].
const cleanDesigns = (designs) => {
  if (!Array.isArray(designs)) return [];
  const seen = new Set();
  return designs.filter((d) => d && d.id && d.label && !seen.has(d.id) && seen.add(d.id));
};

const FEATURED_TAGS = ['Best Seller', 'Trending', 'Viral', 'Premium', 'New Arrival'];

let products = [];
let categories = [];

/** Replace the in-memory catalogue with `data` ({ categories, products }, the shape of GET /catalog). */
export function setCatalog(data) {
  const nextProducts = data.products
    .filter((p) => isAllowed(p.categorySlug))
    .map((p) => ({
      ...p,
      image: imageUrl(p.image),
      designs: cleanDesigns(p.designs),
      tag: p.tag && !hiddenTags.has(p.tag.toLowerCase()) ? p.tag : null,
      isNew: p.tag === 'New Arrival',
      bestSeller: p.tag === 'Best Seller',
      featured: FEATURED_TAGS.includes(p.tag),
    }));

  categories = data.categories
    .filter((c) => isAllowed(c.slug))
    .map((c) => {
      const prices = nextProducts.filter((p) => p.categorySlug === c.slug).map((p) => p.price);
      return {
        ...c,
        id: c.slug,
        image: imageUrl(c.image),
        count: prices.length,
        minPrice: prices.length ? Math.min(...prices) : 0,
        maxPrice: prices.length ? Math.max(...prices) : 0,
      };
    });
  products = nextProducts;
}

/**
 * Load the catalogue from the backend. Never throws; returns true when it loaded, false on any problem.
 * @returns {Promise<boolean>}
 */
export async function hydrateCatalog({ timeoutMs = 8000 } = {}) {
  if (!CRM.apiUrl) return false;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${CRM.apiUrl.replace(/\/+$/, '')}/catalog`, { signal: controller.signal });
    if (!res.ok) return false;
    const data = await res.json();
    if (!Array.isArray(data?.products) || !Array.isArray(data?.categories)) return false;
    setCatalog(data);
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export const getCategories = () => categories;
export const getCategory = (slug) => categories.find((c) => c.slug === slug) || null;
export const getProductById = (id) => products.find((p) => p.id === id) || null;
export const getProductBySlug = (slug) => products.find((p) => p.slug === slug) || null;

export const getRelatedProducts = (product, limit = 4) =>
  products.filter((p) => p.categorySlug === product.categorySlug && p.id !== product.id).slice(0, limit);

export const getOtherProducts = (product) => products.filter((p) => p.id !== product.id);

export const getFeaturedProducts = (limit = 8) =>
  products
    .filter((p) => p.featured)
    .sort((a, b) => FEATURED_TAGS.indexOf(a.tag) - FEATURED_TAGS.indexOf(b.tag))
    .slice(0, limit);

export function getTrendingProducts(featuredLimit = 8, extra = 1) {
  const featured = getFeaturedProducts(featuredLimit);
  const ids = new Set(featured.map((p) => p.id));
  const fillers = products.filter((p) => !ids.has(p.id)).slice(0, extra);
  return [...featured, ...fillers];
}

const SORTERS = {
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
};

export function getPriceBounds() {
  if (!products.length) return null;
  const prices = products.map((p) => p.price);
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

export function getProducts({ categorySlug, categorySlugs, query, collection, sort, minPrice, maxPrice } = {}) {
  let list = products;

  if (categorySlug) list = list.filter((p) => p.categorySlug === categorySlug);
  if (categorySlugs?.length) {
    const wanted = new Set(categorySlugs);
    list = list.filter((p) => wanted.has(p.categorySlug));
  }
  if (Number.isFinite(minPrice)) list = list.filter((p) => p.price >= minPrice);
  if (Number.isFinite(maxPrice)) list = list.filter((p) => p.price <= maxPrice);
  if (collection === 'new') list = list.filter((p) => p.isNew);
  if (collection === 'best') list = list.filter((p) => p.bestSeller);

  const q = query?.trim().toLowerCase();
  if (q) {
    const catName = (slug) => getCategory(slug)?.name.toLowerCase() || '';
    list = list.filter((p) =>
      [p.name, p.description, catName(p.categorySlug), p.tag || ''].some((t) => t.toLowerCase().includes(q)),
    );
  }

  return SORTERS[sort] ? [...list].sort(SORTERS[sort]) : list;
}

/**
 * Live search suggestions with relevance ranking.
 *
 * Score:
 *   1000 — exact product name match
 *    500 — product name starts with the query
 *    300 — product name contains the query
 *    200 — category name starts with the query
 *    150 — category name contains the query
 *    100 — product tag matches
 *     50 — product description contains the query
 *
 * Ties broken by shorter product names first.
 */
export function searchSuggestions(query, limit = 8) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return { categories: [], products: [] };

  const catName = (slug) => getCategory(slug)?.name.toLowerCase() || '';

  const scored = products
    .map((p) => {
      const name = (p.name || '').toLowerCase();
      const desc = (p.description || '').toLowerCase();
      const cat = catName(p.categorySlug);
      const tag = (p.tag || '').toLowerCase();

      let score = 0;
      if (name === q) score = 1000;
      else if (name.startsWith(q)) score = 500;
      else if (name.includes(q)) score = 300;
      else if (cat.startsWith(q)) score = 200;
      else if (cat.includes(q)) score = 150;
      else if (tag.includes(q)) score = 100;
      else if (desc.includes(q)) score = 50;

      return { product: p, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (a.product.name || '').length - (b.product.name || '').length;
    })
    .slice(0, limit)
    .map(({ product }) => product);

  return {
    categories: categories.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 3),
    products: scored,
  };
}