import { Link } from 'react-router-dom';
import { BRAND } from '../config';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import './Legal.css';

// DRAFT pages so the footer links work. They only describe what the storefront visibly does.
// Replace the text with your own reviewed policy before launch.
function DraftNotice({ children }) {
  return (
    <p className="draft-notice" role="note">
      <strong>Draft page.</strong> {children}
    </p>
  );
}

function LegalPage({ title, children }) {
  useDocumentTitle(title);
  return (
    <div className="container">
      <section className="section legal-page">
        <h1 className="section-title">{title}</h1>
        {children}
        <p><Link to="/contact" className="btn">Contact us</Link></p>
      </section>
    </div>
  );
}

export function Privacy() {
  return (
    <LegalPage title="Privacy Policy">
      <DraftNotice>This text is a placeholder and has not been reviewed. It will be replaced by the shop’s own policy.</DraftNotice>
      <p className="legal-text">
        {BRAND.name} uses the details you provide, such as your name, contact details and delivery address, only to
        handle your enquiries and orders. For questions about your information, contact us at {BRAND.email}.
      </p>
    </LegalPage>
  );
}

export function Terms() {
  return (
    <LegalPage title="Terms & Conditions">
      <DraftNotice>This text is a placeholder and has not been reviewed. It will be replaced by the shop’s own terms.</DraftNotice>
      <p className="legal-text">
        Product details and prices are shown on each product page. Orders are confirmed through the contact and payment
        steps on this site. For anything not covered here, please contact us before ordering.
      </p>
    </LegalPage>
  );
}

// The shop has not supplied delivery times, charges, areas or courier details, so none are stated here.
export function ShippingPolicy() {
  return (
    <LegalPage title="Shipping Policy">
      <DraftNotice>The shop’s shipping policy has not been published yet. Delivery times, charges and areas will be added here.</DraftNotice>
      <p className="legal-text">
        Until then, please ask about delivery for your address before you order. You can reach us on WhatsApp at {BRAND.phone}.
      </p>
    </LegalPage>
  );
}

// The shop has not supplied a return period, conditions or refund terms, so none are stated here.
export function ReturnPolicy() {
  return (
    <LegalPage title="Return Policy">
      <DraftNotice>The shop’s return and refund policy has not been published yet. It will be added here once confirmed.</DraftNotice>
      <p className="legal-text">
        Until then, please contact us before ordering if you have questions about returns or exchanges. You can reach us on WhatsApp at {BRAND.phone}.
      </p>
    </LegalPage>
  );
}
