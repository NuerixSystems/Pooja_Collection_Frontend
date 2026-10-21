import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BRAND } from '../config';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { getCategories, getProducts } from '../services/catalog';
import {
  ArrowRightIcon, AwardIcon, BagIcon, CheckCircleIcon, GemIcon, GiftIcon,
  HeartIcon, PhoneIcon, UserIcon, WhatsAppIcon,
} from '../components/Icons';
import './About.css';

const STORY_POINTS = [
  'Fair, transparent prices with honest advice',
  'Designs picked from trusted makers',
  'Friendly help choosing the right piece for your style',
  'Careful packing so everything reaches you in perfect shape',
];

const WHY_US = [
  { Icon: AwardIcon, title: 'Quality Products', text: 'Every piece is checked for finish and shine before it reaches you.' },
  { Icon: GemIcon, title: 'Elegant Designs', text: 'Stylish jewellery for everyday wear, weddings and festive occasions.' },
  { Icon: HeartIcon, title: 'Customer First', text: 'Friendly help on WhatsApp and phone, before and after your order.' },
  { Icon: GiftIcon, title: 'Perfect for Gifting', text: 'Beautiful pieces that make birthdays and celebrations extra special.' },
];

const JOURNEY = [
  { tag: 'The idea', title: 'A simple vision', text: `${BRAND.name} began with one goal: make every day and every festival shine with jewellery women love.` },
  { tag: 'Sourcing', title: 'Handpicked designs', text: 'We choose trending and timeless designs from reliable makers so quality is never a question.' },
  { tag: 'Growing', title: 'A range for everyone', text: 'From delicate earrings to statement sets, we grew a catalogue with something for every style and budget.' },
  { tag: 'Today', title: 'Easy online ordering', text: 'Browse, add to cart and place your order — we confirm the details personally with you.' },
];

const STEPS = [
  { title: 'Browse & Add', text: 'Pick your favourite jewellery and add it to your cart.' },
  { title: 'Place Order', text: 'Share your delivery details and choose how you want to pay.' },
  { title: 'We Confirm', text: 'Our team reaches out to confirm your order and delivery.' },
  { title: 'Shine', text: 'Unbox your new favourites and wear them with pride.' },
];

const CARE_TIPS = [
  { q: 'Keep jewellery away from water and perfume', a: 'Put your jewellery on last and take it off before bathing, swimming or exercising so the finish stays bright.' },
  { q: 'Store each piece separately', a: 'Keep pieces in a dry pouch or box so they do not scratch or tangle against each other.' },
  { q: 'Wipe gently after every wear', a: 'Use a soft, dry cloth to remove sweat and oils before you put your jewellery away.' },
  { q: 'Avoid harsh chemicals', a: 'Skip sprays, lotions and cleaners on your jewellery — a gentle wipe is all it needs.' },
];

