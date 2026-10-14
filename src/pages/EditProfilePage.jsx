import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { getSession, updateProfile } from '../services/auth';
import { saveSession } from '../services/session';
import './AccountPage.css';

export default function EditProfilePage() {
  useDocumentTitle('Edit Profile');
  const navigate = useNavigate();
  const session = getSession();
  const [name, setName] = useState(session?.customer?.name || '');
  const [phone, setPhone] = useState(session?.customer?.phone || '');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  if (!session) {
    navigate('/');
    return null;
  }

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const updated = await updateProfile({ name, phone });
      saveSession({ ...session, customer: updated });
      setNotice('Profile updated.');
      setTimeout(() => navigate('/account'), 800);
    } catch (err) {
      setError(err.message || 'Could not update profile.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container account-page">
      <h1 className="account-title">Edit Profile</h1>

      <form className="account-form" onSubmit={submit} noValidate>
        <label>
          Full name
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
          />
        </label>

        <label>
          Mobile number
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="98765 43210"
            autoComplete="tel"
          />
          <small className="muted">10-digit Indian mobile number.</small>
        </label>

        <label>
          Email
          <input type="email" value={session.customer.email || ''} disabled />
          <small className="muted">Email cannot be changed.</small>
        </label>

        <div className="account-form-actions">
          <button type="submit" className="btn" disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
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