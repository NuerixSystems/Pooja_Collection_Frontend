import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import { StoreProvider, useStore } from '../context/StoreContext';
import { UIProvider } from '../context/UIContext';
import { useAddToCart } from '../hooks/useAddToCart';
import { getSession } from '../services/session';
import { setCatalog } from '../services/catalog';
import { renderApp, savedCart, seedCart } from '../test/utils';

// With a backend configured, the cart is for logged-in customers only.
vi.mock('../config', async (orig) => ({ ...(await orig()), CRM: { tenantId: '8', apiUrl: 'http://api.test' } }));

const RING = 'gold-tulip-rings-3-set';
const RING_NAME = 'Gold Tulip Rings - 3 Set';
const AUTH_KEY = 'pooja-collection:auth:v1';
const CUSTOMER = { id: 1, name: 'Pooja', email: 'pooja@example.com' };

const json = (body, status = 200) => Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) });
const loginDialog = () => screen.queryByRole('dialog', { name: /log in/i });
const form = () => within(document.querySelector('form.auth-form'));
const cardOf = (name) => screen.getByRole('link', { name }).closest('article');
const addIn = (el) => within(el).getByRole('button', { name: /add to cart/i });
const loggedIn = () => localStorage.setItem(AUTH_KEY, JSON.stringify({ token: 'jwt-existing', customer: CUSTOMER }));

async function logIn(user) {
  fetch.mockImplementationOnce(() => json({ token: 'jwt-1', customer: CUSTOMER }));
  await user.type(form().getByLabelText('Email'), 'pooja@example.com');
  await user.type(form().getByLabelText('Password'), 'password1');
  await user.click(form().getByRole('button', { name: 'Log in' }));
}

async function signUp(user) {
  fetch.mockImplementationOnce(() => json({ token: 'jwt-2', customer: CUSTOMER }, 201));
  await user.click(screen.getByRole('tab', { name: 'Sign up' }));
  await user.type(form().getByLabelText('Full name'), 'Pooja');
  await user.type(form().getByLabelText('Email'), 'pooja@example.com');
  await user.type(form().getByLabelText('Password'), 'password1');
  await user.click(form().getByRole('button', { name: 'Create account' }));
}

const NO_REVIEWS = {
  summary: { average: 0, count: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } },
  reviews: [], pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
};

// Product pages also ask the backend for reviews; any other unexpected request fails loudly.
beforeEach(() => vi.stubGlobal('fetch', vi.fn((url) => (String(url).includes('/reviews')
  ? json(NO_REVIEWS)
  : Promise.reject(new Error(`unexpected request: ${url}`))))));
afterEach(() => vi.unstubAllGlobals());

