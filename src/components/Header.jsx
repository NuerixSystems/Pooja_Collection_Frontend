import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BRAND, NAV_LINKS } from '../config';
import { useStore } from '../context/StoreContext';
import { useUI } from '../context/UIContext';
import { useIsLoggedIn } from '../hooks/useIsLoggedIn';
import { searchSuggestions } from '../services/catalog';
import { formatPrice } from '../utils/format';
import { HeartIcon, MenuIcon, SearchIcon, UserIcon, CartIcon } from './Icons';
import BackButton from './BackButton';
import './Header.css';

// ---------------------------------------------------------------------------
// Nav link active state
// ---------------------------------------------------------------------------
export function isNavActive(link, { pathname, search, hash }) {
  const [path, query = ''] = link.to.split('#')[0].split('?');
  if (link.key === 'home') return pathname === '/';
  return pathname === path && search.replace('?', '') === query;
}

// ---------------------------------------------------------------------------
// Small helpers used by the header actions
// ---------------------------------------------------------------------------
function Badge({ count }) {
  return count > 0 ? (
    <span className="badge" aria-hidden="true">
      {count > 99 ? '99+' : count}
    </span>
  ) : null;
}

const withCount = (label, count) => (count ? `${label} (${count})` : label);

function IconButton({ label, onClick, count, className = '', children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`icon-btn ${className}`}
      aria-label={withCount(label, count)}
    >
      {children}
      <Badge count={count} />
    </button>
  );
}

function IconLink({ label, to, count, active, className = '', children }) {
  return (
    <Link
      to={to}
      className={`icon-btn ${className}`}
      aria-label={withCount(label, count)}
      aria-current={active ? 'page' : undefined}
    >
      {children}
      <Badge count={count} />
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------
export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { open } = useUI();
  const { cartCount, wishlistCount } = useStore();
  const loggedIn = useIsLoggedIn();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 120);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const suggestions = useMemo(() => searchSuggestions(debouncedQuery), [debouncedQuery]);
  const showSuggestions = Boolean(searchQuery.trim() && (suggestions.categories.length || suggestions.products.length));

  const handleAccount = () => {
    if (loggedIn) navigate('/account');
    else open('login');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    } else {
      open('search');
    }
  };

  const handleProductSuggestion = (event, product) => {
    setSearchQuery('');
    if (window.matchMedia?.('(max-width: 760px)').matches) {
      event.preventDefault();
      navigate(`/category/${product.categorySlug}`);
    }
  };

  return (
    <header className="site-header">
      {/* Top Bar: Logo, Search, Icons */}
      <div className="header-top">
        <div className={`header-shell${location.pathname === '/' ? ' header-shell--home' : ''}`}>
          <BackButton />

          <IconButton
            label="Open menu"
            onClick={() => open('menu')}
            className="menu-btn"
          >
            <MenuIcon />
          </IconButton>

          <Link to="/" className="brand" aria-label={`${BRAND.name} — home`}>
            <img
              src="/logo.png"
              alt={BRAND.name}
              className="brand-logo"
              width="270"
              height="100"
            />
            <span className="brand-name">Pooja's Collection</span>
          </Link>

          {/* New Amazon-style Search Bar */}
          <div className="header-search-wrap">
            <form className="header-search" onSubmit={handleSearch} role="search">
              <input
                type="search"
                placeholder="Search Pooja's Collection..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search products"
                aria-autocomplete="list"
                aria-expanded={showSuggestions}
                aria-controls="header-search-suggestions"
                autoComplete="off"
              />
              <button type="submit" aria-label="Search">
                <SearchIcon size={20} />
              </button>
            </form>
            {showSuggestions && (
              <div className="header-search-suggestions" id="header-search-suggestions" aria-label="Search suggestions">
                {suggestions.categories.length > 0 && (
                  <div className="header-search-suggestion-group">
                    <p>Categories</p>
                    {suggestions.categories.map((category) => (
                      <Link
                        key={category.slug}
                        to={`/category/${category.slug}`}
                        onClick={() => setSearchQuery('')}
                      >
                        {category.name}
                      </Link>
                    ))}
                  </div>
                )}
                {suggestions.products.length > 0 && (
                  <div className="header-search-suggestion-group">
                    <p>Products</p>
                    {suggestions.products.slice(0, 5).map((product) => (
                      <Link
                        key={product.id}
                        to={`/product/${product.slug}`}
                        onClick={(event) => handleProductSuggestion(event, product)}
                      >
                        <span>{product.name}</span>
                        <span className="header-search-suggestion-price">{formatPrice(product.price)}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <nav className="primary-nav" aria-label="Primary">
            <ul>
              {NAV_LINKS.map((link) => {
                const active = isNavActive(link, location);
                return (
                  <li key={link.key}>
                    <Link
                      to={link.to}
                      className={active ? 'is-active' : ''}
                      aria-current={active ? 'page' : undefined}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="header-actions">
            <IconButton
              label={loggedIn ? 'My Account' : 'Log in'}
              onClick={handleAccount}
            >
              <UserIcon size={26} />
            </IconButton>

            <IconLink
              label="Wishlist"
              to="/wishlist"
              count={wishlistCount}
              active={location.pathname === '/wishlist'}
              className="wishlist-link"
            >
              <HeartIcon size={26} fill={wishlistCount > 0 ? 'currentColor' : 'none'} />
            </IconLink>

            <IconButton
              label="Cart"
              onClick={() => open('cart')}
              count={cartCount}
            >
              <CartIcon size={26} />
            </IconButton>
          </div>
        </div>
      </div>
    </header>
  );
}