import { useEffect, useRef, useState } from 'react';
import { formatPrice } from '../utils/format';
import { clampPrice } from '../utils/shopFilters';

// Dual-handle price slider (two native range inputs layered on one track, no extra dependency) plus typed
// minimum / maximum boxes. `min` / `max` are the real catalogue limits. `value` is { min, max } where null means
// "no limit". While a handle is being dragged only local state changes; the parent hears about it on release.
export default function PriceRangeFilter({ bounds, value, onChange }) {
  const lo = value.min ?? bounds.min;
  const hi = value.max ?? bounds.max;
  const [draft, setDraft] = useState({ lo, hi });
  const [typed, setTyped] = useState({ lo: String(lo), hi: String(hi) });
  const dragging = useRef(false);

  // Follow changes made elsewhere (Reset, Back button, drawer opening).
  useEffect(() => {
    setDraft({ lo, hi });
    setTyped({ lo: String(lo), hi: String(hi) });
  }, [lo, hi]);

  const commit = (nextLo, nextHi) => {
    onChange({ min: nextLo <= bounds.min ? null : nextLo, max: nextHi >= bounds.max ? null : nextHi });
  };

  const slide = (which) => (e) => {
    const n = Number(e.target.value);
    const next = which === 'lo' ? { lo: Math.min(n, draft.hi), hi: draft.hi } : { lo: draft.lo, hi: Math.max(n, draft.lo) };
    setDraft(next);
    setTyped({ lo: String(next.lo), hi: String(next.hi) });
    if (!dragging.current) commit(next.lo, next.hi); // keyboard / assistive tech: apply straight away
  };
  const release = () => {
    if (!dragging.current) return;
    dragging.current = false;
    commit(draft.lo, draft.hi);
  };

  const commitTyped = (which) => {
    const parsed = clampPrice(typed[which], { low: bounds.min, high: bounds.max });
    const base = which === 'lo' ? bounds.min : bounds.max;
    const n = parsed ?? base;
    const next = which === 'lo' ? { lo: Math.min(n, draft.hi), hi: draft.hi } : { lo: draft.lo, hi: Math.max(n, draft.lo) };
    setDraft(next);
    setTyped({ lo: String(next.lo), hi: String(next.hi) });
    commit(next.lo, next.hi);
  };
  const onTypedKey = (which) => (e) => { if (e.key === 'Enter') { e.preventDefault(); commitTyped(which); } };

  const span = bounds.max - bounds.min || 1;
  const pct = (n) => ((n - bounds.min) / span) * 100;
  // When both handles sit at the far end, the minimum handle must be on top or it could never be dragged back.
  const minOnTop = draft.lo > bounds.min + span / 2;
  const sliderProps = { type: 'range', min: bounds.min, max: bounds.max, step: 1, onPointerDown: () => { dragging.current = true; }, onPointerUp: release, onPointerCancel: release, onBlur: release };

  return (
    <div className="price-filter">
      <p className="price-filter__selected" aria-live="polite">
        {formatPrice(draft.lo)} <span aria-hidden="true">–</span><span className="visually-hidden"> to </span> {formatPrice(draft.hi)}
      </p>

      <div className="dual-range" style={{ '--lo': `${pct(draft.lo)}%`, '--hi': `${pct(draft.hi)}%` }}>
        <div className="dual-range__track" aria-hidden="true"><div className="dual-range__fill" /></div>
        <input {...sliderProps} aria-label="Minimum price slider" value={draft.lo} onChange={slide('lo')} style={{ zIndex: minOnTop ? 4 : 3 }} />
        <input {...sliderProps} aria-label="Maximum price slider" value={draft.hi} onChange={slide('hi')} style={{ zIndex: minOnTop ? 3 : 4 }} />
      </div>

      <div className="price-filter__inputs">
        <label className="price-input">
          <span className="price-input__label">Min</span>
          <span className="price-input__box">
            <span aria-hidden="true">₹</span>
            <input
              type="number" inputMode="numeric" min={bounds.min} max={bounds.max} aria-label="Minimum price"
              value={typed.lo} onChange={(e) => setTyped((t) => ({ ...t, lo: e.target.value }))}
              onBlur={() => commitTyped('lo')} onKeyDown={onTypedKey('lo')}
            />
          </span>
        </label>
        <span className="price-filter__to" aria-hidden="true">to</span>
        <label className="price-input">
          <span className="price-input__label">Max</span>
          <span className="price-input__box">
            <span aria-hidden="true">₹</span>
            <input
              type="number" inputMode="numeric" min={bounds.min} max={bounds.max} aria-label="Maximum price"
              value={typed.hi} onChange={(e) => setTyped((t) => ({ ...t, hi: e.target.value }))}
              onBlur={() => commitTyped('hi')} onKeyDown={onTypedKey('hi')}
            />
          </span>
        </label>
      </div>
    </div>
  );
}
