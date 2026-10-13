import { Link } from 'react-router-dom';
import ProductGrid from '../components/ProductGrid';
import { WhatsAppIcon } from '../components/Icons';
import { BRAND } from '../config';
import { useStore } from '../context/StoreContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { formatPrice } from '../utils/format';

// "Ask about these on WhatsApp" only builds a wa.me link from the saved items. Nothing is sent or stored by this site.
const enquiryLink = (items) => {
  const lines = items.map((p) => `- ${p.name} (${formatPrice(p.price)})`);
  const text = `Hi ${BRAND.name}, I'd like to ask about these items:\n${lines.join('\n')}`;
  return `https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(text)}`;
};

export default function Wishlist() {
  const { wishlist } = useStore();
  useDocumentTitle('Wishlist');
  return (
    <div className="container">
      <section className="section">
        <div className="section-head">
          <div>
            <h1 className="section-title">Your wishlist</h1>
            {wishlist.length > 0 && <p className="section-sub">{wishlist.length} saved {wishlist.length === 1 ? 'item' : 'items'}</p>}
          </div>
          {wishlist.length > 0 && (
            <a className="btn btn--ghost wishlist-enquire" href={enquiryLink(wishlist)} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon size={18} /> Ask about these on WhatsApp
            </a>
          )}
        </div>
        <ProductGrid
          products={wishlist}
          empty={<div className="empty"><h2>Nothing saved yet</h2><p>Tap the heart on any product to save it here.</p><Link to="/shop" className="btn">Browse the shop</Link></div>}
        />
      </section>
    </div>
  );
}
