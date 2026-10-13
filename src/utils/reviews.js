// Pure helpers for the Ratings & Reviews UI: normalising API data, display formatting, form validation.
// Sorting, filtering, paging and the summary all come from the server; nothing here invents data.

export const SORT_OPTIONS = [
  { value: 'recent', label: 'Most Recent' },
  { value: 'highest', label: 'Highest Rating' },
  { value: 'lowest', label: 'Lowest Rating' },
];

export const REVIEW_LIMITS = { titleMax: 100, bodyMin: 10, bodyMax: 2000 };

export const STAR_LEVELS = [5, 4, 3, 2, 1];

export const RATING_FILTERS = [{ value: 0, label: 'All ratings' }, ...STAR_LEVELS.map((n) => ({ value: n, label: `${n} ${n === 1 ? 'star' : 'stars'}` }))];

const text = (v) => (typeof v === 'string' ? v.trim() : '');

/** Accepts camelCase or snake_case API fields. Returns null for anything that is not a usable review. */
export function normalizeReview(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const rating = Number(raw.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return null;
  const id = raw.id ?? null;
  if (id === null) return null;
  return {
    id: String(id),
    name: text(raw.customerName ?? raw.customer_name ?? raw.authorName ?? raw.author_name ?? raw.name) || 'Customer',
    rating,
    title: text(raw.title),
    body: text(raw.body ?? raw.text ?? raw.review),
    createdAt: raw.createdAt ?? raw.created_at ?? null,
    // Only ever true when the server says so. The storefront never decides this itself.
    verified: (raw.verifiedPurchase ?? raw.verified_purchase) === true,
  };
}

export const emptySummary = () => ({ average: 0, count: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } });

/** The server's summary covers every approved review of the product (not just the loaded page). Never computed in the browser. */
export function normalizeSummary(apiSummary) {
  const dist = apiSummary?.distribution;
  if (!dist || typeof dist !== 'object') return emptySummary();
  const distribution = {};
  for (const s of STAR_LEVELS) distribution[s] = Math.max(0, Math.trunc(Number(dist[s] ?? dist[String(s)]) || 0));
  const count = STAR_LEVELS.reduce((n, s) => n + distribution[s], 0);
  const given = Number(apiSummary.average);
  const average = count && Number.isFinite(given) && given > 0 && given <= 5 ? given : 0;
  return { average, count, distribution };
}

/** Percentage (0-100) of reviews at one star level, for the distribution bars. */
export const percentOf = (summary, stars) => (summary.count ? Math.round((summary.distribution[stars] / summary.count) * 100) : 0);

export const formatAverage = (n) => (Math.round(n * 10) / 10).toFixed(1);

const dateFmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
export function formatReviewDate(value) {
  const t = Date.parse(value);
  return Number.isFinite(t) ? dateFmt.format(new Date(t)) : '';
}

/** @returns {{ errors: {rating?:string,title?:string,body?:string}, values: {rating:number,title:string,body:string} }} */
export function validateReview({ rating, title, body }) {
  const values = { rating: Number(rating) || 0, title: (title || '').trim(), body: (body || '').trim() };
  const errors = {};
  if (!(values.rating >= 1 && values.rating <= 5)) errors.rating = 'Please choose a star rating.';
  if (!values.title) errors.title = 'Please add a short title.';
  else if (values.title.length > REVIEW_LIMITS.titleMax) errors.title = `Keep the title under ${REVIEW_LIMITS.titleMax} characters.`;
  if (values.body.length < REVIEW_LIMITS.bodyMin) errors.body = `Please write at least ${REVIEW_LIMITS.bodyMin} characters.`;
  else if (values.body.length > REVIEW_LIMITS.bodyMax) errors.body = `Keep your review under ${REVIEW_LIMITS.bodyMax} characters.`;
  return { errors, values };
}
