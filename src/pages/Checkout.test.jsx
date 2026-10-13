import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderApp, savedCart, seedCart } from '../test/utils';

const field = (label) => screen.getByLabelText(label);
const placeOrder = (user) => user.click(screen.getByRole('button', { name: /place order/i }));

async function fillValid(user, overrides = {}) {
  const v = { 'Full name': 'Asha Raman', 'Mobile number': '+91 98765 43210', Address: '12 Temple Road', City: 'Chennai', State: 'Tamil Nadu', 'PIN code': '600004', ...overrides };
  for (const [label, value] of Object.entries(v)) {
    const input = field(label);
    await user.clear(input);
    if (value) await user.type(input, value);
  }
}

const json = (body, status = 200) => Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) });
const serverOrder = (phone) => ({
  id: 'PC261012-1111', status: 'Placed', createdAt: '2026-10-12T10:00:00Z', total: 598, accessToken: 'tok',
  customer: { name: 'Asha Raman', phone, email: '', address: '12 Temple Road', city: 'Chennai', state: 'Tamil Nadu', pincode: '600004', notes: '' },
  items: [{ productId: 'gold-tulip-rings-3-set', designId: null, design: null, name: 'Gold Tulip Rings - 3 Set', image: '/media/products/gold-tulip-rings-3-set.webp', price: 299, qty: 2 }],
});

// Orders always go to the backend (there is no browser-only demo mode), so the network is mocked here.
beforeEach(() => vi.stubGlobal('fetch', vi.fn()));
afterEach(() => vi.unstubAllGlobals());

beforeEach(() => {
  // legacy-format line (no key/designId) also proves old saved carts still load
  seedCart([{ id: 'gold-tulip-rings-3-set', qty: 2 }]);
});

describe('checkout validation focus', () => {
  it('focuses the first invalid field after a failed submit', async () => {
    const user = userEvent.setup();
    renderApp('/checkout');
    await placeOrder(user);
    await waitFor(() => expect(field('Full name')).toHaveFocus());
    expect(field('Full name')).toHaveAttribute('aria-invalid', 'true');
  });

  it('moves focus to the NEXT invalid field once an earlier one is fixed (stale-DOM regression)', async () => {
    const user = userEvent.setup();
    renderApp('/checkout');
    await placeOrder(user); // every field invalid, focus -> name
    await user.type(field('Full name'), 'Asha');
    await placeOrder(user); // name is valid now; the first invalid field is the phone
    await waitFor(() => expect(field('Mobile number')).toHaveFocus());
    expect(screen.getByText('Enter your mobile number.')).toBeInTheDocument();
  });

  it('re-focuses the same field when the user submits again without fixing it', async () => {
    const user = userEvent.setup();
    renderApp('/checkout');
    await placeOrder(user);
    await waitFor(() => expect(field('Full name')).toHaveFocus());
    await placeOrder(user); // focus is on the button again, same error
    await waitFor(() => expect(field('Full name')).toHaveFocus());
  });

  it('focuses a late field (PIN code) when it is the only invalid one', async () => {
    const user = userEvent.setup();
    renderApp('/checkout');
    await fillValid(user, { 'PIN code': '60' });
    await placeOrder(user);
    await waitFor(() => expect(field('PIN code')).toHaveFocus());
    expect(savedCart()).toHaveLength(1); // nothing was placed
  });
});

describe('checkout mobile numbers', () => {
  it('uses a telephone keypad that can type + and spaces', () => {
    renderApp('/checkout');
    expect(field('Mobile number')).toHaveAttribute('type', 'tel');
    expect(field('Mobile number')).toHaveAttribute('inputmode', 'tel');
  });

  it('accepts +91 with spaces and stores/displays the normalised number', async () => {
    const user = userEvent.setup();
    renderApp('/checkout');
    fetch.mockImplementationOnce(() => json(serverOrder('9876543210'), 201));
    await fillValid(user, { 'Mobile number': '+91 98765 43210' });
    await placeOrder(user);
    await screen.findByRole('heading', { name: /order placed/i });
    expect(JSON.parse(fetch.mock.calls[0][1].body).customer.phone).toBe('9876543210');
    expect(screen.getByText(/\+91 98765 43210/)).toBeInTheDocument();
    expect(savedCart()).toEqual([]);
  });

  it('rejects numbers that are not valid Indian mobiles', async () => {
    const user = userEvent.setup();
    renderApp('/checkout');
    await fillValid(user, { 'Mobile number': '+91 12345 67890' });
    await placeOrder(user);
    await waitFor(() => expect(field('Mobile number')).toHaveFocus());
    expect(screen.queryByRole('heading', { name: /order placed/i })).not.toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('checkout summary', () => {
  it('lists the cart items', () => {
    renderApp('/checkout');
    const summary = screen.getByRole('complementary', { name: /order summary/i });
    expect(within(summary).getByText(/Gold Tulip Rings - 3 Set/)).toBeInTheDocument();
  });
});
