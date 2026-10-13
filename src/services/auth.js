// Customer sign-up / log-in against the backend (/api/auth/*): email + password only, no OTP.
import { api } from './api';
import { clearSession, saveSession } from './session';

export { getSession } from './session';
export const logout = clearSession;

export const signup = async ({ name, email, password }) =>
  saveSession(await api('/auth/signup', { method: 'POST', body: { name, email, password } }));

export const login = async ({ email, password }) =>
  saveSession(await api('/auth/login', { method: 'POST', body: { email, password } }));
