import { describe, expect, it } from 'vitest';
import { CART } from '../config';
import { clampQty, initialState, lineKey, reducer, sanitizeSaved } from './cartReducer';

const MAX = CART.maxQtyPerLine;
const add = (state, id, designId = null, qty = 1) => reducer(state, { type: 'cart/add', id, designId, qty });

describe('cart reducer', () => {
  it('adds a line and increments an existing one', () => {
    let s = add(initialState, 'p1');
    s = add(s, 'p1');
    expect(s.cart).toEqual([{ key: 'p1', id: 'p1', designId: null, qty: 2 }]);
  });

  it('keeps different designs of one product as separate lines', () => {
    let s = add(initialState, 'p1', 'a');
    s = add(s, 'p1', 'b');
    s = add(s, 'p1', 'a');
    expect(s.cart.map((l) => [l.key, l.qty])).toEqual([[lineKey('p1', 'a'), 2], [lineKey('p1', 'b'), 1]]);
  });

  it('never lets a line exceed the per-line limit', () => {
    let s = initialState;
    for (let i = 0; i < MAX + 5; i += 1) s = add(s, 'p1');
    expect(s.cart[0].qty).toBe(MAX);
    expect(add(initialState, 'p1', null, 999).cart[0].qty).toBe(MAX);
  });

  it('setQty clamps, and removes the line below 1', () => {
    let s = add(initialState, 'p1');
    s = reducer(s, { type: 'cart/setQty', key: 'p1', qty: 500 });
    expect(s.cart[0].qty).toBe(MAX);
    s = reducer(s, { type: 'cart/setQty', key: 'p1', qty: 0 });
    expect(s.cart).toEqual([]);
  });

  it('removes and clears', () => {
    let s = add(add(initialState, 'p1'), 'p2');
    expect(reducer(s, { type: 'cart/remove', key: 'p1' }).cart.map((l) => l.id)).toEqual(['p2']);
    expect(reducer(s, { type: 'cart/clear' }).cart).toEqual([]);
  });
});

describe('clampQty', () => {
  it('handles junk input', () => {
    expect(clampQty(NaN)).toBe(1);
    expect(clampQty('abc')).toBe(1);
    expect(clampQty(-4)).toBe(1);
    expect(clampQty(2.9)).toBe(2);
    expect(clampQty(MAX + 1)).toBe(MAX);
  });
});

describe('sanitizeSaved', () => {
  it('migrates carts saved before designs/keys existed', () => {
    const s = sanitizeSaved({ cart: [{ id: 'p1', qty: 2 }], wishlist: ['p2'] });
    expect(s.cart).toEqual([{ key: 'p1', id: 'p1', designId: null, qty: 2 }]);
    expect(s.wishlist).toEqual(['p2']);
  });

  it('clamps tampered quantities and drops malformed entries', () => {
    const s = sanitizeSaved({ cart: [{ id: 'p1', qty: 9999 }, null, { qty: 1 }, { id: 5 }], wishlist: [1, 'ok'] });
    expect(s.cart).toEqual([{ key: 'p1', id: 'p1', designId: null, qty: MAX }]);
    expect(s.wishlist).toEqual(['ok']);
  });

  it('falls back to an empty store for unusable data', () => {
    expect(sanitizeSaved(null)).toEqual(initialState);
    expect(sanitizeSaved({ cart: 'x', wishlist: [] })).toEqual(initialState);
  });
});
