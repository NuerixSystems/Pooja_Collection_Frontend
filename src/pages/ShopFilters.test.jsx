import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderApp, savedCart } from '../test/utils';

const cards = () => [...document.querySelectorAll('article.product-card')];
const cardNames = () => cards().map((c) => c.querySelector('.product-name').textContent);
const cardPrices = () => cards().map((c) => c.querySelector('.product-price').textContent);
const count = () => screen.getByRole('status').textContent;
const sortBox = () => screen.getByRole('combobox', { name: /sort by/i });
const sidebar = () => screen.getByRole('complementary', { name: /product filters/i });
const RING = 'gold-tulip-rings-3-set';

describe('shop filters (desktop)', () => {
  it('shows price and category filters, and no availability filter (the API has no stock data)', () => {
    renderApp('/shop');
    const side = sidebar();
    expect(within(side).getByText('Price')).toBeInTheDocument();
    expect(within(side).getByText('Category')).toBeInTheDocument();
    expect(within(side).getAllByRole('checkbox')).toHaveLength(7); // categories only
    expect(document.body.textContent).not.toMatch(/in stock|out of stock|availability/i);
    expect(count()).toBe('7 products');
  });

  it('loads categories dynamically with product counts', () => {
    renderApp('/shop');
    const rings = within(sidebar()).getByRole('checkbox', { name: /^Rings/ });
    expect(rings).not.toBeChecked();
    expect(within(sidebar()).getByText('Bridal / Traditional')).toBeInTheDocument();
  });

  it('filters by category, several at once, and updates the count', async () => {
    const user = userEvent.setup();
    renderApp('/shop');
    await user.click(within(sidebar()).getByRole('checkbox', { name: /^Rings/ }));
    expect(cardNames()).toEqual(['Gold Tulip Rings - 3 Set']);
    expect(count()).toBe('Showing 1 of 7 products');
    await user.click(within(sidebar()).getByRole('checkbox', { name: /^Earrings/ }));
    expect(cards()).toHaveLength(2);
    expect(count()).toBe('Showing 2 of 7 products');
  });

  it('filters by typed minimum and maximum price', async () => {
    const user = userEvent.setup();
    renderApp('/shop');
    const min = within(sidebar()).getByLabelText('Minimum price');
    await user.clear(min);
    await user.type(min, '300');
    await user.tab();
    expect(cards()).toHaveLength(3);
    expect(cardPrices().every((p) => /₹(399|499)/.test(p))).toBe(true);
    expect(document.querySelector('.price-filter__selected').textContent).toMatch(/₹300.*₹499/);

    const max = within(sidebar()).getByLabelText('Maximum price');
    await user.clear(max);
    await user.type(max, '399{Enter}');
    expect(cards()).toHaveLength(2);
    expect(count()).toBe('Showing 2 of 7 products');
  });

  it('filters with the slider handles and keeps the typed boxes in sync', () => {
    renderApp('/shop');
    fireEvent.change(within(sidebar()).getByLabelText('Minimum price slider'), { target: { value: '300' } });
    expect(cards()).toHaveLength(3);
    expect(within(sidebar()).getByLabelText('Minimum price')).toHaveValue(300);
    fireEvent.change(within(sidebar()).getByLabelText('Maximum price slider'), { target: { value: '399' } });
    expect(cards()).toHaveLength(2);
    expect(within(sidebar()).getByLabelText('Maximum price')).toHaveValue(399);
  });

  it('never lets the minimum pass the maximum, and clamps typed values to the catalogue range', async () => {
    const user = userEvent.setup();
    renderApp('/shop');
    const max = within(sidebar()).getByLabelText('Maximum price');
    await user.clear(max);
    await user.type(max, '50{Enter}'); // below the cheapest product -> clamped to the catalogue minimum
    expect(max).toHaveValue(199);
    expect(cards()).toHaveLength(2);
    fireEvent.change(within(sidebar()).getByLabelText('Minimum price slider'), { target: { value: '450' } });
    expect(within(sidebar()).getByLabelText('Minimum price')).toHaveValue(199);
  });

  it('combines category, price and sorting', async () => {
    const user = userEvent.setup();
    renderApp('/shop');
    await user.click(within(sidebar()).getByRole('checkbox', { name: /^Necklaces/ }));
    await user.click(within(sidebar()).getByRole('checkbox', { name: /^Bridal/ }));
    await user.click(within(sidebar()).getByRole('checkbox', { name: /^Watches/ }));
    const min = within(sidebar()).getByLabelText('Minimum price');
    await user.clear(min);
    await user.type(min, '300{Enter}');
    expect(cardNames()).toEqual(['Kashmiri Peacock Bracelet Watch', 'Gold Maang Tikka']);
    await user.selectOptions(sortBox(), 'price-desc');
    expect(cardNames()).toEqual(['Kashmiri Peacock Bracelet Watch', 'Gold Maang Tikka']);
    await user.selectOptions(sortBox(), 'price-asc');
    expect(cardNames()).toEqual(['Gold Maang Tikka', 'Kashmiri Peacock Bracelet Watch']);
  });

  it('sorts by price both ways and back to Featured', async () => {
    const user = userEvent.setup();
    renderApp('/shop');
    const featured = cardNames();
    await user.selectOptions(sortBox(), 'price-asc');
    expect(cardPrices()[0]).toBe('₹199');
    expect(cardPrices().at(-1)).toBe('₹499');
    await user.selectOptions(sortBox(), 'price-desc');
    expect(cardPrices()[0]).toBe('₹499');
    await user.selectOptions(sortBox(), '');
    expect(cardNames()).toEqual(featured);
  });

  it('offers no "newest" sort because products carry no creation date', () => {
    renderApp('/shop');
    expect(within(sortBox()).queryByRole('option', { name: /newest/i })).not.toBeInTheDocument();
  });

  it('shows a helpful message when nothing matches, and Reset filters recovers', async () => {
    const user = userEvent.setup();
    renderApp('/shop');
    await user.click(within(sidebar()).getByRole('checkbox', { name: /^Watches/ }));
    const max = within(sidebar()).getByLabelText('Maximum price');
    await user.clear(max);
    await user.type(max, '300{Enter}');
    expect(cards()).toHaveLength(0);
    expect(screen.getByRole('heading', { name: /no products match your filters/i })).toBeInTheDocument();
    expect(count()).toBe('Showing 0 of 7 products');
    await user.click(screen.getByRole('button', { name: /reset filters/i }));
    expect(cards()).toHaveLength(7);
    expect(count()).toBe('7 products');
  });

  it('Clear all resets category, price and sort, but keeps the search', async () => {
    const user = userEvent.setup();
    renderApp('/shop?q=gold');
    const before = cards().length;
    await user.click(within(sidebar()).getByRole('checkbox', { name: /^Rings/ }));
    await user.selectOptions(sortBox(), 'price-desc');
    await user.click(within(sidebar()).getByRole('button', { name: /clear all/i }));
    expect(cards()).toHaveLength(before);
    expect(sortBox()).toHaveValue('');
    expect(screen.getByRole('heading', { level: 1, name: /results for “gold”/i })).toBeInTheDocument();
    expect(within(sidebar()).queryByRole('button', { name: /clear all/i })).not.toBeInTheDocument();
  });

  it('works together with search', async () => {
    const user = userEvent.setup();
    renderApp('/shop?q=bracelet');
    expect(cards().length).toBeGreaterThan(1);
    await user.click(within(sidebar()).getByRole('checkbox', { name: /^Watches/ }));
    expect(cardNames()).toEqual(['Kashmiri Peacock Bracelet Watch']);
    expect(screen.getByRole('heading', { level: 1, name: /results for “bracelet”/i })).toBeInTheDocument();
  });

  it('starts from filters in the URL', () => {
    renderApp('/shop?category=rings&category=earrings&minPrice=250');
    expect(cardNames()).toEqual(['Gold Tulip Rings - 3 Set']);
    expect(within(sidebar()).getByRole('checkbox', { name: /^Rings/ })).toBeChecked();
  });

  it('keeps the existing category chips and their URLs', () => {
    renderApp('/shop');
    const chips = within(screen.getByRole('navigation', { name: 'Categories' }));
    expect(chips.getByRole('link', { name: 'Rings' })).toHaveAttribute('href', '/category/rings');
    expect(chips.getByRole('link', { name: 'All' })).toHaveAttribute('href', '/shop');
  });
});

