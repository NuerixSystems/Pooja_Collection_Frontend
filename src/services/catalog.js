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
  // `CRM.mediaUrl` points at the backend root (e.g. http://localhost:8000) since the API
  // returns fully-qualified paths like /media/pooja/products/x.webp.
  return `${(CRM.mediaUrl || CRM.apiUrl).replace(/\/+$/, '')}${path.startsWith('/') ? '' : '/'}${path}`;
};

// A product only has selectable designs when the data lists them explicitly as [{ id, label }].
// Never derive designs from description text: availability per design is not known to the storefront.
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
 * Load the catalogue from the backend. Never throws; returns true when it loaded, false on any problem
 * (no API configured, network error, timeout, malformed response). Nothing is cached in the browser.
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

/** Load the complete product gallery from the public Pooja API. */
export async function getProductGallery(slug) {
  const response = await fetch(
    `${API_BASE_URL}/api/pooja/products/${encodeURIComponent(slug)}/gallery`
  );

  if (!response.ok) {
    throw new Error(
      `Gallery request failed: ${response.status} ${response.url}`
    );
  }

  const data = await response.json();

  // Support the ProductGalleryOut response structure.
  return (data.images || [])
    .map((image) => image.url)
    .filter(Boolean);
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

export function searchSuggestions(query, limit = 5) {
  const q = query.trim().toLowerCase();
  if (!q) return { categories: [], products: [] };
  return {
    categories: categories.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 3),
    products: getProducts({ query: q }).slice(0, limit),
  };
}
