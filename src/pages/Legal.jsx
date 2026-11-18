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

function LegalPage({ title, children, className = '', showContactLink = true }) {
  useDocumentTitle(title);
  return (
    <div className="container">
      <section className={`section legal-page ${className}`.trim()}>
        <h1 className="section-title">{title}</h1>
        {children}
        {showContactLink && <p><Link to="/contact" className="btn">Contact us</Link></p>}
      </section>
    </div>
  );
}

export function Privacy() {
  useDocumentTitle('Privacy Policy');

  return (
    <div className="privacy-policy-page">
      <section className="privacy-hero">
        <div className="container">
          <div className="privacy-hero-content">
            <span className="privacy-eyebrow">Legal</span>
            <h1 className="privacy-hero-title">Privacy Policy</h1>
            <p className="privacy-updated">Effective date: November 6, 2026</p>
          </div>
        </div>
      </section>
      <section className="privacy-content-section">
        <div className="container">
          <article className="privacy-content">
            <div className="privacy-policy">
        <p className="privacy-policy__intro">
          Pooja Collections ("we", "us" or "our") respects your privacy. This policy explains what personal
          information we collect through <a href="https://poojascollection.com/">poojascollection.com</a>, how
          we use it, and the choices available to you when you browse, place an order or contact us.
        </p>

        <div className="privacy-policy__sections">
          <section className="privacy-policy__section">
            <h2>Introduction</h2>
            <p>
              This policy applies to information collected through our website and in connection with orders and
              enquiries. We handle information for the purposes described below and aim to do so in accordance
              with applicable Indian privacy and e-commerce laws. This policy is general information and is not
              a guarantee of legal compliance.
            </p>
          </section>

          <section className="privacy-policy__section">
            <h2>Information We Collect</h2>
            <p>Depending on how you use the website, information you provide may include:</p>
            <ul>
              <li>For orders: your full name, mobile number, email address, delivery address, city, state, PIN code and order details.</li>
              <li>
                For contact or enquiry forms: your name and mobile number, and any optional WhatsApp number,
                email address or delivery address you choose to provide, together with your message.
              </li>
              <li>
                Information needed to manage your account or order, including relevant order and payment
                confirmation details that you provide.
              </li>
            </ul>
            <p>Please provide only information that is accurate and necessary for your request or order.</p>
          </section>

          <section className="privacy-policy__section">
            <h2>How We Use Your Information</h2>
            <p>We use the information above to:</p>
            <ul>
              <li>process and manage orders, arrange delivery and provide customer support;</li>
              <li>respond to questions and enquiries you send us;</li>
              <li>send order confirmations, delivery updates and other order-related notifications; and</li>
              <li>operate and maintain essential website and account functionality.</li>
            </ul>
            <p>
              We do not currently send promotional messages. If this changes, we will handle any required
              consent and communication preferences in accordance with applicable law.
            </p>
          </section>

          <section className="privacy-policy__section">
            <h2>Payment Information</h2>
            <p>
              We accept UPI and direct bank transfer. Payment is made through your bank or UPI application.
              We may receive information needed to identify or confirm a payment in connection with your order.
              We do not ask you to disclose your UPI PIN, ATM PIN, banking password or one-time password to us.
              Never share these credentials with Pooja Collections or anyone claiming to represent us.
            </p>
          </section>

          <section className="privacy-policy__section">
            <h2>Shipping and Delivery Information</h2>
            <p>
              To fulfil an order, we may share the recipient's name, phone number, delivery address and
              relevant order details with Speed Parcel, our third-party courier partner. This sharing is
              limited to what is reasonably needed to arrange and complete delivery and provide delivery
              updates. Estimated delivery is 2–5 business days; actual timing may vary.
            </p>
          </section>

          <section className="privacy-policy__section">
            <h2>Cookies and Local Storage</h2>
            <p>
              Our website may store shopping cart, wishlist, login session and other essential website
              functionality information in your browser's local storage. Local storage is separate from
              browser cookies; we do not describe local storage as cookies. You can clear browser storage
              through your browser settings, but doing so may remove saved cart or wishlist information or
              sign you out.
            </p>
          </section>

          <section className="privacy-policy__section">
            <h2>Third-Party Services</h2>
            <p>
              We use Nuerix CRM for backend and order management, Speed Parcel for delivery, and WhatsApp
              to communicate with customers who choose to contact us there. Information may be shared with
              these providers when needed for their respective services. Their handling of information is
              also subject to their own terms and privacy practices. Please review those practices when using
              their services.
            </p>
          </section>

          <section className="privacy-policy__section">
            <h2>Data Security</h2>
            <p>
              We take reasonable steps intended to protect personal information against unauthorized access,
              loss, misuse or alteration. No website or method of electronic storage or transmission can be
              guaranteed to be completely secure. Please contact us promptly if you have a concern about
              information you shared with us.
            </p>
          </section>

          <section className="privacy-policy__section">
            <h2>Data Retention</h2>
            <p>
              We retain personal information for as long as reasonably necessary for the purposes described
              in this policy, including managing orders and enquiries, resolving issues, and meeting
              applicable legal or record-keeping requirements. Retention may vary depending on the type of
              information and the circumstances. Information that is no longer needed will be handled or
              deleted as appropriate, subject to applicable requirements.
            </p>
          </section>

          <section className="privacy-policy__section">
            <h2>Your Privacy Rights</h2>
            <p>
              Subject to applicable law, you may contact us to request access to or correction of personal
              information you have provided, request deletion where we are permitted to do so, or withdraw
              consent where processing is based on your consent. We may need to retain some information to
              complete an order or meet legal obligations. We may also ask for reasonable information to
              verify your request. To exercise a right or raise a privacy concern, use the contact details
              below.
            </p>
          </section>

          <section className="privacy-policy__section">
            <h2>Children's Privacy</h2>
            <p>
              Our website is not intended to invite children to submit personal information. If you are a
              parent or lawful guardian and believe a child has provided personal information to us, please
              contact us so we can review the request and take appropriate steps, subject to applicable law.
            </p>
          </section>

          <section className="privacy-policy__section">
            <h2>External Website Links</h2>
            <p>
              Our website or communications may link to third-party websites or services. We do not control
              their content or privacy practices. Review the privacy information provided by those third
              parties before sharing information with them.
            </p>
          </section>

          <section className="privacy-policy__section">
            <h2>Changes to This Privacy Policy</h2>
            <p>
              We may update this policy when our practices or applicable requirements change. The latest
              version will be posted on this page with its effective date. Please review this page
              periodically.
            </p>
          </section>

          <section className="privacy-policy__section privacy-policy__contact">
            <h2>Contact Information</h2>
            <p>For privacy-related questions or requests, please contact us:</p>
            <address className="privacy-contact-details">
              <div className="privacy-contact-card">
                <span className="privacy-contact-card__label">Company Name</span>
                <span className="privacy-contact-card__value">Pooja Collections</span>
              </div>
              <div className="privacy-contact-card">
                <span className="privacy-contact-card__label">Email</span>
                <a className="privacy-contact-card__value" href="mailto:Poojascollection31@gmail.com">
                  Poojascollection31@gmail.com
                </a>
              </div>
              <div className="privacy-contact-card">
                <span className="privacy-contact-card__label">Phone</span>
                <a className="privacy-contact-card__value" href="tel:+919610844743">
                  +91 96108 44743
                </a>
              </div>
            </address>
            <p className="privacy-contact-address">
              <strong>Business Address:</strong> Sri Ramachandra Bus Stop, near 66 Mount Poonamallee Road,
              Thelliaragaram, Tamil Nadu – 600116, India.
            </p>
          </section>
        </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}

export function Terms() {
  useDocumentTitle('Terms & Conditions');

  return (
    <div className="privacy-policy-page terms-page">
      <section className="privacy-hero">
        <div className="container">
          <div className="privacy-hero-content">
            <span className="privacy-eyebrow">Legal</span>
            <h1 className="privacy-hero-title">Terms &amp; Conditions</h1>
            <p className="privacy-updated">Last Updated: November 6, 2026</p>
          </div>
        </div>
      </section>
      <section className="privacy-content-section">
        <div className="container">
          <article className="privacy-content">
            <div className="privacy-policy">
              <p className="privacy-policy__intro">
                Welcome to Pooja Collections. These Terms &amp; Conditions govern your access to and use of our
                website, <a href="https://poojascollection.com/">https://poojascollection.com/</a>, and the
                purchase of products through our website. By accessing our website or placing an order, you
                agree to these Terms &amp; Conditions. Please read them carefully before using our services.
              </p>

              <div className="privacy-policy__sections">
                <section className="privacy-policy__section">
                  <h2>1. General Terms</h2>
                  <ul>
                    <li>Pooja Collections operates this website to showcase and sell products to customers.</li>
                    <li>By using this website, you agree to follow these Terms &amp; Conditions.</li>
                    <li>We reserve the right to update or modify these terms whenever necessary.</li>
                    <li>Continued use of the website after changes are published means you acknowledge the updated terms.</li>
                  </ul>
                </section>

                <section className="privacy-policy__section">
                  <h2>2. Products and Pricing</h2>
                  <ul>
                    <li>We make every reasonable effort to display accurate product descriptions, images, and prices.</li>
                    <li>Actual product colours and appearance may vary slightly depending on lighting, photography, and screen settings.</li>
                    <li>All prices are displayed in Indian Rupees (INR), unless otherwise stated.</li>
                    <li>Product prices may change without prior notice.</li>
                    <li>Product availability depends on stock.</li>
                    <li>If a product becomes unavailable after an order is placed, we will contact the customer to discuss the available options.</li>
                  </ul>
                </section>

                <section className="privacy-policy__section">
                  <h2>3. Orders and Payments</h2>
                  <ul>
                    <li>Customers can select products and add them to their shopping cart.</li>
                    <li>Customers can proceed to checkout and review their delivery details.</li>
                    <li>Saved customer contact and delivery information may be automatically filled in during checkout.</li>
                    <li>Customers must complete payment by scanning the UPI QR code displayed on the checkout page.</li>
                    <li>After making payment, customers must enter the correct UTR (Unique Transaction Reference) number and click the Place Order button.</li>
                    <li>Once submitted, the order will be recorded as Pending Verification.</li>
                    <li>Our admin team will manually verify the payment using the submitted UTR number.</li>
                    <li>An order will be confirmed only after successful payment verification.</li>
                    <li>If payment fails or cannot be verified, the order will remain in Pending Verification status until reviewed by our admin team.</li>
                    <li>Customers can check their order status through their website account.</li>
                  </ul>
                </section>

                <section className="privacy-policy__section">
                  <h2>4. Order Processing</h2>
                  <ul>
                    <li>Orders will be processed after successful payment verification.</li>
                    <li>Once payment is verified, the order status will be updated by our admin team.</li>
                    <li>Confirmed orders will generally be prepared for dispatch within 1 business day.</li>
                    <li>Processing times may vary in exceptional circumstances.</li>
                  </ul>
                </section>

                <section className="privacy-policy__section">
                  <h2>5. Shipping and Delivery</h2>
                  <ul>
                    <li>Orders are delivered through courier services and third-party delivery partners.</li>
                    <li>Our current courier partner is Speed Parcel.</li>
                    <li>Shipping charges are calculated based on the customer's delivery location and the total weight of the ordered products.</li>
                    <li>Applicable shipping charges will be displayed during checkout before the customer places the order.</li>
                    <li>Orders are generally delivered within 2–5 business days after dispatch.</li>
                    <li>Delivery timelines may vary depending on the customer's location, courier availability, weather conditions, and other unforeseen circumstances.</li>
                    <li>Customers can check their order status and available shipping updates through their website account.</li>
                    <li>Customers are responsible for providing accurate delivery addresses, mobile numbers, and other required information.</li>
                  </ul>
                </section>

                <section className="privacy-policy__section">
                  <h2>6. Order Cancellation</h2>
                  <ul>
                    <li>Customers may request cancellation immediately after placing an order.</li>
                    <li>Cancellation requests must be submitted as soon as possible.</li>
                    <li>Once an order has been processed or dispatched, cancellation may not be accepted.</li>
                    <li>Customers should contact Pooja Collections directly for cancellation requests.</li>
                    <li>Any eligible refund following an approved cancellation will be handled through the applicable payment and refund process.</li>
                  </ul>
                </section>

                <section className="privacy-policy__section">
                  <h2>7. Returns and Replacements</h2>
                  <ul>
                    <li>Returns or refunds will not be accepted simply because a customer changes their mind or dislikes a product after receiving it.</li>
                    <li>If a customer receives a damaged or incorrect product, they must contact Pooja Collections within 24 hours of delivery.</li>
                    <li>Customers must provide clear photographs or videos showing the damaged or incorrect product.</li>
                    <li>Our team will review the complaint and verify the provided evidence.</li>
                    <li>After successful verification, an appropriate replacement or refund will be arranged.</li>
                    <li>Products must be retained until the complaint is reviewed.</li>
                    <li>This policy does not limit any rights or remedies available to customers under applicable consumer protection laws.</li>
                  </ul>
                </section>

                <section className="privacy-policy__section">
                  <h2>8. Refund Policy</h2>
                  <ul>
                    <li>Refunds for change of mind or personal preference are not provided.</li>
                    <li>Refunds may be considered for verified damaged or incorrect product deliveries.</li>
                    <li>Approved refunds will be processed through an appropriate payment method.</li>
                    <li>The time taken for the refund to appear in the customer's account may depend on the payment provider or bank.</li>
                    <li>Customers will be informed about the refund status where applicable.</li>
                    <li>Any refund required under applicable law will be handled in accordance with the law.</li>
                  </ul>
                </section>

                <section className="privacy-policy__section">
                  <h2>9. Customer Responsibilities</h2>
                  <p>Customers agree to:</p>
                  <ul>
                    <li>Provide accurate and complete personal and delivery information.</li>
                    <li>Enter the correct UTR number after completing payment.</li>
                    <li>Ensure that payment details are submitted correctly.</li>
                    <li>Use the website only for lawful purposes.</li>
                    <li>Avoid fraudulent orders, false payment claims, or misuse of website services.</li>
                    <li>Contact our team promptly if they identify an issue with their order.</li>
                  </ul>
                </section>

                <section className="privacy-policy__section">
                  <h2>10. Order Tracking and Status Updates</h2>
                  <ul>
                    <li>Customers can log in to their website account to view their order information.</li>
                    <li>Order statuses may include Pending Verification, Confirmed, Processing, Shipped, and Delivered, depending on the order stage.</li>
                    <li>Payment verification and order status updates are handled by our admin team.</li>
                    <li>Customers can use the website to stay informed about their order progress.</li>
                  </ul>
                </section>

                <section className="privacy-policy__section">
                  <h2>11. Website Usage and Intellectual Property</h2>
                  <ul>
                    <li>All website content, including product photographs, descriptions, graphics, logos, and branding, belongs to Pooja Collections or its respective content owners, unless otherwise stated.</li>
                    <li>Website content may not be copied, reproduced, distributed, or used commercially without prior permission.</li>
                    <li>Customers must not misuse the website or attempt to interfere with its normal operation.</li>
                  </ul>
                </section>

                <section className="privacy-policy__section">
                  <h2>12. Third-Party Services</h2>
                  <ul>
                    <li>We may use third-party services for payment processing, courier delivery, and other website operations.</li>
                    <li>Such services may operate under their own terms, conditions, and privacy policies.</li>
                    <li>Pooja Collections is not responsible for independent service disruptions caused by third-party providers, subject to applicable laws.</li>
                  </ul>
                </section>

                <section className="privacy-policy__section">
                  <h2>13. Limitation of Responsibility</h2>
                  <p>
                    Pooja Collections will make reasonable efforts to ensure accurate product information,
                    reliable order processing, and timely delivery. However, delivery delays or service
                    interruptions may occur due to circumstances beyond our reasonable control, including
                    courier disruptions, transportation issues, natural events, or technical problems.
                  </p>
                  <p>Nothing in these terms excludes or limits any liability that cannot legally be excluded under applicable law.</p>
                </section>

                <section className="privacy-policy__section">
                  <h2>14. Privacy and Personal Information</h2>
                  <ul>
                    <li>Customer information collected through the website will be handled in accordance with our <Link to="/privacy">Privacy Policy</Link>.</li>
                    <li>We collect information required to process orders, arrange deliveries, verify payments, and provide order-related updates.</li>
                    <li>Customers are encouraged to read our Privacy Policy to understand how their personal information is collected and used.</li>
                  </ul>
                </section>

                <section className="privacy-policy__section">
                  <h2>15. Changes to Terms &amp; Conditions</h2>
                  <p>
                    Pooja Collections reserves the right to update, modify, or revise these Terms &amp; Conditions
                    whenever necessary. Updated terms will be published on this website along with the revised
                    date. Customers are encouraged to review this page periodically.
                  </p>
                </section>

                <section className="privacy-policy__section">
                  <h2>16. Governing Law</h2>
                  <p>
                    These Terms &amp; Conditions shall be governed by the applicable laws of India, including
                    relevant consumer protection and e-commerce laws. Any disputes will be handled by the
                    appropriate legal authorities in accordance with applicable law.
                  </p>
                </section>

                <section className="privacy-policy__section privacy-policy__contact">
                  <h2>17. Contact Us</h2>
                  <p>
                    If you have any questions, concerns, cancellation requests, or complaints regarding these
                    Terms &amp; Conditions or your orders, please contact us:
                  </p>
                  <address className="privacy-contact-details">
                    <div className="privacy-contact-card">
                      <span className="privacy-contact-card__label">Business Name</span>
                      <span className="privacy-contact-card__value">Pooja Collections</span>
                    </div>
                    <div className="privacy-contact-card">
                      <span className="privacy-contact-card__label">Website</span>
                      <a className="privacy-contact-card__value" href="https://poojascollection.com/">
                        poojascollection.com
                      </a>
                    </div>
                    <div className="privacy-contact-card">
                      <span className="privacy-contact-card__label">Email</span>
                      <a className="privacy-contact-card__value" href="mailto:Poojascollection31@gmail.com">
                        Poojascollection31@gmail.com
                      </a>
                    </div>
                    <div className="privacy-contact-card">
                      <span className="privacy-contact-card__label">Phone</span>
                      <a className="privacy-contact-card__value" href="tel:+919610844743">
                        +91 96108 44743
                      </a>
                    </div>
                  </address>
                  <p className="privacy-contact-address">
                    <strong>Business Address:</strong> Sri Ramachandra Bus Stop, near 66 Mount Poonamallee Road,
                    Thelliaragaram, Tamil Nadu – 600116, India.
                  </p>
                  <p>We appreciate your trust in Pooja Collections and thank you for shopping with us!</p>
                </section>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
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
