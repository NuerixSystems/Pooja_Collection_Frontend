import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderApp, seedCart } from '../test/utils';

describe('footer (Part 2)', () => {
  it('keeps every existing section and adds Shipping Policy, Return Policy and Enquiry List', () => {
    renderApp('/');
    const footer = screen.getByRole('contentinfo');
    ['Quick Links', 'Shop by Category', 'Customer Care', 'Connect With Us'].forEach((name) => {
      expect(within(footer).getByRole('heading', { name })).toBeInTheDocument();
    });
    const link = (name) => within(footer).getByRole('link', { name });
    expect(link('Shipping Policy')).toHaveAttribute('href', '/shipping-policy');
    expect(link('Return Policy')).toHaveAttribute('href', '/return-policy');
    expect(link('Enquiry List')).toHaveAttribute('href', '/contact#enquiry');
    expect(link('Privacy Policy')).toHaveAttribute('href', '/privacy');
    expect(link('Terms & Conditions')).toHaveAttribute('href', '/terms');
    expect(link(/instagram/i)).toHaveAttribute('href', expect.stringContaining('instagram.com'));
    expect(link(/whatsapp/i)).toHaveAttribute('href', expect.stringContaining('wa.me/'));
    expect(footer).toHaveTextContent(/all rights reserved/i);
  });
});

describe('draft policy pages', () => {
  it.each([
    ['/shipping-policy', 'Shipping Policy'],
    ['/return-policy', 'Return Policy'],
    ['/privacy', 'Privacy Policy'],
    ['/terms', 'Terms & Conditions'],
  ])('%s is clearly marked as a draft', (route, title) => {
    renderApp(route);
    expect(screen.getByRole('heading', { level: 1, name: title })).toBeInTheDocument();
    expect(screen.getByRole('note')).toHaveTextContent(/draft page/i);
  });

  it('shipping and return pages do not invent delivery times, charges, return periods or refund terms', () => {
    ['/shipping-policy', '/return-policy'].forEach((route) => {
      const { unmount } = renderApp(route);
      const text = screen.getByRole('main').textContent;
      expect(text).not.toMatch(/\d+\s*(-|to)?\s*\d*\s*(business\s*)?(days?|hours?|weeks?)/i);
      expect(text).not.toMatch(/free (shipping|delivery)|₹\s*\d|within \d+/i);
      unmount();
    });
  });
});

describe('enquiry (existing WhatsApp form, no backend)', () => {
  it('Contact shows the enquiry form anchor when the cart is empty', () => {
    renderApp('/contact');
    expect(document.getElementById('enquiry')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send on whatsapp/i })).toBeInTheDocument();
  });

  it('wishlist shows an empty state with no enquiry link when nothing is saved', () => {
    renderApp('/wishlist');
    expect(screen.getByRole('heading', { name: /nothing saved yet/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /ask about these on whatsapp/i })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /browse the shop/i })).toHaveAttribute('href', '/shop');
  });

  it('wishlist offers a WhatsApp enquiry link built from the saved products', () => {
    seedCart([], ['gold-tulip-rings-3-set']);
    renderApp('/wishlist');
    const ask = screen.getByRole('link', { name: /ask about these on whatsapp/i });
    expect(ask.getAttribute('href')).toContain('wa.me/');
    expect(decodeURIComponent(ask.getAttribute('href'))).toContain('Gold Tulip Rings - 3 Set');
    expect(screen.getByText('1 saved item')).toBeInTheDocument();
  });
});

describe('other pages', () => {
  it('About links to the shop and contact page', () => {
    renderApp('/about');
    expect(screen.getByRole('heading', { level: 1, name: /about us/i })).toBeInTheDocument();
    const main = within(screen.getByRole('main'));   // header and footer also have a "Contact Us" link
    expect(main.getByRole('link', { name: /shop the collection/i })).toHaveAttribute('href', '/shop');
    expect(main.getByRole('link', { name: /contact us/i })).toHaveAttribute('href', '/contact');
  });

  it('empty cart offers the shop and the wishlist', () => {
    renderApp('/cart');
    expect(screen.getByRole('heading', { name: /your cart is empty/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /browse the shop/i })).toHaveAttribute('href', '/shop');
    expect(screen.getByRole('link', { name: /view wishlist/i })).toHaveAttribute('href', '/wishlist');
  });

  it('product page breadcrumb links Home, Shop and the category and names the current product', () => {
    renderApp('/product/gold-tulip-rings-3-set');
    const crumbs = within(screen.getByRole('navigation', { name: /breadcrumb/i }));
    expect(crumbs.getByRole('link', { name: 'Shop' })).toHaveAttribute('href', '/shop');
    expect(crumbs.getByRole('link', { name: 'Rings' })).toHaveAttribute('href', '/category/rings');
    expect(crumbs.getByText('Gold Tulip Rings - 3 Set')).toHaveAttribute('aria-current', 'page');
  });

  it('cart with items still shows the order form with the existing UPI option', () => {
    seedCart([{ id: 'gold-tulip-rings-3-set', qty: 1 }]);
    renderApp('/contact');
    expect(screen.getByRole('heading', { name: /your details/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /upi/i })).toBeInTheDocument();
  });
});
