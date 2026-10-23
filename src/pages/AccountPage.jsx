import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { getSession, logout, fetchProfile } from '../services/auth';
import { useStore } from '../context/StoreContext';
import './AccountPage.css';

export default function AccountPage() {
  useDocumentTitle('My Account');
  const navigate = useNavigate();
  const { wishlistCount } = useStore();
  const [profile, setProfile] = useState(() => getSession()?.customer || null);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      navigate('/');
      return;
    }
    fetchProfile()
      .then((data) => setProfile(data))
      .catch(() => { /* keep cached profile */ });
  }, [navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!profile) return null;

  return (
    <div className="container account-page">
      <header className="account-header">
        <div className="account-avatar" aria-hidden>
          <span>{profile.name?.charAt(0).toUpperCase() || '?'}</span>
        </div>
        <h1 className="account-title">My Account</h1>
      </header>

      {/* Profile summary — name, email, mobile */}
      <section className="account-card" aria-label="Profile summary">
        <div className="account-row">
          <span className="account-label">Name</span>
          <span className="account-value">{profile.name || '—'}</span>
        </div>
        <div className="account-row">
          <span className="account-label">Email</span>
          <span className="account-value">{profile.email || '—'}</span>
        </div>
        <div className="account-row">
          <span className="account-label">Mobile</span>
          <span className="account-value">{profile.phone || 'Not added'}</span>
        </div>
      </section>

      {/* Navigation menu */}
      <nav className="account-menu" aria-label="Account actions">
        <Link to="/orders" className="account-link">
          <span className="account-icon" aria-hidden>📦</span>
          <span className="account-link-text">My Orders</span>
          <span className="account-chevron" aria-hidden>›</span>
        </Link>

        <Link to="/wishlist" className="account-link">
          <span className="account-icon" aria-hidden>❤️</span>
          <span className="account-link-text">
            Wishlist {wishlistCount > 0 && <span className="muted">({wishlistCount})</span>}
          </span>
          <span className="account-chevron" aria-hidden>›</span>
        </Link>

        {/* 👇 NEW: Manage Addresses Link Add Panniruken */}
        <Link to="/account/addresses" className="account-link">
          <span className="account-icon" aria-hidden>📍</span>
          <span className="account-link-text">Manage Addresses</span>
          <span className="account-chevron" aria-hidden>›</span>
        </Link>

        <Link to="/account/edit" className="account-link">
          <span className="account-icon" aria-hidden>✏️</span>
          <span className="account-link-text">Edit Profile</span>
          <span className="account-chevron" aria-hidden>›</span>
        </Link>

        <Link to="/account/password" className="account-link">
          <span className="account-icon" aria-hidden>🔒</span>
          <span className="account-link-text">Change Password</span>
          <span className="account-chevron" aria-hidden>›</span>
        </Link>
      </nav>

      <button type="button" className="btn account-logout" onClick={handleLogout}>
        Log Out
      </button>
    </div>
  );
}