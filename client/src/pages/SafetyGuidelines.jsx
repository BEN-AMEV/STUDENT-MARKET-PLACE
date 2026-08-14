import { Link } from 'react-router-dom';
import './Docs.css';

const SafetyGuidelines = () => {
  return (
    <div className="docs-page animate-fade-in">
      <div className="docs-hero docs-hero-safety">
        <div className="docs-hero-inner container">
          <div className="docs-hero-badge">
            <span className="material-symbols-outlined">security</span>
            Your Safety
          </div>
          <h1 className="docs-hero-title">Student Safety Guidelines</h1>
          <p className="docs-hero-sub">
            Stay safe every time you buy or sell on CampusMarket. Read this before your first transaction.
          </p>
        </div>
      </div>

      <div className="docs-container container">

        {/* Alert box */}
        <div className="docs-notice docs-notice-warning">
          <span className="material-symbols-outlined">warning</span>
          <p>
            <strong>Golden Rule:</strong> Never pay anyone outside the CampusMarket platform.
            All legitimate payments go through our Paystack checkout with escrow protection.
            Anyone asking you to pay via direct MoMo, cash upfront, or any other method is 
            <strong> a scammer.</strong>
          </p>
        </div>

        {/* Meetup Safety */}
        <section className="docs-section">
          <div className="docs-section-icon accent">
            <span className="material-symbols-outlined">location_on</span>
          </div>
          <h2>Safe Meetup Rules</h2>
          <div className="docs-safety-grid">
            <div className="docs-safety-card green">
              <span className="material-symbols-outlined">check_circle</span>
              <div>
                <strong>DO: Meet in public</strong>
                <p>Choose busy, well-lit campus locations — libraries, student centres, cafeterias, security posts.</p>
              </div>
            </div>
            <div className="docs-safety-card green">
              <span className="material-symbols-outlined">check_circle</span>
              <div>
                <strong>DO: Inspect before paying</strong>
                <p>For cash transactions, always inspect the item thoroughly before handing over any money.</p>
              </div>
            </div>
            <div className="docs-safety-card green">
              <span className="material-symbols-outlined">check_circle</span>
              <div>
                <strong>DO: Meet during daylight</strong>
                <p>Schedule meetups during daytime or early evening hours when campus is active.</p>
              </div>
            </div>
            <div className="docs-safety-card green">
              <span className="material-symbols-outlined">check_circle</span>
              <div>
                <strong>DO: Bring a friend</strong>
                <p>For high-value items, bring a classmate or friend to the exchange.</p>
              </div>
            </div>
            <div className="docs-safety-card red">
              <span className="material-symbols-outlined">cancel</span>
              <div>
                <strong>DON'T: Go to private locations</strong>
                <p>Never agree to meet at off-campus private residences, dormitory rooms, or isolated areas.</p>
              </div>
            </div>
            <div className="docs-safety-card red">
              <span className="material-symbols-outlined">cancel</span>
              <div>
                <strong>DON'T: Pay before seeing the item</strong>
                <p>Never send money, MoMo, or accept verbal promises before physically inspecting the item.</p>
              </div>
            </div>
            <div className="docs-safety-card red">
              <span className="material-symbols-outlined">cancel</span>
              <div>
                <strong>DON'T: Share personal address</strong>
                <p>Do not share your home address, dorm room number, or any private location details.</p>
              </div>
            </div>
            <div className="docs-safety-card red">
              <span className="material-symbols-outlined">cancel</span>
              <div>
                <strong>DON'T: Feel pressured</strong>
                <p>If a seller or buyer is rushing you, using aggressive tactics, or something feels wrong — walk away.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Escrow Section */}
        <section className="docs-section" id="escrow">
          <div className="docs-section-icon">
            <span className="material-symbols-outlined">lock</span>
          </div>
          <h2>Our 24-Hour Escrow Protection</h2>
          <p>
            When you pay through CampusMarket's Paystack checkout, your money is <strong>never</strong> 
            sent directly to the seller. Instead it is held in a secure escrow account for 24 hours.
          </p>
          <div className="docs-steps">
            <div className="docs-step">
              <div className="docs-step-num">1</div>
              <div>
                <strong>You pay via Paystack</strong>
                <p>Your payment goes into secure escrow — not to the seller yet.</p>
              </div>
            </div>
            <div className="docs-step">
              <div className="docs-step-num">2</div>
              <div>
                <strong>You meet & inspect</strong>
                <p>You arrange meetup with the seller via WhatsApp and inspect the item.</p>
              </div>
            </div>
            <div className="docs-step">
              <div className="docs-step-num">3</div>
              <div>
                <strong>You confirm receipt</strong>
                <p>On your Dashboard, confirm you received the item in good condition.</p>
              </div>
            </div>
            <div className="docs-step">
              <div className="docs-step-num">4</div>
              <div>
                <strong>Seller gets paid</strong>
                <p>Within 24 hours, the seller receives their payment (minus 3% platform fee).</p>
              </div>
            </div>
          </div>
          <div className="docs-notice docs-notice-tip">
            <span className="material-symbols-outlined">lightbulb</span>
            <p>
              If there is a problem — wrong item, damaged goods, or no-show — raise a dispute 
              within 24 hours from your Dashboard and our team will investigate. 
              <Link to="/faq#disputes"> Learn more about disputes.</Link>
            </p>
          </div>
        </section>

        {/* Spotting Scams */}
        <section className="docs-section">
          <div className="docs-section-icon">
            <span className="material-symbols-outlined">gpp_bad</span>
          </div>
          <h2>How to Spot a Scammer</h2>
          <ul className="docs-list docs-list-warning">
            <li><strong>Asks you to pay via direct MoMo or bank transfer</strong> — all real sellers use the platform checkout</li>
            <li><strong>Price is too good to be true</strong> — a GHS 200 iPhone is not real</li>
            <li><strong>Rushes or pressures you</strong> — "offer expires in 10 minutes!"</li>
            <li><strong>Won't meet in person</strong> — "I'll send it, just pay first"</li>
            <li><strong>Impersonates another user</strong> — check the seller's profile rating and review history</li>
            <li><strong>Asks for your CampusMarket login details</strong> — we will never ask for your password</li>
          </ul>
        </section>

        {/* Report */}
        <section className="docs-section">
          <div className="docs-section-icon accent">
            <span className="material-symbols-outlined">flag</span>
          </div>
          <h2>Reporting & Getting Help</h2>
          <p>
            If you suspect fraud, feel unsafe, or have been scammed:
          </p>
          <ul className="docs-list">
            <li>Use the <strong>Report</strong> button on any user's profile or listing</li>
            <li>Email us immediately at <a href="mailto:safety@campusmarket.gh">safety@campusmarket.gh</a></li>
            <li>If you are in physical danger, contact your campus security or Ghana Police Service (191)</li>
          </ul>
          <p>
            All safety reports are reviewed within <strong>24 hours</strong> and suspicious accounts 
            are suspended during investigation.
          </p>
        </section>

      </div>
    </div>
  );
};

export default SafetyGuidelines;
