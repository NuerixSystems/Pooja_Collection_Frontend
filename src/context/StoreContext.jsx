import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import { CART } from '../config';
import { apiEnabled } from '../services/api';
import { getProductById } from '../services/catalog';
import { getToken } from '../services/session';
import { initialState, lineKey, reducer, sanitizeSaved } from './cartReducer';

const STORAGE_KEY = 'pooja-collection:store:v1';

function load() {
  try {
    return sanitizeSaved(JSON.parse(localStorage.getItem(STORAGE_KEY)));
  } catch {
    /* storage unavailable or corrupt — start fresh */
  }
  return initialState;
}

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore quota / privacy-mode errors */
    }
  }, [state]);

  const value = useMemo(() => {
    // Drop lines that can no longer be shown: product removed/excluded, design no longer offered,
    // or a design is now required but the saved line has none.
    const lines = state.cart.flatMap((l) => {
      const product = getProductById(l.id);
      if (!product) return [];
      const design = l.designId ? product.designs.find((d) => d.id === l.designId) || null : null;
      if (l.designId && !design) return [];
      if (product.designs.length && !design) return [];
      return [{ key: l.key, product, design, qty: l.qty }];
    });
    const wishlistProducts = state.wishlist.map(getProductById).filter(Boolean);
    const qtyOf = (id, designId = null) => state.cart.find((l) => l.key === lineKey(id, designId))?.qty ?? 0;

    return {
      lines,
      wishlist: wishlistProducts,
      cartCount: lines.reduce((n, l) => n + l.qty, 0),
      cartTotal: lines.reduce((sum, l) => sum + l.qty * l.product.price, 0),
      wishlistCount: wishlistProducts.length,
      maxQty: CART.maxQtyPerLine,
      isWishlisted: (id) => state.wishlist.includes(id),
      isAtMax: (id, designId = null) => qtyOf(id, designId) >= CART.maxQtyPerLine,
      /**
       * Adds `qty` units (default 1). Enforced here, not only in the UI: a product with designs needs a valid
       * design, a line can't exceed the per-line limit, and, when the shop's backend is configured,
       * only a logged-in customer can add anything. Every Add to Cart button goes through this.
       * The login check comes after the product/design checks, so a bad request is reported as such before
       * anyone is asked to log in. `useAddToCart` turns 'login-required' into the login modal.
       * @returns {{ ok: true } | { ok: false, reason: 'not-found' | 'design-required' | 'login-required' | 'max-qty' }}
       */
      addToCart: (id, designId = null, qty = 1) => {
        const product = getProductById(id);
        if (!product) return { ok: false, reason: 'not-found' };
        if (product.designs.length && !product.designs.some((d) => d.id === designId)) {
          return { ok: false, reason: 'design-required' };
        }
        // Without a backend there are no accounts to log in to (the login panel is a placeholder), so the
        // storefront keeps working as before. With one, the cart is for logged-in customers only.
        if (apiEnabled() && !getToken()) return { ok: false, reason: 'login-required' };
        if (qtyOf(id, designId) >= CART.maxQtyPerLine) return { ok: false, reason: 'max-qty' };
        dispatch({ type: 'cart/add', id, designId: product.designs.length ? designId : null, qty });
        return { ok: true };
      },
      setQty: (key, qty) => dispatch({ type: 'cart/setQty', key, qty }),
      removeFromCart: (key) => dispatch({ type: 'cart/remove', key }),
      clearCart: () => dispatch({ type: 'cart/clear' }),
      toggleWishlist: (id) => dispatch({ type: 'wishlist/toggle', id }),
    };
  }, [state]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}
