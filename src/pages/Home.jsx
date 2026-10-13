import { Link } from 'react-router-dom';
import CategoryGrid from '../components/CategoryGrid';
import ProductGrid from '../components/ProductGrid';
import { OurStory, WhyChooseUs } from '../components/HomeSections';
import { getTrendingProducts } from '../services/catalog';

// No hero banner: categories are the first thing on the page.
export default function Home() {
  return (
    <div className="container container--full">
      <section id="categories" className="section section--categories" aria-labelledby="cat-title">
        <div className="section-head">
          <h1 id="cat-title" className="section-title">Shop by category</h1>
          <p className="section-sub">Find your favourite pieces</p>
        </div>
        <CategoryGrid />
      </section>

      <section className="section section--trending" aria-labelledby="trend-title">
        <div className="section-head">
          <h2 id="trend-title" className="section-title">Trending now</h2>
          <Link to="/shop" className="text-link">View all</Link>
        </div>
        <ProductGrid products={getTrendingProducts(8, 1)} />
      </section>

      <OurStory />
      <WhyChooseUs />
    </div>
  );
}
