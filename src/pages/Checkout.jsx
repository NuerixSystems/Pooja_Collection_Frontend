import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SafeImage from '../components/SafeImage';
import { useStore } from '../context/StoreContext';
import { useUI } from '../context/UIContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { ApiError } from '../services/api';
import { getAddresses } from '../services/address';
import { getSession } from '../services/auth';
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
  const { open, checkoutAddress } = useUI();

  // 👇 DEBUG LOG to check if address is in context
  console.log('🟢 Checkout Address in context:', checkoutAddress);

  const [values, setValues] = useState(() => {
    if (checkoutAddress) {
      return {
        name: checkoutAddress.name || '',
        phone: checkoutAddress.phone || '',
        pincode: checkoutAddress.pincode || '',
        address: checkoutAddress.addressLine || '',
        city: checkoutAddress.city || '',
        state: checkoutAddress.state || '',
      };
    }
    return {};
  });

  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});
  const [focusRequest, setFocusRequest] = useState({ field: null, attempt: 0 });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  
  // Address feature
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const session = getSession();

  const inputs = useRef({});
  const requestId = useRef(newRequestId());
  useDocumentTitle('Checkout');

  useEffect(() => {
    if (session) {
      getAddresses()
        .then((data) => {
          setSavedAddresses(data);
          const defaultAddr = data.find(a => a.isDefault);
          if (defaultAddr) {
            setSelectedAddressId(defaultAddr.id);
            setValues({
              name: defaultAddr.name,
              phone: defaultAddr.phone,
              pincode: defaultAddr.pincode,
              address: defaultAddr.addressLine,
              city: defaultAddr.city,
              state: defaultAddr.state,
            });
          }
        })
        .catch(() => {});
    }
  }, [session]);

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

  const handleSelectAddress = (addr) => {
    setSelectedAddressId(addr.id);
    setValues({
      name: addr.name,
      phone: addr.phone,
      pincode: addr.pincode,
      address: addr.addressLine,
      city: addr.city,
      state: addr.state,
    });
  };

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
            {savedAddresses.length > 0 && (
              <div className="saved-addresses mb-4">
                <h3 className="text-lg font-semibold mb-2">Saved Addresses</h3>
                <div className="space-y-2">
                  {savedAddresses.map((addr) => (
                    <label key={addr.id} className={`address-card border p-3 rounded cursor-pointer ${selectedAddressId === addr.id ? 'border-blue-500 bg-blue-50' : ''}`}>
                      <input
                        type="radio"
                        name="savedAddress"
                        checked={selectedAddressId === addr.id}
                        onChange={() => handleSelectAddress(addr)}
                        className="mr-2"
                      />
                      <strong>{addr.name}</strong>, {addr.addressLine}, {addr.city}, {addr.state} - {addr.pincode}
                      <span className="text-sm text-gray-500 ml-2">({addr.phone})</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

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