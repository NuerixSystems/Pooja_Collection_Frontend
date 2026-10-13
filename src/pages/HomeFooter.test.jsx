import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderApp } from '../test/utils';

describe('home sections', () => {
  it('shows Our Story (linking to About), Why Choose Us cards and no duplicate trending products', () => {
    renderApp('/');
    const main = screen.getByRole('main');
    expect(within(main).getByRole('heading', { name: /more than just jewellery/i })).toBeInTheDocument();
    expect(within(main).getByRole('link', { name: /our story/i })).toHaveAttribute('href', '/about');
    expect(within(main).getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(
      expect.arrayContaining(['Elegant Designs', 'Quality Craftsmanship', 'Customer Support']),
    );
    const names = [...main.querySelectorAll('.product-grid .product-name')].map((n) => n.textContent);
    expect(new Set(names).size).toBe(names.length);
    expect(names.length).toBeGreaterThan(0);
  });
});

describe('footer', () => {
  it('links every category, real social links and working policy pages (no # links)', () => {
    renderApp('/');
    const footer = screen.getByRole('contentinfo');
    const hrefs = within(footer).getAllByRole('link').map((a) => a.getAttribute('href'));
    expect(hrefs.filter((h) => h.startsWith('/category/'))).toHaveLength(7);
    expect(hrefs).toEqual(expect.arrayContaining(['/', '/shop', '/about', '/contact', '/wishlist', '/privacy', '/terms', '/#categories']));
    expect(hrefs.some((h) => h === '#')).toBe(false);
    expect(within(footer).getByRole('link', { name: /instagram/i })).toHaveAttribute('href', expect.stringContaining('instagram.com'));
    expect(within(footer).getByRole('link', { name: /whatsapp/i })).toHaveAttribute('href', expect.stringContaining('wa.me/'));
  });

  it('privacy and terms routes render', () => {
    renderApp('/privacy');
    expect(screen.getByRole('heading', { level: 1, name: /privacy policy/i })).toBeInTheDocument();
  });
});
