// Customer session (token from the backend), kept in localStorage. Safe if storage is blocked.
const KEY = 'pooja-collection:auth:v1';

// Components that need to react to login/logout (e.g. the pending add-to-cart) subscribe here.
const listeners = new Set();
const notify = () => listeners.forEach((fn) => fn());

export function getSession() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    return s?.token && s?.customer ? s : null;
  } catch {
    return null;
  }
}

export const getToken = () => getSession()?.token ?? null;

/** Calls `fn` whenever the session changes, in this tab or another one. Returns an unsubscribe function. */
export function subscribeSession(fn) {
  listeners.add(fn);
  const onStorage = (e) => { if (e.key === KEY || e.key === null) fn(); };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(fn);
    window.removeEventListener('storage', onStorage);
  };
}

export function saveSession(session) {
  try {
    localStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    /* ignore */
  }
  notify();
  return session;
}

export function clearSession() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  notify();
}
