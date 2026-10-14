// Server-side cart for logged-in customers. Guest carts stay in localStorage
// (via cartReducer / StoreContext) until the customer logs in, at which point
// the guest cart is migrated to the server and the local copy is cleared.

import { api, ApiError } from './api';
import { getToken } from './session';

export const serverCartEnabled = () => Boolean(getToken());

// ----- server-side cart operations -----

export async function fetchServerCart() {
  if (!serverCartEnabled()) return null;
  try {
    return await api('/cart');
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null;
    throw err;
  }
}

export async function serverAddItem({ productId, designId = null, qty = 1 }) {
  return api('/cart/items', {
    method: 'POST',
    body: { productId, designId, qty },
  });
}

export async function serverUpdateItem(itemId, qty) {
  return api(`/cart/items/${itemId}`, { method: 'PATCH', body: { qty } });
}

export async function serverRemoveItem(itemId) {
  return api(`/cart/items/${itemId}`, { method: 'DELETE' });
}

/**
 * Clear the server-side cart.
 *
 * Pass an explicit `token` when the caller is about to remove the session
 * (e.g. logout): otherwise the Authorization header would be gone by the time
 * the request fires and the backend would reject it with 401.
 */
export async function serverClearCart(explicitToken) {
  const token = explicitToken || getToken();
  if (!token) return;
  try {
    await api('/cart', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (err) {
    // 401 = the token is already invalid — nothing to clear on the server.
    if (!(err instanceof ApiError && err.status === 401)) throw err;
  }
}

// ----- migrate guest cart to server on login -----

export async function migrateGuestCartToServer(guestLines) {
  if (!guestLines?.length) return null;
  let lastCart = null;
  for (const line of guestLines) {
    try {
      lastCart = await serverAddItem({
        productId: line.id,
        designId: line.designId || null,
        qty: line.qty || 1,
      });
    } catch {
      // Skip lines that fail (e.g. product no longer available).
    }
  }
  return lastCart;
}