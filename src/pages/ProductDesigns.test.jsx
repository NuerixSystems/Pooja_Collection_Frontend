import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getCategory, setCatalog } from '../services/catalog';
import { renderApp, savedCart, seedCart } from '../test/utils';

// Fixture catalogue: the shipped data lists no designs, so the design-selection flow is exercised
// here against fixture data fed to the catalogue the same way the backend response is.
const FIXTURE = {
  categories: [{ slug: 'rings', name: 'Rings', image: '/media/pooja/categories/rings.webp' }, { slug: 'dresses', name: 'Dresses' }],
  products: [
    { id: 'plain-ring', slug: 'plain-ring', name: 'Plain Ring', categorySlug: 'rings', description: 'One design', price: 100, tag: null, image: 'https://crm-dkc2.onrender.com/api/product-image/1' },
    {
      id: 'designer-ring', slug: 'designer-ring', name: 'Designer Ring', categorySlug: 'rings', description: 'Several designs', price: 200, tag: null,
      designs: [{ id: 'bow', label: 'Bow' }, { id: 'leaf', label: 'Leaf' }, { id: 'bow', label: 'Duplicate id is ignored' }, { id: 'x' }],
    },
    { id: 'red-dress', slug: 'red-dress', name: 'Red Dress', categorySlug: 'dresses', description: '', price: 900, tag: null },
  ],
};

beforeEach(() => setCatalog(FIXTURE)); // runs after the shared setup's beforeEach, so it wins

const addButton = () => within(document.querySelector('.product-page-info')).getByRole('button', { name: /add to cart|maximum in cart/i });

