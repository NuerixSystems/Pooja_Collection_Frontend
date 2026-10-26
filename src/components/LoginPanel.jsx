import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CRM } from '../config';
import { useUI } from '../context/UIContext';
import { getProductById } from '../services/catalog';
import { getSession, login, logout, signup } from '../services/auth';
import { firstAuthError, validateAuth } from '../utils/authValidation';
import Panel from './Panel';
import './LoginPanel.css';

// --- Icons for Password Toggle ---
function EyeIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

// With a backend configured (VITE_CRM_API_URL) this signs customers up / in against /api/auth/*.
// Without one it stays the "coming soon" placeholder, so the storefront still works standalone.
function LoginForm() {
  const { pendingAdd, close } = useUI();
  const [mode, setMode] = useState('login');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [session, setSession] = useState(getSession);
  const [showPassword, setShowPassword] = useState(false);
  const isLogin = mode === 'login';
  const pendingName = pendingAdd ? getProductById(pendingAdd.id)?.name : null;

  const submit = async (e) => {
    e.preventDefault();
    if (!CRM.apiUrl) {
      setNotice('Customer accounts will be available soon. You can keep browsing and use your cart in the meantime.');
      return;
    }
    const form = new FormData(e.currentTarget);
    const { errors, values } = validateAuth(mode, {
      name: form.get('name'), email: form.get('email'), password: form.get('password'),
    });
    const problem = firstAuthError(errors);
    if (problem) {
      setNotice(problem);
      return;
    }
    setBusy(true);
    setNotice('');
    try {
      setSession(isLogin ? await login(values) : await signup(values));
    } catch (err) {
      setNotice(err.message);
    } finally {
      setBusy(false);
    }
  };

  // ----- logged in -----
  if (session) {
    return (
      <>
        <h2 className="auth-title">Hi, {session.customer.name}</h2>
        <p className="auth-notice" role="status">
          You're logged in. Your orders will be linked to your account.
        </p>

        <div className="auth-account-links">
          <Link to="/account" className="btn btn--ghost" onClick={close}>
            My Account
          </Link>
          <Link to="/orders" className="btn btn--ghost" onClick={close}>
            My Orders
          </Link>
        </div>

        <button
          type="button"
          className="btn"
          onClick={() => { logout(); setSession(null); }}
        >
          Log out
        </button>
      </>
    );
  }

  // ----- not logged in -----
  return (
    <>
      <h2 className="auth-title">{isLogin ? 'Welcome back' : 'Create your account'}</h2>
      {pendingAdd && (
        <p className="auth-notice auth-notice--cart" role="status">
          Log in or sign up to add {pendingName ? `“${pendingName}”` : 'this item'} to your cart. We'll add it right after.
        </p>
      )}
      <div className="auth-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={isLogin} onClick={() => { setMode('login'); setNotice(''); setShowPassword(false); }}>Log in</button>
        <button type="button" role="tab" aria-selected={!isLogin} onClick={() => { setMode('signup'); setNotice(''); setShowPassword(false); }}>Sign up</button>
      </div>
      <form className="auth-form" onSubmit={submit} noValidate>
        {!isLogin && (
          <label>Full name<input type="text" name="name" autoComplete="name" required /></label>
        )}
        <label>Email<input type="email" name="email" autoComplete="email" required /></label>
        <label>
          Password
          <div className="password-input-wrap">
            <input 
              type={showPassword ? "text" : "password"} 
              name="password" 
              autoComplete={isLogin ? 'current-password' : 'new-password'} 
              required 
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
        </label>
        {!isLogin && CRM.apiUrl && <p className="auth-notice">Use at least 8 characters, with a letter and a number.</p>}
        <button type="submit" className="btn" disabled={busy}>
          {busy ? 'Please wait…' : isLogin ? 'Log in' : 'Create account'}
        </button>
        {notice && <p className="auth-notice" role="status">{notice}</p>}
      </form>
    </>
  );
}

export default function LoginPanel() {
  const { panel, close } = useUI();
  const isOpen = panel === 'login';
  return (
    <Panel open={isOpen} onClose={close} side="center" label="Log in">
      {isOpen && <LoginForm />}
    </Panel>
  );
}