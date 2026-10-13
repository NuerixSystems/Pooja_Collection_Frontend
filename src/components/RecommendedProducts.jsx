import { Link } from 'react-router-dom';
import { getCategory } from '../services/catalog';
import { formatPrice } from '../utils/format';
import SafeImage from './SafeImage';
import './RecommendedProducts.css';

// "You May Also Like": a compact card per product (image, category, name, price). The whole card opens
// that product's page through a stretched link on the name, same pattern as ProductCard.
export default function RecommendedProducts({ products }) {
  return (
    <section className="section reco" aria-labelledby="reco-title">
      <div className="section-head"><h2 id="reco-title" className="section-title">You May Also Like</h2></div>
      {products.length === 0 ? (
        <p className="reco-empty">No other products to show right now. Please check back soon.</p>
      ) : (
        <div className="reco-grid">
          {products.map((p) => (
            <article className="reco-card" key={p.id}>
              <div className="reco-media">
                <SafeImage src={p.image} alt="" label={p.name} className="reco-img" />
              </div>
              <div className="reco-info">
                <p className="reco-cat">{getCategory(p.categorySlug)?.name}</p>
                <h3 className="reco-name"><Link to={`/product/${p.slug}`} className="reco-link">{p.name}</Link></h3>
                <p className="reco-price">
                  {formatPrice(p.price)}
                  {p.compareAtPrice && <s>{formatPrice(p.compareAtPrice)}</s>}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
