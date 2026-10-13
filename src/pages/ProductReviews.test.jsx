import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderApp } from '../test/utils';

vi.mock('../config', async (orig) => ({ ...(await orig()), CRM: { tenantId: '8', apiUrl: 'http://api.test' } }));

const SLUG = 'gold-tulip-rings-3-set';
const BASE = `http://api.test/api/products/${SLUG}/reviews`;
const json = (body, status = 200) => Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) });
const SESSION_KEY = 'pooja-collection:auth:v1';
const logIn = () => localStorage.setItem(SESSION_KEY, JSON.stringify({ token: 't', customer: { name: 'Asha' } }));

// Test-only responses, served by a mocked fetch in the exact shape the backend returns. Nothing is bundled with the app.
const dist = (d) => ({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0, ...d });
const rev = (id, rating, title, extra = {}) => ({
  id, rating, title, body: `Body ${title}`, customerName: `Tester ${id}`, verifiedPurchase: false,
  createdAt: '2026-01-02T00:00:00Z', updatedAt: '2026-01-02T00:00:00Z', ...extra,
});
const page = (reviews, { summary, total = reviews.length, pageNo = 1, totalPages = 1 } = {}) => ({
  summary: summary ?? { average: 0, count: 0, distribution: dist({}) },
  reviews,
  pagination: { page: pageNo, pageSize: 10, total, totalPages },
});
const SUMMARY = { average: 3.5, count: 4, distribution: dist({ 5: 1, 4: 2, 1: 1 }) };
const EMPTY = page([]);
const LIST = page([rev(1, 5, 'Test five', { verifiedPurchase: true }), rev(2, 1, 'Test one'), rev(3, 4, 'Test four')], { summary: SUMMARY, total: 4 });
const ME = (over = {}) => ({ canReview: true, reason: null, requiresVerifiedPurchase: true, hasPurchased: true, review: null, ...over });

const section = () => document.querySelector('#reviews');
const titles = () => within(section()).getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
const urls = () => fetch.mock.calls.map(([u]) => String(u));

beforeEach(() => vi.stubGlobal('fetch', vi.fn()));
afterEach(() => vi.unstubAllGlobals());

