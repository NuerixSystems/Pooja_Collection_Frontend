import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import RecommendedProducts from '../components/RecommendedProducts';
import ReviewsSection from '../components/ReviewsSection';
import SafeImage from '../components/SafeImage';
import { HeartIcon } from '../components/Icons';
import { useStore } from '../context/StoreContext';
import { useAddToCart } from '../hooks/useAddToCart';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { getCategory, getOtherProducts, getProductBySlug } from '../services/catalog';
import { formatPrice } from '../utils/format';
import NotFound from './NotFound';
import './ProductPage.css';

function ProductDetails({ product }) {
  const { toggleWishlist, isWishlisted, isAtMax, maxQty } = useStore();
  const addToCart = useAddToCart();
  const [designId, setDesignId] = useState(null);
  const [designError, setDesignError] = useState(false);
  const pickerRef = useRef(null);

  const category = getCategory(product.categorySlug);
  const needsDesign = product.designs.length > 0;
  const wished = isWishlisted(product.id);
  const atMax = isAtMax(product.id, needsDesign ? designId : null);
  const others = getOtherProducts(product);

  const add = () => {
    const result = addToCart(product.id, designId);
    if (result.reason === 'design-required') {
      setDesignError(true);
      pickerRef.current?.querySelector('input')?.focus();
      return;
    }
  };

  return (
    <div className="container">
      <section className="section product-page">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link> / <Link to="/shop">Shop</Link>
          {category && <> / <Link to={`/category/${category.slug}`}>{category.name}</Link></>}
          {' '}/ <span aria-current="page">{product.name}</span>
        </nav>

        <div className="product-page-layout">
          <div className="product-page-media">
            <SafeImage src={product.image} alt={product.name} label={product.name} className="product-img" loading="eager" />
            {product.tag && <span className="product-badge">{product.tag}</span>}
          </div>

          <div className="product-page-info">
            {category && <p className="product-cat">{category.name}</p>}
            <h1 className="product-page-title">{product.name}</h1>
            <p className="product-page-price">
              {formatPrice(product.price)}
              {product.compareAtPrice && <s>{formatPrice(product.compareAtPrice)}</s>}
            </p>
            {product.description && <p className="product-page-desc">{product.description}</p>}

            {needsDesign && (
              <fieldset className="design-picker" ref={pickerRef} aria-describedby={designError ? 'design-error' : undefined}>
                <legend>Choose a design</legend>
                <div className="design-options">
                  {product.designs.map((d) => (
                    <label key={d.id} className={`design-option ${designId === d.id ? 'is-selected' : ''}`}>
                      <input
                        type="radio" name="design" value={d.id} checked={designId === d.id}
                        onChange={() => { setDesignId(d.id); setDesignError(false); }}
                      />
                      <span>{d.label}</span>
                    </label>
                  ))}
                </div>
                {designError && <p className="field-error" id="design-error" role="alert">Select a design to add this item to your cart.</p>}
              </fieldset>
            )}

            <div className="product-page-actions">
              <button type="button" className="btn product-page-add" onClick={add} disabled={atMax}>
                {atMax ? 'Maximum in cart' : 'Add to cart'}
              </button>
              <button
                type="button" className={`btn btn--ghost product-page-wish ${wished ? 'is-on' : ''}`}
                aria-pressed={wished} onClick={() => toggleWishlist(product.id)}
              >
                <HeartIcon size={20} fill={wished ? 'currentColor' : 'none'} /> {wished ? 'Saved' : 'Save'}
              </button>
            </div>
            {atMax && <p className="qty-note">You can order up to {maxQty} of this item at a time.</p>}
          </div>
        </div>
      </section>

      <ReviewsSection product={product} />

      <RecommendedProducts products={others} />
    </div>
  );
}

export default function ProductPage() {
  const { slug } = useParams();
  const product = getProductBySlug(slug);
  useDocumentTitle(product ? product.name : 'Product not found');
  if (!product) return <NotFound message="We couldn't find that product." />;
  // keyed so the selected design never carries over from one product to the next
  return <ProductDetails key={product.slug} product={product} />;
}
