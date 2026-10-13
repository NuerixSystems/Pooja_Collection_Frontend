import { useCallback, useEffect, useRef, useState } from 'react';
import { apiEnabled } from '../services/api';
import { emptyReviews, fetchProductReviews } from '../services/reviews';

const idle = () => (apiEnabled() ? { status: 'loading', ...emptyReviews() } : { status: 'ready', ...emptyReviews() });

/**
 * Loads reviews for one product from the server. `filters` = { sort, rating, verified }.
 * status: 'loading' | 'ready' | 'error'. Page 1 replaces the list; loadMore() appends the next page.
 * Refetches from page 1 when slug or filters change; reload() refetches after a submit/edit/delete.
 */
export function useProductReviews(slug, { sort = 'recent', rating = 0, verified = false } = {}) {
  const [state, setState] = useState(idle);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [more, setMore] = useState({ busy: false, error: '' });
  const live = useRef(0);   // ignores answers that belong to an older request

  useEffect(() => {
    if (!apiEnabled()) return undefined;
    const ticket = ++live.current;
    setState((s) => ({ ...s, status: 'loading' }));
    setError('');
    setMore({ busy: false, error: '' });
    fetchProductReviews(slug, { sort, rating, verified, page: 1 })
      .then((data) => { if (ticket === live.current) setState({ status: 'ready', ...data }); })
      .catch((err) => { if (ticket === live.current) { setError(err.message); setState((s) => ({ ...s, status: 'error' })); } });
    return () => { live.current += 1; };
  }, [slug, sort, rating, verified, attempt]);

  const loadMore = useCallback(async () => {
    const ticket = live.current;
    setMore({ busy: true, error: '' });
    try {
      const next = await fetchProductReviews(slug, { sort, rating, verified, page: state.pagination.page + 1 });
      if (ticket !== live.current) return;
      setState((s) => {
        const seen = new Set(s.reviews.map((r) => r.id));
        return { ...s, summary: next.summary, pagination: next.pagination, reviews: [...s.reviews, ...next.reviews.filter((r) => !seen.has(r.id))] };
      });
      setMore({ busy: false, error: '' });
    } catch (err) {
      if (ticket === live.current) setMore({ busy: false, error: err.message });
    }
  }, [slug, sort, rating, verified, state.pagination.page]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);
  const { status, reviews, summary, pagination } = state;
  return { status, reviews, summary, pagination, error, reload, loadMore, loadingMore: more.busy, moreError: more.error };
}
