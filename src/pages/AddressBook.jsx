import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAddresses, createAddress, deleteAddress, setDefaultAddress } from '../services/address';
import { getSession } from '../services/auth';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import './AddressBook.css'; // (Illa-na CSS file create panni, namma munnadi kudutha styles ah podunga)

export default function AddressBook() {
  useDocumentTitle('Manage Addresses');
  const [addresses, setAddresses] = useState([]);
  const [form, setForm] = useState({ name: '', phone: '', pincode: '', addressLine: '', city: '', state: '' });
  const [loading, setLoading] = useState(false);
  const session = getSession();

  const loadAddresses = () => {
    if (session) {
      getAddresses()
        .then((data) => setAddresses(data))
        .catch(() => setAddresses([]));
    }
  };

  useEffect(() => {
    loadAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createAddress(form);
      setForm({ name: '', phone: '', pincode: '', addressLine: '', city: '', state: '' });
      loadAddresses();
    } catch (err) {
      alert('Failed to add address');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this address?')) {
      try {
        await deleteAddress(id);
        loadAddresses();
      } catch (err) {
        alert('Failed to delete address');
      }
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await setDefaultAddress(id);
      loadAddresses();
    } catch (err) {
      alert('Failed to set default address');
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
        <Link to="/login" className="btn">Login</Link>
      </div>
    );
  }

  return (
    <div className="container address-book-page">
      <h1 className="section-title mb-4">Manage Addresses</h1>

      {/* Saved Addresses List */}
      <div className="address-list">
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
              {!addr.isDefault && (
                <button onClick={() => handleSetDefault(addr.id)} className="btn btn--ghost btn-sm">
                  Set as Default
                </button>
              )}
              <button onClick={() => handleDelete(addr.id)} className="btn btn--danger btn-sm">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add New Address Form */}
      <div className="add-address-section">
        <h2 className="section-title-sm mb-3">Add New Address</h2>
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
          <button disabled={loading} className="btn btn--primary mt-4">
            {loading ? 'Saving...' : 'Save Address'}
          </button>
        </form>
      </div>
    </div>
  );
}