describe('products with designs', () => {
  it('uses the category image when the product image fails on the detail page', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    try {
      renderApp('/product/plain-ring');
      fireEvent.error(await screen.findByRole('img', { name: 'Plain Ring' }));
      expect(screen.getByRole('img', { name: 'Plain Ring' })).toHaveAttribute('src', getCategory('rings').image);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('shows only the designs the data lists (no invented or malformed ones)', () => {
    renderApp('/product/designer-ring');
    const group = screen.getByRole('group', { name: /choose a design/i });
    expect(within(group).getAllByRole('radio').map((r) => r.value)).toEqual(['bow', 'leaf']);
  });

  it('blocks add-to-cart until a design is chosen, explains why, and focuses the options', async () => {
    const user = userEvent.setup();
    renderApp('/product/designer-ring');
    await user.click(addButton());
    expect(screen.getByRole('alert')).toHaveTextContent('Select a design to add this item to your cart.');
    expect(screen.getByRole('radio', { name: 'Bow' })).toHaveFocus();
    expect(savedCart()).toEqual([]);
    expect(screen.queryByRole('dialog', { name: /shopping cart/i })).not.toBeInTheDocument();
  });

  it('adds the chosen design, clears the error, and shows the design in the cart', async () => {
    const user = userEvent.setup();
    renderApp('/product/designer-ring');
    await user.click(addButton()); // error first
    await user.click(screen.getByRole('radio', { name: 'Leaf' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    await user.click(addButton());
    expect(savedCart()).toEqual([{ key: 'designer-ring::leaf', id: 'designer-ring', designId: 'leaf', qty: 1 }]);
    expect(await screen.findByRole('heading', { level: 1, name: 'Contact us' })).toBeInTheDocument();
    expect(screen.getByText('Design: Leaf')).toBeInTheDocument();
  });

  it('keeps different designs as separate cart lines', async () => {
    const user = userEvent.setup();
    seedCart([{ id: 'designer-ring', designId: 'bow', qty: 1 }]);
    renderApp('/product/designer-ring');
    await user.click(screen.getByRole('radio', { name: 'Leaf' }));
    await user.click(addButton());
    expect(savedCart().map((l) => [l.designId, l.qty])).toEqual([['bow', 1], ['leaf', 1]]);
  });

  it('enforces the per-line limit per design', async () => {
    seedCart([{ id: 'designer-ring', designId: 'bow', qty: 10 }]);
    const user = userEvent.setup();
    renderApp('/product/designer-ring');
    await user.click(screen.getByRole('radio', { name: 'Bow' }));
    expect(addButton()).toBeDisabled();
    await user.click(screen.getByRole('radio', { name: 'Leaf' }));
    expect(addButton()).toBeEnabled();
  });

  it('does not carry the selected design over to another product page', async () => {
    const user = userEvent.setup();
    renderApp('/product/designer-ring');
    await user.click(screen.getByRole('radio', { name: 'Bow' }));
    await user.click(screen.getByRole('link', { name: 'Plain Ring' })); // via the related-products card
    expect(screen.queryByRole('group', { name: /choose a design/i })).not.toBeInTheDocument();
  });

  it('sends cards to the product page instead of adding blindly', () => {
    renderApp('/category/rings');
    const card = screen.getByRole('link', { name: 'Designer Ring' }).closest('article');
    expect(within(card).queryByRole('button', { name: /add to cart/i })).not.toBeInTheDocument();
    expect(within(card).getByRole('link', { name: /choose a design/i })).toHaveAttribute('href', '/product/designer-ring');
    const plain = screen.getByRole('link', { name: 'Plain Ring' }).closest('article');
    expect(within(plain).getByRole('button', { name: /add to cart/i })).toBeInTheDocument();
  });

  it('hides saved lines that lack a required design, or use a design no longer offered', () => {
    seedCart([{ id: 'designer-ring', qty: 1 }, { id: 'designer-ring', designId: 'gone', qty: 1 }, { id: 'plain-ring', qty: 1 }]);
    renderApp('/cart');
    expect(screen.getByRole('heading', { name: /your cart/i })).toHaveTextContent('(1)');
    expect(screen.queryByText(/designer ring/i)).not.toBeInTheDocument();
  });

  it('carries the design into the order', async () => {
    const user = userEvent.setup();
    seedCart([{ id: 'designer-ring', designId: 'bow', qty: 2 }]);
    renderApp('/checkout');
    expect(screen.getByText('Design: Bow')).toBeInTheDocument();
    for (const [label, value] of Object.entries({ 'Full name': 'Asha', 'Mobile number': '9876543210', Address: '1 St', City: 'Chennai', State: 'TN', 'PIN code': '600001' })) {
      await user.type(screen.getByLabelText(label), value);
    }
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({
      ok: true, status: 201,
      json: () => Promise.resolve({
        id: 'PC261012-2222', status: 'Placed', createdAt: '2026-10-12T10:00:00Z', total: 400, accessToken: 'tok',
        customer: { name: 'Asha', phone: '9876543210', email: '', address: '1 St', city: 'Chennai', state: 'TN', pincode: '600001', notes: '' },
        items: [{ productId: 'designer-ring', designId: 'bow', design: 'Bow', name: 'Designer Ring', image: '', price: 200, qty: 2 }],
      }),
    })));
    await user.click(screen.getByRole('button', { name: /place order/i }));
    await screen.findByRole('heading', { name: /order placed/i });
    expect(JSON.parse(fetch.mock.calls[0][1].body).items).toEqual([{ productId: 'designer-ring', designId: 'bow', qty: 2 }]);
    expect(screen.getByText('Design: Bow')).toBeInTheDocument();
    vi.unstubAllGlobals();
  });
});

describe('Dresses exclusion (fixture contains a Dresses category and product)', () => {
  it('hides the category, its products, and its page', () => {
    renderApp('/shop');
    expect(screen.queryByText('Red Dress')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Dresses' })).not.toBeInTheDocument();
  });

  it('does not serve the excluded product or category pages', () => {
    renderApp('/product/red-dress');
    expect(screen.getByRole('heading', { name: /page not found/i })).toBeInTheDocument();
  });

  it('drops a saved cart line for an excluded product', () => {
    seedCart([{ id: 'red-dress', qty: 1 }]);
    renderApp('/cart');
    expect(screen.getByRole('heading', { name: /your cart is empty/i })).toBeInTheDocument();
  });
});
