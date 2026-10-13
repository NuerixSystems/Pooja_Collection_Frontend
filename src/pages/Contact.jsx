import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import QuantityStepper from '../components/QuantityStepper';
import SafeImage from '../components/SafeImage';
import { TrashIcon } from '../components/Icons';
import { BRAND, UPI } from '../config';
import { useStore } from '../context/StoreContext';
import { useUI } from '../context/UIContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { ApiError } from '../services/api';
import { placeOrderRemote } from '../services/orders';
import { CHECKOUT_FIELDS, normalizeIndianMobile, validateCheckout } from '../utils/checkout';
import { formatPrice } from '../utils/format';
import './CartPage.css';
import './Checkout.css';
import './Contact.css';

const newRequestId = () =>
  globalThis.crypto?.randomUUID?.() ?? `req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const UTR_RE = new RegExp(`^\\d{${UPI.utrLength}}$`);
const MESSAGE_MAX = 350; // order notes are capped at 500 characters by the server; the payment line takes the rest

function WhatsAppIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2a9.9 9.9 0 0 0-8.5 14.95L2 22l5.2-1.5A9.9 9.9 0 1 0 12.04 2Zm0 18.1a8.2 8.2 0 0 1-4.2-1.15l-.3-.18-3.08.9.92-3-.2-.31a8.2 8.2 0 1 1 6.86 3.74Zm4.5-6.15c-.25-.12-1.46-.72-1.69-.8-.23-.09-.39-.12-.56.12-.16.25-.64.8-.78.97-.14.16-.29.18-.54.06a6.7 6.7 0 0 1-3.3-2.88c-.25-.43.25-.4.72-1.34.08-.16.04-.3-.02-.42-.06-.12-.56-1.35-.76-1.85-.2-.48-.4-.42-.56-.42h-.47c-.16 0-.43.06-.65.3-.23.25-.86.84-.86 2.05s.88 2.38 1 2.55c.12.16 1.73 2.64 4.2 3.7 1.56.67 2.17.73 2.95.62.48-.07 1.46-.6 1.67-1.17.2-.58.2-1.07.14-1.17-.06-.1-.23-.16-.48-.28Z" />
    </svg>
  );
}
function PhoneIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />
    </svg>
  );
}
function InstagramIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ContactChannels() {
  return (
    <ul className="contact-channels">
      <li>
        <a className="contact-card" href={`https://wa.me/${BRAND.whatsapp}`} target="_blank" rel="noopener noreferrer">
          <WhatsAppIcon /><span><strong>WhatsApp</strong><small>{BRAND.phone}</small></span>
        </a>
      </li>
      <li>
        <a className="contact-card" href={`tel:+${BRAND.whatsapp}`}>
          <PhoneIcon /><span><strong>Call us</strong><small>{BRAND.phone}</small></span>
        </a>
      </li>
      <li>
        <a className="contact-card" href={BRAND.instagramUrl} target="_blank" rel="noopener noreferrer">
          <InstagramIcon /><span><strong>Instagram</strong><small>{BRAND.instagramHandle}</small></span>
        </a>
      </li>
    </ul>
  );
}