describe('shop + product cards (no regressions)', () => {
  it('opens a product page from a filtered result', async () => {
    const user = userEvent.setup();
    renderApp('/shop?category=rings');
    await user.click(screen.getByRole('link', { name: 'Gold Tulip Rings - 3 Set' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Gold Tulip Rings - 3 Set' })).toBeInTheDocument();
  });

  it('requires login to wishlist a product from a filtered result', async () => {
    const user = userEvent.setup();
    renderApp('/shop?category=rings');
    await user.click(screen.getByRole('button', { name: /add gold tulip rings - 3 set to wishlist/i }));
    expect(screen.getByRole('dialog', { name: /log in/i })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('pooja-collection:store:v1')).wishlist).toEqual([]);
    expect(savedCart()).toEqual([]);
  });

  it('every card has the same structure: image frame, name, price and a button inside the footer', () => {
    renderApp('/shop');
    cards().forEach((c) => {
      expect(c.querySelector('.product-media')).toBeInTheDocument();
      expect(c.querySelector('.product-foot .product-price')).toBeInTheDocument();
      expect(c.querySelector('.product-foot .product-add')).toBeInTheDocument();
    });
  });

  it('category pages and the home Trending grid still render their cards', () => {
    renderApp('/category/rings');
    expect(cards()).toHaveLength(1);
  });
});

describe('shop filters (mobile / tablet drawer)', () => {
  const mobile = () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: !query.includes('min-width: 901px'),
      media: query, addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {},
    }));
  };
  afterEach(() => { delete window.matchMedia; });

  it('hides the sidebar and opens filters in a drawer with Apply and Reset', async () => {
    mobile();
    const user = userEvent.setup();
    renderApp('/shop');
    expect(screen.queryByRole('complementary', { name: /product filters/i })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^filters/i }));
    const drawer = screen.getByRole('dialog', { name: 'Filters' });
    await user.click(within(drawer).getByRole('checkbox', { name: /^Rings/ }));
    expect(cards()).toHaveLength(7); // nothing applied until Apply
    await user.click(within(drawer).getByRole('button', { name: 'Apply' }));
    expect(screen.queryByRole('dialog', { name: 'Filters' })).not.toBeInTheDocument();
    expect(cardNames()).toEqual(['Gold Tulip Rings - 3 Set']);
    expect(screen.getByRole('button', { name: /^filters/i })).toHaveTextContent('1');
  });

  it('Reset in the drawer clears the draft, and Apply then shows everything', async () => {
    mobile();
    const user = userEvent.setup();
    renderApp('/shop?category=rings');
    await user.click(screen.getByRole('button', { name: /^filters/i }));
    const drawer = screen.getByRole('dialog', { name: 'Filters' });
    expect(within(drawer).getByRole('checkbox', { name: /^Rings/ })).toBeChecked();
    await user.click(within(drawer).getByRole('button', { name: 'Reset' }));
    expect(within(drawer).getByRole('checkbox', { name: /^Rings/ })).not.toBeChecked();
    await user.click(within(drawer).getByRole('button', { name: 'Apply' }));
    expect(cards()).toHaveLength(7);
  });

  it('closing the drawer without Apply discards the draft', async () => {
    mobile();
    const user = userEvent.setup();
    renderApp('/shop');
    await user.click(screen.getByRole('button', { name: /^filters/i }));
    await user.click(within(screen.getByRole('dialog', { name: 'Filters' })).getByRole('checkbox', { name: /^Rings/ }));
    await user.keyboard('{Escape}');
    expect(cards()).toHaveLength(7);
  });
});
