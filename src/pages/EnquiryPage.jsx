import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SafeImage from '../components/SafeImage';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { getSession } from '../services/auth';
import { fetchMyEnquiries } from '../services/enquiries';
import { formatPrice } from '../utils/format';
import './EnquiryPage.css';

const formatDate = (iso) => {
  try {
    return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
};

const STATUS_CLASS = {
  Pending: 'enquiry-status enquiry-status--pending',
  Contacted: 'enquiry-status enquiry-status--contacted',
  Closed: 'enquiry-status enquiry-status--closed',
};

export default function EnquiryPage() {
  useDocumentTitle('Your Enquiry List');
  const navigate = useNavigate();
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!getSession()) {
      navigate('/');
      return;
    }
    fetchMyEnquiries()
      .then((data) => setEnquiries(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message || 'Could not load your enquiries.'))
      .finally(() => setLoading(false));
  }, [navigate]);

  if (loading) {
    return (
      <div className="container">
        <div className="empty"><p>Loading your enquiries…</p></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="empty">
          <h1 style={{ fontSize: '1.75rem' }}>Couldn’t load your enquiries</h1>
          <p>{error}</p>
          <Link to="/shop" className="btn">Back to shop</Link>
        </div>
      </div>
    );
  }

  if (!enquiries.length) {
    return (
      <div className="container">
        <div className="empty">
          <h1 style={{ fontSize: '2rem' }}>No enquiries yet</h1>
          <p>When you send an enquiry it will show up here.</p>
          <Link to="/shop" className="btn">Browse the shop</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container enquiry-page">
      <header className="enquiry-header">
        <h1 className="account-title">Your Enquiry List</h1>
        <p className="muted">{enquiries.length} enquir{enquiries.length === 1 ? 'y' : 'ies'}</p>
      </header>

      <ul className="enquiry-list">
        {enquiries.map((e) => (
          <li key={e.id} className="enquiry-card">
            <div className="enquiry-card-head">
              <div>
                <p className="enquiry-number">Enquiry #{e.id}</p>
                <small className="muted">{formatDate(e.createdAt)}</small>
              </div>
              <span className={STATUS_CLASS[e.status] || 'enquiry-status'}>
                {e.status}
              </span>
            </div>

            {e.items?.length > 0 ? (
              <ul className="enquiry-items">
                {e.items.map((item, idx) => (
                  <li key={`${e.id}-${idx}`}>
                    <SafeImage src={item.image} alt="" label={item.name} className="enquiry-item-thumb" />
                    <div className="enquiry-item-body">
                      <p className="enquiry-item-name">{item.name}</p>
                      {item.design && <small className="muted">Design: {item.design}</small>}
                      <small className="muted">Qty: {item.qty}</small>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">General enquiry</p>
            )}

            {e.customer?.message && (
              <p className="enquiry-message">
                <strong>Your message:</strong> {e.customer.message}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}