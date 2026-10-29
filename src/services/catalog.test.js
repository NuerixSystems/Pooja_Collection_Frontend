import { describe, expect, it, vi } from 'vitest';

vi.mock('../config', async (orig) => ({ ...(await orig()), CRM: { tenantId: '8', apiUrl: 'http://api.test/' } }));

import { EXCLUDED_CATEGORY_SLUGS } from '../config';
import { API_CATALOG } from '../test/fixtures';
import { getCategories, getCategory, getOtherProducts, getProductBySlug, getProductGallery, getProducts, getRelatedProducts, searchSuggestions, setCatalog } from './catalog';

// Wording that must never reach a customer: supplier/platform names, internal stock notes,
// and brand/licensing claims we can't verify.
const BLOCKED = ['meesho', 'osweet', 'hello kitty', 'kitty', 'stock alert'];

describe('catalogue shape (as served by the backend)', () => {
  it('uses the deployed watch image for the Anti Tarnish Watch and its gallery', async () => {
    const image = 'http://api.test/media/pooja/products/watches.webp';
    setCatalog({
      categories: [{ slug: 'watches', name: 'Watches', image: '' }],
      products: [{
        id: 'anti-tarnish-watch',
        slug: 'anti-tarnish-watch',
        name: 'Anti Tarnish Watch',
        categorySlug: 'watches',
        description: '',
        price: 649,
        tag: null,
        image: 'https://crm-dkc2.onrender.com/api/product-image/1',
      }],
    });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        images: [{ url: 'https://crm-dkc2.onrender.com/api/product-image/1' }],
      }),
    }));

    try {
      expect(getProductBySlug('anti-tarnish-watch').image).toBe(image);
      await expect(getProductGallery('anti-tarnish-watch')).resolves.toEqual([image]);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('has 7 categories and 7 products, one per category', () => {
    expect(getCategories().map((c) => c.slug)).toEqual([
      'watches', 'necklaces', 'earrings', 'rings', 'bracelets-and-bangles', 'bridal-traditional', 'men-s-collection',
    ]);
    const all = getProducts();
    expect(all).toHaveLength(7);
    expect(all.map((p) => p.categorySlug).sort()).toEqual(getCategories().map((c) => c.slug).sort());
    getCategories().forEach((c) => expect(c.count).toBe(1));
  });

  it('excludes Dresses everywhere, even if the backend sent it', () => {
    setCatalog({
      categories: [...API_CATALOG.categories, { slug: 'dresses', name: 'Dresses', image: '' }],
      products: [...API_CATALOG.products, { id: 'frock', slug: 'frock', name: 'Frock', categorySlug: 'dresses', description: '', price: 900, tag: null, image: '' }],
    });
    expect(EXCLUDED_CATEGORY_SLUGS).toContain('dresses');
    expect(getCategory('dresses')).toBeNull();
    expect(getProducts().some((p) => p.categorySlug === 'dresses')).toBe(false);
    expect(getProducts({ categorySlug: 'dresses' })).toEqual([]);
    expect(searchSuggestions('dress').categories).toEqual([]);
  });

  it('has unique, URL-safe slugs, valid prices and a visible category for every product', () => {
    const slugs = getProducts().map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    getProducts().forEach((p) => {
      expect(p.slug).toMatch(/^[a-z0-9-]+$/);
      expect(getCategory(p.categorySlug)).not.toBeNull();
      expect(Number.isInteger(p.price) && p.price > 0).toBe(true);
      expect(Array.isArray(p.designs)).toBe(true);
    });
  });

  it('points every image at the backend (nothing bundled with the storefront)', () => {
    getProducts().forEach((p) => expect(p.image).toBe(`http://api.test/media/products/${p.slug}.webp`));
    getCategories().forEach((c) => expect(c.image).toBe(`http://api.test/media/categories/${c.slug}.webp`));
  });

  it('leaves the image empty when the backend has none, so the placeholder tile shows', () => {
    setCatalog({ categories: [{ slug: 'rings', name: 'Rings', image: '' }], products: [] });
    expect(getCategory('rings').image).toBe('');
  });
});

describe('customer-facing wording', () => {
  it('contains no supplier names, stock notes or unverified brand claims in any visible field', () => {
    getProducts().forEach((p) => {
      const visible = [p.name, p.description, p.tag, p.slug, p.image].filter(Boolean).join(' | ').toLowerCase();
      BLOCKED.forEach((term) => expect(visible, `${p.slug} contains "${term}"`).not.toContain(term));
    });
  });

  it('hides internal tags', () => {
    setCatalog({
      categories: API_CATALOG.categories,
      products: [{ ...API_CATALOG.products[0], tag: 'Meesho' }],
    });
    expect(getProducts()[0].tag).toBeNull();
  });
});

describe('search', () => {
  it.each(['meesho', 'Meesho', 'osweet', 'hello kitty', 'stock alert'])('finds nothing for %j', (q) => {
    expect(getProducts({ query: q })).toEqual([]);
    expect(searchSuggestions(q).products).toEqual([]);
  });

  it('finds products by name, category or tag', () => {
    expect(getProducts({ query: 'peacock' }).map((p) => p.slug)).toEqual(['kashmiri-peacock-bracelet-watch']);
    expect(getProducts({ query: 'rings' }).map((p) => p.slug)).toContain('gold-tulip-rings-3-set');
    expect(getProducts({ query: 'bridal' }).map((p) => p.slug)).toEqual(['gold-maang-tikka']);
  });
});

describe('other products', () => {
  it('returns every product except the current one, across all categories', () => {
    const ring = getProductBySlug('gold-tulip-rings-3-set');
    const others = getOtherProducts(ring);
    expect(others).toHaveLength(6);
    expect(others.map((p) => p.slug)).not.toContain(ring.slug);
    expect(new Set(others.map((p) => p.categorySlug)).size).toBe(6);
  });
});

describe('related products', () => {
  it('returns other products from the same category only (none here: one product per category)', () => {
    const ring = getProductBySlug('gold-tulip-rings-3-set');
    expect(getRelatedProducts(ring)).toEqual([]);
    setCatalog({
      categories: API_CATALOG.categories,
      products: [ring, { ...ring, id: 'second-ring', slug: 'second-ring' }, API_CATALOG.products[0]],
    });
    expect(getRelatedProducts(getProductBySlug('gold-tulip-rings-3-set')).map((p) => p.slug)).toEqual(['second-ring']);
  });
});