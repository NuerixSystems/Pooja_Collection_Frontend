
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
  globalThis.crypto?.randomUUID?.() ??
  `req-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;

const getAddressEmail = (addr) => {
  const emailEntry = Object.entries(addr || {}).find(([key, value]) => {
    const normalizedKey = key.replace(/[^a-z]/gi, '').toLowerCase();

    return (
      ['email', 'emailaddress', 'emailid', 'contactemail'].includes(
        normalizedKey
      ) &&
      typeof value === 'string' &&
      value.trim()
    );
  });

  return emailEntry?.[1] || '';
};

// Convert saved address into checkout form values.
const addressToCheckoutValues = (addr, fallbackEmail = '') => {
  const mappedValues = {
    name: addr?.name || '',
    phone: addr?.phone || '',
    email: String(getAddressEmail(addr) || fallbackEmail)
      .trim()
      .toLowerCase(),
    pincode: addr?.pincode || '',
    address: addr?.addressLine || '',
    city: addr?.city || '',
    state: addr?.state || '',
  };

  console.log('[ADDRESS MAPPING]', mappedValues);

  return mappedValues;
};

export default function Checkout() {
  const { lines, cartTotal, cartCount, clearCart } = useStore();
  const navigate = useNavigate();
  const { open, checkoutAddress } = useUI();

  const [session] = useState(() => getSession());

  const [values, setValues] = useState(() =>
    checkoutAddress
      ? addressToCheckoutValues(
          checkoutAddress,
          getAddressEmail(session?.customer)
        )
      : {}
  );

  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});
  const [focusRequest, setFocusRequest] = useState({
    field: null,
    attempt: 0,
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [savedAddresses, setSavedAddresses] = useState([]);

  const [selectedAddressId, setSelectedAddressId] = useState(
    checkoutAddress?.id ?? null
  );

  const inputs = useRef({});
  const requestId = useRef(newRequestId());

  useDocumentTitle('Checkout');

  // Load saved addresses and auto-fill checkout form.
  useEffect(() => {
    let active = true;

    if (!session) return undefined;

    const loadAddresses = async () => {
      try {
        const response = await getAddresses();

        if (!active) return;

        const addresses = Array.isArray(response)
          ? response
          : Array.isArray(response?.items)
            ? response.items
            : Array.isArray(response?.addresses)
              ? response.addresses
              : [];

        console.log('[CHECKOUT] Saved addresses:', addresses);

        setSavedAddresses(addresses);

        let selected = null;

        // First preference: address selected on previous page.
        if (checkoutAddress?.id) {
          selected = addresses.find(
            (address) =>
              String(address.id) === String(checkoutAddress.id)
          );
        }

        // Second preference: default address.
        if (!selected) {
          selected = addresses.find(
            (address) => address.isDefault === true
          );
        }

        // Third preference: only available address.
        if (!selected && addresses.length === 1) {
          selected = addresses[0];
        }

        if (selected) {
          const checkoutValues =
            addressToCheckoutValues(
              selected,
              getAddressEmail(checkoutAddress) ||
                getAddressEmail(session?.customer)
            );

          console.log(
            '[CHECKOUT] Selected address email:',
            selected.email
          );

          console.log(
            '[CHECKOUT] Auto-filled email:',
            checkoutValues.email
          );

          setSelectedAddressId(selected.id);
          setValues(checkoutValues);
        }
      } catch (error) {
        console.error(
          'Could not load saved addresses:',
          error
        );
      }
    };

    loadAddresses();

    return () => {
      active = false;
    };
  }, [session, checkoutAddress]);

  // Focus invalid field.
  useEffect(() => {
    if (focusRequest.field) {
      inputs.current[focusRequest.field]?.focus();
    }
  }, [focusRequest]);

  // Select saved address.
  const handleSelectAddress = (addr) => {
    const checkoutValues = addressToCheckoutValues(
      addr,
      getAddressEmail(session?.customer)
    );

    console.log(
      '[CHECKOUT] Manually selected email:',
      checkoutValues.email
    );

    setSelectedAddressId(addr.id);
    setValues(checkoutValues);
    setErrors({});
    setSubmitError('');
  };

  // Handle manual form changes.
  const handleFieldChange = (name, value) => {
    setValues((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: '',
    }));
  };

  // Place order.
  const submit = async (e) => {
    e.preventDefault();

    if (submitting) return;

    const {
      errors: found,
      firstInvalid,
      values: clean,
    } = validateCheckout(values);

    clean.email = String(clean.email || '')
      .trim()
      .toLowerCase();

    if (!clean.email) {
      found.email = 'Enter your email address.';
    }

    setErrors(found);

    const invalidField =
      firstInvalid ||
      CHECKOUT_FIELDS.find(
        (field) => found[field.name]
      )?.name ||
      null;

    if (invalidField) {
      setFocusRequest((previous) => ({
        field: invalidField,
        attempt: previous.attempt + 1,
      }));

      return;
    }

    const customer = {
      ...clean,
      email: clean.email,
      notes: notes.trim(),
    };

    console.log(
      '[CHECKOUT] Final customer data:',
      customer
    );

    setSubmitting(true);
    setSubmitError('');

    try {
      const order = await placeOrderRemote({
        customer,
        lines,
        clientRequestId: requestId.current,
      });

      clearCart();

      navigate(`/order/${order.id}`, {
        replace: true,
      });
    } catch (error) {
      console.error('[CHECKOUT] Order failed:', error);

      setSubmitError(
        error instanceof ApiError
          ? error.message
          : 'Something went wrong. Please try again.'
      );

      if (
        error instanceof ApiError &&
        error.status === 401
      ) {
        open('login');
      }

      if (
        error instanceof ApiError &&
        error.status >= 400 &&
        error.status < 500
      ) {
        requestId.current = newRequestId();
      }

      setSubmitting(false);
    }
  };

  if (!lines.length) {
    return (
      <div className="container">
        <div className="empty">
          <h1 style={{ fontSize: '2rem' }}>
            Nothing to check out
          </h1>

          <p>Add something to your cart first.</p>

          <Link to="/shop" className="btn">
            Shop all
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <section className="section">
        <div className="section-head">
          <h1 className="section-title">Checkout</h1>
        </div>

        <div className="cart-layout">
          <form
            className="checkout-form"
            onSubmit={submit}
            noValidate
          >
            {savedAddresses.length > 0 && (
              <div className="saved-addresses mb-4">
                <h3 className="text-lg font-semibold mb-2">
                  Saved Addresses
                </h3>

                <div className="space-y-2">
                  {savedAddresses.map((addr) => (
                    <label
                      key={addr.id}
                      className={`address-card border p-3 rounded cursor-pointer ${
                        String(selectedAddressId) ===
                        String(addr.id)
                          ? 'border-blue-500 bg-blue-50'
                          : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="savedAddress"
                        checked={
                          String(selectedAddressId) ===
                          String(addr.id)
                        }
                        onChange={() =>
                          handleSelectAddress(addr)
                        }
                        className="mr-2"
                      />

                      <strong>{addr.name}</strong>,{' '}
                      {addr.addressLine}, {addr.city},{' '}
                      {addr.state} - {addr.pincode}

                      <span className="text-sm text-gray-500 ml-2">
                        ({addr.phone})
                      </span>

                      <span className="block text-sm text-gray-500 ml-6">
                        {getAddressEmail(addr) ||
                          'Email not available'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <h2>Delivery details</h2>

            <div className="field-grid">
              {CHECKOUT_FIELDS.map((field) => (
                <div
                  key={field.name}
                  className={`field ${
                    field.wide ? 'field--wide' : ''
                  }`}
                >
                  <label htmlFor={`f-${field.name}`}>
                    {field.label}
                  </label>

                  <input
                    ref={(el) => {
                      inputs.current[field.name] = el;
                    }}
                    id={`f-${field.name}`}
                    name={field.name}
                    type={field.type || 'text'}
                    inputMode={field.inputMode}
                    autoComplete={field.autoComplete}
                    value={values[field.name] ?? ''}
                    onChange={(e) =>
                      handleFieldChange(
                        field.name,
                        e.target.value
                      )
                    }
                    aria-invalid={
                      errors[field.name]
                        ? 'true'
                        : undefined
                    }
                    aria-describedby={
                      errors[field.name]
                        ? `e-${field.name}`
                        : undefined
                    }
                  />

                  {errors[field.name] && (
                    <p
                      className="field-error"
                      id={`e-${field.name}`}
                    >
                      {errors[field.name]}
                    </p>
                  )}
                </div>
              ))}

              <div className="field field--wide">
                <label htmlFor="f-notes">
                  Order notes (optional)
                </label>

                <textarea
                  id="f-notes"
                  rows="3"
                  value={notes}
                  onChange={(e) =>
                    setNotes(e.target.value)
                  }
                />
              </div>
            </div>

            {submitError && (
              <p
                className="field-error checkout-error"
                role="alert"
              >
                {submitError}
              </p>
            )}

            <button
              type="submit"
              className="btn checkout-submit"
              disabled={submitting}
            >
              {submitting
                ? 'Placing your order…'
                : `Place order · ${formatPrice(cartTotal)}`}
            </button>
          </form>

          <aside
            className="summary"
            aria-label="Order summary"
          >
            <h2>Your order ({cartCount})</h2>

            <ul className="checkout-items">
              {lines.map(
                ({ key, product, design, qty }) => (
                  <li key={key}>
                    <SafeImage
                      src={product.image}
                      alt=""
                      label={product.name}
                    />

                    <span className="checkout-item-name">
                      {product.name}
                      <small> × {qty}</small>

                      {design && (
                        <small className="checkout-item-design">
                          Design: {design.label}
                        </small>
                      )}
                    </span>

                    <span>
                      {formatPrice(product.price * qty)}
                    </span>
                  </li>
                )
              )}
            </ul>

            <p className="summary-row summary-total">
              <span>Total</span>
              <strong>{formatPrice(cartTotal)}</strong>
            </p>

            <Link
              to="/cart"
              className="text-link summary-continue"
            >
              Edit cart
            </Link>
          </aside>
        </div>
      </section>
    </div>
  );
}
