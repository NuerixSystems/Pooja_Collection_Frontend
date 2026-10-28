import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderApp } from '../test/utils';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('header search suggestions', () => {
  it('shows matching category and product suggestions while typing', async () => {
    const user = userEvent.setup();
    renderApp('/');

    await user.type(screen.getByRole('searchbox', { name: /search products/i }), 'e');

    const dropdown = await screen.findByLabelText('Search suggestions');
    const categorySuggestion = within(dropdown).getByRole('link', { name: 'Earrings' });
    expect(categorySuggestion).toHaveAttribute('href', '/category/earrings');
    const productSuggestion = within(dropdown).getAllByRole('link')
      .find((link) => link.getAttribute('href').startsWith('/product/'));
    expect(productSuggestion).toBeTruthy();
  });

  it('opens the matching category when a suggestion is selected', async () => {
    const user = userEvent.setup();
    renderApp('/');

    await user.type(screen.getByRole('searchbox', { name: /search products/i }), 'ear');
    const dropdown = await screen.findByLabelText('Search suggestions');
    await user.click(within(dropdown).getByRole('link', { name: 'Earrings' }));

    await waitFor(() => expect(screen.getByRole('heading', { level: 1, name: 'Earrings' })).toBeInTheDocument());
  });

  it('opens the selected product category from a mobile product suggestion', async () => {
    vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query) => ({
      matches: query === '(max-width: 760px)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })));
    const user = userEvent.setup();
    renderApp('/');

    await user.type(screen.getByRole('searchbox', { name: /search products/i }), 'tulip');
    const dropdown = await screen.findByLabelText('Search suggestions');
    await user.click(within(dropdown).getByRole('link', { name: /Gold Tulip Rings - 3 Set/ }));

    await waitFor(() => expect(screen.getByRole('heading', { level: 1, name: 'Rings' })).toBeInTheDocument());
    expect(screen.getByRole('link', { name: /Gold Tulip Rings - 3 Set/ })).toHaveAttribute(
      'href',
      '/product/gold-tulip-rings-3-set',
    );
    expect(document.querySelector('.category-page .page-chips')).toBeInTheDocument();
  });
});
