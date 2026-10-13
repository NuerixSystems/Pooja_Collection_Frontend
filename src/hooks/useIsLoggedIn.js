import { useSyncExternalStore } from 'react';
import { getToken, subscribeSession } from '../services/session';

/** True while a customer session exists. Re-renders on login/logout (reads the existing session store). */
export function useIsLoggedIn() {
  return Boolean(useSyncExternalStore(subscribeSession, getToken, () => null));
}
