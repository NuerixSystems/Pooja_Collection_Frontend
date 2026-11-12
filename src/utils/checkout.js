
// Checkout form definition + validation.

/**
 * Normalize an Indian mobile number to its 10 national digits.
 *
 * Accepts:
 * 98765 43210
 * +91 98765 43210
 * +919876543210
 * 919876543210
 */
export function normalizeIndianMobile(input) {
  const compact = String(input ?? '').replace(/[\s\u00a0-]/g, '');

  const match = /^(?:\+?91)?([6-9]\d{9})$/.exec(compact);

  return match ? match[1] : null;
}

export const formatIndianMobile = (phone) =>
  /^[6-9]\d{9}$/.test(String(phone))
    ? `+91 ${String(phone).slice(0, 5)} ${String(phone).slice(5)}`
    : String(phone ?? '');

export const CHECKOUT_FIELDS = [
  {
    name: 'name',
    label: 'Full name',
    autoComplete: 'name',
    required: 'Enter your full name.',
  },
  {
    name: 'phone',
    label: 'Mobile number',
    type: 'tel',
    inputMode: 'tel',
    autoComplete: 'tel',
    required: 'Enter your mobile number.',
    invalid: 'Enter a valid 10-digit mobile number. You can include +91.',
    isValid: (v) => normalizeIndianMobile(v) !== null,
  },
  {
    name: 'email',
    label: 'Email address',
    type: 'email',
    autoComplete: 'email',
    required: 'Enter your email address.',
    invalid: 'Enter a valid email address.',
    isValid: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  },
  {
    name: 'address',
    label: 'Address',
    autoComplete: 'street-address',
    required: 'Enter your delivery address.',
    wide: true,
  },
  {
    name: 'city',
    label: 'City',
    autoComplete: 'address-level2',
    required: 'Enter your city.',
  },
  {
    name: 'state',
    label: 'State',
    autoComplete: 'address-level1',
    required: 'Enter your state.',
  },
  {
    name: 'pincode',
    label: 'PIN code',
    inputMode: 'numeric',
    autoComplete: 'postal-code',
    required: 'Enter your PIN code.',
    invalid: 'Enter a valid 6-digit PIN code.',
    isValid: (v) => /^\d{6}$/.test(v),
  },
];

export function validateCheckout(raw) {
  const errors = {};
  const values = {};

  CHECKOUT_FIELDS.forEach((field) => {
    const value = String(raw[field.name] ?? '').trim();

    values[field.name] = value;

    if (field.required && !value) {
      errors[field.name] = field.required;
    } else if (field.isValid && !field.isValid(value)) {
      errors[field.name] = field.invalid;
    }
  });

  if (!errors.phone) {
    values.phone = normalizeIndianMobile(values.phone);
  }

  if (!errors.email) {
    values.email = values.email.toLowerCase();
  }

  const firstInvalid =
    CHECKOUT_FIELDS.find((field) => errors[field.name])?.name ?? null;

  return {
    errors,
    firstInvalid,
    values,
  };
}