// Shown when the cart is empty: a general enquiry that opens WhatsApp with the message pre-filled.
function EnquiryForm() {
  const [form, setForm] = useState({ name: '', phone: '', message: '' });
  const [errors, setErrors] = useState({});

  const submit = (e) => {
    e.preventDefault();
    const found = {};
    if (!form.name.trim()) found.name = 'Enter your name.';
    if (form.phone.trim() && !normalizeIndianMobile(form.phone)) found.phone = 'Enter a valid 10-digit mobile number.';
    if (!form.message.trim()) found.message = 'Write your message.';
    setErrors(found);
    if (Object.keys(found).length) return;
    const text = [
      `Hi ${BRAND.name}, I'm ${form.name.trim()}.`,
      form.phone.trim() && `My number: ${form.phone.trim()}`,
      '',
      form.message.trim(),
    ].filter((l) => l !== false).join('\n');
    window.open(`https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  };

  return (
    <form className="checkout-form" id="enquiry" onSubmit={submit} noValidate>
      <h2>Send us a message</h2>
      <div className="field-grid">
        <div className="field">
          <label htmlFor="q-name">Your name</label>
          <input id="q-name" value={form.name} aria-invalid={errors.name ? 'true' : undefined}
            onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" />
          {errors.name && <p className="field-error">{errors.name}</p>}
        </div>
        <div className="field">
          <label htmlFor="q-phone">Mobile number (optional)</label>
          <input id="q-phone" type="tel" inputMode="tel" value={form.phone} aria-invalid={errors.phone ? 'true' : undefined}
            onChange={(e) => setForm({ ...form, phone: e.target.value })} autoComplete="tel" />
          {errors.phone && <p className="field-error">{errors.phone}</p>}
        </div>
        <div className="field field--wide">
          <label htmlFor="q-msg">Message</label>
          <textarea id="q-msg" rows="5" value={form.message} aria-invalid={errors.message ? 'true' : undefined}
            onChange={(e) => setForm({ ...form, message: e.target.value })} />
          {errors.message && <p className="field-error">{errors.message}</p>}
        </div>
      </div>
      <p className="form-hint">This opens WhatsApp with your message ready to send. Nothing is stored on this website.</p>
      <button type="submit" className="btn checkout-submit"><WhatsAppIcon size={20} /> Send on WhatsApp</button>
    </form>
  );
}

export default function Contact() {
  const { lines, cartTotal, cartCount, maxQty, setQty, removeFromCart, clearCart } = useStore();
  const navigate = useNavigate();
  const { open } = useUI();
  const [values, setValues] = useState({});
  const [message, setMessage] = useState('');
  const [payment, setPayment] = useState('cod'); // 'cod' | 'upi'
  const [utr, setUtr] = useState('');
  const [errors, setErrors] = useState({});
  const [focusRequest, setFocusRequest] = useState({ field: null, attempt: 0 });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [qrFailed, setQrFailed] = useState(false);
  const inputs = useRef({});
  const requestId = useRef(newRequestId());
  useDocumentTitle('Contact');

  useEffect(() => {
    if (focusRequest.field) inputs.current[focusRequest.field]?.focus();
  }, [focusRequest]);

  const hasOrder = lines.length > 0;

  const submit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    const { errors: found, firstInvalid, values: clean } = validateCheckout(values);
    let first = firstInvalid;
    if (payment === 'upi' && !UTR_RE.test(utr.trim())) {
      found.utr = `Enter the ${UPI.utrLength}-digit UTR / transaction ID from your payment app.`;
      first = first || 'utr';
    }
    setErrors(found);
    if (first) {
      setFocusRequest((r) => ({ field: first, attempt: r.attempt + 1 }));
      return;
    }

    const paymentLine = payment === 'cod' ? 'Payment: Cash on Delivery' : `Payment: UPI/QR (UTR ${utr.trim()}) - verify before dispatch`;
    const notes = [paymentLine, message.trim()].filter(Boolean).join('\n');
    const customer = { ...clean, notes };

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
        <div className="section-head"><h1 className="section-title">Contact us</h1></div>
        <p className="contact-intro">
          {hasOrder
            ? 'Fill in your details, choose how you’d like to pay, and place your order. We’ll confirm it on WhatsApp.'
            : 'Questions about an order, sizing or styling? Reach us on WhatsApp, call, Instagram, or send a message below.'}
        </p>
        <ContactChannels />

        {!hasOrder ? (
          <div className="contact-single"><EnquiryForm /></div>
        ) : (
          <div className="cart-layout">
            <form className="checkout-form" onSubmit={submit} noValidate>
              <h2>Your details</h2>
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
                  <label htmlFor="f-message">Message (optional)</label>
                  <textarea id="f-message" rows="3" maxLength={MESSAGE_MAX} value={message} onChange={(e) => setMessage(e.target.value)} />
                </div>
              </div>

              <fieldset className="pay-methods">
                <legend>Payment method</legend>
                <label className={`pay-option ${payment === 'cod' ? 'is-selected' : ''}`}>
                  <input type="radio" name="payment" value="cod" checked={payment === 'cod'} onChange={() => setPayment('cod')} />
                  <span><strong>Cash on Delivery</strong><small>Pay in cash when your order is delivered.</small></span>
                </label>
                <label className={`pay-option ${payment === 'upi' ? 'is-selected' : ''}`}>
                  <input type="radio" name="payment" value="upi" checked={payment === 'upi'} onChange={() => setPayment('upi')} />
                  <span><strong>UPI / QR</strong><small>Pay now by UPI, then enter your transaction ID.</small></span>
                </label>

                {payment === 'upi' && (
                  <div className="upi-box">
                    {qrFailed ? (
                      <p className="upi-missing">QR code isn’t available right now. Please choose Cash on Delivery or message us on WhatsApp.</p>
                    ) : (
                      <img className="upi-qr" src={UPI.qrImage} alt={`UPI QR code to pay ${formatPrice(cartTotal)}`} onError={() => setQrFailed(true)} />
                    )}
                    {UPI.id && <p className="upi-id">UPI ID: <strong>{UPI.id}</strong>{UPI.payee && <small> · {UPI.payee}</small>}</p>}
                    <p className="upi-amount">Amount to pay: <strong>{formatPrice(cartTotal)}</strong></p>
                    <ol className="upi-steps">
                      <li>Scan the QR{UPI.id ? ' (or use the UPI ID)' : ''} and pay exactly {formatPrice(cartTotal)}.</li>
                      <li>Copy the {UPI.utrLength}-digit UTR / UPI reference number from your payment app.</li>
                      <li>Enter it below and place your order.</li>
                    </ol>
                    <div className="field">
                      <label htmlFor="f-utr">UTR / Transaction ID</label>
                      <input
                        ref={(el) => { inputs.current.utr = el; }}
                        id="f-utr" inputMode="numeric" maxLength={UPI.utrLength} placeholder={`${UPI.utrLength}-digit UTR`}
                        value={utr} onChange={(e) => setUtr(e.target.value.replace(/\D/g, ''))}
                        aria-invalid={errors.utr ? 'true' : undefined} aria-describedby={errors.utr ? 'e-utr' : undefined}
                      />
                      {errors.utr && <p className="field-error" id="e-utr">{errors.utr}</p>}
                    </div>
                    <p className="upi-note">Your order will be confirmed after we verify the payment.</p>
                  </div>
                )}
              </fieldset>

              {submitError && <p className="field-error checkout-error" role="alert">{submitError}</p>}
              <button type="submit" className="btn checkout-submit" disabled={submitting}>
                {submitting ? 'Placing your order…' : `Place order · ${formatPrice(cartTotal)}`}
              </button>
            </form>

            <aside className="summary" aria-label="Order summary">
              <h2>Your order ({cartCount})</h2>
              <ul className="contact-items">
                {lines.map(({ key, product, design, qty }) => {
                  const label = design ? `${product.name} (${design.label})` : product.name;
                  return (
                    <li key={key}>
                      <SafeImage src={product.image} alt="" label={product.name} />
                      <div className="contact-item-body">
                        <Link to={`/product/${product.slug}`} className="cart-page-name">{product.name}</Link>
                        {design && <small className="muted">Design: {design.label}</small>}
                        <QuantityStepper name={label} qty={qty} max={maxQty} onChange={(n) => setQty(key, n)} />
                      </div>
                      <div className="contact-item-side">
                        <strong>{formatPrice(product.price * qty)}</strong>
                        <button type="button" className="link-btn" onClick={() => removeFromCart(key)} aria-label={`Remove ${label}`}>
                          <TrashIcon size={18} />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <p className="summary-row summary-total"><span>Total</span><strong>{formatPrice(cartTotal)}</strong></p>
              <Link to="/shop" className="text-link summary-continue">Continue shopping</Link>
            </aside>
          </div>
        )}
      </section>
    </div>
  );
}
