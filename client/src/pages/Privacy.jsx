import './Docs.css';

const Privacy = () => {
  const lastUpdated = 'August 14, 2026';

  return (
    <div className="docs-page animate-fade-in">
      <div className="docs-hero">
        <div className="docs-hero-inner container">
          <div className="docs-hero-badge">
            <span className="material-symbols-outlined">shield</span>
            Privacy
          </div>
          <h1 className="docs-hero-title">Privacy Policy</h1>
          <p className="docs-hero-sub">Last updated: {lastUpdated}</p>
        </div>
      </div>

      <div className="docs-container container">

        <div className="docs-notice">
          <span className="material-symbols-outlined">info</span>
          <p>
            CampusMarket is committed to protecting your personal data. This policy explains 
            what data we collect, why we collect it, and how you can control it.
          </p>
        </div>

        <section className="docs-section">
          <h2>1. Information We Collect</h2>
          <h3>Account & Identity Information</h3>
          <ul className="docs-list">
            <li>Full name, email address, and university</li>
            <li>Student ID image (for seller verification only)</li>
            <li>Profile photo (optional)</li>
            <li>WhatsApp number (optional, for buyer-seller contact)</li>
          </ul>
          <h3>Transaction Information</h3>
          <ul className="docs-list">
            <li>Listing details you create (title, description, price, images)</li>
            <li>Order history (items bought and sold)</li>
            <li>Payment references (via Paystack) — we do <strong>not</strong> store card numbers</li>
            <li>Mobile Money or bank account details you register for payouts</li>
          </ul>
          <h3>Technical Information</h3>
          <ul className="docs-list">
            <li>IP address and device type (for security and fraud prevention)</li>
            <li>Browser type and version</li>
            <li>Pages visited and interaction timestamps</li>
          </ul>
        </section>

        <section className="docs-section">
          <h2>2. How We Use Your Information</h2>
          <ul className="docs-list">
            <li><strong>Account management</strong> — to create and maintain your account</li>
            <li><strong>Seller verification</strong> — to confirm you are an enrolled student</li>
            <li><strong>Transaction processing</strong> — to facilitate payments and escrow via Paystack</li>
            <li><strong>Order fulfilment</strong> — to connect buyers and sellers for meetups</li>
            <li><strong>Safety & fraud prevention</strong> — to detect and prevent scams and abuse</li>
            <li><strong>Communication</strong> — to send OTP codes, order updates, and important notices</li>
            <li><strong>Platform improvement</strong> — to analyse usage and improve our features</li>
          </ul>
        </section>

        <section className="docs-section">
          <h2>3. Sharing Your Information</h2>
          <p>We <strong>do not sell your personal data</strong> to anyone. We only share information:</p>
          <ul className="docs-list">
            <li><strong>With transaction parties</strong> — your name and WhatsApp number are visible to the buyer or seller in a confirmed transaction</li>
            <li><strong>With Paystack</strong> — your email and payment details are shared with our payment processor (Paystack Ltd) for transaction processing</li>
            <li><strong>With your university</strong> — we may report serious fraud or illegal activity to your institution or Ghanaian authorities</li>
            <li><strong>With legal authorities</strong> — if required by Ghanaian law or court order</li>
          </ul>
        </section>

        <section className="docs-section">
          <h2>4. Student ID & Verification Data</h2>
          <p>
            Your student ID image is collected only to verify that you are an active student. 
            It is stored securely, reviewed by our admin team only, and is <strong>never shared publicly</strong> 
            or with third parties except as required by law.
          </p>
          <p>
            You may request deletion of your verification image after approval by contacting 
            <a href="mailto:privacy@campusmarket.gh"> privacy@campusmarket.gh</a>.
          </p>
        </section>

        <section className="docs-section">
          <h2>5. Data Security</h2>
          <ul className="docs-list">
            <li>All data is transmitted over HTTPS (TLS encryption)</li>
            <li>Passwords are hashed using bcrypt — we never store plaintext passwords</li>
            <li>Authentication uses short-lived JWT access tokens (15 minutes) and secure HTTP-only refresh token cookies</li>
            <li>Payment processing is handled entirely by Paystack — we never see or store your card numbers</li>
            <li>Our database (MongoDB Atlas) is hosted in a secured, encrypted cloud environment</li>
          </ul>
        </section>

        <section className="docs-section">
          <h2>6. Cookies & Local Storage</h2>
          <p>We use the following:</p>
          <ul className="docs-list">
            <li><strong>Refresh Token Cookie</strong> — an HTTP-only, secure cookie for keeping you logged in for up to 7 days</li>
            <li><strong>Access Token (localStorage)</strong> — a short-lived token stored in your browser for authenticating API requests</li>
            <li>We do <strong>not</strong> use advertising cookies or third-party tracking</li>
          </ul>
        </section>

        <section className="docs-section">
          <h2>7. Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="docs-list">
            <li><strong>Access</strong> — request a copy of all personal data we hold about you</li>
            <li><strong>Correction</strong> — update inaccurate information via your Profile settings</li>
            <li><strong>Deletion</strong> — request account deletion and data erasure (subject to legal obligations)</li>
            <li><strong>Data Portability</strong> — request your order and listing history in a readable format</li>
            <li><strong>Opt-out</strong> — unsubscribe from non-essential emails</li>
          </ul>
          <p>
            To exercise any of these rights, email <a href="mailto:privacy@campusmarket.gh">privacy@campusmarket.gh</a>.
          </p>
        </section>

        <section className="docs-section">
          <h2>8. Data Retention</h2>
          <p>
            We retain your personal data for as long as your account is active. If you delete your 
            account, we will delete personal data within <strong>30 days</strong>, except for 
            transaction records which we retain for <strong>7 years</strong> for tax and legal compliance.
          </p>
        </section>

        <section className="docs-section">
          <h2>9. Third-Party Services</h2>
          <p>We use the following third-party services:</p>
          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Purpose</th>
                  <th>Privacy Policy</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Paystack</td>
                  <td>Payment processing & escrow</td>
                  <td><a href="https://paystack.com/gh/privacy" target="_blank" rel="noopener noreferrer">paystack.com/privacy</a></td>
                </tr>
                <tr>
                  <td>Google (OAuth)</td>
                  <td>Optional Google Sign-In</td>
                  <td><a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">policies.google.com/privacy</a></td>
                </tr>
                <tr>
                  <td>MongoDB Atlas</td>
                  <td>Secure database hosting</td>
                  <td><a href="https://www.mongodb.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">mongodb.com/legal/privacy</a></td>
                </tr>
                <tr>
                  <td>Cloudinary</td>
                  <td>Image storage & CDN</td>
                  <td><a href="https://cloudinary.com/privacy" target="_blank" rel="noopener noreferrer">cloudinary.com/privacy</a></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="docs-section">
          <h2>10. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy periodically. We will notify you via email 
            for material changes. Continued use after updates constitutes acceptance.
          </p>
        </section>

        <section className="docs-section">
          <h2>11. Contact</h2>
          <p>For privacy questions or requests:</p>
          <p>
            <strong>Email:</strong> <a href="mailto:privacy@campusmarket.gh">privacy@campusmarket.gh</a>
          </p>
        </section>

      </div>
    </div>
  );
};

export default Privacy;