describe('ratings & reviews (real API contract)', () => {
  it('shows a loading state, then the empty state with no reviews', async () => {
    fetch.mockImplementation(() => json(EMPTY));
    renderApp(`/product/${SLUG}`);
    expect(screen.getByText('Loading reviews…')).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'No reviews yet' })).toBeInTheDocument();
    expect(screen.getByText('No ratings yet')).toBeInTheDocument();
    expect(urls()[0]).toBe(`${BASE}?sort=recent&page=1&pageSize=10`);
  });

  it('shows the server summary, distribution, cards and Verified Purchase only when the server says so', async () => {
    fetch.mockImplementation(() => json(LIST));
    renderApp(`/product/${SLUG}`);
    await screen.findByText('Test five');
    expect(screen.getByText('3.5')).toBeInTheDocument();
    expect(screen.getByText('4 ratings')).toBeInTheDocument();
    expect(screen.getByLabelText(/^4 star: 2 reviews, 50%/)).toBeInTheDocument();
    expect(within(section()).getAllByText('Verified Purchase')).toHaveLength(1);
    expect(screen.getByText('Showing 3 of 4 reviews')).toBeInTheDocument();
  });

  it('asks the server to sort and filter (the browser does neither)', async () => {
    fetch.mockImplementation(() => json(LIST));
    const user = userEvent.setup();
    renderApp(`/product/${SLUG}`);
    await screen.findByText('Test five');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Sort reviews' }), 'Lowest Rating');
    await waitFor(() => expect(urls().some((u) => u.includes('sort=lowest'))).toBe(true));
    await user.selectOptions(screen.getByRole('combobox', { name: 'Filter by rating' }), '4 stars');
    await waitFor(() => expect(urls().some((u) => u.includes('sort=lowest') && u.includes('rating=4'))).toBe(true));
    await user.click(screen.getByRole('checkbox', { name: 'Verified purchases only' }));
    await waitFor(() => expect(urls().some((u) => u.includes('rating=4') && u.includes('verified=true'))).toBe(true));
  });

  it('shows a no-match state with a working "Clear filters" when a filter has no results', async () => {
    fetch.mockImplementation((u) => json(String(u).includes('rating=2') ? page([], { summary: SUMMARY, total: 0, totalPages: 0 }) : LIST));
    const user = userEvent.setup();
    renderApp(`/product/${SLUG}`);
    await screen.findByText('Test five');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Filter by rating' }), '2 stars');
    expect(await screen.findByRole('heading', { name: 'No reviews match these filters' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(await screen.findByText('Test five')).toBeInTheDocument();
  });

  it('loads further pages with "Load more reviews" and appends them', async () => {
    const p1 = page([rev(1, 5, 'First page')], { summary: SUMMARY, total: 2, totalPages: 2 });
    const p2 = page([rev(2, 4, 'Second page')], { summary: SUMMARY, total: 2, pageNo: 2, totalPages: 2 });
    fetch.mockImplementation((u) => json(String(u).includes('page=2') ? p2 : p1));
    const user = userEvent.setup();
    renderApp(`/product/${SLUG}`);
    await screen.findByText('First page');
    await user.click(screen.getByRole('button', { name: 'Load more reviews' }));
    await screen.findByText('Second page');
    expect(titles()).toEqual(expect.arrayContaining(['First page', 'Second page']));
    expect(screen.queryByRole('button', { name: 'Load more reviews' })).not.toBeInTheDocument();
    expect(urls().some((u) => u.includes('page=2'))).toBe(true);
  });

  it('shows an error with a working retry', async () => {
    fetch.mockImplementationOnce(() => Promise.reject(new Error('offline'))).mockImplementation(() => json(EMPTY));
    const user = userEvent.setup();
    renderApp(`/product/${SLUG}`);
    expect(await screen.findByRole('alert')).toHaveTextContent(/couldn't reach/i);
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('heading', { name: 'No reviews yet' })).toBeInTheDocument();
  });

  it('a missing endpoint is an error, not a silent "no reviews"', async () => {
    fetch.mockImplementation(() => json({ detail: 'Not Found' }, 404));
    renderApp(`/product/${SLUG}`);
    expect(await screen.findByRole('alert')).toHaveTextContent('Not Found');
  });

  it('asks logged-out visitors to log in instead of showing the form', async () => {
    fetch.mockImplementation(() => json(EMPTY));
    const user = userEvent.setup();
    renderApp(`/product/${SLUG}`);
    await screen.findByRole('heading', { name: 'No reviews yet' });
    await user.click(screen.getByRole('button', { name: 'Write a Review' }));
    expect(screen.getByText('Please log in to write a review.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Review title')).not.toBeInTheDocument();
    expect(urls().some((u) => u.endsWith('/me'))).toBe(false);
  });

  it('explains when the server says this customer has no eligible purchase', async () => {
    logIn();
    fetch.mockImplementation((u) => json(String(u).endsWith('/me') ? ME({ canReview: false, reason: 'purchase_required', hasPurchased: false }) : EMPTY));
    const user = userEvent.setup();
    renderApp(`/product/${SLUG}`);
    await screen.findByRole('heading', { name: 'No reviews yet' });
    await user.click(screen.getByRole('button', { name: 'Write a Review' }));
    expect(await screen.findByText(/Only customers who have received this product can review it/)).toBeInTheDocument();
    expect(screen.queryByLabelText('Review title')).not.toBeInTheDocument();
  });

  it('validates, posts only rating/title/body with the bearer token, and shows success', async () => {
    logIn();
    fetch.mockImplementation((u, o) => {
      if (o?.method === 'POST') return json({ ...rev(9, 4, 'Lovely piece'), status: 'approved' }, 201);
      return json(String(u).endsWith('/me') ? ME() : EMPTY);
    });
    const user = userEvent.setup();
    renderApp(`/product/${SLUG}`);
    await screen.findByRole('heading', { name: 'No reviews yet' });
    await user.click(screen.getByRole('button', { name: 'Write a Review' }));
    await screen.findByLabelText('Review title');

    await user.click(screen.getByRole('button', { name: 'Submit review' }));
    expect(screen.getByText('Please choose a star rating.')).toBeInTheDocument();
    expect(screen.getByText('Please add a short title.')).toBeInTheDocument();
    expect(fetch.mock.calls.some(([, o]) => o?.method === 'POST')).toBe(false);

    await user.click(screen.getByRole('radio', { name: /^4 stars/ }));
    await user.type(screen.getByLabelText('Review title'), 'Lovely piece');
    await user.type(screen.getByLabelText('Your review'), 'Finish looks great in daylight.');
    await user.click(screen.getByRole('button', { name: 'Submit review' }));

    expect(await screen.findByText('Thank you! Your review has been submitted.')).toBeInTheDocument();
    const post = fetch.mock.calls.find(([, o]) => o?.method === 'POST');
    expect(post[0]).toBe(BASE);
    expect(JSON.parse(post[1].body)).toEqual({ rating: 4, title: 'Lovely piece', body: 'Finish looks great in daylight.' });
    expect(post[1].headers.Authorization).toBe('Bearer t');
    expect(screen.getByRole('button', { name: 'My Review' })).toBeInTheDocument();
  });

  it('says so when a new review is awaiting approval', async () => {
    logIn();
    fetch.mockImplementation((u, o) => {
      if (o?.method === 'POST') return json({ ...rev(9, 5, 'Nice'), status: 'pending' }, 201);
      return json(String(u).endsWith('/me') ? ME() : EMPTY);
    });
    const user = userEvent.setup();
    renderApp(`/product/${SLUG}`);
    await screen.findByRole('heading', { name: 'No reviews yet' });
    await user.click(screen.getByRole('button', { name: 'Write a Review' }));
    await user.click(await screen.findByRole('radio', { name: /^5 stars/ }));
    await user.type(screen.getByLabelText('Review title'), 'Nice');
    await user.type(screen.getByLabelText('Your review'), 'Really happy with this.');
    await user.click(screen.getByRole('button', { name: 'Submit review' }));
    expect(await screen.findByText(/awaiting approval/i, { selector: '.review-success' })).toBeInTheDocument();
  });

  it('shows server field errors and keeps what the customer typed', async () => {
    logIn();
    fetch.mockImplementation((u, o) => {
      if (o?.method === 'POST') return json({ detail: 'Please write at least 10 characters.', fields: { body: 'Server says the review is too short.' } }, 422);
      return json(String(u).endsWith('/me') ? ME() : EMPTY);
    });
    const user = userEvent.setup();
    renderApp(`/product/${SLUG}`);
    await screen.findByRole('heading', { name: 'No reviews yet' });
    await user.click(screen.getByRole('button', { name: 'Write a Review' }));
    await user.click(await screen.findByRole('radio', { name: /^5 stars/ }));
    await user.type(screen.getByLabelText('Review title'), 'Great');
    await user.type(screen.getByLabelText('Your review'), 'Really happy with this.');
    await user.click(screen.getByRole('button', { name: 'Submit review' }));
    expect(await screen.findByText('Server says the review is too short.')).toBeInTheDocument();
    expect(screen.getByLabelText('Review title')).toHaveValue('Great');
  });

  it('lets a customer who already reviewed edit and delete only their own review', async () => {
    logIn();
    const mineReview = { ...rev(5, 3, 'My old title'), status: 'approved', verifiedPurchase: true };
    fetch.mockImplementation((u, o) => {
      if (o?.method === 'PUT') return json({ ...mineReview, rating: 5, title: 'My new title' });
      if (o?.method === 'DELETE') return Promise.resolve({ ok: true, status: 204, json: () => Promise.reject(new Error('no body')) });
      return json(String(u).endsWith('/me') ? ME({ canReview: false, reason: 'already_reviewed', review: mineReview }) : EMPTY);
    });
    const user = userEvent.setup();
    renderApp(`/product/${SLUG}`);
    await screen.findByRole('heading', { name: 'No reviews yet' });
    await user.click(screen.getByRole('button', { name: 'Write a Review' }));
    expect(await screen.findByText('My old title')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Edit review' }));
    const title = await screen.findByLabelText('Review title');
    expect(title).toHaveValue('My old title');
    await user.clear(title);
    await user.type(title, 'My new title');
    await user.click(screen.getByRole('radio', { name: /^5 stars/ }));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByText('Your review has been updated.')).toBeInTheDocument();
    const put = fetch.mock.calls.find(([, o]) => o?.method === 'PUT');
    expect(put[0]).toBe(`${BASE}/me`);
    expect(Object.keys(JSON.parse(put[1].body)).sort()).toEqual(['body', 'rating', 'title']);

    await user.click(screen.getByRole('button', { name: 'Delete review' }));
    await user.click(screen.getByRole('button', { name: 'Yes, delete it' }));
    expect(await screen.findByText('Your review has been deleted.')).toBeInTheDocument();
    expect(fetch.mock.calls.some(([u, o]) => o?.method === 'DELETE' && u === `${BASE}/me`)).toBe(true);
    expect(screen.getByRole('button', { name: 'Write a Review' })).toBeInTheDocument();
  });
});
