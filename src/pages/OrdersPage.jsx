import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SafeImage from '../components/SafeImage';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { getSession } from '../services/auth';
import { fetchMyOrders } from '../services/orders';
import { formatPrice } from '../utils/format';
import './OrdersPage.css';

const STATUS_LABEL = {
  Pending: 'Awaiting confirmation',
  Placed: 'Placed',
  Confirmed: 'Confirmed',
  Shipped: 'Shipped',
  Delivered: 'Delivered',
  Cancelled: 'Cancelled',
};

const formatDate = (iso) => {
  try {
    return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
};

export default function OrdersPage() {
  useDocumentTitle('My Orders');
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!getSession()) {
      navigate('/');
      return;
    }
    fetchMyOrders()
      .then((data) => setOrders(data))
      .catch((err) => setError(err.message || 'Could not load your orders.'))
      .finally(() => setLoading(false));
  }, [navigate]);

  if (loading) {
    return (
      <div className="container">
        <div className="empty"><p>Loading your orders…</p></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="empty">
          <h1 style={{ fontSize: '1.75rem' }}>Couldn’t load your orders</h1>
          <p>{error}</p>
          <Link to="/shop" className="btn">Back to shop</Link>
        </div>
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="container">
        <div className="empty">
          <h1 style={{ fontSize: '2rem' }}>No orders yet</h1>
          <p>When you place an order it will show up here.</p>
          <Link to="/shop" className="btn">Start shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container orders-page">
      <header className="orders-header">
        <h1 className="account-title">My Orders</h1>
        <p className="muted">{orders.length} order{orders.length === 1 ? '' : 's'}</p>
      </header>

      <ul className="order-list">
        {orders.map((order) => {
          const statusLabel = STATUS_LABEL[order.status] || order.status;
          const statusClass = `order-status order-status--${order.status.toLowerCase()}`;
          return (
            <li key={order.id} className="order-card">
              <div className="order-card-head">
                <div>
                  <Link to={`/order/${order.id}`} className="order-number">{order.id}</Link>
                  <p className="muted order-date">{formatDate(order.createdAt)}</p>
                </div>
                <span className={statusClass}>{statusLabel}</span>
              </div>

              <ul className="order-items">
                {order.items.map((item, idx) => (
                  <li key={`${order.id}-${idx}`}>
                    <SafeImage src={item.image} alt="" label={item.name} className="order-item-thumb" />
                    <div className="order-item-body">
                      <p className="order-item-name">{item.name}</p>
                      {item.design && <small className="muted">Design: {item.design}</small>}
                      <small className="muted">Qty: {item.qty} · {formatPrice(item.price)}</small>
                    </div>
                    <strong>{formatPrice(item.price * item.qty)}</strong>
                  </li>
                ))}
              </ul>

              {/* 👇 Admin Notes Box (User-ku kaattum) */}
              {order.adminNotes && (
                <div className="mx-4 mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm font-semibold text-yellow-800">Message from Shop:</p>
                  <p className="text-sm text-yellow-700">{order.adminNotes}</p>
                </div>
              )}

              <div className="order-card-foot">
                <div className="order-meta">
                  <span className="muted">Payment</span>
                  {order.utrId && <small className="muted">UTR: {order.utrId}</small>}
                </div>
                <div className="order-total">
                  <span className="muted">Total</span>
                  <strong>{formatPrice(order.total)}</strong>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}