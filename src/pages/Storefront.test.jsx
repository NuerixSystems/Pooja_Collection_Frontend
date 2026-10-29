import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderApp, savedCart, seedCart } from '../test/utils';

const RING = 'gold-tulip-rings-3-set';
const RING_NAME = 'Gold Tulip Rings - 3 Set';

describe('homepage', () => {
  it('is category-first with all 7 categories and no Dresses', () => {
    renderApp('/');
    const main = screen.getByRole('main');
    const headings = within(main).getAllByRole('heading', { level: 1 }).concat(within(main).getAllByRole('heading', { level: 2 }));
    expect(headings[0]).toHaveTextContent('Shop by category');
    const cats = within(main).getAllByRole('link').filter((a) => a.getAttribute('href')?.startsWith('/category/') && a.className.includes('category-card'));
    expect(cats).toHaveLength(7);
    expect(main).not.toHaveTextContent(/dresses/i);
  });
});

describe('shop', () => {
  it('lists all 7 products and keeps Dresses out', () => {
    renderApp('/shop');
    expect(document.querySelectorAll('article.product-card')).toHaveLength(7);
    expect(screen.queryByRole('link', { name: /dresses/i })).not.toBeInTheDocument();
  });

  it('has no supplier or brand-claim wording anywhere on the page', () => {
    renderApp('/shop');
    expect(document.body.textContent).not.toMatch(/meesho|osweet|kitty|stock alert/i);
  });

  it('finds nothing for a supplier-name search', () => {
    renderApp('/shop?q=meesho');
    expect(screen.getByRole('heading', { name: /no products found/i })).toBeInTheDocument();
  });
});

describe('clickable product cards', () => {
  it('links each card to its product page', () => {
    renderApp('/shop');
    const card = screen.getByRole('link', { name: RING_NAME });
    expect(card).toHaveAttribute('href', `/product/${RING}`);
    expect(document.querySelectorAll('.product-link')).toHaveLength(7);
  });

  it('opens the product page when the name is clicked', async () => {
    const user = userEvent.setup();
    renderApp('/shop');
    await user.click(screen.getByRole('link', { name: RING_NAME }));
    expect(await screen.findByRole('heading', { level: 1, name: RING_NAME })).toBeInTheDocument();
  });

  it('add-to-cart on a card adds the item and opens the contact/order page', async () => {
    const user = userEvent.setup();
    renderApp('/category/rings');
    const card = screen.getByRole('link', { name: RING_NAME }).closest('article');
    await user.click(within(card).getByRole('button', { name: /add to cart/i }));
    expect(savedCart()).toEqual([{ key: RING, id: RING, designId: null, qty: 1 }]);
    expect(await screen.findByRole('heading', { level: 1, name: 'Contact us' })).toBeInTheDocument();
  });

  it('asks guests to log in before wishlisting from a card', async () => {
    const user = userEvent.setup();
    renderApp('/category/rings');
    await user.click(screen.getByRole('button', { name: /add gold tulip rings - 3 set to wishlist/i }));
    expect(screen.getByRole('heading', { level: 1, name: 'Rings' })).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: /log in/i })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('pooja-collection:store:v1')).wishlist).toEqual([]);
  });
});

describe('product page', () => {
  it('shows details, related products and a working add to cart (no designs, no selector)', async () => {
    const user = userEvent.setup();
    renderApp(`/product/${RING}`);
    expect(screen.getByRole('heading', { level: 1, name: RING_NAME })).toBeInTheDocument();
    // scoped: other products in "You May Also Like" can share the same price
    expect(within(document.querySelector('.product-page-info')).getByText('₹299')).toBeInTheDocument();
    expect(screen.getByText('Tulip shape with gemstone, black holder')).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: /choose a design/i })).not.toBeInTheDocument();
    // "You May Also Like" lists every other product from every category, never the current one
    const reco = screen.getByRole('heading', { name: /you may also like/i }).closest('section');
    expect(within(reco).getAllByRole('article')).toHaveLength(6);
    expect(within(reco).queryByRole('link', { name: RING_NAME })).not.toBeInTheDocument();
    expect(within(reco).getByRole('link', { name: 'Kashmiri Peacock Bracelet Watch' })).toHaveAttribute('href', '/product/kashmiri-peacock-bracelet-watch');
    expect(document.title).toBe(`${RING_NAME} — Pooja Collection`);

    // scoped to the main product block: the related-product cards below have their own buttons
    await user.click(within(document.querySelector('.product-page-info')).getByRole('button', { name: /^add to cart$/i }));
    expect(savedCart()).toHaveLength(1);
    expect(await screen.findByRole('heading', { level: 1, name: 'Contact us' })).toBeInTheDocument();
  });

  it('serves each product by its slug, with its backend image', () => {
    renderApp('/product/kashmiri-peacock-bracelet-watch');
    expect(screen.getByRole('heading', { level: 1, name: 'Kashmiri Peacock Bracelet Watch' })).toBeInTheDocument();
    expect(document.querySelector('.product-page-media img')).toHaveAttribute('src', '/media/products/kashmiri-peacock-bracelet-watch.webp');
  });

  it('shows not-found for unknown products', () => {
    renderApp('/product/meesho-matte-gold-earring-set-6-in-1');
    expect(screen.getByRole('heading', { name: /page not found/i })).toBeInTheDocument();
  });
});

describe('search panel', () => {
  it('suggests products linking to their pages, and nothing for supplier names', async () => {
    const user = userEvent.setup();
    renderApp('/');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    const box = screen.getByRole('searchbox', { name: /search products/i });
    await user.type(box, 'peacock');
    // The Home page behind the panel also links to this product (Trending now), so scope to the search dialog.
    const dialog = screen.getByRole('dialog', { name: /^search$/i });
    expect(within(dialog).getByRole('link', { name: /Kashmiri Peacock Bracelet Watch/ })).toHaveAttribute('href', '/product/kashmiri-peacock-bracelet-watch');
    await user.clear(box);
    await user.type(box, 'meesho');
    expect(screen.getByText(/no matches for/i)).toBeInTheDocument();
  });
});

describe('cart quantity guard', () => {
  it('disables + at the limit and explains why, without claiming anything about stock', async () => {
    const user = userEvent.setup();
    seedCart([{ id: RING, qty: 9 }]);
    renderApp('/cart');
    const plus = screen.getByRole('button', { name: /increase quantity of gold tulip rings/i });
    expect(plus).toBeEnabled();
    await user.click(plus);
    expect(plus).toBeDisabled();
    expect(screen.getByText('Maximum 10 per order')).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/in stock|out of stock|only \d+ left/i);
    expect(savedCart()[0].qty).toBe(10);
  });

  it('clamps a tampered saved quantity on load', () => {
    seedCart([{ id: RING, qty: 5000 }]);
    renderApp('/cart');
    expect(savedCart()[0].qty).toBe(10);
  });

  it('disables add-to-cart on the product page once the line is at the limit', () => {
    seedCart([{ id: RING, qty: 10 }]);
    renderApp(`/product/${RING}`);
    expect(screen.getByRole('button', { name: /maximum in cart/i })).toBeDisabled();
  });

  it('drops saved lines whose product no longer exists instead of crashing', () => {
    seedCart([{ id: 'meesho-matte-gold-earring-set-6-in-1', qty: 1 }]);
    renderApp('/cart');
    expect(screen.getByRole('heading', { name: /your cart is empty/i })).toBeInTheDocument();
  });
});
