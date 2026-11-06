import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CRM, GOOGLE_CLIENT_ID } from '../config';
import { useUI } from '../context/UIContext';
import { getProductById } from '../services/catalog';
import { getSession, googleLogin, login, logout, signup } from '../services/auth';
import { firstAuthError, validateAuth } from '../utils/authValidation';
import { loadGoogleIdentityServices } from '../services/googleIdentity';
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

function GoogleSignInButton({ onCredential, onError, busy, isLogin }) {
  const buttonRef = useRef(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!GOOGLE_CLIENT_ID) {
      onError('Google sign-in is not configured. Please use email and password.');
      setLoading(false);
      return () => { active = false; };
    }

    setLoading(true);
    loadGoogleIdentityServices()
      .then((google) => {
        if (!active || !buttonRef.current) return;
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: ({ credential }) => {
            if (!active) return;
            if (!credential) {
              onError('Google sign-in did not return a credential. Please try again.');
              return;
            }
            onCredential(credential);
          },
        });
        google.accounts.id.renderButton(buttonRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: isLogin ? 'signin_with' : 'signup_with',
          shape: 'pill',
          logo_alignment: 'left',
          width: Math.max(buttonRef.current.clientWidth, 280),
        });
        setLoading(false);
      })
      .catch(() => {
        if (active) {
          setLoading(false);
          onError('Google sign-in could not be loaded. Please try again.');
        }
      });

    return () => {
      active = false;
      buttonRef.current?.replaceChildren();
    };
  }, [isLogin, onCredential, onError]);

  if (!GOOGLE_CLIENT_ID) {
    return (
      <div className="auth-google-unavailable">
        <button type="button" className="auth-google-fallback" disabled>
          {isLogin ? 'Sign in with Google' : 'Sign up with Google'}
        </button>
        <p>Google sign-in needs VITE_GOOGLE_CLIENT_ID to be configured.</p>
      </div>
    );
  }
  return (
    <div className="auth-google-shell" aria-busy={busy || loading}>
      {loading && <span className="auth-google-loading">Loading Google sign-in…</span>}
      <div ref={buttonRef} className="auth-google" />
    </div>
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

  const handleGoogleCredential = useCallback(async (credential) => {
    if (!CRM.apiUrl) {
      setNotice('Customer accounts will be available soon. You can keep browsing and use your cart in the meantime.');
      return;
    }
    setNotice('');
    setBusy(true);
    try {
      setSession(await googleLogin(credential));
    } catch (err) {
      setNotice(err.message);
    } finally {
      setBusy(false);
    }
  }, []);
  const handleGoogleError = useCallback((message) => setNotice(message), []);

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
      <div className="auth-social">
        <GoogleSignInButton onCredential={handleGoogleCredential} onError={handleGoogleError} busy={busy} isLogin={isLogin} />
        <div className="auth-divider"><span>or continue with email</span></div>
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