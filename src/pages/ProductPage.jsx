
import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import RecommendedProducts from '../components/RecommendedProducts';
import ReviewsSection from '../components/ReviewsSection';
import SafeImage from '../components/SafeImage';
import { HeartIcon } from '../components/Icons';
import { useStore } from '../context/StoreContext';
import { useAddToCart } from '../hooks/useAddToCart';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import {
  getCategory,
  getOtherProducts,
  getProductBySlug,
  getProductGallery,
} from '../services/catalog';
import { formatPrice } from '../utils/format';
import NotFound from './NotFound';
import './ProductPage.css';

function sanitizeDescriptionHtml(input) {
  if (!input || typeof input !== 'string') return '';

  const parser = new DOMParser();
  let doc = parser.parseFromString(input, 'text/html');

  // Decode HTML-escaped descriptions.
  for (let i = 0; i < 3; i += 1) {
    const decodedText = doc.body.textContent || '';

    if (!/<\/?[a-z][\s\S]*>/i.test(decodedText)) break;

    const decodedDoc = parser.parseFromString(decodedText, 'text/html');

    if (decodedDoc.body.innerHTML === doc.body.innerHTML) break;

    doc = decodedDoc;
  }

  const allowedTags = new Set([
    'P', 'BR', 'STRONG', 'B', 'EM', 'I', 'U',
    'UL', 'OL', 'LI',
    'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
    'BLOCKQUOTE', 'A', 'SPAN', 'DIV',
  ]);

  const blockedTags = new Set([
    'SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED',
    'SVG', 'MATH', 'FORM', 'INPUT', 'BUTTON',
    'VIDEO', 'AUDIO', 'TEMPLATE',
  ]);

  const allowedStyles = new Set([
    'color', 'background-color', 'font-size',
    'font-family', 'font-weight', 'font-style',
    'text-decoration', 'text-align',
  ]);

  function cleanChildren(parent) {
    for (const node of [...parent.childNodes]) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;

      const tag = node.tagName;

      if (blockedTags.has(tag)) {
        node.remove();
        continue;
      }

      if (!allowedTags.has(tag)) {
        node.replaceWith(...node.childNodes);
        continue;
      }

      const originalStyle = node.getAttribute('style');
      const originalHref = tag === 'A' ? node.getAttribute('href') : null;

      for (const attr of [...node.attributes]) {
        node.removeAttribute(attr.name);
      }

      if (originalStyle) {
        const safeStyles = [];

        for (const declaration of originalStyle.split(';')) {
          const colon = declaration.indexOf(':');
          if (colon === -1) continue;

          const property = declaration.slice(0, colon).trim().toLowerCase();
          const value = declaration.slice(colon + 1).trim();

          if (
            allowedStyles.has(property) &&
            value &&
            !/url\s*\(|expression\s*\(|javascript:|[<>]/i.test(value)
          ) {
            safeStyles.push(`${property}: ${value}`);
          }
        }

        if (safeStyles.length) {
          node.setAttribute('style', safeStyles.join('; '));
        }
      }

      if (tag === 'A' && originalHref) {
        try {
          const url = new URL(originalHref, window.location.origin);

          if (['https:', 'http:', 'mailto:'].includes(url.protocol)) {
            node.setAttribute('href', url.href);

            if (url.protocol !== 'mailto:') {
              node.setAttribute('target', '_blank');
              node.setAttribute('rel', 'noopener noreferrer');
            }
          }
        } catch {
          // Ignore invalid links.
        }
      }

      cleanChildren(node);
    }
  }

  cleanChildren(doc.body);

  doc.body.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach((heading) => {
    if (!heading.textContent.trim()) heading.remove();
  });

  return doc.body.innerHTML;
}

function ProductDetails({ product }) {
  const { toggleWishlist, isWishlisted, isAtMax, maxQty } = useStore();
  const addToCart = useAddToCart();

  const [galleryImages, setGalleryImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(product.image || '');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [designId, setDesignId] = useState(null);
  const [designError, setDesignError] = useState(false);

  const pickerRef = useRef(null);
  const closeButtonRef = useRef(null);

  useEffect(() => {
    let active = true;

    getProductGallery(product.slug)
      .then((images) => {
        if (!active) return;

        const uniqueImages = [...new Set(
          (images || []).filter(
            (image) => typeof image === 'string' && image.trim()
          )
        )];

        const allImages = uniqueImages.length
          ? uniqueImages
          : [product.image].filter(Boolean);

        setGalleryImages(allImages);
        setSelectedImage(allImages[0] || '');
      })
      .catch((error) => {
        console.error('Failed to load product gallery:', error);

        if (active) {
          const fallback = [product.image].filter(Boolean);
          setGalleryImages(fallback);
          setSelectedImage(fallback[0] || '');
        }
      });

    return () => {
      active = false;
    };
  }, [product.slug, product.image]);

  const category = getCategory(product.categorySlug);
  const needsDesign = product.designs.length > 0;
  const wished = isWishlisted(product.id);
  const atMax = isAtMax(product.id, needsDesign ? designId : null);
  const others = getOtherProducts(product);

  const description = product.description || '';
  const hasHtml = /<\/?[a-z][\s\S]*>/i.test(description);
  const safeDescription = sanitizeDescriptionHtml(description);

  const currentImageIndex = Math.max(
    0,
    galleryImages.indexOf(selectedImage)
  );

  const showImage = (index) => {
    if (!galleryImages.length) return;

    const nextIndex =
      (index + galleryImages.length) % galleryImages.length;

    setSelectedImage(galleryImages[nextIndex]);
  };

  const showPrevious = () => showImage(currentImageIndex - 1);
  const showNext = () => showImage(currentImageIndex + 1);

  // Lock background scrolling and support keyboard navigation.
  useEffect(() => {
    if (!lightboxOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setLightboxOpen(false);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        showImage(currentImageIndex - 1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        showImage(currentImageIndex + 1);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [lightboxOpen, currentImageIndex, galleryImages]);

  const add = () => {
    const result = addToCart(product.id, designId);

    if (result.reason === 'design-required') {
      setDesignError(true);
      pickerRef.current?.querySelector('input')?.focus();
    }
  };

  return (
    <div className="container">
      <section className="section product-page">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link> / <Link to="/shop">Shop</Link>
          {category && (
            <>
              {' / '}
              <Link to={`/category/${category.slug}`}>
                {category.name}
              </Link>
            </>
          )}
          {' / '}
          <span aria-current="page">{product.name}</span>
        </nav>

        <div className="product-page-layout">
          <div className="product-page-gallery">
            <div className="product-page-media">
              <button
                type="button"
                className="product-main-image-trigger"
                onClick={() => setLightboxOpen(true)}
                aria-label={`Enlarge ${product.name} images`}
              >
                <SafeImage
                  src={selectedImage || product.image}
                  fallbackSrc={category?.image}
                  alt={product.name}
                  label={product.name}
                  className="product-img"
                  loading="eager"
                />
                <span className="product-image-zoom-hint">
                  Click to enlarge
                </span>
              </button>

              {product.tag && (
                <span className="product-badge">{product.tag}</span>
              )}
            </div>

            {galleryImages.length > 1 && (
              <div
                className="product-gallery-thumbnails"
                aria-label="Product images"
              >
                {galleryImages.map((src, index) => (
                  <button
                    type="button"
                    key={src}
                    className={`product-gallery-thumbnail${
                      selectedImage === src ? ' is-selected' : ''
                    }`}
                    onClick={() => setSelectedImage(src)}
                    aria-label={`View product image ${index + 1}`}
                    aria-pressed={selectedImage === src}
                  >
                    <SafeImage
                      src={src}
                      fallbackSrc={category?.image}
                      alt={`${product.name} image ${index + 1}`}
                      label={product.name}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="product-page-info">
            {category && <p className="product-cat">{category.name}</p>}

            <h1 className="product-page-title">{product.name}</h1>

            <p className="product-page-price">
              {formatPrice(product.price)}
              {product.compareAtPrice && (
                <s>{formatPrice(product.compareAtPrice)}</s>
              )}
            </p>

            {description.trim() && (
              hasHtml ? (
                <div
                  className="product-page-desc product-rich-description"
                  dangerouslySetInnerHTML={{
                    __html: safeDescription,
                  }}
                />
              ) : (
                <p className="product-page-desc">{description}</p>
              )
            )}

            {needsDesign && (
              <fieldset
                className="design-picker"
                ref={pickerRef}
                aria-describedby={designError ? 'design-error' : undefined}
              >
                <legend>Choose a design</legend>

                <div className="design-options">
                  {product.designs.map((design) => (
                    <label
                      key={design.id}
                      className={`design-option ${
                        designId === design.id ? 'is-selected' : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="design"
                        value={design.id}
                        checked={designId === design.id}
                        onChange={() => {
                          setDesignId(design.id);
                          setDesignError(false);
                        }}
                      />
                      <span>{design.label}</span>
                    </label>
                  ))}
                </div>

                {designError && (
                  <p className="field-error" id="design-error" role="alert">
                    Select a design to add this item to your cart.
                  </p>
                )}
              </fieldset>
            )}

            <div className="product-page-actions">
              <button
                type="button"
                className="btn product-page-add"
                onClick={add}
                disabled={atMax}
              >
                {atMax ? 'Maximum in cart' : 'Add to cart'}
              </button>

              <button
                type="button"
                className={`btn btn--ghost product-page-wish ${
                  wished ? 'is-on' : ''
                }`}
                aria-pressed={wished}
                onClick={() => toggleWishlist(product.id)}
              >
                <HeartIcon
                  size={20}
                  fill={wished ? 'currentColor' : 'none'}
                />
                {wished ? 'Saved' : 'Save'}
              </button>
            </div>

            {atMax && (
              <p className="qty-note">
                You can order up to {maxQty} of this item at a time.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Full-screen product slideshow */}
      {lightboxOpen && galleryImages.length > 0 && (
        <div
          className="product-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`${product.name} image gallery`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setLightboxOpen(false);
            }
          }}
        >
          <button
            ref={closeButtonRef}
            type="button"
            className="product-lightbox-close"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close slideshow"
          >
            ×
          </button>

          <div className="product-lightbox-content">
            <p className="product-lightbox-title">{product.name}</p>

            <div className="product-lightbox-stage">
              {galleryImages.length > 1 && (
                <button
                  type="button"
                  className="product-lightbox-arrow product-lightbox-prev"
                  onClick={showPrevious}
                  aria-label="Previous image"
                >
                  ‹
                </button>
              )}

              <SafeImage
                key={selectedImage}
                src={selectedImage}
                fallbackSrc={category?.image}
                alt={`${product.name}, image ${currentImageIndex + 1}`}
                label={product.name}
                className="product-lightbox-image"
              />

              {galleryImages.length > 1 && (
                <button
                  type="button"
                  className="product-lightbox-arrow product-lightbox-next"
                  onClick={showNext}
                  aria-label="Next image"
                >
                  ›
                </button>
              )}
            </div>

            <p className="product-lightbox-counter">
              {currentImageIndex + 1} / {galleryImages.length}
            </p>

            {galleryImages.length > 1 && (
              <div
                className="product-lightbox-thumbnails"
                aria-label="Choose an image"
              >
                {galleryImages.map((src, index) => (
                  <button
                    type="button"
                    key={src}
                    className={`product-lightbox-thumbnail${
                      selectedImage === src ? ' is-selected' : ''
                    }`}
                    onClick={() => setSelectedImage(src)}
                    aria-label={`Show image ${index + 1}`}
                    aria-pressed={selectedImage === src}
                  >
                    <SafeImage
                      src={src}
                      alt={`${product.name} thumbnail ${index + 1}`}
                      label={product.name}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <ReviewsSection product={product} />
      <RecommendedProducts products={others} />
    </div>
  );
}

export default function ProductPage() {
  const { slug } = useParams();
  const product = getProductBySlug(slug);

  useDocumentTitle(product ? product.name : 'Product not found');

  if (!product) {
    return <NotFound message="We couldn't find that product." />;
  }

  return <ProductDetails key={product.slug} product={product} />;
}