import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BRAND, NAV_LINKS } from '../config';
import { useStore } from '../context/StoreContext';
import { useUI } from '../context/UIContext';
import { useIsLoggedIn } from '../hooks/useIsLoggedIn';
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

  const handleAccount = () => {
    if (loggedIn) navigate('/account');
    else open('login');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      open('search');
    }
  };

  return (
    <header className="site-header">
      {/* Top Bar: Logo, Search, Icons */}
      <div className="header-top">
        <div className="header-shell">
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
          <form className="header-search" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search Pooja's Collection..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search products"
            />
            <button type="submit" aria-label="Search">
              <SearchIcon size={20} />
            </button>
          </form>

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
              className="hide-mobile"
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