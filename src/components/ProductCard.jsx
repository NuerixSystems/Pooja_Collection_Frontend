
import { Link } from 'react-router-dom';

import { useStore } from '../context/StoreContext';
import { useUI } from '../context/UIContext';
import { useAddToCart } from '../hooks/useAddToCart';
import { getCategory } from '../services/catalog';
import { getSession } from '../services/session';
import { formatPrice } from '../utils/format';

import { HeartIcon } from './Icons';
import SafeImage from './SafeImage';

import './ProductCard.css';


function getDescriptionPreview(description, maxLength = 120) {
  if (!description || typeof description !== 'string') {
    return '';
  }

  const parser = new DOMParser();
  let decoded = description;

  for (let i = 0; i < 2; i += 1) {
    const parsedText =
      parser.parseFromString(decoded, 'text/html')
        .body.textContent || '';

    if (parsedText === decoded) break;

    decoded = parsedText;
  }

  const plain = (
    parser.parseFromString(decoded, 'text/html')
      .body.textContent || ''
  ).replace(/\s+/g, ' ').trim();

  return plain.length <= maxLength
    ? plain
    : `${plain.slice(0, maxLength).trimEnd()}…`;
}


function stockOf(product) {
  const raw =
    product?.stock_quantity ??
    product?.stockQuantity;

  const quantity = Number(raw ?? 0);

  return Number.isFinite(quantity)
    ? Math.max(0, Math.floor(quantity))
    : 0;
}


export default function ProductCard({
  product,
  compact = false,
  linkImageToProduct = false,
}) {
  const {
    toggleWishlist,
    isWishlisted,
    isAtMax,
  } = useStore();

  const { open } = useUI();
  const addToCart = useAddToCart();

  const category = getCategory(product.categorySlug);

  const stock = stockOf(product);
  const outOfStock = stock === 0;
  const lowStock = stock > 0 && stock < 3;

  const wished = isWishlisted(product.id);

  const needsDesign =
    (product.designs || []).length > 0;

  const atMax =
    !needsDesign && isAtMax(product.id);

  const to = `/product/${product.slug}`;

  const descriptionPreview =
    getDescriptionPreview(product.description);


  // Wishlist remains enabled even when the product is out of stock.
  const handleWishlistToggle = () => {
    if (!getSession() && !wished) {
      open('login');
      return;
    }

    toggleWishlist(product.id);
  };


  // Prevent adding products when stock is zero.
  const handleAddToCart = () => {
    if (outOfStock || needsDesign || atMax) return;

    addToCart(product.id);
  };


  return (
    <article
      className={[
        'product-card',
        compact ? 'product-card--compact' : '',
        outOfStock ? 'product-card--out-of-stock' : '',
      ].filter(Boolean).join(' ')}
      data-stock={stock}
    >

      <div className="product-media">

        {linkImageToProduct ? (
          <Link
            to={to}
            className="product-image-link"
            aria-label={`View ${product.name}`}
          >
            <SafeImage
              src={product.image}
              fallbackSrc={category?.image}
              alt={product.name}
              label={product.name}
              className="product-img"
            />
          </Link>
        ) : (
          <SafeImage
            src={product.image}
            fallbackSrc={category?.image}
            alt={product.name}
            label={product.name}
            className="product-img"
          />
        )}

        {product.tag && !outOfStock && (
          <span className="product-badge">
            {product.tag}
          </span>
        )}


        {/* Wishlist stays clickable for every stock level */}
        <button
          type="button"
          className={`wish-btn ${wished ? 'is-on' : ''}`}
          aria-pressed={wished}
          aria-label={
            wished
              ? `Remove ${product.name} from wishlist`
              : `Add ${product.name} to wishlist`
          }
          onClick={handleWishlistToggle}
        >
          <HeartIcon
            size={20}
            fill={wished ? 'currentColor' : 'none'}
          />
        </button>

      </div>


      <div className="product-info">

        {!compact && category && (
          <p className="product-cat">
            {category.name}
          </p>
        )}

        <h3 className="product-name">
          {outOfStock ? (
            <span
              className="product-link product-link--disabled"
              aria-disabled="true"
            >
              {product.name}
            </span>
          ) : (
            <Link
              to={to}
              className="product-link"
            >
              {product.name}
            </Link>
          )}
        </h3>

        {!compact && descriptionPreview && (
          <p className="product-desc">
            {descriptionPreview}
          </p>
        )}

        <div className="product-foot">

          <p className="product-price">
            {formatPrice(product.price)}

            {product.compareAtPrice && (
              <s>
                {formatPrice(product.compareAtPrice)}
              </s>
            )}
          </p>

          {!compact && lowStock && (
            <span className="stock-badge" role="status">
              Only {stock} left
            </span>
          )}

          {!compact && (
            outOfStock ? (
              <button
                type="button"
                className="btn btn--ghost product-add product-add--out-of-stock"
                disabled
                aria-disabled="true"
              >
                Out of Stock
              </button>
            ) : needsDesign ? (
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
                onClick={handleAddToCart}
              >
                {atMax ? 'Maximum in cart' : 'Add to cart'}
              </button>
            )
          )}

        </div>
      </div>

    </article>
  );
}
