import { createContext, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import { CART } from '../config';
import { apiEnabled } from '../services/api';
import { getProductById } from '../services/catalog';
import { getSession, getToken, subscribeSession } from '../services/session';
import {
  fetchServerCart,
  serverAddItem,
  serverRemoveItem,
  serverUpdateItem,
} from '../services/cart';
import { initialState, lineKey, reducer, sanitizeSaved } from './cartReducer';

const STORAGE_KEY = 'pooja-collection:store:v1';
const WISHLIST_STORAGE_KEY = 'pooja-collection:wishlist:v1';

function getWishlistStorageKey() {
  const customer = getSession()?.customer;
  const customerId = customer?.id ?? customer?.email;
  return customerId == null
    ? null
    : `${WISHLIST_STORAGE_KEY}:${encodeURIComponent(String(customerId))}`;
}

function loadWishlist(key) {
  if (!key) return [];
  try {
    const wishlist = JSON.parse(localStorage.getItem(key));
    return Array.isArray(wishlist) ? wishlist.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

function load() {
  try {
    const state = sanitizeSaved(JSON.parse(localStorage.getItem(STORAGE_KEY)));
    const wishlistKey = getWishlistStorageKey();
    return wishlistKey ? { ...state, wishlist: loadWishlist(wishlistKey) } : state;
  } catch {
    /* storage unavailable or corrupt — start fresh */
  }
  return initialState;
}

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  // ---- ALL HOOKS FIRST (Rules of Hooks) ----
  const [state, dispatch] = useReducer(reducer, undefined, load);
  const [serverCart, setServerCart] = useState(null);
  const [busy, setBusy] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);

  // Persist guest state to localStorage.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  // Load server cart on mount and on every session change.
  useEffect(() => {
    let cancelled = false;

    const loadServerCart = async () => {
      if (!apiEnabled() || !getToken()) {
        if (!cancelled) setServerCart(null);
        return;
      }
      try {
        if (!cancelled) setBusy(true);
        const cart = await fetchServerCart();
        console.log('[Store] server cart fetched:', cart);
        if (!cancelled) setServerCart(cart);
      } catch (err) {
        console.error('[Store] fetch failed:', err);
      } finally {
        if (!cancelled) setBusy(false);
      }
    };

    loadServerCart();

    const unsub = subscribeSession(() => {
      // Logout UX: wipe in-memory cart immediately.
      if (!getToken()) {
        setServerCart(null);
        dispatch({ type: 'cart/clear' });
      }
      dispatch({ type: 'wishlist/set', wishlist: [] });
      // Re-run this effect on the next tick.
      setSessionKey((k) => k + 1);
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, [sessionKey]);

  // Restore the wishlist belonging to the active customer after login or account changes.
  useEffect(() => {
    const wishlistKey = getWishlistStorageKey();
    if (wishlistKey) {
      dispatch({ type: 'wishlist/set', wishlist: loadWishlist(wishlistKey) });
    }
  }, [sessionKey]);

  const isLoggedIn = useMemo(() => Boolean(getSession()), [sessionKey]);

  const value = useMemo(() => {
    let lines = [];

    // The backend may send camelCase (productId) or snake_case (product_id), and the cart may be
    // wrapped as { cart: {...} } or use `lines` instead of `items`. Accept all of them.
    const serverItems = Array.isArray(serverCart?.items)
      ? serverCart.items
      : Array.isArray(serverCart?.cart?.items)
        ? serverCart.cart.items
        : Array.isArray(serverCart?.lines)
          ? serverCart.lines
          : null;

    if (isLoggedIn && serverItems) {
      lines = serverItems.flatMap((item) => {
        // NOTE: never fall back to item.id here — that is the cart-row id, not the product id.
        const productId = item.productId ?? item.product_id ?? item.product?.id;
        const itemDesignId = item.designId ?? item.design_id ?? item.design?.id ?? null;
        const product = getProductById(productId) || getProductById(String(productId));
        if (!product) {
          console.warn('[Store] cart item skipped, product not in catalog:', item);
          return [];
        }
        const design = itemDesignId
          ? product.designs.find((d) => d.id === itemDesignId) || null
          : null;
        if (itemDesignId && !design) return [];
        if (product.designs.length && !design) return [];
        return [{
          key: lineKey(product.id, itemDesignId),
          serverId: item.id,
          product,
          design,
          qty: item.qty ?? item.quantity ?? 1,
        }];
      });
    } else {
      lines = state.cart.flatMap((l) => {
        const product = getProductById(l.id);
        if (!product) return [];
        const design = l.designId
          ? product.designs.find((d) => d.id === l.designId) || null
          : null;
        if (l.designId && !design) return [];
        if (product.designs.length && !design) return [];
        return [{
          key: l.key,
          serverId: null,
          product,
          design,
          qty: l.qty,
        }];
      });
    }

    const wishlistProducts = state.wishlist.map(getProductById).filter(Boolean);
    const qtyOf = (id, designId = null) =>
      lines.find((l) => l.key === lineKey(id, designId))?.qty ?? 0;

    // ---- Actions ----

    const addToCart = (id, designId = null, qty = 1) => {
      const product = getProductById(id);
      if (!product) return { ok: false, reason: 'not-found' };
      const wantsDesign = product.designs.length > 0;
      if (wantsDesign && !product.designs.some((d) => d.id === designId)) {
        return { ok: false, reason: 'design-required' };
      }
      if (apiEnabled() && !getToken()) return { ok: false, reason: 'login-required' };

      const finalDesignId = wantsDesign ? designId : null;
      if (qtyOf(id, finalDesignId) >= CART.maxQtyPerLine) {
        return { ok: false, reason: 'max-qty' };
      }

      if (apiEnabled() && getToken()) {
        setBusy(true);
        serverAddItem({ productId: id, designId: finalDesignId, qty })
          .then((cart) => setServerCart(cart))
          .catch((err) => console.error('[Store] add failed:', err))
          .finally(() => setBusy(false));
        return { ok: true };
      }

      dispatch({ type: 'cart/add', id, designId: finalDesignId, qty });
      return { ok: true };
    };

    const setQty = (key, qty) => {
      const line = lines.find((l) => l.key === key);
      if (!line) return;
      if (isLoggedIn && line.serverId != null) {
        setBusy(true);
        const call = qty < 1
          ? serverRemoveItem(line.serverId)
          : serverUpdateItem(line.serverId, qty);
        call
          .then((cart) => setServerCart(cart))
          .catch((err) => console.error('[Store] setQty failed:', err))
          .finally(() => setBusy(false));
        return;
      }
      dispatch({ type: 'cart/setQty', key, qty });
    };

    const removeFromCart = (key) => {
      const line = lines.find((l) => l.key === key);
      if (!line) return;
      if (isLoggedIn && line.serverId != null) {
        setBusy(true);
        serverRemoveItem(line.serverId)
          .then((cart) => setServerCart(cart))
          .catch((err) => console.error('[Store] remove failed:', err))
          .finally(() => setBusy(false));
        return;
      }
      dispatch({ type: 'cart/remove', key });
    };

    const clearCart = () => {
      dispatch({ type: 'cart/clear' });
    };

    const toggleWishlist = (id) => {
      const wishlist = state.wishlist.includes(id)
        ? state.wishlist.filter((savedId) => savedId !== id)
        : [...state.wishlist, id];
      const wishlistKey = getWishlistStorageKey();
      if (wishlistKey) {
        try {
          localStorage.setItem(wishlistKey, JSON.stringify(wishlist));
        } catch {
          /* ignore */
        }
      }
      dispatch({ type: 'wishlist/toggle', id });
    };

    const cartCount = lines.reduce((n, l) => n + l.qty, 0);
    const cartTotal = lines.reduce((sum, l) => sum + l.qty * l.product.price, 0);

    return {
      lines,
      wishlist: wishlistProducts,
      cartCount,
      cartTotal,
      wishlistCount: wishlistProducts.length,
      maxQty: CART.maxQtyPerLine,
      busy,
      isWishlisted: (id) => state.wishlist.includes(id),
      isAtMax: (id, designId = null) => qtyOf(id, designId) >= CART.maxQtyPerLine,
      addToCart,
      setQty,
      removeFromCart,
      clearCart,
      toggleWishlist,
    };
  }, [state, serverCart, busy, isLoggedIn, sessionKey]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}