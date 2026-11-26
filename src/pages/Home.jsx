import { useRef } from 'react';
import { Link } from 'react-router-dom';

import CategoryGrid from '../components/CategoryGrid';
import ProductGrid from '../components/ProductGrid';
import {
  FeaturedProducts,
  OurStory,
  WhyChooseUs,
} from '../components/HomeSections';

import { ChevronRightIcon } from '../components/Icons';
import { getProducts } from '../services/catalog';

import './Home.css';

// 👇 Trending Now-la kaata vendiya products-oda IDs
//    (latest-to-old order code-la handle aagum)
const TRENDING_PRODUCT_IDS = [59, 58, 57, 56, 54, 53, 52, 51];

// 👇 Favourites-la evlo products venum
const FAVOURITES_LIMIT = 7;

/* ------------------------------------------------------------------
 * Helper: product-oda "added time"-a kandupidikka.
 * 1) createdAt / created_at irundha adhu use pannu
 * 2) Illa na id-a use pannu (bigger id = newer)
 * ------------------------------------------------------------------ */
const getProductTime = (product) => {
  const createdAt = product?.createdAt || product?.created_at;
  if (createdAt) {
    const t = new Date(createdAt).getTime();
    if (Number.isFinite(t)) return t;
  }
  return Number(product?.id) || 0;
};

export default function Home() {
  const productsRef = useRef(null);

  const products = getProducts();

  /* ---------------- TRENDING NOW — latest to old ---------------- */
  const trendingProducts = products
    .filter((p) => TRENDING_PRODUCT_IDS.includes(p.id))
    .sort((a, b) => getProductTime(b) - getProductTime(a)); // latest mudhalla

  /* ---------------- FAVOURITES — last-a add panna 7 ---------------- */
  // Latest 7 products (last-a add pannadhu mudhalla varum)
  const featuredProducts = [...products]
    .sort((a, b) => getProductTime(b) - getProductTime(a)) // latest mudhalla
    .slice(0, FAVOURITES_LIMIT); // mudhal 7

  const scrollProducts = (direction) => {
    if (!productsRef.current) return;

    productsRef.current.scrollBy({
      left: direction * productsRef.current.clientWidth * 0.75,
      behavior: 'smooth',
    });
  };

  return (
    <div className="container container--full">

      {/* Categories */}
      <section
        id="categories"
        className="section section--categories home-categories"
        aria-labelledby="cat-title"
      >
        <h1 id="cat-title" className="visually-hidden">
          Shop by category
        </h1>

        <CategoryGrid />
      </section>

      {/* Divider */}
      <div className="home-divider" aria-hidden="true">
        <span className="home-divider-line" />
        <svg className="home-lotus" viewBox="0 0 32 24" fill="none">
          <path d="M16 21C9 21 5 17 5 12c4 0 7 2 9 6-1-6 0-10 2-14 2 4 3 8 2 14 2-4 5-6 9-6 0 5-4 9-11 9Z" />
          <path d="M3 18c4 0 7 1 10 3m16-3c-4 0-7 1-10 3" />
        </svg>
        <span className="home-divider-line" />
      </div>

      {/* Trending Now — latest to old */}
      {trendingProducts.length > 0 && (
        <section
          className="section section--trending home-trending"
          aria-labelledby="trend-title"
        >
          <div className="home-trending-head">
            <div>
              <h2 id="trend-title" className="section-title">
                Trending now
              </h2>
              <p className="section-sub">
                Our most loved products, handpicked for you
              </p>
            </div>

            <Link to="/shop" className="text-link">
              View all
              <ChevronRightIcon size={18} />
            </Link>
          </div>

          <div className="home-product-carousel">
            <button
              type="button"
              className="home-carousel-arrow"
              aria-label="Previous products"
              onClick={() => scrollProducts(-1)}
            >
              <ChevronRightIcon size={20} className="is-reversed" />
            </button>

            <div className="home-product-window" ref={productsRef}>
              <ProductGrid
                products={trendingProducts}
                variant="home"
                compact
                linkImageToProduct
              />
            </div>

            <button
              type="button"
              className="home-carousel-arrow"
              aria-label="Next products"
              onClick={() => scrollProducts(1)}
            >
              <ChevronRightIcon size={20} />
            </button>
          </div>
        </section>
      )}

      {/* Shop our favourites — last-a add panna 7 (latest mudhalla) */}
      <FeaturedProducts products={featuredProducts} />

      <OurStory />
      <WhyChooseUs />

    </div>
  );
}
