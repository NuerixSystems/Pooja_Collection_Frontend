import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useUI } from '../context/UIContext';
import { AFTER_ADD_PATH } from '../hooks/useAddToCart';
import { useIsLoggedIn } from '../hooks/useIsLoggedIn';

// Renders nothing. When a guest clicked Add to Cart, logged in or signed up, and the login modal is still
// waiting, this adds the originally chosen product, design and quantity, then continues as a normal add would.
export default function PendingCartAdd() {
  const loggedIn = useIsLoggedIn();
  const { pendingAdd, setPendingAdd, close } = useUI();
  const { addToCart } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loggedIn || !pendingAdd) return;
    setPendingAdd(null); // consume first: it must only ever be added once
    const result = addToCart(pendingAdd.id, pendingAdd.designId, pendingAdd.qty);
    close();
    if (result.ok) navigate(AFTER_ADD_PATH);
  }, [loggedIn, pendingAdd, setPendingAdd, addToCart, close, navigate]);

  return null;
}
