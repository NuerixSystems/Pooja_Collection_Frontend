import { Link } from 'react-router-dom';
import { BRAND, FOOTER_CARE_LINKS, NAV_LINKS } from '../config';
import { getCategories } from '../services/catalog';
import { ArrowRightIcon, InstagramIcon, PhoneIcon, WhatsAppIcon } from './Icons';
import './Footer.css';

export default function Footer() {
  const categories = getCategories();
  const quickLinks = [...NAV_LINKS.map(({ key, label, to }) => ({ key, label, to })), { key: 'wishlist', label: 'Wishlist', to: '/wishlist' }];

  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <section className="footer-col footer-about" aria-label={BRAND.name}>
          <Link to="/" className="footer-logo" aria-label={`${BRAND.name} home`}>
            <img src="/logo.png" alt="" width="44" height="44" />
            <span>{BRAND.name}</span>
          </Link>
          <p className="footer-desc">{BRAND.description}</p>
        </section>

        <nav className="footer-col" aria-labelledby="ft-quick">
          <h2 id="ft-quick" className="footer-title">Quick Links</h2>
          <ul className="footer-list">
            {quickLinks.map((l) => <li key={l.key}><Link to={l.to}>{l.label}</Link></li>)}
          </ul>
        </nav>

        <nav className="footer-col" aria-labelledby="ft-cat">
          <h2 id="ft-cat" className="footer-title">Shop by Category</h2>
          <ul className="footer-list">
            {categories.map((c) => <li key={c.slug}><Link to={`/category/${c.slug}`}>{c.name}</Link></li>)}
            <li><Link to="/#categories" className="footer-all">View All Categories <ArrowRightIcon size={16} /></Link></li>
          </ul>
        </nav>

        <nav className="footer-col" aria-labelledby="ft-care">
          <h2 id="ft-care" className="footer-title">Customer Care</h2>
          <ul className="footer-list">
            {FOOTER_CARE_LINKS.map((l) => <li key={l.to}><Link to={l.to}>{l.label}</Link></li>)}
          </ul>
        </nav>

        <section className="footer-col" aria-labelledby="ft-connect">
          <h2 id="ft-connect" className="footer-title">Connect With Us</h2>
          <div className="footer-social">
            {BRAND.instagramUrl && (
              <a href={BRAND.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Pooja Collection on Instagram"><InstagramIcon size={20} /></a>
            )}
            {BRAND.whatsapp && (
              <a href={`https://wa.me/${BRAND.whatsapp}`} target="_blank" rel="noopener noreferrer" aria-label="Chat with Pooja Collection on WhatsApp"><WhatsAppIcon size={20} /></a>
            )}
          </div>
          {BRAND.phone && (
            <a className="footer-phone" href={`tel:+${BRAND.whatsapp || BRAND.phone.replace(/\D/g, '')}`}>
              <PhoneIcon size={18} /> {BRAND.phone}
            </a>
          )}
        </section>
      </div>
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} {BRAND.name}. All rights reserved.</p>
      </div>
    </footer>
  );
}
