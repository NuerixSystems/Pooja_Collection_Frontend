// Order placement layer.
// placeOrderRemote() sends the order to POST /orders. The server re-checks product, design, price and
// quantity and returns the real order; a copy is cached in this browser so the confirmation page can show it
// (together with the token needed to read it again). There is no offline/demo mode.
//
// IMPORTANT: prices, quantities and designs from the browser are advisory only; the server never trusts them.

import { api, ApiError } from './api';
import { clearSession } from './session';

const KEY = 'pooja-collection:orders:v1';

function readAll() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function cache(order) {
  try {
    localStorage.setItem(KEY, JSON.stringify([order, ...readAll().filter((o) => o.id !== order.id)].slice(0, 20)));
  } catch {
    /* storage unavailable — the order is still returned for this session */
  }
}

/**
 * Place an order on the backend. Throws ApiError (message is customer-friendly) on failure.
 * `clientRequestId` makes retries safe: the server returns the same order instead of creating a duplicate.
 *
 * `paymentMethod` is "COD" or "UPI"; `utrId` is the UPI transaction reference (required for UPI).
 */
export async function placeOrderRemote({
  customer,
  lines,
  clientRequestId,
  paymentMethod = 'COD',
  utrId = null,
}) {
  let order;
  try {
    order = await api('/orders', {
      method: 'POST',
      body: {
        customer,
        clientRequestId,
        paymentMethod,
        utrId,
        items: lines.map(({ product, design, qty }) => ({
          productId: product.id,
          designId: design?.id ?? null,
          qty,
        })),
      },
    });
  } catch (err) {
    // The server only takes orders from logged-in customers. A 401 means there is no valid login (never logged
    // in, or the saved one expired), so drop the stale session; the caller then opens the login modal.
    if (err instanceof ApiError && err.status === 401) {
      clearSession();
      throw new ApiError('Please log in to place your order. Your cart is saved.', 401);
    }
    throw err;
  }
  cache(order);
  return order;
}

export const getOrder = (id) => readAll().find((o) => o.id === id) || null;

/**
 * Fetch the logged-in customer's orders from the backend.
 * Returns an empty array for guests / expired sessions (never throws on 401).
 */
export async function fetchMyOrders() {
  try {
    return await api('/orders');
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return [];
    throw err;
  }
}