
import { useState, useEffect } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { useUI } from '../context/UIContext';
import {
  getAddresses,
  createAddress,
  deleteAddress,
  setDefaultAddress,
} from '../services/address';
import { ApiError } from '../services/api';
import { getSession } from '../services/auth';
import { clearSession, subscribeSession } from '../services/session';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import './AddressBook.css';

const emptyForm = {
  name: '',
  phone: '',
  email: '',
  pincode: '',
  addressLine: '',
  city: '',
  state: '',
  isDefault: false,
};

export default function AddressBook() {
  useDocumentTitle('Manage Addresses');

  const { open } = useUI();

  const [addresses, setAddresses] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(getSession);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);

  useEffect(() => subscribeSession(() => setSession(getSession())), []);

  const handleRequestError = (err) => {
    if (err instanceof ApiError && err.status === 401) {
      clearSession();
      setError('Your login has expired. Please log in again to manage addresses.');
      open('login');
      return;
    }

    setError(
      err instanceof Error
        ? err.message
        : 'Something went wrong. Please try again.'
    );
  };

  const refreshAddresses = async () => {
    const data = await getAddresses();
    setAddresses(data);
  };

  useEffect(() => {
    let active = true;

    if (!session) {
      setAddresses([]);
      return () => {
        active = false;
      };
    }

    setError('');

    getAddresses()
      .then((data) => {
        if (active) setAddresses(data);
      })
      .catch((err) => {
        if (!active) return;
        setAddresses([]);
        handleRequestError(err);
      });

    return () => {
      active = false;
    };
  }, [session]);

  const handleEditClick = (addr) => {
    setEditingId(addr.id);

    setForm({
      name: addr.name || '',
      phone: addr.phone || '',
      email: addr.email || '',
      pincode: addr.pincode || '',
      addressLine: addr.addressLine || '',
      city: addr.city || '',
      state: addr.state || '',
      isDefault: Boolean(addr.isDefault),
    });

    document
      .querySelector('.add-address-section')
      ?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setLoading(true);
    setError('');

    try {
      // Existing edit flow: remove the old address, then save the updated one.
      // Preserve its default-address setting.
      if (editingId) {
        await deleteAddress(editingId);
      }

      await createAddress({
        ...form,
        email: form.email.trim().toLowerCase(),
      });

      setForm({ ...emptyForm });
      setEditingId(null);

      await refreshAddresses();
    } catch (err) {
      handleRequestError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this address?')) return;

    try {
      await deleteAddress(id);

      if (editingId === id) {
        handleCancelEdit();
      }

      await refreshAddresses();
    } catch (err) {
      handleRequestError(err);
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await setDefaultAddress(id);
      await refreshAddresses();
    } catch (err) {
      handleRequestError(err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  if (!session) {
    return (
      <div className="container address-book-page">
        <h1 className="section-title mb-4">Manage Addresses</h1>
        <p>Please log in to manage your addresses.</p>

        {error && <p role="alert">{error}</p>}

        <button
          type="button"
          className="btn"
          onClick={() => open('login')}
        >
          Login
        </button>
      </div>
    );
  }

  return (
    <div className="container address-book-page">
      <h1 className="section-title mb-4">Manage Addresses</h1>

      <div className="address-list">
        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}

        {addresses.length === 0 && (
          <p className="text-gray-500">No addresses saved yet.</p>
        )}

        {addresses.map((addr) => (
          <div
            key={addr.id}
            className={`address-card ${addr.isDefault ? 'is-default' : ''}`}
          >
            <div className="address-details">
              <p className="address-name">
                {addr.name}{' '}
                {addr.isDefault && (
                  <span className="default-badge">Default</span>
                )}
              </p>

              <p className="address-text">
                {addr.addressLine}, {addr.city}, {addr.state} - {addr.pincode}
              </p>

              <p className="address-phone">Phone: {addr.phone}</p>
              <p className="address-phone">
                Email: {addr.email || 'Not provided'}
              </p>
            </div>

            <div className="address-actions">
              <div className="icon-buttons">
                <button
                  type="button"
                  onClick={() => handleEditClick(addr)}
                  className="icon-btn btn-edit"
                  title="Edit"
                >
                  <Pencil size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(addr.id)}
                  className="icon-btn btn-delete"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {!addr.isDefault && (
                <button
                  type="button"
                  onClick={() => handleSetDefault(addr.id)}
                  className="btn-text-default"
                >
                  Set as Default
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="add-address-section">
        <h2 className="section-title-sm mb-3">
          {editingId ? 'Edit Address' : 'Add New Address'}
        </h2>

        <form onSubmit={handleSubmit} className="address-form">
          <div className="field-grid">
            <div className="field">
              <label htmlFor="address-name">Full Name</label>
              <input
                id="address-name"
                required
                name="name"
                value={form.name}
                onChange={handleChange}
                className="input"
                placeholder="Enter name"
              />
            </div>

            <div className="field">
              <label htmlFor="address-phone">Phone (10 digits)</label>
              <input
                id="address-phone"
                required
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="input"
                placeholder="Enter phone"
              />
            </div>

            <div className="field">
              <label htmlFor="address-email">Email Address</label>
              <input
                id="address-email"
                required
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="input"
                placeholder="Enter email address"
                autoComplete="email"
              />
            </div>

            <div className="field field--wide">
              <label htmlFor="address-line">Address Line</label>
              <input
                id="address-line"
                required
                name="addressLine"
                value={form.addressLine}
                onChange={handleChange}
                className="input"
                placeholder="House no, Street name"
              />
            </div>

            <div className="field">
              <label htmlFor="address-city">City</label>
              <input
                id="address-city"
                required
                name="city"
                value={form.city}
                onChange={handleChange}
                className="input"
                placeholder="Enter city"
              />
            </div>

            <div className="field">
              <label htmlFor="address-state">State</label>
              <input
                id="address-state"
                required
                name="state"
                value={form.state}
                onChange={handleChange}
                className="input"
                placeholder="Enter state"
              />
            </div>

            <div className="field">
              <label htmlFor="address-pincode">Pincode</label>
              <input
                id="address-pincode"
                required
                inputMode="numeric"
                name="pincode"
                value={form.pincode}
                onChange={handleChange}
                className="input"
                placeholder="6-digit pincode"
                maxLength={6}
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn--primary"
              disabled={loading}
            >
              {loading
                ? 'Saving...'
                : editingId
                  ? 'Update Address'
                  : 'Save Address'}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="btn btn--ghost"
                disabled={loading}
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
