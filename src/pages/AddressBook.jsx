import { useState, useEffect } from 'react';
import { Pencil, Trash2 } from 'lucide-react'; // 👈 Icons imported
import { useUI } from '../context/UIContext';
import { getAddresses, createAddress, deleteAddress, setDefaultAddress } from '../services/address';
import { ApiError } from '../services/api';
import { getSession } from '../services/auth';
import { clearSession, subscribeSession } from '../services/session';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import './AddressBook.css';

export default function AddressBook() {
  useDocumentTitle('Manage Addresses');
  const { open } = useUI();
  const [addresses, setAddresses] = useState([]);
  
  const emptyForm = { name: '', phone: '', pincode: '', addressLine: '', city: '', state: '' };
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
    setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
  };

  useEffect(() => {
    let active = true;
    if (!session) {
      setAddresses([]);
      return () => { active = false; };
    }

    setError('');
    getAddresses()
      .then((data) => { if (active) setAddresses(data); })
      .catch((err) => {
        if (!active) return;
        setAddresses([]);
        handleRequestError(err);
      });

    return () => { active = false; };
  }, [session]);

  const handleEditClick = (addr) => {
    setEditingId(addr.id);
    setForm({
      name: addr.name,
      phone: addr.phone,
      pincode: addr.pincode,
      addressLine: addr.addressLine,
      city: addr.city,
      state: addr.state
    });
    document.querySelector('.add-address-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (editingId) {
        await deleteAddress(editingId);
      }
      await createAddress(form);
      setForm(emptyForm);
      setEditingId(null);
      setAddresses(await getAddresses());
    } catch (err) {
      handleRequestError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this address?')) {
      try {
        await deleteAddress(id);
        if (editingId === id) handleCancelEdit();
        setAddresses(await getAddresses());
      } catch (err) {
        handleRequestError(err);
      }
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await setDefaultAddress(id);
      setAddresses(await getAddresses());
    } catch (err) {
      handleRequestError(err);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  if (!session) {
    return (
      <div className="container address-book-page">
        <h1 className="section-title mb-4">Manage Addresses</h1>
        <p>Please log in to manage your addresses.</p>
        {error && <p role="alert">{error}</p>}
        <button type="button" className="btn" onClick={() => open('login')}>Login</button>
      </div>
    );
  }

  return (
    <div className="container address-book-page">
      <h1 className="section-title mb-4">Manage Addresses</h1>

      <div className="address-list">
        {error && <p className="field-error" role="alert">{error}</p>}
        {addresses.length === 0 && <p className="text-gray-500">No addresses saved yet.</p>}
        {addresses.map((addr) => (
          <div key={addr.id} className={`address-card ${addr.isDefault ? 'is-default' : ''}`}>
            <div className="address-details">
              <p className="address-name">
                {addr.name} {addr.isDefault && <span className="default-badge">Default</span>}
              </p>
              <p className="address-text">
                {addr.addressLine}, {addr.city}, {addr.state} - {addr.pincode}
              </p>
              <p className="address-phone">Phone: {addr.phone}</p>
            </div>
            
            <div className="address-actions">
              {/* 👇 Icon Buttons (Edit & Delete) */}
              <div className="icon-buttons">
                <button onClick={() => handleEditClick(addr)} className="icon-btn btn-edit" title="Edit">
                  <Pencil size={16} />
                </button>
                <button onClick={() => handleDelete(addr.id)} className="icon-btn btn-delete" title="Delete">
                  <Trash2 size={16} />
                </button>
              </div>
              
              {/* Set Default Button Below */}
              {!addr.isDefault && (
                <button onClick={() => handleSetDefault(addr.id)} className="btn-text-default">
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
              <label>Full Name</label>
              <input required name="name" value={form.name} onChange={handleChange} className="input" placeholder="Enter name" />
            </div>
            <div className="field">
              <label>Phone (10 digits)</label>
              <input required name="phone" value={form.phone} onChange={handleChange} className="input" placeholder="Enter phone" />
            </div>
            <div className="field field--wide">
              <label>Address Line</label>
              <input required name="addressLine" value={form.addressLine} onChange={handleChange} className="input" placeholder="House no, Street name" />
            </div>
            <div className="field">
              <label>City</label>
              <input required name="city" value={form.city} onChange={handleChange} className="input" placeholder="Enter city" />
            </div>
            <div className="field">
              <label>State</label>
              <input required name="state" value={form.state} onChange={handleChange} className="input" placeholder="Enter state" />
            </div>
            <div className="field">
              <label>Pincode</label>
              <input required name="pincode" value={form.pincode} onChange={handleChange} className="input" placeholder="6-digit pincode" />
            </div>
          </div>
          
          <div className="form-actions">
            <button disabled={loading} className="btn btn--primary">
              {loading ? 'Saving...' : editingId ? 'Update Address' : 'Save Address'}
            </button>
            {editingId && (
              <button type="button" onClick={handleCancelEdit} className="btn btn--ghost" disabled={loading}>
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
} 