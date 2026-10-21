import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BRAND, FOOTER_CARE_LINKS, NAV_LINKS } from '../config';
import { getCategories } from '../services/catalog';
import { ArrowRightIcon, InstagramIcon, PhoneIcon, WhatsAppIcon, YouTubeIcon } from './Icons'; 
import './Footer.css';

export default function Footer() {
  const [showAllCategories, setShowAllCategories] = useState(false);
  
  const categories = getCategories();
  const quickLinks = [...NAV_LINKS.map(({ key, label, to }) => ({ key, label, to })), { key: 'wishlist', label: 'Wishlist', to: '/wishlist' }];

  const HIDDEN_CATEGORY_SLUGS = ['bracelets-and-bangles', 'bridal-traditional', 'mens-collection', 'nose-pins'];
  const HIDDEN_CATEGORY_NAMES = ['Bracelets and Bangles', 'Bridal Traditional', "Men's Collection", 'Nose Pins'];

  const visibleCategories = categories.filter((c) => 
    showAllCategories || 
    (!HIDDEN_CATEGORY_SLUGS.includes(c.slug) && !HIDDEN_CATEGORY_NAMES.includes(c.name))
  );

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
            {visibleCategories.map((c) => (
              <li key={c.slug}>
                <Link to={`/category/${c.slug}`}>{c.name}</Link>
              </li>
            ))}
            
            <li>
              <button 
                type="button" 
                onClick={() => setShowAllCategories(!showAllCategories)} 
                className="footer-all-btn"
              >
                {showAllCategories ? 'Show Less' : 'View All Categories'} <ArrowRightIcon size={16} className={showAllCategories ? 'rotate-icon' : ''} />
              </button>
            </li>
          </ul>
        </nav>

        <nav className="footer-col" aria-labelledby="ft-care">
          <h2 id="ft-care" className="footer-title">Customer Care</h2>
          <ul className="footer-list">
            {FOOTER_CARE_LINKS.filter((l) => l.label !== 'Return Policy' && l.label !== 'Enquiry List').map((l) => (
              <li key={l.to}><Link to={l.to}>{l.label}</Link></li>
            ))}
          </ul>
        </nav>

        <section className="footer-col" aria-labelledby="ft-connect">
          <h2 id="ft-connect" className="footer-title">Connect With Us</h2>
          <div className="footer-social">
            
            {/* Instagram - Custom Inline SVG for Gradient */}
            <a 
              href="https://www.instagram.com/poojascollection.official" 
              target="_blank" 
              rel="noopener noreferrer" 
              aria-label="Pooja Collection on Instagram"
              className="social-insta"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <defs>
                  <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#FEDA75" />
                    <stop offset="25%" stopColor="#FA7E1E" />
                    <stop offset="50%" stopColor="#D62976" />
                    <stop offset="75%" stopColor="#962FBF" />
                    <stop offset="100%" stopColor="#4F5BD5" />
                  </linearGradient>
                </defs>
                <rect x="3" y="3" width="18" height="18" rx="5" stroke="url(#ig-grad)" />
                <circle cx="12" cy="12" r="4" stroke="url(#ig-grad)" />
                <circle cx="17.5" cy="6.5" r="1" fill="url(#ig-grad)" stroke="none" />
              </svg>
            </a>

            {/* YouTube */}
            <a 
              href="https://youtube.com/@poojascollection-p3d" 
              target="_blank" 
              rel="noopener noreferrer" 
              aria-label="Pooja Collection on YouTube"
              className="social-youtube"
            >
              <YouTubeIcon size={20} />
            </a>
            
            {/* WhatsApp */}
            {BRAND.whatsapp && (
              <a 
                href={`https://wa.me/${BRAND.whatsapp}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label="Chat with Pooja Collection on WhatsApp"
                className="social-whatsapp"
              >
                <WhatsAppIcon size={20} />
              </a>
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
        <p>
          © {new Date().getFullYear()} {BRAND.name}. All rights reserved.
          {' · '}
          Powered by{' '}
          <a 
            href="https://nuerixdigital.com/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="footer-powered"
          >
            Nuerix Digital
          </a>
        </p>
      </div>
    </footer>
  );
}