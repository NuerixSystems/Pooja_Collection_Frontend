import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useUI } from '../context/UIContext';

/** Where shoppers go after something is added to the cart (the order page). */
export const AFTER_ADD_PATH = '/contact';

/**
 * The one way an Add to Cart button adds an item.
 * - Logged in (or no backend configured): adds it and opens the order page, as before.
 * - Guest: nothing is added. The existing Login/Signup modal opens and the item is remembered; once the
 *   customer logs in or signs up, <PendingCartAdd /> adds it. Closing the modal forgets it.
 * Returns the store's result, so callers can react to e.g. { ok: false, reason: 'design-required' }.
 */
export function useAddToCart() {
  const { addToCart } = useStore();
  const { open, setPendingAdd } = useUI();
  const navigate = useNavigate();

  return useCallback((id, designId = null, qty = 1) => {
    const result = addToCart(id, designId, qty);
    if (result.ok) navigate(AFTER_ADD_PATH);
    else if (result.reason === 'login-required') {
      setPendingAdd({ id, designId, qty });
      open('login');
    }
    return result;
  }, [addToCart, navigate, open, setPendingAdd]);
}
