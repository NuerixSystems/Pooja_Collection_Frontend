import { describe, expect, it } from 'vitest';
import { formatIndianMobile, normalizeIndianMobile, validateCheckout } from './checkout';

describe('normalizeIndianMobile', () => {
  it.each([
    ['9876543210', '9876543210'],
    ['98765 43210', '9876543210'],
    ['+91 98765 43210', '9876543210'],
    ['+919876543210', '9876543210'],
    ['+91   9876 543 210', '9876543210'],
    ['919876543210', '9876543210'],
    ['+91-98765-43210', '9876543210'],
    ['  6000000000  ', '6000000000'],
    ['9198765432', '9198765432'], // a real 10-digit number that happens to start with 91
  ])('accepts %j', (input, expected) => {
    expect(normalizeIndianMobile(input)).toBe(expected);
  });

  it.each([
    '', '   ', '12345', '5876543210', '0987654321', '987654321', '98765432100',
    '+1 9876543210', '+91 12345 67890', '+91 5876543210', '9876a43210', '(98765) 43210', '+91+919876543210', '911234567890',
  ])('rejects %j', (input) => {
    expect(normalizeIndianMobile(input)).toBeNull();
  });

  it('tolerates null and undefined', () => {
    expect(normalizeIndianMobile(undefined)).toBeNull();
    expect(normalizeIndianMobile(null)).toBeNull();
  });
});

describe('formatIndianMobile', () => {
  it('formats a normalised number and leaves anything else untouched', () => {
    expect(formatIndianMobile('9876543210')).toBe('+91 98765 43210');
    expect(formatIndianMobile('+91 98 76')).toBe('+91 98 76'); // e.g. a legacy saved order
    expect(formatIndianMobile(undefined)).toBe('');
  });
});

describe('validateCheckout', () => {
  const valid = { name: ' Asha ', phone: '+91 98765 43210', email: '', address: '1 Main St', city: 'Chennai', state: 'Tamil Nadu', pincode: '600001' };

  it('passes and returns trimmed values with the 10-digit phone', () => {
    const r = validateCheckout(valid);
    expect(r.errors).toEqual({});
    expect(r.firstInvalid).toBeNull();
    expect(r.values.phone).toBe('9876543210');
    expect(r.values.name).toBe('Asha');
  });

  it('reports the first invalid field in on-screen order', () => {
    const r = validateCheckout({ ...valid, phone: '123', pincode: 'abc', address: '' });
    expect(Object.keys(r.errors).sort()).toEqual(['address', 'phone', 'pincode']);
    expect(r.firstInvalid).toBe('phone');
  });

  it('requires name and treats email as optional but validated when present', () => {
    expect(validateCheckout({ ...valid, name: '  ' }).firstInvalid).toBe('name');
    expect(validateCheckout({ ...valid, email: 'nope' }).errors.email).toMatch(/valid email/);
    expect(validateCheckout({ ...valid, email: 'a@b.co' }).errors.email).toBeUndefined();
  });
});
