import { Link } from 'react-router-dom';
import { BRAND } from '../config';
import { getCategory, getCategories } from '../services/catalog';
import ProductGrid from './ProductGrid';
import { ArrowRightIcon, AwardIcon, GemIcon } from './Icons';
import './HomeSections.css';

const FEATURES = [
  { icon: GemIcon, title: 'Elegant Designs', text: 'Pieces chosen for their beauty and style.' },
  { icon: AwardIcon, title: 'Quality Craftsmanship', text: 'Jewellery selected with care and attention.' },
];

export function OurStory() {
  // Real catalogue imagery (backend media) as the banner backdrop; plain gradient if none is available.
  const cat = getCategory('bridal-traditional') || getCategories()[0];
  const style = cat?.image ? { '--story-img': `url("${cat.image}")` } : undefined;
  return (
    <section className="story" style={style} aria-labelledby="story-title">
      <div className="story-inner">
        <h2 id="story-title" className="story-title">More Than Just Jewellery</h2>
        <p className="story-text">{BRAND.name} brings you style, beauty and elegance in every piece, from everyday jewellery to festive favourites.</p>
        <Link to="/about" className="story-btn">Our Story <ArrowRightIcon size={18} /></Link>
      </div>
    </section>
  );
}

export function WhyChooseUs() {
  return (
    <section className="why" aria-labelledby="why-title">
      <h2 id="why-title" className="section-title why-title">Why Choose {BRAND.name}?</h2>
      <ul className="why-grid">
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <li key={title} className="why-card">
            <span className="why-icon"><Icon size={28} /></span>
            <h3 className="why-card-title">{title}</h3>
            <p className="why-card-text">{text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function FeaturedProducts({ products }) {
  if (!products.length) return null;

  return (
    <section className="home-picks" aria-labelledby="picks-title">
      <div className="home-picks-head">
        <div>
          <h2 id="picks-title" className="section-title">Shop our favourites</h2>
          <p className="section-sub">Find a piece you’ll love, ready to add to your cart.</p>
        </div>
        <Link to="/shop" className="text-link">View all <ArrowRightIcon size={18} /></Link>
      </div>
      <ProductGrid products={products} variant="picks" compact={false} />
    </section>
  );
}
