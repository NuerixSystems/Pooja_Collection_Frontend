import { Link } from 'react-router-dom';
import QuantityStepper from '../components/QuantityStepper';
import SafeImage from '../components/SafeImage';
import { TrashIcon } from '../components/Icons';
import { useStore } from '../context/StoreContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { formatPrice } from '../utils/format';
import './CartPage.css';

export default function CartPage() {
  const { lines, cartTotal, cartCount, maxQty, setQty, removeFromCart } = useStore();
  useDocumentTitle('Your cart');

  if (!lines.length) {
    return (
      <div className="container">
        <div className="empty">
          <h1 style={{ fontSize: '2rem' }}>Your cart is empty</h1>
          <p>Pick a category and add something you love.</p>
          <p className="empty-actions">
            <Link to="/shop" className="btn">Browse the shop</Link>
            <Link to="/wishlist" className="btn btn--ghost">View wishlist</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <section className="section">
        <div className="section-head"><h1 className="section-title">Your cart <span className="muted">({cartCount})</span></h1></div>
        <div className="cart-layout">
          <ul className="cart-page-lines">
            {lines.map(({ key, product, design, qty }) => {
              const label = design ? `${product.name} (${design.label})` : product.name;
              return (
                <li key={key} className="cart-page-line">
                  <Link to={`/product/${product.slug}`} className="cart-page-thumb" aria-label={`View ${product.name}`}>
                    <SafeImage src={product.image} alt="" label={product.name} />
                  </Link>
                  <div className="cart-page-info">
                    <Link to={`/product/${product.slug}`} className="cart-page-name">{product.name}</Link>
                    {design && <p className="muted">Design: {design.label}</p>}
                    <p className="muted">{formatPrice(product.price)} each</p>
                    <QuantityStepper name={label} qty={qty} max={maxQty} onChange={(n) => setQty(key, n)} />
                  </div>
                  <div className="cart-page-side">
                    <strong>{formatPrice(product.price * qty)}</strong>
                    <button type="button" className="link-btn" onClick={() => removeFromCart(key)} aria-label={`Remove ${label}`}>
                      <TrashIcon size={18} /> Remove
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          <aside className="summary" aria-label="Order summary">
            <h2>Order summary</h2>
            <p className="summary-row"><span>Subtotal ({cartCount} {cartCount === 1 ? 'item' : 'items'})</span><strong>{formatPrice(cartTotal)}</strong></p>
            <p className="summary-row summary-total"><span>Total</span><strong>{formatPrice(cartTotal)}</strong></p>
            <Link to="/contact" className="btn">Proceed to checkout</Link>
            <Link to="/shop" className="text-link summary-continue">Continue shopping</Link>
          </aside>
        </div>
      </section>
    </div>
  );
}
