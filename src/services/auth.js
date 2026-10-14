// Customer sign-up / log-in against the backend (/api/auth/*): email + password only, no OTP.
import { api } from './api';
import { clearSession, saveSession } from './session';

export { getSession } from './session';
export const logout = clearSession;

export const signup = async ({ name, email, password }) =>
  saveSession(await api('/auth/signup', { method: 'POST', body: { name, email, password } }));

export const login = async ({ email, password }) =>
  saveSession(await api('/auth/login', { method: 'POST', body: { email, password } }));

// ---------- profile ----------

/** Fetch the latest customer profile (name, email, phone) from the server. */
export const fetchProfile = () => api('/auth/me');

/** Update name and (optionally) mobile of the current customer. */
export const updateProfile = ({ name, phone }) =>
  api('/auth/me', { method: 'PATCH', body: { name, phone } });

/** Change password (requires current password). */
export const changePassword = ({ currentPassword, newPassword }) =>
  api('/auth/password', { method: 'PATCH', body: { currentPassword, newPassword } });