export default function About() {
  useDocumentTitle('About Us');
  const [openTip, setOpenTip] = useState(0);

  const productCount = getProducts().length;
  const categoryCount = getCategories().length;
  const stats = [
    { value: productCount ? `${productCount}+` : '100+', label: 'Products' },
    { value: String(categoryCount || 7), label: 'Categories' },
    { value: 'COD & UPI', label: 'Payment options' },
    { value: 'WhatsApp', label: 'Quick support' },
  ];

  return (
    <div className="about-v2">
      {/* Hero */}
      <header className="about-hero">
        <h1>About Us</h1>
        <p>{BRAND.name} — {BRAND.tagline.join(' · ')}</p>
      </header>

      {/* Our story */}
      <section className="about-story container">
        <div className="about-story-text">
          <p className="about-eyebrow">Our story</p>
          <h2>Adding sparkle to every occasion, one piece at a time</h2>
          <p>
            {BRAND.name} was founded with a simple vision — to bring style, beauty and elegance to
            every celebration. We offer elegant jewellery that people love for everyday wear,
            weddings and every moment worth remembering.
          </p>
          <p>
            From delicate everyday pieces to statement sets for the big occasion, our range is built
            so everyone finds something they love — at fair prices, with honest advice.
          </p>
          <ul className="about-checks">
            {STORY_POINTS.map((p) => (
              <li key={p}><CheckCircleIcon size={20} /> <span>{p}</span></li>
            ))}
          </ul>
          <div className="about-actions">
            <Link to="/shop" className="btn about-btn">Shop the collection</Link>
            <Link to="/contact" className="btn btn--ghost">Contact us</Link>
          </div>
        </div>

        <div className="about-story-visual">
          <div className="about-logo-card">
            <img src="/logo.png" alt={`${BRAND.name} logo`} width="480" height="480" />
          </div>
          <div className="about-float-badge">
            <span className="about-float-icon"><AwardIcon size={22} /></span>
            <span>
              <strong>Handpicked Designs</strong>
              <small>Style you will love</small>
            </span>
          </div>
        </div>
      </section>

      {/* Stats band */}
      <section className="about-stats" aria-label="Pooja Collection at a glance">
        <div className="container about-stats-grid">
          {stats.map((s) => (
            <div key={s.label} className="about-stat">
              <strong>{s.value}</strong>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Google Business Section */}
      <section className="about-block container">
        <div className="about-head">
          <p className="about-eyebrow">Find us online</p>
          <h2>Google Business</h2>
          <span className="about-rule" />
        </div>
        <div className="about-two">
          
          {/* Left Side: Informational (Not clickable) */}
          <article className="about-card about-card--plain">
            <h3>Read our Google Reviews</h3>
            <p>See what our happy customers are saying about us on Google. We take pride in delivering quality and joy to every customer.</p>
          </article>

          {/* Right Side: Clickable Profile Card */}
          <a 
            href="https://share.google/8ayLfG7zRCoufnejc" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="about-card about-card--google"
          >
            <h3>Visit our Profile</h3>
            <p>Check out our full business profile, opening hours, and location details on Google Maps.</p>
            <span className="about-google-link">
              View on Google <ArrowRightIcon size={16} />
            </span>
          </a>

        </div>
      </section>

      {/* Why choose us */}
      <section className="about-block container">
        <div className="about-head">
          <p className="about-eyebrow">What we stand for</p>
          <h2>Why customers choose us</h2>
          <span className="about-rule" />
        </div>
        <div className="about-four">
          {WHY_US.map(({ Icon, title, text }) => (
            <article key={title} className="about-card about-card--center">
              <span className="about-icon-circle"><Icon size={24} /></span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Journey */}
      <section className="about-block container">
        <div className="about-head">
          <p className="about-eyebrow">Our journey</p>
          <h2>From a simple idea to your jewellery box</h2>
          <span className="about-rule" />
        </div>
        <ol className="about-timeline">
          {JOURNEY.map((j) => (
            <li key={j.tag}>
              <span className="about-dot" aria-hidden="true" />
              <p className="about-eyebrow">{j.tag}</p>
              <h3>{j.title}</h3>
              <p>{j.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* More than just jewellery banner */}
      <section className="container about-banner-wrap">
        <div className="about-banner">
          <h2>More Than Just Jewellery</h2>
          <p>We bring style, beauty and elegance to your celebrations — because the best moments are the ones we share.</p>
        </div>
      </section>

      {/* How ordering works */}
      <section className="about-block container">
        <div className="about-head">
          <p className="about-eyebrow">Simple &amp; easy</p>
          <h2>How ordering works</h2>
          <span className="about-rule" />
        </div>
        <div className="about-four">
          {STEPS.map((s, i) => (
            <article key={s.title} className="about-card about-card--step">
              <span className="about-step-no">{i + 1}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </article>
          ))}
        </div>
        <div className="about-pills">
          <span><BagIcon size={20} /> Wide variety for every budget</span>
          <span><GiftIcon size={20} /> Careful packing &amp; delivery support</span>
          <span><UserIcon size={20} /> Trusted by happy customers</span>
        </div>
      </section>

      {/* CTA */}
      <section className="container about-banner-wrap">
        <div className="about-cta">
          <h2>Make Your Moments Extra Special</h2>
          <p>Have a question or a bulk order in mind? Talk to us anytime.</p>
          <div className="about-cta-actions">
            <Link to="/shop" className="about-cta-btn about-cta-btn--shop">Shop Now <ArrowRightIcon size={18} /></Link>
            {BRAND.whatsapp && (
              <a className="about-cta-btn about-cta-btn--wa" href={`https://wa.me/${BRAND.whatsapp}`} target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon size={18} /> WhatsApp Us
              </a>
            )}
            {BRAND.phone && (
              <a className="about-cta-btn about-cta-btn--phone" href={`tel:+${BRAND.whatsapp || BRAND.phone.replace(/\D/g, '')}`}>
                <PhoneIcon size={18} /> {BRAND.phone}
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Care tips (accordion) */}
      <section className="about-care">
        <div className="container about-care-inner">
          <div className="about-head about-head--light">
            <p className="about-eyebrow">Care for your jewellery</p>
            <h2>Care tips to keep it shining</h2>
          </div>
          <div className="about-acc">
            {CARE_TIPS.map((t, i) => {
              const open = openTip === i;
              return (
                <div key={t.q} className={`about-acc-item${open ? ' is-open' : ''}`}>
                  <h3>
                    <button
                      type="button"
                      className="about-acc-btn"
                      aria-expanded={open}
                      aria-controls={`care-tip-${i}`}
                      onClick={() => setOpenTip(open ? -1 : i)}
                    >
                      <CheckCircleIcon size={20} />
                      <span>{t.q}</span>
                      <b aria-hidden="true">{open ? '−' : '+'}</b>
                    </button>
                  </h3>
                  {open && <p id={`care-tip-${i}`} className="about-acc-panel">{t.a}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}