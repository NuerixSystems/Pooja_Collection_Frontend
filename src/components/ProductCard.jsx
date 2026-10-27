
import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useAddToCart } from '../hooks/useAddToCart';
import { getCategory } from '../services/catalog';
import { formatPrice } from '../utils/format';
import { HeartIcon } from './Icons';
import SafeImage from './SafeImage';
import './ProductCard.css';

/**
 * Convert HTML or HTML-escaped descriptions into readable plain text.
 * Product cards should show a short text preview, not raw HTML.
 */
function getDescriptionPreview(description, maxLength = 120) {
  if (!description || typeof description !== 'string') return '';

  const parser = new DOMParser();

  // Decode HTML entities, including descriptions stored as escaped HTML.
  let decoded = description;

  for (let i = 0; i < 2; i += 1) {
    const doc = parser.parseFromString(decoded, 'text/html');
    const text = doc.body.textContent || '';

    if (text === decoded) break;
    decoded = text;
  }

  // Extract readable text if the decoded content contains HTML.
  const doc = parser.parseFromString(decoded, 'text/html');
  const plainText = (doc.body.textContent || '')
    .replace(/\s+/g, ' ')
    .trim();

  if (plainText.length <= maxLength) return plainText;

  return `${plainText.slice(0, maxLength).trimEnd()}…`;
}

export default function ProductCard({ product, compact = false }) {
  const { toggleWishlist, isWishlisted, isAtMax } = useStore();
  const addToCart = useAddToCart();

  const category = getCategory(product.categorySlug);
  const wished = isWishlisted(product.id);
  const needsDesign = product.designs.length > 0;
  const atMax = !needsDesign && isAtMax(product.id);
  const to = `/product/${product.slug}`;

  const descriptionPreview = getDescriptionPreview(product.description);

  return (
    <article
      className={`product-card${compact ? ' product-card--compact' : ''}`}
    >
      <div className="product-media">
        <SafeImage
          src={product.image}
          fallbackSrc={category?.image}
          alt={product.name}
          label={product.name}
          className="product-img"
        />

        {product.tag && (
          <span className="product-badge">{product.tag}</span>
        )}

        <button
          type="button"
          className={`wish-btn ${wished ? 'is-on' : ''}`}
          aria-pressed={wished}
          aria-label={
            wished
              ? `Remove ${product.name} from wishlist`
              : `Add ${product.name} to wishlist`
          }
          onClick={() => toggleWishlist(product.id)}
        >
          <HeartIcon
            size={20}
            fill={wished ? 'currentColor' : 'none'}
          />
        </button>
      </div>

      <div className="product-info">
        {!compact && category && (
          <p className="product-cat">{category.name}</p>
        )}

        <h3 className="product-name">
          <Link to={to} className="product-link">
            {product.name}
          </Link>
        </h3>

        {!compact && descriptionPreview && (
          <p className="product-desc">{descriptionPreview}</p>
        )}

        <div className="product-foot">
          <p className="product-price">
            {formatPrice(product.price)}
            {product.compareAtPrice && (
              <s>{formatPrice(product.compareAtPrice)}</s>
            )}
          </p>

          {!compact &&
            (needsDesign ? (
              <Link
                to={to}
                className="btn btn--ghost product-add"
              >
                Choose a design
              </Link>
            ) : (
              <button
                type="button"
                className="btn btn--ghost product-add"
                disabled={atMax}
                onClick={() => addToCart(product.id)}
              >
                {atMax ? 'Maximum in cart' : 'Add to cart'}
              </button>
            ))}
        </div>
      </div>
    </article>
  );
}
