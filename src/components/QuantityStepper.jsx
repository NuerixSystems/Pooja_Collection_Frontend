import { MinusIcon, PlusIcon } from './Icons';
import './QuantityStepper.css';

// `max` is a UI guard only (see CART in config); stock is validated when the order is placed.
export default function QuantityStepper({ name, qty, onChange, max }) {
  const atMax = max != null && qty >= max;
  return (
    <div className="qty-wrap">
      <div className="qty">
        <button type="button" aria-label={`Decrease quantity of ${name}`} onClick={() => onChange(qty - 1)}><MinusIcon size={16} /></button>
        <span aria-live="polite">{qty}</span>
        <button type="button" aria-label={`Increase quantity of ${name}`} disabled={atMax} onClick={() => onChange(qty + 1)}><PlusIcon size={16} /></button>
      </div>
      {atMax && <p className="qty-note">Maximum {max} per order</p>}
    </div>
  );
}
