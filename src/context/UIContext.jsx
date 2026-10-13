import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

// One panel open at a time: 'menu' | 'search' | 'login' | 'cart' | null
const UIContext = createContext(null);

export function UIProvider({ children }) {
  const [panel, setPanel] = useState(null);
  // What a guest tried to add to the cart ({ id, designId, qty }) while the login modal is open.
  // It is added after a successful login/signup and forgotten if the modal is closed any other way.
  const [pendingAdd, setPendingAdd] = useState(null);
  const open = useCallback((name) => setPanel(name), []);
  const close = useCallback(() => setPanel(null), []);

  useEffect(() => {
    if (panel !== 'login') setPendingAdd(null);
  }, [panel]);

  const value = useMemo(
    () => ({ panel, open, close, pendingAdd, setPendingAdd }),
    [panel, open, close, pendingAdd],
  );
  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used inside <UIProvider>');
  return ctx;
}
