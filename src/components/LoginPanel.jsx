import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CRM } from '../config';
import { useUI } from '../context/UIContext';
import { getProductById } from '../services/catalog';
import { getSession, login, logout, signup } from '../services/auth';
import { firstAuthError, validateAuth } from '../utils/authValidation';
import Panel from './Panel';
import './LoginPanel.css';

// With a backend configured (VITE_CRM_API_URL) this signs customers up / in against /api/auth/*.
// Without one it stays the "coming soon" placeholder, so the storefront still works standalone.
function LoginForm() {
  const { pendingAdd, close } = useUI();
  const [mode, setMode] = useState('login');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [session, setSession] = useState(getSession);
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
        <button type="button" role="tab" aria-selected={isLogin} onClick={() => { setMode('login'); setNotice(''); }}>Log in</button>
        <button type="button" role="tab" aria-selected={!isLogin} onClick={() => { setMode('signup'); setNotice(''); }}>Sign up</button>
      </div>
      <form className="auth-form" onSubmit={submit} noValidate>
        {!isLogin && (
          <label>Full name<input type="text" name="name" autoComplete="name" required /></label>
        )}
        <label>Email<input type="email" name="email" autoComplete="email" required /></label>
        <label>Password<input type="password" name="password" autoComplete={isLogin ? 'current-password' : 'new-password'} required /></label>
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