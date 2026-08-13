import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-inner container">
        <div className="footer-grid">
          {/* Brand Column */}
          <div className="footer-brand">
            <h2 className="footer-brand-name">CampusMarket</h2>
            <p className="footer-brand-desc text-body-sm color-on-surface-variant">
              The safest and easiest way to buy and sell items within your university community.
            </p>
            <div className="footer-social">
              <a href="#" className="footer-social-link" aria-label="Website">
                <span className="material-symbols-outlined">public</span>
              </a>
              <a href="#" className="footer-social-link" aria-label="Email">
                <span className="material-symbols-outlined">alternate_email</span>
              </a>
              <a href="#" className="footer-social-link" aria-label="Chat">
                <span className="material-symbols-outlined">chat_bubble</span>
              </a>
            </div>
          </div>

          {/* Company Links */}
          <div className="footer-col">
            <h4 className="footer-col-title text-label-caps">Company</h4>
            <ul className="footer-col-links">
              <li><Link to="/explore">About Us</Link></li>
              <li><Link to="/explore">Terms of Service</Link></li>
              <li><Link to="/explore">Privacy Policy</Link></li>
              <li><Link to="/explore">Student Safety</Link></li>
            </ul>
          </div>

          {/* Support Links */}
          <div className="footer-col">
            <h4 className="footer-col-title text-label-caps">Support</h4>
            <ul className="footer-col-links">
              <li><Link to="/explore">Help Center</Link></li>
              <li><Link to="/dashboard">Report a User</Link></li>
              <li><Link to="/explore">Safety Tips</Link></li>
              <li><Link to="/dashboard">Dispute Resolution</Link></li>
            </ul>
          </div>

          {/* Join Beta */}
          <div className="footer-col">
            <h4 className="footer-col-title text-label-caps">Join the Beta</h4>
            <p className="text-body-sm color-on-surface-variant footer-beta-text">
              Be the first to know when we launch at new campuses.
            </p>
            <div className="footer-beta-form">
              <input
                type="email"
                placeholder="edu email address"
                className="input-field footer-beta-input"
              />
              <button className="btn btn-primary btn-full footer-beta-btn">
                Sign Up
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <span>© 2026 CampusMarket Inc. Built for Students.</span>
          <div className="footer-bottom-links">
            <a href="#">English (US)</a>
            <a href="#">GHS (₵)</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
