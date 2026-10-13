import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { StoreProvider } from '../context/StoreContext';
import { UIProvider } from '../context/UIContext';

export const STORE_KEY = 'pooja-collection:store:v1';

/** Seed the persisted cart before rendering, e.g. seedCart([{ id: 'gold-tulip-rings-3-set', qty: 2 }]). */
export const seedCart = (cart, wishlist = []) =>
  localStorage.setItem(STORE_KEY, JSON.stringify({ cart, wishlist }));

export const savedCart = () => JSON.parse(localStorage.getItem(STORE_KEY) || '{"cart":[]}').cart;

export function renderApp(route = '/') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <StoreProvider>
        <UIProvider>
          <App />
        </UIProvider>
      </StoreProvider>
    </MemoryRouter>,
  );
}
