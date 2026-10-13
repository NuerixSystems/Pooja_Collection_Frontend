// Test fixture: what GET /api/catalog returns (7 categories, one product each). Keep in sync with backend/data/catalog.json.
export const API_CATALOG = {
  "categories": [
    {
      "slug": "watches",
      "name": "Watches",
      "image": "/media/categories/watches.webp"
    },
    {
      "slug": "necklaces",
      "name": "Necklaces",
      "image": "/media/categories/necklaces.webp"
    },
    {
      "slug": "earrings",
      "name": "Earrings",
      "image": "/media/categories/earrings.webp"
    },
    {
      "slug": "rings",
      "name": "Rings",
      "image": "/media/categories/rings.webp"
    },
    {
      "slug": "bracelets-and-bangles",
      "name": "Bracelets & Bangles",
      "image": "/media/categories/bracelets-and-bangles.webp"
    },
    {
      "slug": "bridal-traditional",
      "name": "Bridal / Traditional",
      "image": "/media/categories/bridal-traditional.webp"
    },
    {
      "slug": "men-s-collection",
      "name": "Men's Collection",
      "image": "/media/categories/men-s-collection.webp"
    }
  ],
  "products": [
    {
      "id": "kashmiri-peacock-bracelet-watch",
      "slug": "kashmiri-peacock-bracelet-watch",
      "name": "Kashmiri Peacock Bracelet Watch",
      "categorySlug": "watches",
      "description": "Ornate gold, red-green detailing, antique look",
      "price": 499,
      "tag": "Premium",
      "image": "/media/products/kashmiri-peacock-bracelet-watch.webp",
      "designs": []
    },
    {
      "id": "tulip-pendant-necklace-gold",
      "slug": "tulip-pendant-necklace-gold",
      "name": "Tulip Pendant Necklace - Gold",
      "categorySlug": "necklaces",
      "description": "Stainless steel, tulip design, anti-tarnish",
      "price": 299,
      "tag": "Viral",
      "image": "/media/products/tulip-pendant-necklace-gold.webp",
      "designs": []
    },
    {
      "id": "viral-ball-back-studs",
      "slug": "viral-ball-back-studs",
      "name": "Viral Ball-back Studs",
      "categorySlug": "earrings",
      "description": "Gold-tone ball-back, multiple designs",
      "price": 199,
      "tag": "Viral",
      "image": "/media/products/viral-ball-back-studs.webp",
      "designs": []
    },
    {
      "id": "gold-tulip-rings-3-set",
      "slug": "gold-tulip-rings-3-set",
      "name": "Gold Tulip Rings - 3 Set",
      "categorySlug": "rings",
      "description": "Tulip shape with gemstone, black holder",
      "price": 299,
      "tag": "Gift",
      "image": "/media/products/gold-tulip-rings-3-set.webp",
      "designs": []
    },
    {
      "id": "butterfly-cuff-bangle",
      "slug": "butterfly-cuff-bangle",
      "name": "Butterfly Cuff Bangle",
      "categorySlug": "bracelets-and-bangles",
      "description": "Wide open cuff, 3 butterfly motifs, gold",
      "price": 399,
      "tag": "Premium",
      "image": "/media/products/butterfly-cuff-bangle.webp",
      "designs": []
    },
    {
      "id": "gold-maang-tikka",
      "slug": "gold-maang-tikka",
      "name": "Gold Maang Tikka",
      "categorySlug": "bridal-traditional",
      "description": "Traditional headpiece, gold-tone",
      "price": 399,
      "tag": "Bridal",
      "image": "/media/products/gold-maang-tikka.webp",
      "designs": []
    },
    {
      "id": "men-s-chain-bracelet-304-steel",
      "slug": "men-s-chain-bracelet-304-steel",
      "name": "Men's Chain Bracelet - 304 Steel",
      "categorySlug": "men-s-collection",
      "description": "Gold-colored, 304 Steel",
      "price": 199,
      "tag": "Men",
      "image": "/media/products/men-s-chain-bracelet-304-steel.webp",
      "designs": []
    }
  ]
};
