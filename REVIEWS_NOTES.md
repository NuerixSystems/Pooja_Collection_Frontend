# Ratings & Reviews (frontend)

Shown on every product page (`/product/:slug`) between the product details and "You May Also Like". Part 2 connected it to the real backend; the temporary mock/"not live" fallbacks are gone and no sample reviews are bundled.

## Files
- `src/components/ReviewsSection.jsx`: summary, filters/sort, list + "Load more", login/eligibility messages, the customer's own review (edit/delete)
- `src/components/ReviewForm.jsx` (create + edit), `ReviewCard.jsx`, `StarRating.jsx`, `Reviews.css`
- `src/hooks/useProductReviews.js`, `src/services/reviews.js`, `src/utils/reviews.js`

## How it talks to the backend (see `backend/REVIEWS_NOTES.md` for the full contract)
- List: `GET /api/products/{slug}/reviews?sort=&rating=&verified=&page=&pageSize=`. Sorting, filtering, paging and the summary are done by the server; the browser only displays them.
- Clicking **Write a Review** while logged in calls `GET .../reviews/me`; the server answers whether the customer may review (delivered order of this product), already has a review, or must buy first. Logged-out visitors get a login prompt.
- Submit/edit/delete send only `{ rating, title, body }` (never a customer id or verified flag); `DELETE`/`PUT` target `.../reviews/me`.
- The "Verified Purchase" badge is shown only when the server returns `verifiedPurchase: true`.
- A failed or missing endpoint shows an error with "Try again" (it is no longer silently treated as "no reviews").

## Not included
- Photo upload: no secure upload/storage exists on the backend, so reviews are text-only.
- Client-side form checks mirror the server rules for quick feedback; the server is the authority and its field errors are shown.

## Tests
`npm test` (the review tests mock `fetch` with responses in the backend's shape; those fixtures exist only inside the tests).
