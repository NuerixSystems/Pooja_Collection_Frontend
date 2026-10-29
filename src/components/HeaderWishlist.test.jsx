import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderApp, seedCart } from '../test/utils';
import { logout } from '../services/auth';
import { saveSession } from '../services/session';

const RING = 'gold-tulip-rings-3-set';
const RING_NAME = 'Gold Tulip Rings - 3 Set';
const WATCH_NAME = 'Kashmiri Peacock Bracelet Watch';

const header = () => within(document.querySelector('.site-header'));
const heart = () => header().getByRole('link', { name: /^wishlist/i });
const savedWishlist = () => JSON.parse(localStorage.getItem('pooja-collection:store:v1')).wishlist;
const cardOf = (name) => screen.getByRole('link', { name }).closest('article');

describe('navbar wishlist heart', () => {
  it('sits right beside the Cart icon and links to the wishlist page', () => {
    renderApp('/');
    expect(heart()).toHaveAttribute('href', '/wishlist');
    const actions = [...document.querySelector('.header-actions').children];
    expect(actions.at(-2)).toBe(heart());
    expect(actions.at(-1)).toBe(header().getByRole('button', { name: /^cart/i }));
  });

  it('shows both the account shortcut and wishlist on mobile', () => {
    renderApp('/');
    const account = header().getByRole('button', { name: 'Log in' });
    expect(account).not.toHaveClass('hide-mobile');
    expect(account.closest('.hide-mobile')).toBeNull();
    expect(heart()).not.toHaveClass('hide-mobile');
    expect(heart().closest('.hide-mobile')).toBeNull();
  });

  it('labels the account shortcut for a signed-in customer', () => {
    act(() => saveSession({ token: 'customer-token', customer: { id: 42, name: 'Pooja' } }));
    renderApp('/');
    expect(header().getByRole('button', { name: 'My Account' })).toBeInTheDocument();
  });

  it('has no badge when nothing is saved', () => {
    renderApp('/');
    expect(heart()).toHaveAccessibleName('Wishlist');
    expect(heart().querySelector('.badge')).toBeNull();
  });

  it('shows a count badge that follows adds and removes, with an accessible name', async () => {
    const user = userEvent.setup();
    renderApp('/shop');
    await user.click(screen.getByRole('button', { name: new RegExp(`add ${RING_NAME} to wishlist`, 'i') }));
    expect(heart().querySelector('.badge')).toHaveTextContent('1');
    expect(heart()).toHaveAccessibleName('Wishlist (1)');

    await user.click(screen.getByRole('button', { name: new RegExp(`add ${WATCH_NAME} to wishlist`, 'i') }));
    expect(heart().querySelector('.badge')).toHaveTextContent('2');

    await user.click(screen.getByRole('button', { name: new RegExp(`remove ${RING_NAME} from wishlist`, 'i') }));
    expect(heart().querySelector('.badge')).toHaveTextContent('1');
    await user.click(screen.getByRole('button', { name: new RegExp(`remove ${WATCH_NAME} from wishlist`, 'i') }));
    expect(heart().querySelector('.badge')).toBeNull();
    expect(savedWishlist()).toEqual([]);
  });

  it('shows the saved count from a previous visit', () => {
    seedCart([], [RING]);
    renderApp('/');
    expect(heart()).toHaveAccessibleName('Wishlist (1)');
  });

  it('does not count saved products that are no longer in the catalogue', () => {
    seedCart([], [RING, 'does-not-exist']);
    renderApp('/');
    expect(heart().querySelector('.badge')).toHaveTextContent('1');
  });

  it('opens the wishlist page with the saved products when clicked', async () => {
    const user = userEvent.setup();
    seedCart([], [RING]);
    renderApp('/');
    await user.click(heart());

    expect(await screen.findByRole('heading', { level: 1, name: /your wishlist/i })).toBeInTheDocument();
    expect(screen.getByText('1 saved item')).toBeInTheDocument();
    expect(within(screen.getByRole('main')).getByRole('link', { name: RING_NAME })).toHaveAttribute('href', `/product/${RING}`);
    expect(heart()).toHaveAttribute('aria-current', 'page');
  });

  it('opens an empty state when nothing is saved', async () => {
    const user = userEvent.setup();
    renderApp('/');
    await user.click(heart());
    expect(await screen.findByRole('heading', { name: /nothing saved yet/i })).toBeInTheDocument();
  });

  it('lets the shopper remove a product from the wishlist page, updating the badge', async () => {
    const user = userEvent.setup();
    seedCart([], [RING, 'kashmiri-peacock-bracelet-watch']);
    renderApp('/wishlist');
    expect(screen.getAllByRole('article')).toHaveLength(2);

    await user.click(within(cardOf(RING_NAME)).getByRole('button', { name: /remove .* from wishlist/i }));
    expect(screen.getAllByRole('article')).toHaveLength(1);
    expect(screen.queryByRole('link', { name: RING_NAME })).not.toBeInTheDocument();
    expect(heart()).toHaveAccessibleName('Wishlist (1)');
    expect(savedWishlist()).toEqual(['kashmiri-peacock-bracelet-watch']);
  });

  it('works for guests: saving needs no login', async () => {
    const user = userEvent.setup();
    renderApp('/shop');
    await user.click(screen.getByRole('button', { name: new RegExp(`add ${RING_NAME} to wishlist`, 'i') }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(savedWishlist()).toEqual([RING]);
  });

  it('clears the visible wishlist on logout and restores it for the same customer', async () => {
    const user = userEvent.setup();
    renderApp('/shop');
    act(() => saveSession({ token: 'first-token', customer: { id: 42, name: 'Pooja' } }));

    await user.click(screen.getByRole('button', { name: new RegExp(`add ${RING_NAME} to wishlist`, 'i') }));
    expect(heart()).toHaveAccessibleName('Wishlist (1)');

    act(() => logout());
    expect(heart()).toHaveAccessibleName('Wishlist');
    expect(savedWishlist()).toEqual([]);

    act(() => saveSession({ token: 'second-token', customer: { id: 42, name: 'Pooja' } }));
    await waitFor(() => expect(heart()).toHaveAccessibleName('Wishlist (1)'));
    expect(screen.getByRole('button', { name: new RegExp(`remove ${RING_NAME} from wishlist`, 'i') })).toBeInTheDocument();
  });

  it('does not show one customer wishlist to another customer', async () => {
    const user = userEvent.setup();
    renderApp('/shop');
    act(() => saveSession({ token: 'first-token', customer: { id: 42, name: 'Pooja' } }));

    await user.click(screen.getByRole('button', { name: new RegExp(`add ${RING_NAME} to wishlist`, 'i') }));
    act(() => logout());
    act(() => saveSession({ token: 'other-token', customer: { id: 43, name: 'Other' } }));

    await waitFor(() => expect(heart()).toHaveAccessibleName('Wishlist'));
  });

  it('keeps the cart badge and the wishlist badge independent', () => {
    seedCart([{ id: RING, qty: 3 }], [RING]);
    renderApp('/');
    expect(header().getByRole('button', { name: /^cart/i })).toHaveAccessibleName('Cart (3)');
    expect(heart()).toHaveAccessibleName('Wishlist (1)');
  });
});
