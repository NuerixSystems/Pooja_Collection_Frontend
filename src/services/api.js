// Tiny fetch wrapper for the Pooja Collection backend (VITE_CRM_API_URL).
//
// VITE_CRM_API_URL should include the full base path of the Pooja API, e.g.:
//   Local:      http://localhost:8000/api/pooja
//   Production: https://crm-dkc2.onrender.com/api/pooja

import { CRM } from '../config';
import { getToken } from './session';

export class ApiError extends Error {
  constructor(message, status, fields = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;   // 0 = network failure / timeout
    this.fields = fields;
  }
}

export const apiEnabled = () => Boolean(CRM.apiUrl);

export async function api(path, { method = 'GET', body, headers = {}, timeoutMs = 15000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const token = getToken();

  // 👇 FIXED: Smart URL for Local and Production
  const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const base = isLocal 
    ? 'http://localhost:8000/api/pooja' 
    : 'https://crm-dkc2.onrender.com/api/pooja';

  const suffix = path ? (path.startsWith('/') ? path : `/${path}`) : '';

  let res;
  try {
    res = await fetch(`${base}${suffix}`, {
      method,
      signal: controller.signal,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Couldn't reach the shop's server. Check your connection and try again.", 0);
  } finally {
    clearTimeout(timer);
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* empty or non-JSON body */
  }
  if (!res.ok) {
    const detail = typeof data?.detail === 'string' ? data.detail : null;
    throw new ApiError(detail || 'Something went wrong. Please try again.', res.status, data?.fields || {});
  }
  return data;
}
