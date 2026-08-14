import './Docs.css';

const Terms = () => {
  const lastUpdated = 'August 14, 2026';

  return (
    <div className="docs-page animate-fade-in">
      <div className="docs-hero">
        <div className="docs-hero-inner container">
          <div className="docs-hero-badge">
            <span className="material-symbols-outlined">gavel</span>
            Legal
          </div>
          <h1 className="docs-hero-title">Terms of Service</h1>
          <p className="docs-hero-sub">Last updated: {lastUpdated}</p>
        </div>
      </div>

      <div className="docs-container container">

        <div className="docs-notice">
          <span className="material-symbols-outlined">info</span>
          <p>
            By creating an account or using CampusMarket, you agree to these Terms of Service.
            Please read them carefully. If you do not agree, do not use the platform.
          </p>
        </div>

        <section className="docs-section">
          <h2>1. Who We Are</h2>
          <p>
            CampusMarket is a student-to-student marketplace platform operated in Ghana. 
            We provide a platform that allows verified university students ("Users") to 
            list, buy, and sell goods and services within their campus community.
          </p>
          <p>
            CampusMarket acts as a facilitator only. We are not a party to any transaction 
            between buyers and sellers except in our role as an escrow intermediary.
          </p>
        </section>

        <section className="docs-section">
          <h2>2. Eligibility</h2>
          <p>To use CampusMarket, you must:</p>
          <ul className="docs-list">
            <li>Be a currently enrolled student at a supported Ghanaian university</li>
            <li>Be at least 18 years old (or have parental/guardian consent)</li>
            <li>Have a valid university email address or student ID card</li>
            <li>Provide accurate and complete registration information</li>
          </ul>
          <p>
            We reserve the right to verify your student status and suspend accounts that 
            do not meet eligibility requirements.
          </p>
        </section>

        <section className="docs-section">
          <h2>3. User Accounts</h2>
          <ul className="docs-list">
            <li>You are responsible for keeping your account credentials secure and confidential</li>
            <li>You may not share your account or allow others to use it</li>
            <li>You must notify us immediately at <a href="mailto:support@campusmarket.gh">support@campusmarket.gh</a> if you suspect unauthorised access</li>
            <li>One account per student only</li>
          </ul>
        </section>

        <section className="docs-section">
          <h2>4. Listings & Selling</h2>
          <p>As a seller, you agree that:</p>
          <ul className="docs-list">
            <li>All listings must be accurate, honest, and not misleading</li>
            <li>You own or have the legal right to sell the listed item/service</li>
            <li>Items must be legal to buy and sell in Ghana</li>
            <li>Prices must be stated in Ghana Cedis (GHS)</li>
            <li>You will fulfil orders promptly and as described</li>
            <li>You will not cancel orders after payment has been confirmed in escrow</li>
          </ul>
        </section>

        <section className="docs-section">
          <h2>5. Prohibited Items & Activities</h2>
          <p>The following are strictly prohibited on CampusMarket:</p>
          <ul className="docs-list docs-list-danger">
            <li>Illegal drugs, substances, or paraphernalia</li>
            <li>Weapons, ammunition, or dangerous materials</li>
            <li>Counterfeit, stolen, or fraudulently obtained items</li>
            <li>Exam papers, answer keys, or academic dishonesty materials</li>
            <li>Adult content of any kind</li>
            <li>Fake student IDs or identity documents</li>
            <li>Multi-level marketing or pyramid scheme promotions</li>
            <li>Harassment, hate speech, or discrimination</li>
          </ul>
          <p>Violations will result in immediate account suspension and may be reported to your university or Ghanaian authorities.</p>
        </section>

        <section className="docs-section">
          <h2>6. Escrow & Payment</h2>
          <ul className="docs-list">
            <li>All Paystack payments are held in escrow for <strong>24 hours</strong> after the buyer confirms payment</li>
            <li>A <strong>3% platform fee</strong> is deducted from the seller's payout</li>
            <li>Seller payouts are processed to a registered Mobile Money or bank account after 24 hours if no dispute is raised</li>
            <li>Buyers may raise a dispute within the 24-hour window if an item is not received or significantly not as described</li>
            <li>CampusMarket's decision in escrow disputes is final</li>
          </ul>
        </section>

        <section className="docs-section">
          <h2>7. Platform Fee</h2>
          <p>
            CampusMarket charges a <strong>3% transaction fee</strong> on every completed sale. 
            This fee is automatically deducted from the seller's payout. 
            Buyers pay no additional fees — the listed price is the final price.
          </p>
        </section>

        <section className="docs-section">
          <h2>8. Cancellations & Refunds</h2>
          <ul className="docs-list">
            <li>Cash orders may be cancelled before meetup</li>
            <li>Paystack orders: refund requests must be raised within the 24-hour escrow window</li>
            <li>Once funds are released to the seller, refunds can only be initiated voluntarily by the seller</li>
            <li>CampusMarket may facilitate refunds in genuine fraud cases at its discretion</li>
          </ul>
        </section>

        <section className="docs-section">
          <h2>9. Reviews & Ratings</h2>
          <p>
            After a completed transaction, buyers and sellers may leave reviews. 
            Reviews must be honest and based on the actual transaction. Fake reviews, 
            review manipulation, or defamatory content is prohibited and may result in 
            account suspension.
          </p>
        </section>

        <section className="docs-section">
          <h2>10. Limitation of Liability</h2>
          <p>
            CampusMarket is a marketplace platform only. We do not inspect, verify, or 
            guarantee the quality of any listed item or service. We are not liable for:
          </p>
          <ul className="docs-list">
            <li>The quality, safety, or legality of items listed</li>
            <li>Disputes between buyers and sellers beyond our escrow process</li>
            <li>Loss resulting from personal meetups or exchanges</li>
            <li>Technical failures, downtime, or data loss beyond our reasonable control</li>
          </ul>
        </section>

        <section className="docs-section">
          <h2>11. Account Suspension & Termination</h2>
          <p>We may suspend or terminate accounts that:</p>
          <ul className="docs-list">
            <li>Violate these Terms of Service</li>
            <li>Engage in fraud, scamming, or dishonest conduct</li>
            <li>Receive repeated unresolved complaints</li>
            <li>Are found to be non-students</li>
          </ul>
        </section>

        <section className="docs-section">
          <h2>12. Changes to Terms</h2>
          <p>
            We may update these Terms at any time. We will notify users of significant 
            changes via email. Continued use of CampusMarket after changes constitutes 
            acceptance of the updated Terms.
          </p>
        </section>

        <section className="docs-section">
          <h2>13. Contact</h2>
          <p>For any questions about these Terms, contact us:</p>
          <p>
            <strong>Email:</strong> <a href="mailto:legal@campusmarket.gh">legal@campusmarket.gh</a>
          </p>
        </section>

      </div>
    </div>
  );
};

export default Terms;
