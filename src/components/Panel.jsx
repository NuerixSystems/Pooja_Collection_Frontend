import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CloseIcon } from './Icons';
import './Panel.css';

// Reusable overlay: side = 'left' | 'right' | 'top' | 'center'.
export default function Panel({ open, onClose, side = 'right', label, children }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    ref.current?.querySelector('input, button, a')?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      previous?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="panel-root">
      <div className="panel-backdrop" onClick={onClose} />
      <div ref={ref} className={`panel panel--${side}`} role="dialog" aria-modal="true" aria-label={label}>
        <button type="button" className="panel-close" onClick={onClose} aria-label="Close">
          <CloseIcon />
        </button>
        {children}
      </div>
    </div>,
    document.body,
  );
}
