import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const UIContext = createContext(null);

export function UIProvider({ children }) {
  const [panel, setPanel] = useState(null);
  const [pendingAdd, setPendingAdd] = useState(null);
  const [checkoutAddress, setCheckoutAddress] = useState(null);

  const open = useCallback((name) => setPanel(name), []);
  const close = useCallback(() => setPanel(null), []);

  // 👇 Stable setter for checkoutAddress
  const updateCheckoutAddress = useCallback((addr) => {
    setCheckoutAddress(addr);
  }, []);

  useEffect(() => {
    if (panel !== 'login') setPendingAdd(null);
  }, [panel]);

  const value = useMemo(
    () => ({ 
      panel, 
      open, 
      close, 
      pendingAdd, 
      setPendingAdd,
      checkoutAddress, 
      setCheckoutAddress: updateCheckoutAddress, // 👈 Use stable setter
    }),
    [panel, open, close, pendingAdd, checkoutAddress, updateCheckoutAddress],
  );
  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used inside <UIProvider>');
  return ctx;
}