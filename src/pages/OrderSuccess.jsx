import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import SafeImage from '../components/SafeImage';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { imageUrl } from '../services/catalog';
import { getOrder } from '../services/orders';
import { formatIndianMobile } from '../utils/checkout';
import { formatPrice } from '../utils/format';
import NotFound from './NotFound';
import './CartPage.css';
import './OrderSuccess.css';

export default function OrderSuccess() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useDocumentTitle(order ? 'Order placed' : 'Order not found');

  useEffect(() => {
    async function fetchOrder() {
      try {
        const data = await getOrder(id);
        setOrder(data);
      } catch {
        setOrder(null);
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="container">
        <div className="empty"><p>Loading order…</p></div>
      </div>
    );
  }

  if (!order) {
    return <NotFound message="We couldn't find that order." />;
  }

  const { customer } = order;
  const paymentLine = (customer.notes || '').split('\n').find((l) => l.startsWith('Payment:'));

  return (
    <div className="container">
      <section className="section order-done">
        <div className="order-check" aria-hidden="true">✓</div>
        <h1 className="section-title">Order placed</h1>
        <p className="muted">
          Thank you, {customer.name}. Your order number is <strong className="order-id">{order.id}</strong>.
        </p>

        <div className="order-card">
          <ul className="checkout-items">
            {order.items.map((i) => (
              <li key={`${i.productId}::${i.designId || ''}`}>
                <SafeImage src={imageUrl(i.image)} alt="" label={i.name} />
                <span className="checkout-item-name">
                  {i.name}<small> × {i.qty}</small>
                  {i.design && <small className="checkout-item-design">Design: {i.design}</small>}
                </span>
                <span>{formatPrice(i.price * i.qty)}</span>
              </li>
            ))}
          </ul>
          <p className="summary-row summary-total"><span>Total</span><strong>{formatPrice(order.total)}</strong></p>
          <div className="order-ship">
            <h2>Delivering to</h2>
            <p>
              {customer.name}<br />
              {customer.address}<br />
              {customer.city}, {customer.state} {customer.pincode}<br />
              {formatIndianMobile(customer.phone)}
            </p>
          </div>

          {/* 👇 Admin Notes Box */}
          {order.adminNotes && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm font-semibold text-yellow-800">Message from Shop:</p>
              <p className="text-sm text-yellow-700">{order.adminNotes}</p>
            </div>
          )}

          {paymentLine && <p className="muted">{paymentLine.replace(' - verify before dispatch', '')}</p>}
        </div>
        <Link to="/" className="btn">Continue shopping</Link>
      </section>
    </div>
  );
}