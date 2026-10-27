
import { CRM, EXCLUDED_CATEGORY_SLUGS, HIDDEN_TAGS } from '../config';

const excluded = new Set(EXCLUDED_CATEGORY_SLUGS);
<<<<<<< HEAD
const hiddenTags = new Set(HIDDEN_TAGS.map((t) => t.toLowerCase()));
const isAllowed = (slug) => !excluded.has(String(slug).toLowerCase());
const mediaBaseUrl = (CRM.mediaUrl || CRM.apiUrl).replace(/\/api\/pooja\/?$/, '').replace(/\/+$/, '');
const PRODUCT_IMAGE_OVERRIDES = {
  'anti-tarnish-watch': `${mediaBaseUrl}/media/pooja/products/watches.webp`,
};
=======
const hiddenTags = new Set(HIDDEN_TAGS.map((tag) => tag.toLowerCase()));
>>>>>>> cfc24a8af18a584b196c9f0d12ca1e4f841dd028

const isAllowed = (slug) => !excluded.has(String(slug ?? '').toLowerCase());

const FEATURED_TAGS = [
  'Best Seller',
  'Trending',
  'Viral',
  'Premium',
  'New Arrival',
];

let products = [];
let categories = [];

<<<<<<< HEAD
/** Replace the in-memory catalogue with `data` ({ categories, products }, the shape of GET /catalog). */
export function setCatalog(data) {
  const nextProducts = data.products
    .filter((p) => isAllowed(p.categorySlug))
    .map((p) => ({
      ...p,
      image: PRODUCT_IMAGE_OVERRIDES[p.slug] || imageUrl(p.image),
      designs: cleanDesigns(p.designs),
      tag: p.tag && !hiddenTags.has(p.tag.toLowerCase()) ? p.tag : null,
      isNew: p.tag === 'New Arrival',
      bestSeller: p.tag === 'Best Seller',
      featured: FEATURED_TAGS.includes(p.tag),
    }));
=======
/**
 * Public Pooja API base.
 *
 * CRM.apiUrl should be the backend root, for example:
 * https://crm-dkc2.onrender.com
 */
const API_ROOT = () => (CRM.apiUrl || '').replace(/\/+$/, '');

const POOJA_API = () => `${API_ROOT()}/api/pooja`;

/**
 * Convert backend image paths to complete URLs.
 *
 * Examples:
 * /media/pooja/products/image.webp
 * https://crm-dkc2.onrender.com/media/products/image.webp
 */
export const imageUrl = (path) => {
  if (!path) return '';

  const value = String(path).trim();

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  if (value.startsWith('//')) {
    return `${window.location.protocol}${value}`;
  }

  const mediaRoot = (CRM.mediaUrl || CRM.apiUrl || '').replace(/\/+$/, '');

  return `${mediaRoot}${value.startsWith('/') ? '' : '/'}${value}`;
};

/**
 * Only use explicitly supplied design options.
 */
const cleanDesigns = (designs) => {
  if (!Array.isArray(designs)) return [];

  const seen = new Set();

  return designs.filter((design) => {
    if (!design || !design.id || !design.label) return false;

    if (seen.has(design.id)) return false;

    seen.add(design.id);
    return true;
  });
};

/**
 * Replace the in-memory catalogue with API data.
 *
 * Expected shape:
 * {
 *   categories: [...],
 *   products: [...]
 * }
 */
export function setCatalog(data) {
  const incomingProducts = Array.isArray(data?.products)
    ? data.products
    : [];

  const incomingCategories = Array.isArray(data?.categories)
    ? data.categories
    : [];

  const nextProducts = incomingProducts
    .filter((product) => isAllowed(product.categorySlug))
    .map((product) => {
      const tag = product.tag || null;
>>>>>>> cfc24a8af18a584b196c9f0d12ca1e4f841dd028

      return {
        ...product,
        image: imageUrl(product.image),
        designs: cleanDesigns(product.designs),
        tag:
          tag && !hiddenTags.has(String(tag).toLowerCase())
            ? tag
            : null,
        isNew: tag === 'New Arrival',
        bestSeller: tag === 'Best Seller',
        featured: FEATURED_TAGS.includes(tag),
      };
    });

  categories = incomingCategories
    .filter((category) => isAllowed(category.slug))
    .map((category) => {
      const categoryProducts = nextProducts.filter(
        (product) => product.categorySlug === category.slug,
      );

      const prices = categoryProducts
        .map((product) => Number(product.price))
        .filter(Number.isFinite);

      return {
        ...category,
        id: category.slug,
        image: imageUrl(category.image),
        count: categoryProducts.length,
        minPrice: prices.length ? Math.min(...prices) : 0,
        maxPrice: prices.length ? Math.max(...prices) : 0,
      };
    });

  products = nextProducts;
}

/**
 * Load catalogue from:
 * GET /api/pooja/catalog
 */
export async function hydrateCatalog({ timeoutMs = 8000 } = {}) {
  if (!CRM.apiUrl) {
    console.error('Catalogue API is not configured: CRM.apiUrl is empty.');
    return false;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${POOJA_API()}/catalog`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error(
        `Catalogue request failed: HTTP ${response.status}`,
        `${POOJA_API()}/catalog`,
      );
      return false;
    }

    const data = await response.json();

    if (
      !Array.isArray(data?.products) ||
      !Array.isArray(data?.categories)
    ) {
      console.error('Catalogue API returned an unexpected response shape.');
      return false;
    }

    setCatalog(data);
    return true;
  } catch (error) {
    console.error('Could not load catalogue:', error);
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Load all images for a product:
 * GET /api/pooja/products/{slug}/gallery
 */
export async function getProductGallery(slug) {
  if (!CRM.apiUrl || !slug) return [];

  const url =
    `${POOJA_API()}/products/${encodeURIComponent(slug)}/gallery`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      console.error(
        `Product gallery request failed: HTTP ${response.status}`,
        url,
      );
      return [];
    }

    const data = await response.json();
<<<<<<< HEAD
    if (!Array.isArray(data?.images)) return [];
    const productImage = getProductBySlug(slug)?.image;
    return data.images
      .map((item) => {
        const url = imageUrl(item?.url);
        return productImage && /\/api\/product-image\/\d+$/.test(url) ? productImage : url;
=======

    if (!Array.isArray(data?.images)) {
      console.error('Product gallery API did not return an images array.');
      return [];
    }

    return data.images
      .map((item) => {
        // Support either { url: "..." } or a direct URL string.
        const path = typeof item === 'string' ? item : item?.url;
        return imageUrl(path);
>>>>>>> cfc24a8af18a584b196c9f0d12ca1e4f841dd028
      })
      .filter(Boolean)
      .filter((url, index, all) => all.indexOf(url) === index);
  } catch (error) {
    console.error('Could not load product gallery:', error);
    return [];
  }
}

export const getCategories = () => categories;

export const getCategory = (slug) =>
  categories.find((category) => category.slug === slug) || null;

export const getProductById = (id) =>
  products.find((product) => product.id === id) || null;

export const getProductBySlug = (slug) =>
  products.find((product) => product.slug === slug) || null;

export const getRelatedProducts = (product, limit = 4) =>
  products
    .filter(
      (item) =>
        item.categorySlug === product.categorySlug &&
        item.id !== product.id,
    )
    .slice(0, limit);

export const getOtherProducts = (product) =>
  products.filter((item) => item.id !== product.id);

export const getFeaturedProducts = (limit = 8) =>
  products
    .filter((product) => product.featured)
    .sort(
      (a, b) =>
        FEATURED_TAGS.indexOf(a.tag) -
        FEATURED_TAGS.indexOf(b.tag),
    )
    .slice(0, limit);

export function getTrendingProducts(featuredLimit = 8, extra = 1) {
  const featured = getFeaturedProducts(featuredLimit);
  const ids = new Set(featured.map((product) => product.id));
  const fillers = products
    .filter((product) => !ids.has(product.id))
    .slice(0, extra);

  return [...featured, ...fillers];
}

const SORTERS = {
  'price-asc': (a, b) => Number(a.price) - Number(b.price),
  'price-desc': (a, b) => Number(b.price) - Number(a.price),
};

export function getPriceBounds() {
  if (!products.length) return null;

  const prices = products
    .map((product) => Number(product.price))
    .filter(Number.isFinite);

  if (!prices.length) return null;

  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  };
}

export function getProducts({
  categorySlug,
  categorySlugs,
  query,
  collection,
  sort,
  minPrice,
  maxPrice,
} = {}) {
  let list = products;

  if (categorySlug) {
    list = list.filter(
      (product) => product.categorySlug === categorySlug,
    );
  }

  if (categorySlugs?.length) {
    const wanted = new Set(categorySlugs);

    list = list.filter(
      (product) => wanted.has(product.categorySlug),
    );
  }

  if (Number.isFinite(minPrice)) {
    list = list.filter(
      (product) => Number(product.price) >= minPrice,
    );
  }

  if (Number.isFinite(maxPrice)) {
    list = list.filter(
      (product) => Number(product.price) <= maxPrice,
    );
  }

  if (collection === 'new') {
    list = list.filter((product) => product.isNew);
  }

  if (collection === 'best') {
    list = list.filter((product) => product.bestSeller);
  }

  const q = query?.trim().toLowerCase();

  if (q) {
    const categoryName = (slug) =>
      getCategory(slug)?.name?.toLowerCase() || '';

    list = list.filter((product) =>
      [
        product.name,
        product.description,
        categoryName(product.categorySlug),
        product.tag || '',
      ].some((value) =>
        String(value ?? '').toLowerCase().includes(q),
      ),
    );
  }

  return SORTERS[sort] ? [...list].sort(SORTERS[sort]) : list;
}

export function searchSuggestions(query, limit = 5) {
  const q = String(query ?? '').trim().toLowerCase();

  if (!q) {
    return { categories: [], products: [] };
  }

  return {
    categories: categories
      .filter((category) =>
        String(category.name ?? '').toLowerCase().includes(q),
      )
      .slice(0, 3),

    products: getProducts({ query: q }).slice(0, limit),
  };
}
