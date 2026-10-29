import { Link, useNavigate } from 'react-router-dom';
import { NAV_LINKS } from '../config';
import { getCategories } from '../services/catalog';
import { useUI } from '../context/UIContext';
import { useIsLoggedIn } from '../hooks/useIsLoggedIn';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { logout } from '../services/auth';
import Panel from './Panel';
import './MenuPanel.css';

export default function MenuPanel() {
  const { panel, open, close } = useUI();
  const navigate = useNavigate();
  const loggedIn = useIsLoggedIn();
  const isMobile = useMediaQuery('(max-width: 760px)');
  if (!isMobile) return null; // side menu is mobile-only

  const handleAccountAction = () => {
    if (loggedIn) {
      logout();
      close();
      navigate('/');
      return;
    }
    open('login');
  };

  return (
    <Panel open={panel === 'menu'} onClose={close} side="left" label="Menu">
      <nav className="menu" aria-label="Menu">
        <ul className="menu-list">
          {NAV_LINKS.map((l) => (
            <li key={l.key}><Link to={l.to} onClick={close}>{l.label}</Link></li>
          ))}
        </ul>
        <h2 className="menu-heading">Shop by category</h2>
        <ul className="menu-list menu-list--sub">
          {getCategories().map((c) => (
            <li key={c.slug}><Link to={`/category/${c.slug}`} onClick={close}>{c.name}</Link></li>
          ))}
        </ul>
        <button type="button" className="btn btn--ghost menu-account" onClick={handleAccountAction}>
          {loggedIn ? 'Log out' : 'Log in or create account'}
        </button>
      </nav>
    </Panel>
  );
}
