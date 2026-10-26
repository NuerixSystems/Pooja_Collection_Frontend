import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import RecommendedProducts from '../components/RecommendedProducts';
import ReviewsSection from '../components/ReviewsSection';
import SafeImage from '../components/SafeImage';
import { HeartIcon } from '../components/Icons';
import { useStore } from '../context/StoreContext';
import { useUI } from '../context/UIContext';
import { useAddToCart } from '../hooks/useAddToCart';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { getCategory, getOtherProducts, getProductBySlug } from '../services/catalog';
import { getAddresses, setDefaultAddress } from '../services/address';
import { getSession } from '../services/auth';
import { formatPrice } from '../utils/format';
import NotFound from './NotFound';
import './ProductPage.css';

function ProductDetails({ product }) {
  const { toggleWishlist, isWishlisted, isAtMax, maxQty } = useStore();
  const { setCheckoutAddress } = useUI();
  const addToCart = useAddToCart();
  const [designId, setDesignId] = useState(null);
  const [designError, setDesignError] = useState(false);
  const pickerRef = useRef(null);

  // Address Feature State (Modal + Multiple Address)
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  
  const session = getSession();
  const sessionToken = session?.token; 

  useEffect(() => {
    if (sessionToken) {
      getAddresses()
        .then((data) => {
          setAddresses(data);
          const defaultAddr = data.find((a) => a.isDefault);
          if (defaultAddr) {
            setSelectedAddress(defaultAddr);
            // 👇 Default address ah context la save pannu (Checkout-ku pass aaga)
            setCheckoutAddress(defaultAddr);
          } else if (data.length > 0) {
            setSelectedAddress(data[0]);
            // 👇 First address ah context la save pannu
            setCheckoutAddress(data[0]);
          }
        })
        .catch(() => setAddresses([]));
    }
  }, [sessionToken, setCheckoutAddress]);

  const handleSelectAddress = async (addr) => {
    try {
      await setDefaultAddress(addr.id);
      setSelectedAddress(addr);
      setShowAddressModal(false);
      setAddresses((prev) =>
        prev.map((a) => ({ ...a, isDefault: a.id === addr.id }))
      );
      
      console.log('✅ Address selected:', addr);
      setCheckoutAddress(addr); 
      console.log('✅ Setting checkout address to context');
      
    } catch (error) {
      console.error('❌ Failed to select address:', error);
      alert('Failed to update address. Please try again.');
    }
  };

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

            {/* Deliver to Box (Modal with Multiple Addresses) */}
            <div className="delivery-box">
              {sessionToken ? (
                <div className="delivery-box-inner">
                  <div className="delivery-info">
                    <span className="delivery-label">Deliver to:</span>{' '}
                    <span className="delivery-address">
                      {selectedAddress
                        ? `${selectedAddress.name}, ${selectedAddress.pincode}`
                        : 'No address saved.'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddressModal(true)}
                    className="delivery-change-btn"
                  >
                    {selectedAddress ? 'Change' : 'Add'}
                  </button>
                </div>
              ) : (
                <p className="delivery-text">
                  <Link to="/login" className="delivery-change">Login</Link> to see delivery options
                </p>
              )}
            </div>

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

      {/* Address Selection Modal */}
      {showAddressModal && (
        <div className="address-modal-overlay" onClick={() => setShowAddressModal(false)}>
          <div className="address-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="address-modal-title">Select Delivery Address</h3>
            {addresses.length === 0 ? (
              <div className="address-modal-empty">
                <p>No addresses saved.</p>
                <Link to="/account/addresses" className="btn btn--ghost">Add New Address</Link>
              </div>
            ) : (
              <ul className="address-modal-list">
                {addresses.map((addr) => (
                  <li
                    key={addr.id}
                    className={`address-modal-item ${selectedAddress?.id === addr.id ? 'selected' : ''}`}
                    onClick={() => handleSelectAddress(addr)}
                  >
                    <div className="address-modal-radio">
                      <input type="radio" checked={selectedAddress?.id === addr.id} readOnly />
                    </div>
                    <div className="address-modal-details">
                      <strong>{addr.name}</strong> {addr.isDefault && <span className="default-tag">Default</span>}
                      <p>{addr.addressLine}, {addr.city}, {addr.state} - {addr.pincode}</p>
                      <small>{addr.phone}</small>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              className="btn btn--ghost address-modal-close"
              onClick={() => setShowAddressModal(false)}
            >
              Close
            </button>
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
  if (!product) return <NotFound message="We couldn't find that product." />;
  return <ProductDetails key={product.slug} product={product} />;
}