import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderApp, savedCart, seedCart } from '../test/utils';

vi.mock('../config', async (orig) => ({ ...(await orig()), CRM: { tenantId: '8', apiUrl: 'http://api.test' } }));

const json = (body, status = 200) => Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) });
const field = (label) => screen.getByLabelText(label);
const placeButton = () => screen.getByRole('button', { name: /place order|placing/i });

async function fillValid(user) {
  const v = { 'Full name': 'Asha Raman', 'Mobile number': '98765 43210', Address: '12 Temple Road', City: 'Chennai', State: 'Tamil Nadu', 'PIN code': '600004' };
  for (const [label, value] of Object.entries(v)) await user.type(field(label), value);
}

const serverOrder = (extra = {}) => ({
  id: 'PC261012-4321', status: 'Placed', createdAt: '2026-10-12T10:00:00Z', total: 998, accessToken: 'tok',
  customer: { name: 'Asha Raman', phone: '9876543210', email: '', address: '12 Temple Road', city: 'Chennai', state: 'Tamil Nadu', pincode: '600004', notes: '' },
  items: [{ productId: 'gold-tulip-rings-3-set', designId: null, design: null, name: 'Gold Tulip Rings - 3 Set', image: '/media/products/gold-tulip-rings-3-set.webp', price: 499, qty: 2 }],
  ...extra,
});

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
  seedCart([{ id: 'gold-tulip-rings-3-set', qty: 2 }]);
});
afterEach(() => vi.unstubAllGlobals());

describe('checkout with a backend', () => {
  it('posts the order, clears the cart and shows the confirmation from the server order', async () => {
    fetch.mockImplementationOnce(() => json(serverOrder(), 201));
    const user = userEvent.setup();
    renderApp('/checkout');
    await fillValid(user);
    await user.click(placeButton());

    await screen.findByRole('heading', { name: /order placed/i });
    expect(screen.getByText('PC261012-4321')).toBeInTheDocument();
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.customer.phone).toBe('9876543210');
    expect(body.items).toEqual([{ productId: 'gold-tulip-rings-3-set', designId: null, qty: 2 }]);
    expect(body.clientRequestId).toMatch(/.{8,}/);
    expect(savedCart()).toEqual([]);
  });

  it('shows the server message, keeps the cart, and lets the customer try again', async () => {
    fetch.mockImplementationOnce(() => json({ detail: 'Some items in your cart are no longer available. Please review your cart.' }, 422));
    const user = userEvent.setup();
    renderApp('/checkout');
    await fillValid(user);
    await user.click(placeButton());

    expect(await screen.findByRole('alert')).toHaveTextContent(/no longer available/i);
    expect(savedCart()).toHaveLength(1);
    expect(placeButton()).toBeEnabled();

    fetch.mockImplementationOnce(() => json(serverOrder(), 201));
    await user.click(placeButton());
    await screen.findByRole('heading', { name: /order placed/i });
    // a definitive 4xx means the retry is a NEW request, so it must not reuse the rejected request id
    const [first, second] = fetch.mock.calls.map((c) => JSON.parse(c[1].body).clientRequestId);
    expect(second).not.toBe(first);
  });

  it('reuses the request id after a dropped connection, so a retry can never double-order', async () => {
    fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    const user = userEvent.setup();
    renderApp('/checkout');
    await fillValid(user);
    await user.click(placeButton());
    expect(await screen.findByRole('alert')).toHaveTextContent(/couldn't reach/i);

    fetch.mockImplementationOnce(() => json(serverOrder(), 201));
    await user.click(placeButton());
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    const [first, second] = fetch.mock.calls.map((c) => JSON.parse(c[1].body).clientRequestId);
    expect(second).toBe(first);
  });

  it('does not call the server when the form is invalid', async () => {
    const user = userEvent.setup();
    renderApp('/checkout');
    await user.click(placeButton());
    await waitFor(() => expect(field('Full name')).toHaveFocus());
    expect(fetch).not.toHaveBeenCalled();
  });
});
