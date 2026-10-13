// Central storefront configuration.
// Admin/catalogue management lives in the existing Nuerix CRM — this app is frontend only.

export const BRAND = {
  name: 'Pooja Collection',
  tagline: ['Style', 'Beauty', 'Elegance'],
  email: 'hello@poojacollection.in',
  currency: 'INR',
  // Contact channels (shown on the Contact page)
  phone: '+91 96108 44743',
  whatsapp: '919610844743', // digits only, with country code (used in wa.me links)
  instagramUrl: 'https://www.instagram.com/collection_2518',
  instagramHandle: '@collection_2518',
  description: 'Elegant jewellery for everyday wear and festive occasions.',
};

// UPI payment shown on the Contact/order page.
// 1) Put your own QR image at frontend/public/upi-qr.png   2) Set your UPI ID below.
export const UPI = {
  id: '9791872933@naviaxis',
  payee: 'Mr VIGNESH V',
  qrImage: '/upi-qr.png',
  utrLength: 12,
};

export const CRM = {
  tenantId: import.meta.env.VITE_TENANT_ID || '8',
  apiUrl: import.meta.env.VITE_CRM_API_URL || '',
  mediaUrl: import.meta.env.VITE_MEDIA_BASE || '',   // ← NEW
  // ... existing fields
};

// Categories that must never appear anywhere in the storefront,
// regardless of what the data source (mock or CRM) returns.
export const EXCLUDED_CATEGORY_SLUGS = ['dresses'];

// Tags that exist in the sheet for internal use and must not show as customer-facing badges.
// Safety net only: the catalogue is already cleaned at import time (scripts/import-catalog.py).
export const HIDDEN_TAGS = ['Meesho'];

// UI-side cart guard. This is a convenience limit, NOT stock validation: the storefront has no
// stock data, and the order service (Nuerix CRM, later phase) must re-check availability, price
// and quantity when an order is placed.
export const CART = { maxQtyPerLine: 10 };

export const NAV_LINKS = [
  { key: 'home', label: 'Home', to: '/' },
  { key: 'shop', label: 'Shop', to: '/shop' },
  { key: 'about', label: 'About Us', to: '/about' },
  { key: 'contact', label: 'Contact Us', to: '/contact' },
];

// Footer "Customer Care" links. Privacy/Terms are draft pages (pages/Legal.jsx): replace their text
// with your own policy before launch.
export const FOOTER_CARE_LINKS = [
  { label: 'Help & Support', to: '/contact' },
  { label: 'Privacy Policy', to: '/privacy' },
  { label: 'Terms & Conditions', to: '/terms' },
  { label: 'Shipping Policy', to: '/shipping-policy' }, // draft page: owner must supply the real policy
  { label: 'Return Policy', to: '/return-policy' }, // draft page: owner must supply the real policy
  // Reuses the existing WhatsApp enquiry form on the Contact page; there is no enquiry backend (see PART2_NOTES.md).
  { label: 'Enquiry List', to: '/contact#enquiry' },
];
