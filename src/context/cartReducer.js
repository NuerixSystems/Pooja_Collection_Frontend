import { CART } from '../config';

// Cart lines are keyed by product + design so two designs of one product are separate lines.
export const lineKey = (id, designId) => (designId ? `${id}::${designId}` : id);

export const clampQty = (n, max = CART.maxQtyPerLine) => {
  const whole = Math.floor(Number(n));
  return Number.isFinite(whole) ? Math.min(max, Math.max(1, whole)) : 1;
};

export const initialState = { cart: [], wishlist: [] };

/** Normalise whatever was persisted (including carts saved before designs existed). */
export function sanitizeSaved(saved) {
  if (!saved || !Array.isArray(saved.cart) || !Array.isArray(saved.wishlist)) return initialState;
  const cart = saved.cart
    .filter((l) => l && typeof l.id === 'string')
    .map((l) => ({
      key: lineKey(l.id, l.designId || null),
      id: l.id,
      designId: l.designId || null,
      qty: clampQty(l.qty),
    }));
  return { cart, wishlist: saved.wishlist.filter((i) => typeof i === 'string') };
}

export function reducer(state, action) {
  switch (action.type) {
    case 'cart/add': {
      const designId = action.designId || null;
      const key = lineKey(action.id, designId);
      const found = state.cart.find((l) => l.key === key);
      const cart = found
        ? state.cart.map((l) => (l.key === key ? { ...l, qty: clampQty(l.qty + (action.qty || 1)) } : l))
        : [...state.cart, { key, id: action.id, designId, qty: clampQty(action.qty || 1) }];
      return { ...state, cart };
    }
    case 'cart/setQty': {
      if (action.qty < 1) return { ...state, cart: state.cart.filter((l) => l.key !== action.key) };
      return { ...state, cart: state.cart.map((l) => (l.key === action.key ? { ...l, qty: clampQty(action.qty) } : l)) };
    }
    case 'cart/remove':
      return { ...state, cart: state.cart.filter((l) => l.key !== action.key) };
    case 'cart/clear':
      return { ...state, cart: [] };
    case 'wishlist/toggle': {
      const has = state.wishlist.includes(action.id);
      return { ...state, wishlist: has ? state.wishlist.filter((i) => i !== action.id) : [...state.wishlist, action.id] };
    }
    default:
      return state;
  }
}
