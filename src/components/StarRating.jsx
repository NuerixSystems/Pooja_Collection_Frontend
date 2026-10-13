import { StarIcon } from './Icons';

const FIVE = [1, 2, 3, 4, 5];

/** Read-only stars with fractional fill (e.g. 4.3). `value` 0 renders five empty stars. */
export default function StarRating({ value = 0, size = 18, label }) {
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));
  const text = label ?? `${(Math.round(value * 10) / 10).toFixed(1)} out of 5 stars`;
  return (
    <span className="stars" role="img" aria-label={text} style={{ '--star-size': `${size}px` }}>
      <span className="stars-row stars-row--base" aria-hidden="true">
        {FIVE.map((n) => <StarIcon key={n} size={size} />)}
      </span>
      <span className="stars-row stars-row--fill" style={{ width: `${pct}%` }} aria-hidden="true">
        {FIVE.map((n) => <StarIcon key={n} size={size} />)}
      </span>
    </span>
  );
}
