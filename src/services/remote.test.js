import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// These tests run with a backend "configured": CRM.apiUrl is set and fetch is mocked.
vi.mock('../config', async (orig) => ({ ...(await orig()), CRM: { tenantId: '8', apiUrl: 'http://api.test/' } }));

import { getCategories, getProducts, hydrateCatalog } from './catalog';
import { API_CATALOG } from '../test/fixtures';
import { login, signup, getSession } from './auth';
import { placeOrderRemote, getOrder } from './orders';

const json = (body, status = 200) => Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) });
const calls = () => fetch.mock.calls.map(([url, init]) => [url, init]);

beforeEach(() => vi.stubGlobal('fetch', vi.fn()));
afterEach(() => vi.unstubAllGlobals());

describe('hydrateCatalog', () => {
  it('reports failure (and leaves the current catalogue alone) when the backend is down, errors, or sends junk', async () => {
    fetch.mockRejectedValueOnce(new Error('offline'));
    expect(await hydrateCatalog()).toBe(false);
    fetch.mockImplementationOnce(() => json({ detail: 'boom' }, 500));
    expect(await hydrateCatalog()).toBe(false);
    fetch.mockImplementationOnce(() => json({ nope: true }));
    expect(await hydrateCatalog()).toBe(false);
    expect(getProducts()).toHaveLength(API_CATALOG.products.length);
  });

  it('swaps in the live catalogue (and still hides excluded categories)', async () => {
    fetch.mockImplementationOnce(() =>
      json({
        categories: [{ slug: 'rings', name: 'Rings' }, { slug: 'dresses', name: 'Dresses' }],
        products: [
          { id: 'live-ring', slug: 'live-ring', name: 'Live Ring', categorySlug: 'rings', description: 'x', price: 250, tag: 'New Arrival', image: '/media/products/live-ring.webp', designs: [{ id: 'a', label: 'A' }] },
          { id: 'frock', slug: 'frock', name: 'Frock', categorySlug: 'dresses', description: 'x', price: 900, tag: null, designs: [] },
        ],
      }),
    );
    expect(await hydrateCatalog()).toBe(true);
    expect(calls()[0][0]).toBe('http://api.test/api/catalog'); // trailing slash in the base URL is handled
    expect(getProducts().map((p) => p.slug)).toEqual(['live-ring']);
    expect(getCategories().map((c) => c.slug)).toEqual(['rings']);
    expect(getProducts()[0]).toMatchObject({ isNew: true, designs: [{ id: 'a', label: 'A' }], image: 'http://api.test/media/products/live-ring.webp' });
  });
});

describe('placeOrderRemote', () => {
  const product = { id: 'kashmiri-peacock-bracelet-watch', name: 'Kashmiri Peacock Bracelet Watch', price: 499, image: '/x.webp' };
  const customer = { name: 'Asha', phone: '9876543210', address: 'a', city: 'c', state: 's', pincode: '600001', email: '', notes: '' };

  it('sends ids and quantities only (never prices) and caches the server order', async () => {
    const serverOrder = { id: 'PC261012-1234', status: 'Placed', total: 998, items: [], customer, accessToken: 't0k' };
    fetch.mockImplementationOnce(() => json(serverOrder, 201));
    const order = await placeOrderRemote({ customer, clientRequestId: 'req-12345678', lines: [{ product, design: null, qty: 2 }] });

    const [url, init] = calls()[0];
    expect(url).toBe('http://api.test/api/orders');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ customer, clientRequestId: 'req-12345678', items: [{ productId: 'kashmiri-peacock-bracelet-watch', designId: null, qty: 2 }] });
    expect(order.total).toBe(998);
    expect(getOrder('PC261012-1234')).toMatchObject({ id: 'PC261012-1234', accessToken: 't0k' });
  });

  it('turns server and network failures into friendly ApiErrors', async () => {
    fetch.mockImplementationOnce(() => json({ detail: 'Please choose a design for “X”.' }, 422));
    await expect(placeOrderRemote({ customer, lines: [{ product, qty: 1 }] })).rejects.toMatchObject({ status: 422, message: 'Please choose a design for “X”.' });
    fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    await expect(placeOrderRemote({ customer, lines: [{ product, qty: 1 }] })).rejects.toMatchObject({ status: 0 });
  });
});

describe('auth', () => {
  const authBody = (i) => JSON.parse(calls()[i][1].body);

  it('stores the session after sign-up/log-in and sends the bearer token on later calls', async () => {
    fetch.mockImplementationOnce(() => json({ token: 'jwt1', customer: { id: 1, name: 'Pooja' } }, 201));
    await signup({ name: 'Pooja', email: 'p@x.com', password: 'password1' });
    expect(getSession()).toMatchObject({ token: 'jwt1' });
    expect(calls()[0][0]).toBe('http://api.test/api/auth/signup');
    expect(authBody(0)).toEqual({ name: 'Pooja', email: 'p@x.com', password: 'password1' }); // email + password only

    fetch.mockImplementationOnce(() => json({ token: 'jwt2', customer: { id: 1, name: 'Pooja' } }));
    await login({ email: 'p@x.com', password: 'password1' });
    expect(calls()[1][0]).toBe('http://api.test/api/auth/login');
    expect(authBody(1)).toEqual({ email: 'p@x.com', password: 'password1' });
    expect(calls()[1][1].headers.Authorization).toBe('Bearer jwt1');
    expect(getSession().token).toBe('jwt2');

    fetch.mockImplementationOnce(() => json({ detail: 'Incorrect email or password.' }, 401));
    await expect(login({ email: 'p@x.com', password: 'nope' })).rejects.toMatchObject({ status: 401, message: 'Incorrect email or password.' });
    expect(getSession().token).toBe('jwt2'); // a failed login doesn't wipe the session
  });

  it('surfaces the duplicate-email message and keeps the session logged out', async () => {
    const message = 'An account with this email already exists. Try logging in.';
    fetch.mockImplementationOnce(() => json({ detail: message }, 409));
    await expect(signup({ name: 'Pooja', email: 'p@x.com', password: 'password1' })).rejects.toMatchObject({ status: 409, message });
    expect(getSession()).toBeNull();
  });

  it('keeps the JWT working for checkout: a placed order carries the logged-in customer token', async () => {
    fetch.mockImplementationOnce(() => json({ token: 'jwt-order', customer: { id: 1, name: 'Pooja' } }));
    await login({ email: 'p@x.com', password: 'password1' });
    const product = { id: 'kashmiri-peacock-bracelet-watch', name: 'Watch', price: 499, image: '/x.webp' };
    const customer = { name: 'Asha', phone: '9876543210', address: 'a', city: 'c', state: 's', pincode: '600001', email: '', notes: '' };
    fetch.mockImplementationOnce(() => json({ id: 'PC261012-9999', status: 'Placed', total: 499, items: [], customer, accessToken: 'tok' }, 201));
    await placeOrderRemote({ customer, clientRequestId: 'req-87654321', lines: [{ product, design: null, qty: 1 }] });
    expect(calls()[1][0]).toBe('http://api.test/api/orders');
    expect(calls()[1][1].headers.Authorization).toBe('Bearer jwt-order');
  });
});