describe('guest clicks Add to Cart', () => {
  it('opens the login modal instead of adding, and stays on the page', async () => {
    const user = userEvent.setup();
    renderApp('/category/rings');
    await user.click(addIn(cardOf(RING_NAME)));

    expect(loginDialog()).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(`Log in or sign up to add “${RING_NAME}” to your cart`);
    expect(savedCart()).toEqual([]);
    expect(screen.getByRole('heading', { level: 1, name: 'Rings' })).toBeInTheDocument(); // no navigation
    expect(fetch).not.toHaveBeenCalled();
  });

  it('adds the chosen product automatically after a successful login, then continues as before', async () => {
    const user = userEvent.setup();
    renderApp('/category/rings');
    await user.click(addIn(cardOf(RING_NAME)));
    await logIn(user);

    expect(await screen.findByRole('heading', { level: 1, name: 'Contact us' })).toBeInTheDocument();
    expect(savedCart()).toEqual([{ key: RING, id: RING, designId: null, qty: 1 }]);
    expect(getSession()).toMatchObject({ token: 'jwt-1' });
    expect(loginDialog()).not.toBeInTheDocument();
  });

  it('adds the chosen product automatically after a successful sign-up', async () => {
    const user = userEvent.setup();
    renderApp('/category/rings');
    await user.click(addIn(cardOf(RING_NAME)));
    await signUp(user);

    expect(await screen.findByRole('heading', { level: 1, name: 'Contact us' })).toBeInTheDocument();
    expect(savedCart()).toEqual([{ key: RING, id: RING, designId: null, qty: 1 }]);
    expect(fetch.mock.calls[0][0]).toBe('http://api.test/api/auth/signup');
  });

  it('adds nothing when login fails, keeps the modal, and adds exactly once when the retry works', async () => {
    const user = userEvent.setup();
    renderApp('/category/rings');
    await user.click(addIn(cardOf(RING_NAME)));

    fetch.mockImplementationOnce(() => json({ detail: 'Incorrect email or password.' }, 401));
    await user.type(form().getByLabelText('Email'), 'pooja@example.com');
    await user.type(form().getByLabelText('Password'), 'wrong-pass1');
    await user.click(form().getByRole('button', { name: 'Log in' }));
    expect(await screen.findByText('Incorrect email or password.')).toBeInTheDocument();
    expect(savedCart()).toEqual([]);
    expect(loginDialog()).toBeInTheDocument();

    await user.clear(form().getByLabelText('Password'));
    await user.type(form().getByLabelText('Password'), 'password1');
    fetch.mockImplementationOnce(() => json({ token: 'jwt-1', customer: CUSTOMER }));
    await user.click(form().getByRole('button', { name: 'Log in' }));
    await screen.findByRole('heading', { level: 1, name: 'Contact us' });
    expect(savedCart()).toEqual([{ key: RING, id: RING, designId: null, qty: 1 }]);
  });

  it('forgets the item if the modal is closed, so a later login adds nothing by surprise', async () => {
    const user = userEvent.setup();
    renderApp('/category/rings');
    await user.click(addIn(cardOf(RING_NAME)));
    await user.keyboard('{Escape}');
    expect(loginDialog()).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Log in' })); // header icon, opened on purpose this time
    expect(screen.queryByText(/we'll add it right after/i)).not.toBeInTheDocument();
    await logIn(user);
    await screen.findByRole('heading', { name: /hi, pooja/i });
    expect(savedCart()).toEqual([]);
  });

  it('is asked to log in from the product page', async () => {
    const user = userEvent.setup();
    renderApp(`/product/${RING}`);
    await user.click(within(document.querySelector('.product-page-info')).getByRole('button', { name: /^add to cart$/i }));
    expect(loginDialog()).toBeInTheDocument();
    expect(savedCart()).toEqual([]);
  });

  it.each(['/', '/shop', '/category/rings', '/category/watches'])('every Add to Cart button on %s opens the login modal and adds nothing', async (route) => {
    const user = userEvent.setup();
    renderApp(route);
    const buttons = screen.queryAllByRole('button', { name: /add to cart/i });
    expect(buttons.length).toBeGreaterThan(0); // never pass vacuously
    for (const button of buttons) {
      await user.click(button);
      expect(loginDialog()).toBeInTheDocument();
      await user.keyboard('{Escape}');
      expect(loginDialog()).not.toBeInTheDocument();
    }
    expect(savedCart()).toEqual([]);
  });

  it('is asked to log in from the wishlist page too', async () => {
    const user = userEvent.setup();
    seedCart([], [RING]);
    renderApp('/wishlist');
    await user.click(addIn(cardOf(RING_NAME)));
    expect(loginDialog()).toBeInTheDocument();
    expect(savedCart()).toEqual([]);
  });
});

describe('designs', () => {
  const FIXTURE = {
    categories: [{ slug: 'rings', name: 'Rings' }],
    products: [{
      id: 'designer-ring', slug: 'designer-ring', name: 'Designer Ring', categorySlug: 'rings', description: '', price: 200, tag: null,
      designs: [{ id: 'bow', label: 'Bow' }, { id: 'leaf', label: 'Leaf' }],
    }],
  };
  beforeEach(() => setCatalog(FIXTURE));

  it('asks for a design before asking for a login, then adds the chosen design after login', async () => {
    const user = userEvent.setup();
    renderApp('/product/designer-ring');
    const add = () => within(document.querySelector('.product-page-info')).getByRole('button', { name: /^add to cart$/i });

    await user.click(add());
    expect(screen.getByRole('alert')).toHaveTextContent('Select a design');
    expect(loginDialog()).not.toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: 'Leaf' }));
    await user.click(add());
    expect(loginDialog()).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('“Designer Ring”');

    await logIn(user);
    await screen.findByRole('heading', { level: 1, name: 'Contact us' });
    expect(savedCart()).toEqual([{ key: 'designer-ring::leaf', id: 'designer-ring', designId: 'leaf', qty: 1 }]);
  });
});

