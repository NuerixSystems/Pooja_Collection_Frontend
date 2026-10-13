import { useEffect, useRef, useState } from 'react';
import { useUI } from '../context/UIContext';
import { useProductReviews } from '../hooks/useProductReviews';
import { ApiError } from '../services/api';
import { deleteMyReview, fetchMyReviewStatus } from '../services/reviews';
import { getSession } from '../services/session';
import { RATING_FILTERS, SORT_OPTIONS, STAR_LEVELS, formatAverage, percentOf } from '../utils/reviews';
import ReviewCard from './ReviewCard';
import ReviewForm from './ReviewForm';
import StarRating from './StarRating';
import './Reviews.css';

function Summary({ summary }) {
  return (
    <div className="rating-summary">
      <div className="rating-summary-top">
        <p className="rating-average" aria-hidden={summary.count === 0}>{summary.count ? formatAverage(summary.average) : '–'}</p>
        <div>
          <StarRating value={summary.average} size={20} />
          <p className="rating-count">
            {summary.count === 0 ? 'No ratings yet' : `${summary.count} ${summary.count === 1 ? 'rating' : 'ratings'}`}
          </p>
        </div>
      </div>
      <ul className="rating-bars" aria-label="Rating breakdown">
        {STAR_LEVELS.map((s) => {
          const pct = percentOf(summary, s);
          return (
            <li key={s} aria-label={`${s} star: ${summary.distribution[s]} ${summary.distribution[s] === 1 ? 'review' : 'reviews'}, ${pct}%`}>
              <span className="rating-bar-label" aria-hidden="true">{s} star</span>
              <span className="rating-bar" aria-hidden="true"><span style={{ width: `${pct}%` }} /></span>
              <span className="rating-bar-pct" aria-hidden="true">{pct}%</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="review-skeleton" role="status" aria-live="polite">
      <span className="visually-hidden">Loading reviews…</span>
      {[0, 1, 2].map((n) => <div key={n} className="review-skeleton-card" aria-hidden="true" />)}
    </div>
  );
}

/** The signed-in customer's own review, with edit / delete. Only the server decides what they may do. */
function MyReview({ review, onEdit, onDelete, busy, error }) {
  const [confirming, setConfirming] = useState(false);
  const pending = review.status === 'pending';
  const rejected = review.status === 'rejected';
  return (
    <div className="my-review" aria-label="Your review">
      <h3 className="my-review-title">Your review</h3>
      {pending && <p className="my-review-note" role="status">Awaiting approval. It will appear on the page once the shop approves it.</p>}
      {rejected && <p className="my-review-note" role="status">The shop has not published this review.</p>}
      <ReviewCard review={review} />
      {error && <p className="field-error" role="alert">{error}</p>}
      {!rejected && (
        <div className="review-form-actions">
          <button type="button" className="btn btn--ghost" onClick={onEdit} disabled={busy}>Edit review</button>
          {confirming ? (
            <>
              <button type="button" className="btn" onClick={onDelete} disabled={busy}>{busy ? 'Deleting…' : 'Yes, delete it'}</button>
              <button type="button" className="btn btn--ghost" onClick={() => setConfirming(false)} disabled={busy}>Keep it</button>
            </>
          ) : (
            <button type="button" className="btn btn--ghost" onClick={() => setConfirming(true)} disabled={busy}>Delete review</button>
          )}
        </div>
      )}
    </div>
  );
}

export default function ReviewsSection({ product }) {
  const { open: openPanel, panel } = useUI();
  const [sort, setSort] = useState('recent');
  const [rating, setRating] = useState(0);
  const [verified, setVerified] = useState(false);
  const [form, setForm] = useState(null);          // null | 'create' | 'edit'
  const [needsLogin, setNeedsLogin] = useState(false);
  const [checking, setChecking] = useState(false);
  const [gate, setGate] = useState('');            // why the customer cannot write a review (message from the rules)
  const [mine, setMine] = useState(null);          // the customer's own review, from the server
  const [mineBusy, setMineBusy] = useState(false);
  const [mineError, setMineError] = useState('');
  const [success, setSuccess] = useState('');
  const buttonRef = useRef(null);
  const { status, reviews, summary, pagination, error, reload, loadMore, loadingMore, moreError } =
    useProductReviews(product.slug, { sort, rating, verified });

  const filtered = rating !== 0 || verified;

  const startWriting = async () => {
    setSuccess(''); setGate(''); setMineError('');
    if (!getSession()) { setNeedsLogin(true); setForm(null); return; }
    setNeedsLogin(false);
    setChecking(true);
    try {
      const s = await fetchMyReviewStatus(product.slug);
      setMine(s.review);
      if (s.canReview) setForm('create');
      else if (s.reason === 'already_reviewed') setForm(null);
      else {
        setForm(null);
        setGate('Only customers who have received this product can review it. Reviews from verified purchases help others shop with confidence.');
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) { setNeedsLogin(true); openPanel('login'); }
      else setGate(err.message || "We couldn't check whether you can review this product. Please try again.");
    } finally {
      setChecking(false);
    }
  };

  // After the customer logs in from the panel we opened, carry on where they left off.
  useEffect(() => {
    if (needsLogin && panel === null && getSession()) startWriting();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panel]);

  const closeForm = () => { setForm(null); buttonRef.current?.focus(); };
  const saved = (review) => {
    const wasEdit = form === 'edit';
    setMine(review); setForm(null);
    setSuccess(
      review?.status === 'pending'
        ? 'Thank you! Your review is awaiting approval and will appear once the shop approves it.'
        : wasEdit ? 'Your review has been updated.' : 'Thank you! Your review has been submitted.',
    );
    reload();
  };
  const removeMine = async () => {
    setMineBusy(true); setMineError('');
    try {
      await deleteMyReview(product.slug);
      setMine(null); setSuccess('Your review has been deleted.'); reload();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) { setNeedsLogin(true); openPanel('login'); }
      else setMineError(err.message);
    } finally {
      setMineBusy(false);
    }
  };

  return (
    <section className="section reviews" id="reviews" aria-labelledby="reviews-title">
      <div className="section-head">
        <h2 className="section-title" id="reviews-title">Ratings &amp; Reviews</h2>
        <button
          type="button" className="btn btn--ghost" ref={buttonRef} onClick={startWriting} disabled={checking}
          aria-expanded={form !== null} aria-controls={form ? 'review-form' : undefined}
        >
          {checking ? 'Checking…' : mine ? 'My Review' : 'Write a Review'}
        </button>
      </div>

      {status === 'error' && reviews.length === 0 ? (
        <div className="review-error" role="alert">
          <p>{error || "We couldn't load reviews right now."}</p>
          <button type="button" className="btn btn--ghost" onClick={reload}>Try again</button>
        </div>
      ) : (
        <div className="reviews-layout">
          <aside className="reviews-side">
            {status === 'loading' && reviews.length === 0 ? <div className="review-skeleton-card review-skeleton-card--summary" aria-hidden="true" /> : <Summary summary={summary} />}
          </aside>

          <div className="reviews-main">
            {success && <p className="review-success" role="status">{success}</p>}

            {needsLogin && (
              <div className="review-login" role="status">
                <p>Please log in to write a review.</p>
                <button type="button" className="btn" onClick={() => openPanel('login')}>Log in</button>
              </div>
            )}

            {gate && <p className="review-gate" role="status">{gate}</p>}

            {form && (
              <ReviewForm
                product={product} existing={form === 'edit' ? mine : null} onCancel={closeForm} onSaved={saved}
                onSessionExpired={() => { setNeedsLogin(true); openPanel('login'); }}
              />
            )}

            {mine && !form && (
              <MyReview review={mine} busy={mineBusy} error={mineError} onEdit={() => { setSuccess(''); setForm('edit'); }} onDelete={removeMine} />
            )}

            {status === 'loading' && reviews.length === 0 && <ListSkeleton />}

            {status !== 'loading' && summary.count === 0 && !filtered && (
              <div className="review-empty">
                <h3>No reviews yet</h3>
                <p>Be the first to share your thoughts on this piece.</p>
              </div>
            )}

            {(summary.count > 0 || filtered) && (
              <>
                <div className="review-toolbar">
                  <p className="review-total" aria-live="polite">
                    {status === 'loading' ? 'Loading…' : `Showing ${reviews.length} of ${pagination.total} ${pagination.total === 1 ? 'review' : 'reviews'}`}
                  </p>
                  <div className="review-controls">
                    <label className="sort">
                      <span className="visually-hidden">Filter by rating</span>
                      <select value={rating} onChange={(e) => setRating(Number(e.target.value))} aria-label="Filter by rating">
                        {RATING_FILTERS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </label>
                    <label className="sort">
                      <span className="visually-hidden">Sort reviews</span>
                      <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort reviews">
                        {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </label>
                    <label className="review-verified-toggle">
                      <input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} />
                      <span>Verified purchases only</span>
                    </label>
                  </div>
                </div>

                {status === 'error' && <p className="field-error" role="alert">{error}</p>}

                {status !== 'loading' && reviews.length === 0 && filtered && (
                  <div className="review-empty">
                    <h3>No reviews match these filters</h3>
                    <button type="button" className="btn btn--ghost" onClick={() => { setRating(0); setVerified(false); }}>Clear filters</button>
                  </div>
                )}

                {reviews.length > 0 && (
                  <div className="review-list" aria-busy={status === 'loading'}>
                    {reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
                  </div>
                )}

                {status === 'ready' && pagination.page < pagination.totalPages && (
                  <div className="review-more">
                    {moreError && <p className="field-error" role="alert">{moreError}</p>}
                    <button type="button" className="btn btn--ghost" onClick={loadMore} disabled={loadingMore}>
                      {loadingMore ? 'Loading…' : 'Load more reviews'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
