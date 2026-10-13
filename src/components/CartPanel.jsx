import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useUI } from '../context/UIContext';
import { formatPrice } from '../utils/format';
import Panel from './Panel';
import SafeImage from './SafeImage';
import { TrashIcon } from './Icons';
import QuantityStepper from './QuantityStepper';
import './CartPanel.css';

export default function CartPanel() {
  const { panel, close } = useUI();
  const { lines, cartTotal, cartCount, maxQty, setQty, removeFromCart } = useStore();

  return (
    <Panel open={panel === 'cart'} onClose={close} side="right" label="Shopping cart">
      <h2 className="cart-title">Your cart{cartCount > 0 && <span> ({cartCount})</span>}</h2>

      {lines.length === 0 ? (
        <div className="empty">
          <h2>Your cart is empty</h2>
          <p>Pick a category and add something you love.</p>
          <Link to="/" className="btn" onClick={close}>Browse categories</Link>
        </div>
      ) : (
        <>
          <ul className="cart-lines">
            {lines.map(({ key, product, design, qty }) => {
              const label = design ? `${product.name} (${design.label})` : product.name;
              return (
                <li key={key} className="cart-line">
                  <SafeImage src={product.image} alt="" label={product.name} className="cart-thumb" />
                  <div className="cart-line-body">
                    <Link to={`/product/${product.slug}`} className="cart-line-name" onClick={close}>{product.name}</Link>
                    {design && <p className="cart-line-design">Design: {design.label}</p>}
                    <p className="cart-line-price">{formatPrice(product.price)}</p>
                    <QuantityStepper name={label} qty={qty} max={maxQty} onChange={(n) => setQty(key, n)} />
                  </div>
                  <button type="button" className="cart-remove" aria-label={`Remove ${label}`} onClick={() => removeFromCart(key)}>
                    <TrashIcon size={20} />
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="cart-footer">
            <p className="cart-total"><span>Subtotal</span><strong>{formatPrice(cartTotal)}</strong></p>
            <Link to="/contact" className="btn" onClick={close}>Checkout</Link>
            <Link to="/cart" className="btn btn--ghost" onClick={close}>View cart</Link>
          </div>
        </>
      )}
    </Panel>
  );
}
