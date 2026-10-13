// Checkout form definition + validation. Pure functions so they can be unit-tested.

/**
 * Normalise an Indian mobile number to its 10 national digits, or return null if invalid.
 * Accepts an optional +91 / 91 country code and spaces or hyphens between digits
 * ("98765 43210", "+91 98765 43210", "+919876543210"). Indian mobiles start with 6-9.
 */
export function normalizeIndianMobile(input) {
  const compact = String(input ?? '').replace(/[\s\u00a0-]/g, '');
  const match = /^(?:\+91|91)?([6-9]\d{9})$/.exec(compact);
  return match ? match[1] : null;
}

export const formatIndianMobile = (phone) =>
  /^[6-9]\d{9}$/.test(String(phone)) ? `+91 ${phone.slice(0, 5)} ${phone.slice(5)}` : String(phone ?? '');

export const CHECKOUT_FIELDS = [
  { name: 'name', label: 'Full name', autoComplete: 'name', required: 'Enter your full name.' },
  {
    name: 'phone', label: 'Mobile number', type: 'tel', inputMode: 'tel', autoComplete: 'tel',
    required: 'Enter your mobile number.',
    invalid: 'Enter a valid 10-digit mobile number. You can include +91.',
    isValid: (v) => normalizeIndianMobile(v) !== null,
  },
  {
    name: 'email', label: 'Email (optional)', type: 'email', autoComplete: 'email',
    invalid: 'Enter a valid email address.',
    isValid: (v) => v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  },
  { name: 'address', label: 'Address', autoComplete: 'street-address', required: 'Enter your delivery address.', wide: true },
  { name: 'city', label: 'City', autoComplete: 'address-level2', required: 'Enter your city.' },
  { name: 'state', label: 'State', autoComplete: 'address-level1', required: 'Enter your state.' },
  {
    name: 'pincode', label: 'PIN code', inputMode: 'numeric', autoComplete: 'postal-code',
    required: 'Enter your PIN code.',
    invalid: 'Enter a valid 6-digit PIN code.',
    isValid: (v) => /^\d{6}$/.test(v),
  },
];

/**
 * @returns {{ errors: Record<string,string>, firstInvalid: string|null, values: Record<string,string> }}
 * `values` is trimmed, with the phone replaced by its normalised 10-digit form when valid.
 * `firstInvalid` follows the on-screen field order, which is where focus should go.
 */
export function validateCheckout(raw) {
  const errors = {};
  const values = {};
  CHECKOUT_FIELDS.forEach((f) => {
    const v = String(raw[f.name] ?? '').trim();
    values[f.name] = v;
    if (f.required && !v) errors[f.name] = f.required;
    else if (f.isValid && !f.isValid(v)) errors[f.name] = f.invalid;
  });
  if (!errors.phone) values.phone = normalizeIndianMobile(values.phone);
  const firstInvalid = CHECKOUT_FIELDS.find((f) => errors[f.name])?.name ?? null;
  return { errors, firstInvalid, values };
}
