import { useEffect, useRef, useState } from 'react';
import { ApiError } from '../services/api';
import { submitProductReview, updateMyReview } from '../services/reviews';
import { REVIEW_LIMITS, validateReview } from '../utils/reviews';
import { StarIcon } from './Icons';

const LABELS = ['Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

// Photo upload is intentionally not offered: the backend has no upload endpoint and no safe file storage (see REVIEWS_NOTES.md).
// `existing` (the customer's own review) switches the form to edit mode. The server re-checks everything.
export default function ReviewForm({ product, existing = null, onCancel, onSaved, onSessionExpired }) {
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [title, setTitle] = useState(existing?.title ?? '');
  const [body, setBody] = useState(existing?.body ?? '');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const headingRef = useRef(null);

  useEffect(() => { headingRef.current?.focus(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    const { errors: found, values } = validateReview({ rating, title, body });
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length) {
      const first = ['rating', 'title', 'body'].find((k) => found[k]);
      document.getElementById(first === 'rating' ? 'review-rating-1' : `review-${first}`)?.focus();
      return;
    }
    setBusy(true);
    try {
      const saved = existing ? await updateMyReview(product.slug, values) : await submitProductReview(product.slug, values);
      onSaved(saved);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setFormError('Your session has expired. Please log in again to submit your review.');
        onSessionExpired?.();
      } else if (err instanceof ApiError && Object.keys(err.fields || {}).length) {
        setErrors(err.fields);
        setFormError('Please fix the highlighted fields.');
      } else {
        setFormError(err.message || 'We could not submit your review. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="review-form" onSubmit={submit} noValidate aria-labelledby="review-form-title" id="review-form">
      <h3 id="review-form-title" tabIndex={-1} ref={headingRef}>{existing ? 'Edit your review of' : 'Write a review for'} {product.name}</h3>

      <fieldset className="field star-input" aria-describedby={errors.rating ? 'review-rating-error' : undefined}>
        <legend>Your rating</legend>
        <div className="star-input-row">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className={n <= rating ? 'is-on' : ''}>
              <input
                type="radio" name="review-rating" id={`review-rating-${n}`} value={n}
                checked={rating === n} onChange={() => { setRating(n); setErrors((x) => ({ ...x, rating: undefined })); }}
                aria-label={`${n} ${n === 1 ? 'star' : 'stars'}, ${LABELS[n - 1]}`}
              />
              <StarIcon size={30} />
            </label>
          ))}
          <span className="star-input-text" aria-hidden="true">{rating ? LABELS[rating - 1] : ''}</span>
        </div>
        {errors.rating && <p className="field-error" id="review-rating-error" role="alert">{errors.rating}</p>}
      </fieldset>

      <div className="field">
        <label htmlFor="review-title">Review title</label>
        <input
          id="review-title" type="text" value={title} maxLength={REVIEW_LIMITS.titleMax} autoComplete="off"
          onChange={(e) => setTitle(e.target.value)} placeholder="Sum it up in a few words"
          aria-invalid={errors.title ? 'true' : undefined} aria-describedby={errors.title ? 'review-title-error' : undefined}
        />
        {errors.title && <p className="field-error" id="review-title-error" role="alert">{errors.title}</p>}
      </div>

      <div className="field">
        <label htmlFor="review-body">Your review</label>
        <textarea
          id="review-body" rows={5} value={body} maxLength={REVIEW_LIMITS.bodyMax}
          onChange={(e) => setBody(e.target.value)} placeholder="What did you like or dislike? How does it look and wear?"
          aria-invalid={errors.body ? 'true' : undefined} aria-describedby={errors.body ? 'review-body-error' : undefined}
        />
        <p className="review-count" aria-hidden="true">{body.length}/{REVIEW_LIMITS.bodyMax}</p>
        {errors.body && <p className="field-error" id="review-body-error" role="alert">{errors.body}</p>}
      </div>

      {formError && <p className="field-error review-form-error" role="alert">{formError}</p>}

      <div className="review-form-actions">
        <button type="submit" className="btn" disabled={busy}>{busy ? 'Saving…' : existing ? 'Save changes' : 'Submit review'}</button>
        <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={busy}>Cancel</button>
      </div>
    </form>
  );
}
