import { CRM, EXCLUDED_CATEGORY_SLUGS, HIDDEN_TAGS } from '../config';

const excluded = new Set(
  (Array.isArray(EXCLUDED_CATEGORY_SLUGS) ? EXCLUDED_CATEGORY_SLUGS : [])
    .map((slug) => String(slug ?? '').toLowerCase()),
);

const hiddenTags = new Set(
  (Array.isArray(HIDDEN_TAGS) ? HIDDEN_TAGS : [])
    .map((tag) => String(tag ?? '').toLowerCase()),
);

const isAllowed = (slug) =>
  !excluded.has(String(slug ?? '').toLowerCase());

const FEATURED_TAGS = [
  'Best Seller',
  'Trending',
  'Viral',
  'Premium',
  'New Arrival',
];

const unavailableImageHosts = new Set(['images.nuerix.in']);

let products = [];
let categories = [];

/**
 * Backend API base.
 *
 * Supported CRM.apiUrl values:
 *   https://your-backend.onrender.com
 *   https://your-backend.onrender.com/api
 *   https://your-backend.onrender.com/api/pooja
 */
const POOJA_API = () => {
  const apiUrl = String(CRM?.apiUrl ?? '').trim().replace(/\/+$/, '');

  if (!apiUrl) return '';

  if (/\/api\/pooja$/i.test(apiUrl)) {
    return apiUrl;
  }

  if (/\/api$/i.test(apiUrl)) {
    return `${apiUrl}/pooja`;
  }

  return `${apiUrl}/api/pooja`;
};

/**
 * Convert backend image paths into absolute URLs.
 *
 * Absolute URLs are preserved. Relative paths use CRM.mediaUrl first,
 * then CRM.apiUrl.
 */
export const imageUrl = (path) => {
  if (!path) return '';

  const value = String(path).trim();

  if (!value) return '';

  if (/^https?:\/\//i.test(value)) {
    try {
      const { hostname } = new URL(value);
      if (unavailableImageHosts.has(hostname.toLowerCase())) return '';
    } catch {
      return '';
    }

    return value;
  }

  if (value.startsWith('//')) {
    try {
      const { hostname } = new URL(`https:${value}`);
      if (unavailableImageHosts.has(hostname.toLowerCase())) return '';
    } catch {
      return '';
    }

    const protocol =
      typeof window !== 'undefined' ? window.location.protocol : 'https:';

    return `${protocol}${value}`;
  }

  const mediaRoot = String(CRM?.mediaUrl || CRM?.apiUrl || '')
    .trim()
    .replace(/\/+$/, '');

  if (!mediaRoot) return value;

  return `${mediaRoot}${value.startsWith('/') ? '' : '/'}${value}`;
};

/**
 * Keep only valid, unique design options.
 */
const cleanDesigns = (designs) => {
  if (!Array.isArray(designs)) return [];

  const seen = new Set();

  return designs.filter((design) => {
    if (!design || design.id == null || !design.label) return false;

    const key = String(design.id);

    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
};

/**
 * Replace the in-memory catalogue with API data.
 *
 * Expected response:
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
    .filter((product) => isAllowed(product?.categorySlug))
    .map((product) => {
      const originalTag = product?.tag || null;
      const tag =
        originalTag &&
        !hiddenTags.has(String(originalTag).toLowerCase())
          ? originalTag
          : null;

      return {
        ...product,
        image: imageUrl(product?.image),
        designs: cleanDesigns(product?.designs),
        tag,
        isNew: tag === 'New Arrival',
        bestSeller: tag === 'Best Seller',
        featured: FEATURED_TAGS.includes(tag),
      };
    });

  categories = incomingCategories
    .filter((category) => isAllowed(category?.slug))
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
 * Load the public catalogue:
 * GET /api/pooja/catalog
 *
 * Render free services can take time to wake up after inactivity.
 * The default timeout is therefore 60 seconds instead of 8 seconds.
 */
export async function hydrateCatalog({ timeoutMs = 60000 } = {}) {
  const apiBase = POOJA_API();

  if (!apiBase) {
    console.error(
      'Catalogue API is not configured. Check CRM.apiUrl in your frontend config.',
    );
    return false;
  }

  const url = `${apiBase}/catalog`;
  const controller = new AbortController();
  let timedOut = false;

  const safeTimeout = Math.max(
    1000,
    Number.isFinite(Number(timeoutMs)) ? Number(timeoutMs) : 60000,
  );

  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, safeTimeout);

  try {
    console.info('Loading Pooja catalogue:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
      cache: 'no-store',
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error(
        `Catalogue request failed with HTTP ${response.status}.`,
        responseText.slice(0, 1000),
      );
      return false;
    }

    let data;

    try {
      data = responseText ? JSON.parse(responseText) : null;
    } catch (parseError) {
      console.error(
        'Catalogue API returned invalid JSON. Check the FastAPI endpoint and response.',
        responseText.slice(0, 1000),
        parseError,
      );
      return false;
    }

    if (
      !data ||
      !Array.isArray(data.products) ||
      !Array.isArray(data.categories)
    ) {
      console.error(
        'Catalogue API response must contain products[] and categories[]. Received:',
        data,
      );
      return false;
    }

    setCatalog(data);

    console.info(
      `Pooja catalogue loaded: ${products.length} products and ${categories.length} categories.`,
    );

    return true;
  } catch (error) {
    if (error?.name === 'AbortError' && timedOut) {
      console.error(
        `Catalogue request timed out after ${Math.round(safeTimeout / 1000)} seconds.`,
        `Backend URL: ${url}`,
        'Check Render service startup, backend logs, and database response time.',
      );
    } else if (error?.name === 'AbortError') {
      console.warn('Catalogue request was aborted by the caller or browser.');
    } else {
      console.error('Could not load catalogue:', error);
    }

    return false;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Load all images for one product:
 * GET /api/pooja/products/{slug}/gallery
 *
 * The backend gallery endpoint is expected to read image metadata directly
 * from the CRM schema. This function does not query database tables itself.
 */
export async function getProductGallery(slug, { timeoutMs = 30000 } = {}) {
  const apiBase = POOJA_API();

  if (!apiBase || !slug) return [];

  const url = `${apiBase}/products/${encodeURIComponent(slug)}/gallery`;
  const controller = new AbortController();
  let timedOut = false;

  const safeTimeout = Math.max(
    1000,
    Number.isFinite(Number(timeoutMs)) ? Number(timeoutMs) : 30000,
  );

  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, safeTimeout);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();

      console.error(
        `Product gallery request failed with HTTP ${response.status}.`,
        url,
        errorText.slice(0, 1000),
      );

      return [];
    }

    const data = await response.json();

    if (!Array.isArray(data?.images)) {
      console.error(
        'Product gallery API did not return an images array.',
        data,
      );
      return [];
    }

    return data.images
      .map((item) => {
        const path = typeof item === 'string' ? item : item?.url;
        return imageUrl(path);
      })
      .filter(Boolean)
      .filter((image, index, all) => all.indexOf(image) === index);
  } catch (error) {
    if (error?.name === 'AbortError' && timedOut) {
      console.error(
        `Product gallery request timed out after ${Math.round(safeTimeout / 1000)} seconds.`,
        url,
      );
    } else {
      console.error('Could not load product gallery:', error);
    }

    return [];
  } finally {
    clearTimeout(timer);
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
