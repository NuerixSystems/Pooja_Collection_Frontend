import { Link, useLocation } from 'react-router-dom';
import { BRAND, NAV_LINKS } from '../config';
import { useStore } from '../context/StoreContext';
import { useUI } from '../context/UIContext';
import { HeartIcon, MenuIcon, SearchIcon, UserIcon } from './Icons';
import './Header.css';

export function isNavActive(link, { pathname, search, hash }) {
  const [path, query = ''] = link.to.split('#')[0].split('?');
  if (link.key === 'home') return pathname === '/';
  return pathname === path && (search.replace('?', '') === query);
}

function CartIcon({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 3h2.6l2.4 11.2a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.1L20.5 7H5.6" />
      <circle cx="9.5" cy="19.5" r="1.4" />
      <circle cx="17" cy="19.5" r="1.4" />
    </svg>
  );
}

function Badge({ count }) {
  return count > 0 ? <span className="badge" aria-hidden="true">{count > 99 ? '99+' : count}</span> : null;
}

const withCount = (label, count) => (count ? `${label} (${count})` : label);

function IconButton({ label, onClick, count, className = '', children }) {
  return (
    <button type="button" onClick={onClick} className={`icon-btn ${className}`} aria-label={withCount(label, count)}>
      {children}
      <Badge count={count} />
    </button>
  );
}

// Same look as IconButton, but a real link: it navigates to a page rather than opening a panel.
function IconLink({ label, to, count, active, className = '', children }) {
  return (
    <Link to={to} className={`icon-btn ${className}`} aria-label={withCount(label, count)} aria-current={active ? 'page' : undefined}>
      {children}
      <Badge count={count} />
    </Link>
  );
}

export default function Header() {
  const location = useLocation();
  const { open } = useUI();
  const { cartCount, wishlistCount } = useStore();

  return (
    <header className="site-header">
      <div className="header-shell">
        <IconButton label="Open menu" onClick={() => open('menu')} className="menu-btn"><MenuIcon /></IconButton>

        <Link to="/" className="brand" aria-label={`${BRAND.name} — home`}>
          <img src="/logo.png" alt={BRAND.name} className="brand-logo" width="270" height="100" />
        </Link>

        <nav className="primary-nav" aria-label="Primary">
          <ul>
            {NAV_LINKS.map((link) => {
              const active = isNavActive(link, location);
              return (
                <li key={link.key}>
                  <Link to={link.to} className={active ? 'is-active' : ''} aria-current={active ? 'page' : undefined}>{link.label}</Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="header-actions">
          <IconButton label="Search" onClick={() => open('search')}><SearchIcon size={26} /></IconButton>
          <IconButton label="Log in" onClick={() => open('login')} className="hide-mobile"><UserIcon size={26} /></IconButton>
          <IconLink label="Wishlist" to="/wishlist" count={wishlistCount} active={location.pathname === '/wishlist'} className="wishlist-link">
            <HeartIcon size={26} fill={wishlistCount > 0 ? 'currentColor' : 'none'} />
          </IconLink>
          <IconButton label="Cart" onClick={() => open('cart')} count={cartCount}><CartIcon /></IconButton>
        </div>
      </div>
    </header>
  );
}