describe('quantity', () => {
  // The buttons add one at a time today; the hook supports a quantity, and the pending add must keep it.
  function Probe() {
    const add = useAddToCart();
    return <button type="button" onClick={() => add(RING, null, 3)}>probe add 3</button>;
  }
  const renderWithProbe = () => render(
    <MemoryRouter initialEntries={['/shop']}>
      <StoreProvider><UIProvider><App /><Probe /></UIProvider></StoreProvider>
    </MemoryRouter>,
  );

  it('adds the originally selected quantity after login', async () => {
    const user = userEvent.setup();
    renderWithProbe();
    await user.click(screen.getByRole('button', { name: 'probe add 3' }));
    expect(savedCart()).toEqual([]);
    await logIn(user);
    await screen.findByRole('heading', { level: 1, name: 'Contact us' });
    expect(savedCart()).toEqual([{ key: RING, id: RING, designId: null, qty: 3 }]);
  });

  it('adds the quantity to what is already in the cart, up to the per-line limit', async () => {
    const user = userEvent.setup();
    loggedIn();
    seedCart([{ id: RING, qty: 9 }]);
    renderWithProbe();
    await user.click(screen.getByRole('button', { name: 'probe add 3' }));
    expect(savedCart()).toEqual([{ key: RING, id: RING, designId: null, qty: 10 }]);
  });
});

describe('logged-in customer', () => {
  it('adds straight away with no login modal', async () => {
    const user = userEvent.setup();
    loggedIn();
    renderApp('/category/rings');
    await user.click(addIn(cardOf(RING_NAME)));
    expect(await screen.findByRole('heading', { level: 1, name: 'Contact us' })).toBeInTheDocument();
    expect(savedCart()).toEqual([{ key: RING, id: RING, designId: null, qty: 1 }]);
    expect(loginDialog()).not.toBeInTheDocument();
  });

  it('is asked to log in again after logging out', async () => {
    const user = userEvent.setup();
    loggedIn();
    renderApp('/category/rings');
    await user.click(screen.getByRole('button', { name: 'Log in' }));
    await user.click(screen.getByRole('button', { name: 'Log out' }));
    await user.keyboard('{Escape}');

    await user.click(addIn(cardOf(RING_NAME)));
    expect(loginDialog()).toBeInTheDocument();
    expect(savedCart()).toEqual([]);
  });

  it('can still use the existing cart (change quantity, remove) without any login prompt', async () => {
    const user = userEvent.setup();
    seedCart([{ id: RING, qty: 2 }]); // e.g. a cart saved before this rule existed
    renderApp('/cart');
    await user.click(screen.getByRole('button', { name: /remove gold tulip rings/i }));
    expect(savedCart()).toEqual([]);
    expect(loginDialog()).not.toBeInTheDocument();
  });
});

describe('checkout needs a login too (server answers 401)', () => {
  const fill = async (user) => {
    const v = { 'Full name': 'Asha Raman', 'Mobile number': '98765 43210', Address: '12 Temple Road', City: 'Chennai', State: 'Tamil Nadu', 'PIN code': '600004' };
    for (const [label, value] of Object.entries(v)) await user.type(screen.getByLabelText(label), value);
  };

  it('clears the stale session, keeps the cart, explains, and opens the login modal', async () => {
    const user = userEvent.setup();
    loggedIn(); // looks logged in here, but the server no longer accepts the token
    seedCart([{ id: RING, qty: 2 }]);
    fetch.mockImplementationOnce(() => json({ detail: 'Please log in.' }, 401));
    renderApp('/checkout');
    await fill(user);
    await user.click(screen.getByRole('button', { name: /place order/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Please log in to place your order');
    await waitFor(() => expect(loginDialog()).toBeInTheDocument());
    expect(getSession()).toBeNull();
    expect(savedCart()).toHaveLength(1);
    expect(fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer jwt-existing');
  });

  it('sends the login token with the order when logged in', async () => {
    const user = userEvent.setup();
    loggedIn();
    seedCart([{ id: RING, qty: 2 }]);
    fetch.mockImplementationOnce(() => json({
      id: 'PC261012-4321', status: 'Placed', createdAt: '2026-10-12T10:00:00Z', total: 598, accessToken: 'tok',
      customer: { name: 'Asha Raman', phone: '9876543210', email: '', address: '12 Temple Road', city: 'Chennai', state: 'Tamil Nadu', pincode: '600004', notes: '' },
      items: [{ productId: RING, designId: null, design: null, name: RING_NAME, image: '', price: 299, qty: 2 }],
    }, 201));
    renderApp('/checkout');
    await fill(user);
    await user.click(screen.getByRole('button', { name: /place order/i }));
    await screen.findByRole('heading', { name: /order placed/i });
    expect(fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer jwt-existing');
  });
});

describe('store guard (not only the UI)', () => {
  it('addToCart itself refuses a guest, so no future button can bypass the rule', () => {
    let store;
    function Grab() { store = useStore(); return null; }
    render(<StoreProvider><Grab /></StoreProvider>);
    expect(store.addToCart(RING)).toEqual({ ok: false, reason: 'login-required' });
    expect(store.cartCount).toBe(0);
    expect(store.addToCart('no-such-product')).toEqual({ ok: false, reason: 'not-found' });
  });
});
