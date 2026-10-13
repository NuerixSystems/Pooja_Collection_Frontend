import { Link } from 'react-router-dom';
import { BRAND } from '../config';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import './Legal.css';

export default function About() {
  useDocumentTitle('About Us');
  return (
    <div className="container">
      <section className="section legal-page about-page">
        <p className="eyebrow">Our story</p>
        <h1 className="section-title">About us</h1>
        <p className="legal-text about-lede">
          {BRAND.name} brings you {BRAND.tagline.join(', ').toLowerCase()} in every piece, from everyday jewellery to festive favourites.
          Have a question about a product or an order? We’re just a message away.
        </p>
        <p className="about-actions">
          <Link to="/shop" className="btn">Shop the collection</Link>
          <Link to="/contact" className="btn btn--ghost">Contact us</Link>
        </p>
      </section>
    </div>
  );
}
