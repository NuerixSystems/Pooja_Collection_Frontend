// Enquiry API. Submits to the backend, which saves the enquiry and notifies the admin
// via WhatsApp. The customer never leaves the website.
//
// Usage:
//   import { submitEnquiry, fetchMyEnquiries } from './enquiries';
//   const enquiry = await submitEnquiry({ customer, items });

import { api, ApiError } from './api';
import { getToken } from './session';

/** Submit a new enquiry to the backend. */
export async function submitEnquiry({ customer, items }) {
  return api('/enquiries', {
    method: 'POST',
    body: {
      customer,
      items: items.map(({ productId, designId, qty }) => ({
        productId,
        designId: designId || null,
        qty,
      })),
    },
  });
}

/** Fetch the logged-in customer's enquiries (newest first). */
export async function fetchMyEnquiries() {
  if (!getToken()) return [];
  try {
    return await api('/enquiries/mine');
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return [];
    throw err;
  }
}