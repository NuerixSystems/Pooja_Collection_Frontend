import { formatReviewDate } from '../utils/reviews';
import { CheckCircleIcon } from './Icons';
import StarRating from './StarRating';

export default function ReviewCard({ review }) {
  const date = formatReviewDate(review.createdAt);
  return (
    <article className="review-card">
      <header className="review-card-head">
        <StarRating value={review.rating} size={16} label={`${review.rating} out of 5 stars`} />
        {review.title && <h3 className="review-card-title">{review.title}</h3>}
      </header>
      {review.body && <p className="review-card-body">{review.body}</p>}
      <footer className="review-card-meta">
        <span className="review-card-name">{review.name}</span>
        {review.verified && (
          <span className="verified-badge"><CheckCircleIcon size={15} /> Verified Purchase</span>
        )}
        {date && <time dateTime={review.createdAt}>{date}</time>}
      </footer>
    </article>
  );
}
