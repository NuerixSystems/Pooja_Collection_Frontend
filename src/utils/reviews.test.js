import { describe, expect, it } from 'vitest';
import { normalizeReview, normalizeSummary, percentOf, validateReview } from './reviews';

describe('normalizeReview', () => {
  it('accepts snake_case and camelCase and trims text', () => {
    expect(normalizeReview({ id: 7, rating: 4, customer_name: ' Asha ', title: ' Nice ', body: 'ok', created_at: 'x', verified_purchase: true }))
      .toEqual({ id: '7', name: 'Asha', rating: 4, title: 'Nice', body: 'ok', createdAt: 'x', verified: true });
  });
  it('only marks verified when the server says exactly true', () => {
    expect(normalizeReview({ id: 1, rating: 5, verifiedPurchase: 'yes' }).verified).toBe(false);
    expect(normalizeReview({ id: 1, rating: 5 }).verified).toBe(false);
  });
  it('drops unusable records', () => {
    expect(normalizeReview(null)).toBeNull();
    expect(normalizeReview({ id: 1, rating: 9 })).toBeNull();
    expect(normalizeReview({ rating: 5 })).toBeNull();
  });
});

describe('normalizeSummary', () => {
  it('is all zeros when the server sends nothing', () => {
    const s = normalizeSummary(undefined);
    expect(s.count).toBe(0);
    expect(s.average).toBe(0);
    expect(percentOf(s, 5)).toBe(0);
  });
  it('uses the server average and distribution; count is the sum of the distribution', () => {
    const s = normalizeSummary({ average: 4.5, distribution: { 5: '3', 4: 1 } });
    expect(s.count).toBe(4);
    expect(s.average).toBe(4.5);
    expect(s.distribution).toEqual({ 5: 3, 4: 1, 3: 0, 2: 0, 1: 0 });
    expect(percentOf(s, 5)).toBe(75);
  });
  it('ignores an out-of-range average', () => {
    expect(normalizeSummary({ average: 9, distribution: { 5: 1 } }).average).toBe(0);
  });
});

describe('validateReview', () => {
  it('requires rating, title and a minimum review length', () => {
    const { errors } = validateReview({ rating: 0, title: ' ', body: 'short' });
    expect(Object.keys(errors).sort()).toEqual(['body', 'rating', 'title']);
  });
  it('passes a valid review and trims it', () => {
    const { errors, values } = validateReview({ rating: '5', title: ' Lovely ', body: '  Beautiful finish, worn daily.  ' });
    expect(errors).toEqual({});
    expect(values).toEqual({ rating: 5, title: 'Lovely', body: 'Beautiful finish, worn daily.' });
  });
});
