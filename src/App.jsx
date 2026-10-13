import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import MenuPanel from './components/MenuPanel';
import SearchPanel from './components/SearchPanel';
import LoginPanel from './components/LoginPanel';
import CartPanel from './components/CartPanel';
import PendingCartAdd from './components/PendingCartAdd';
import Home from './pages/Home';
import CategoryPage from './pages/CategoryPage';
import Shop from './pages/Shop';
import ProductPage from './pages/ProductPage';
import Wishlist from './pages/Wishlist';
import CartPage from './pages/CartPage';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import Contact from './pages/Contact';
import About from './pages/About';
import { Privacy, ReturnPolicy, ShippingPolicy, Terms } from './pages/Legal';
import NotFound from './pages/NotFound';
import { useDocumentTitle } from './hooks/useDocumentTitle';
import { useUI } from './context/UIContext';

function RouteEffects() {
  const { pathname, hash } = useLocation();
  const { close } = useUI();

  useEffect(() => {
    if (hash) document.querySelector(hash)?.scrollIntoView();
    else window.scrollTo(0, 0);
  }, [pathname, hash]);

  useEffect(() => { close(); }, [pathname, close]);
  return null;
}

// Wraps only the page area, so a crash on one page leaves the header, cart and menu usable.
// Keyed by pathname: navigating elsewhere clears the error.
function Page({ children }) {
  const { pathname } = useLocation();
  return <ErrorBoundary resetKey={pathname}>{children}</ErrorBoundary>;
}

function HomeRoute() {
  useDocumentTitle('');
  return <Home />;
}

export default function App() {
  return (
    <>
      <RouteEffects />
      <Header />
      <main>
        <Page>
          <Routes>
            <Route path="/" element={<HomeRoute />} />
            <Route path="/category/:slug" element={<CategoryPage />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:slug" element={<ProductPage />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order/:id" element={<OrderSuccess />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/shipping-policy" element={<ShippingPolicy />} />
            <Route path="/return-policy" element={<ReturnPolicy />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Page>
      </main>
      <Footer />
      <MenuPanel />
      <SearchPanel />
      <LoginPanel />
      <CartPanel />
      <PendingCartAdd />
    </>
  );
}
