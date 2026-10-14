import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SafeImage from '../components/SafeImage';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { BRAND } from '../config';
import { getSession } from '../services/auth';
import { listEnquiries, removeEnquiry, clearEnquiries } from '../services/enquiry';
import { formatPrice } from '../utils/format';
import './EnquiryPage.css';

const formatDate = (iso) => {
  try {
    return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
};

const buildWhatsAppMessage = (e) => {
  const lines = [
    `Hi ${BRAND.name}, following up on my enquiry:`,
    '',
    `${e.productName}${e.designLabel ? ` (${e.designLabel})` : ''} × ${e.qty}${e.price ? ` — ${formatPrice(e.price * e.qty)}` : ''}`,
    '',
    `Name: ${e.customerName}`,
    e.customerPhone && `Mobile: +91 ${e.customerPhone}`,
    e.customerEmail && `Email: ${e.customerEmail}`,
    e.customerAddress && `Address: ${e.customerAddress}`,
    e.message && '',
    e.message,
  ];
  return lines.filter(Boolean).join('\n');
};

export default function EnquiryPage() {
  useDocumentTitle('Your Enquiry List');
  const navigate = useNavigate();
  const [enquiries, setEnquiries] = useState([]);

  useEffect(() => {
    if (!getSession()) {
      navigate('/');
      return;
    }
    setEnquiries(listEnquiries());
  }, [navigate]);

  const resend = (e) => {
    window.open(`https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(buildWhatsAppMessage(e))}`, '_blank', 'noopener');
  };

  const remove = (id) => {
    removeEnquiry(id);
    setEnquiries(listEnquiries());
  };

  const clearAll = () => {
    if (!enquiries.length) return;
    if (window.confirm('Clear all enquiries from this browser?')) {
      clearEnquiries();
      setEnquiries([]);
    }
  };

  if (!enquiries.length) {
    return (
      <div className="container">
        <div className="empty">
          <h1 style={{ fontSize: '2rem' }}>No enquiries yet</h1>
          <p>When you enquire about a product, it will show up here.</p>
          <Link to="/shop" className="btn">Browse the shop</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container enquiry-page">
      <header className="enquiry-header">
        <div>
          <h1 className="account-title">Your Enquiry List</h1>
          <p className="muted">{enquiries.length} enquir{enquiries.length === 1 ? 'y' : 'ies'}</p>
        </div>
        <button type="button" className="link-btn" onClick={clearAll}>Clear all</button>
      </header>

      <ul className="enquiry-list">
        {enquiries.map((e) => (
          <li key={e.id} className="enquiry-card">
            <SafeImage src={e.productImage} alt="" label={e.productName} className="enquiry-thumb" />
            <div className="enquiry-body">
              <Link to={`/product/${e.productSlug}`} className="enquiry-name">{e.productName}</Link>
              {e.designLabel && <small className="muted">Design: {e.designLabel}</small>}
              <small className="muted">Qty: {e.qty} · Saved {formatDate(e.createdAt)}</small>
              <span className="enquiry-status">Pending</span>
            </div>
            <div className="enquiry-actions">
              <button type="button" className="btn" onClick={() => resend(e)}>Resend</button>
              <button type="button" className="link-btn" onClick={() => remove(e.id)}>Remove</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}