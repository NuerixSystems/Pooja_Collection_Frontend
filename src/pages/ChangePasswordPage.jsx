import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { getSession, changePassword } from '../services/auth';
import './AccountPage.css';

export default function ChangePasswordPage() {
  useDocumentTitle('Change Password');
  const navigate = useNavigate();
  const session = getSession();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  if (!session) {
    navigate('/');
    return null;
  }

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');

    if (next.length < 8) return setError('New password must be at least 8 characters.');
    if (!/[A-Za-z]/.test(next) || !/\d/.test(next))
      return setError('New password must include a letter and a number.');
    if (next !== confirm) return setError('New passwords do not match.');

    setBusy(true);
    try {
      await changePassword({ currentPassword: current, newPassword: next });
      setNotice('Password changed.');
      setCurrent(''); setNext(''); setConfirm('');
      setTimeout(() => navigate('/account'), 800);
    } catch (err) {
      setError(err.message || 'Could not change password.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container account-page">
      <h1 className="account-title">Change Password</h1>

      <form className="account-form" onSubmit={submit} noValidate>
        <label>
          Current password
          <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required autoComplete="current-password" />
        </label>

        <label>
          New password
          <input type="password" value={next} onChange={(e) => setNext(e.target.value)} required autoComplete="new-password" />
          <small className="muted">At least 8 characters, with a letter and a number.</small>
        </label>

        <label>
          Confirm new password
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required autoComplete="new-password" />
        </label>

        <div className="account-form-actions">
          <button type="submit" className="btn" disabled={busy}>
            {busy ? 'Saving…' : 'Change password'}
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => navigate('/account')}>
            Cancel
          </button>
        </div>

        {notice && <p className="auth-notice" role="status">{notice}</p>}
        {error && <p className="auth-notice auth-notice--error" role="alert">{error}</p>}
      </form>
    </div>
  );
}