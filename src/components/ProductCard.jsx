import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useAddToCart } from '../hooks/useAddToCart';
import { getCategory } from '../services/catalog';
import { formatPrice } from '../utils/format';
import { HeartIcon } from './Icons';
import SafeImage from './SafeImage';
import './ProductCard.css';

// The whole card opens the product page through a "stretched" link on the product name
// (see ProductCard.css), so there are no nested interactive elements. The wishlist and
// add-to-cart buttons sit above that link.
export default function ProductCard({ product }) {
  const { toggleWishlist, isWishlisted, isAtMax } = useStore();
  const addToCart = useAddToCart();
  const wished = isWishlisted(product.id);
  const needsDesign = product.designs.length > 0;
  const atMax = !needsDesign && isAtMax(product.id);
  const to = `/product/${product.slug}`;

  return (
    <article className="product-card">
      <div className="product-media">
        <SafeImage src={product.image} alt="" label={product.name} className="product-img" />
        {product.tag && <span className="product-badge">{product.tag}</span>}
        <button
          type="button" className={`wish-btn ${wished ? 'is-on' : ''}`}
          aria-pressed={wished} aria-label={wished ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          onClick={() => toggleWishlist(product.id)}
        >
          <HeartIcon size={20} fill={wished ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="product-info">
        <p className="product-cat">{getCategory(product.categorySlug)?.name}</p>
        <h3 className="product-name"><Link to={to} className="product-link">{product.name}</Link></h3>
        {product.description && <p className="product-desc">{product.description}</p>}
        <div className="product-foot">
          <p className="product-price">
            {formatPrice(product.price)}
            {product.compareAtPrice && <s>{formatPrice(product.compareAtPrice)}</s>}
          </p>
          {needsDesign ? (
            <Link to={to} className="btn btn--ghost product-add">Choose a design</Link>
          ) : (
            <button
              type="button" className="btn btn--ghost product-add" disabled={atMax}
              onClick={() => addToCart(product.id)}
            >
              {atMax ? 'Maximum in cart' : 'Add to cart'}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
