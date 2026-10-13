// Reviews data layer. Components never call fetch directly; they use this file (like services/catalog.js).
//
// Backend endpoints (all under /api, see backend/REVIEWS_NOTES.md):
//   GET    /products/{slug}/reviews?sort=recent|highest|lowest&rating=1-5&verified=true&page=1&pageSize=10   public
//   GET    /products/{slug}/reviews/me      (Bearer) can this customer review? + their own review
//   POST   /products/{slug}/reviews         (Bearer) { rating, title, body } -> 201
//   PUT    /products/{slug}/reviews/me      (Bearer) edit own review
//   DELETE /products/{slug}/reviews/me      (Bearer) delete own review -> 204
// Validation errors arrive as 422 { detail, fields }. Only { rating, title, body } is ever sent: the server decides who the
// customer is and whether the purchase is verified. Nothing is cached or stored in the browser.
import { ApiError, api, apiEnabled } from './api';
import { emptySummary, normalizeReview, normalizeSummary } from '../utils/reviews';

export const PAGE_SIZE = 10;

export const emptyReviews = () => ({
  reviews: [], summary: emptySummary(), pagination: { page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 0 },
});

const base = (slug) => `/products/${encodeURIComponent(slug)}/reviews`;

export async function fetchProductReviews(slug, { sort = 'recent', rating = 0, verified = false, page = 1 } = {}) {
  if (!apiEnabled()) return emptyReviews();
  const q = new URLSearchParams({ sort, page: String(page), pageSize: String(PAGE_SIZE) });
  if (rating) q.set('rating', String(rating));
  if (verified) q.set('verified', 'true');
  const data = await api(`${base(slug)}?${q}`);
  const reviews = (Array.isArray(data?.reviews) ? data.reviews : []).map(normalizeReview).filter(Boolean);
  const p = data?.pagination || {};
  return {
    reviews,
    summary: normalizeSummary(data?.summary),
    pagination: {
      page: Number(p.page) || page, pageSize: Number(p.pageSize) || PAGE_SIZE,
      total: Number(p.total) || 0, totalPages: Number(p.totalPages) || 0,
    },
  };
}

/** Requires a logged-in customer (401 otherwise). -> { canReview, reason, requiresVerifiedPurchase, hasPurchased, review } */
export async function fetchMyReviewStatus(slug) {
  const d = await api(`${base(slug)}/me`);
  return {
    canReview: d?.canReview === true,
    reason: d?.reason ?? null,
    requiresVerifiedPurchase: d?.requiresVerifiedPurchase !== false,
    hasPurchased: d?.hasPurchased === true,
    review: d?.review ? { ...normalizeReview(d.review), status: d.review.status } : null,
  };
}

const unavailable = () => new ApiError("Reviews aren't available right now. Please try again later.", 0);

function toOwn(d) {
  const r = normalizeReview(d);
  return r ? { ...r, status: d.status } : null;
}

export async function submitProductReview(slug, { rating, title, body }) {
  if (!apiEnabled()) throw unavailable();
  return toOwn(await api(base(slug), { method: 'POST', body: { rating, title, body } }));
}

export async function updateMyReview(slug, { rating, title, body }) {
  if (!apiEnabled()) throw unavailable();
  return toOwn(await api(`${base(slug)}/me`, { method: 'PUT', body: { rating, title, body } }));
}

export async function deleteMyReview(slug) {
  if (!apiEnabled()) throw unavailable();
  await api(`${base(slug)}/me`, { method: 'DELETE' });
}
