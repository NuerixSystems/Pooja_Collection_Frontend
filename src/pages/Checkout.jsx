import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SafeImage from '../components/SafeImage';
import { useStore } from '../context/StoreContext';
import { useUI } from '../context/UIContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { ApiError } from '../services/api';
import { placeOrderRemote } from '../services/orders';
import { CHECKOUT_FIELDS, validateCheckout } from '../utils/checkout';
import { formatPrice } from '../utils/format';
import './CartPage.css';
import './Checkout.css';

const newRequestId = () =>
  globalThis.crypto?.randomUUID?.() ?? `req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export default function Checkout() {
  const { lines, cartTotal, cartCount, clearCart } = useStore();
  const navigate = useNavigate();
  const { open } = useUI();
  const [values, setValues] = useState({});
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});
  // Focus must move AFTER React has rendered the error state, so a failed submit records which
  // field to focus (and a counter so repeated failures on the same field re-trigger the effect).
  const [focusRequest, setFocusRequest] = useState({ field: null, attempt: 0 });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const inputs = useRef({});
  // One id per attempt: if a response is lost and the customer retries, the server returns the same order.
  const requestId = useRef(newRequestId());
  useDocumentTitle('Checkout');

  useEffect(() => {
    if (focusRequest.field) inputs.current[focusRequest.field]?.focus();
  }, [focusRequest]);

  if (!lines.length) {
    return (
      <div className="container">
        <div className="empty">
          <h1 style={{ fontSize: '2rem' }}>Nothing to check out</h1>
          <p>Add something to your cart first.</p>
          <Link to="/shop" className="btn">Shop all</Link>
        </div>
      </div>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    const { errors: found, firstInvalid, values: clean } = validateCheckout(values);
    setErrors(found);
    if (firstInvalid) {
      setFocusRequest((r) => ({ field: firstInvalid, attempt: r.attempt + 1 }));
      return;
    }
    const customer = { ...clean, notes: notes.trim() };

    setSubmitting(true);
    setSubmitError('');
    try {
      const order = await placeOrderRemote({ customer, lines, clientRequestId: requestId.current });
      clearCart();
      navigate(`/order/${order.id}`, { replace: true });
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
      if (err instanceof ApiError && err.status === 401) open('login');
      // The server definitively said no (not a dropped connection): the next attempt is a new request.
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) requestId.current = newRequestId();
      setSubmitting(false);
    }
  };

  return (
    <div className="container">
      <section className="section">
        <div className="section-head"><h1 className="section-title">Checkout</h1></div>
        <div className="cart-layout">
          <form className="checkout-form" onSubmit={submit} noValidate>
            <h2>Delivery details</h2>
            <div className="field-grid">
              {CHECKOUT_FIELDS.map((f) => (
                <div key={f.name} className={`field ${f.wide ? 'field--wide' : ''}`}>
                  <label htmlFor={`f-${f.name}`}>{f.label}</label>
                  <input
                    ref={(el) => { inputs.current[f.name] = el; }}
                    id={`f-${f.name}`} name={f.name} type={f.type || 'text'} inputMode={f.inputMode}
                    autoComplete={f.autoComplete} value={values[f.name] || ''}
                    onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}
                    aria-invalid={errors[f.name] ? 'true' : undefined}
                    aria-describedby={errors[f.name] ? `e-${f.name}` : undefined}
                  />
                  {errors[f.name] && <p className="field-error" id={`e-${f.name}`}>{errors[f.name]}</p>}
                </div>
              ))}
              <div className="field field--wide">
                <label htmlFor="f-notes">Order notes (optional)</label>
                <textarea id="f-notes" rows="3" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </div>
            {submitError && <p className="field-error checkout-error" role="alert">{submitError}</p>}
            <button type="submit" className="btn checkout-submit" disabled={submitting}>
              {submitting ? 'Placing your order…' : `Place order · ${formatPrice(cartTotal)}`}
            </button>
          </form>

          <aside className="summary" aria-label="Order summary">
            <h2>Your order ({cartCount})</h2>
            <ul className="checkout-items">
              {lines.map(({ key, product, design, qty }) => (
                <li key={key}>
                  <SafeImage src={product.image} alt="" label={product.name} />
                  <span className="checkout-item-name">
                    {product.name}<small> × {qty}</small>
                    {design && <small className="checkout-item-design">Design: {design.label}</small>}
                  </span>
                  <span>{formatPrice(product.price * qty)}</span>
                </li>
              ))}
            </ul>
            <p className="summary-row summary-total"><span>Total</span><strong>{formatPrice(cartTotal)}</strong></p>
            <Link to="/cart" className="text-link summary-continue">Edit cart</Link>
          </aside>
        </div>
      </section>
    </div>
  );
}
