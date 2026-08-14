import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-inner container">
        <div className="footer-grid">

          {/* Brand Column */}
          <div className="footer-brand">
            <div className="footer-brand-logo">
              <span className="material-symbols-outlined footer-brand-icon">storefront</span>
              <h2 className="footer-brand-name">CampusMarket</h2>
            </div>
            <p className="footer-brand-desc">
              Ghana's safest student-to-student marketplace. Buy, sell, and discover
              within your university community — protected by escrow.
            </p>
            <div className="footer-social">
              <a href="mailto:support@campusmarket.gh" className="footer-social-link" aria-label="Email us">
                <span className="material-symbols-outlined">alternate_email</span>
              </a>
              <a href="https://wa.me/233509254483" target="_blank" rel="noopener noreferrer" className="footer-social-link" aria-label="WhatsApp Support">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Marketplace Links */}
          <div className="footer-col">
            <h4 className="footer-col-title">Marketplace</h4>
            <ul className="footer-col-links">
              <li><Link to="/explore">Browse Listings</Link></li>
              <li><Link to="/sell">Sell an Item</Link></li>
              <li><Link to="/register">Join CampusMarket</Link></li>
              <li><Link to="/dashboard">My Orders</Link></li>
            </ul>
          </div>

          {/* Company Links */}
          <div className="footer-col">
            <h4 className="footer-col-title">Company</h4>
            <ul className="footer-col-links">
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/terms">Terms of Service</Link></li>
              <li><Link to="/privacy">Privacy Policy</Link></li>
              <li><Link to="/safety">Student Safety</Link></li>
            </ul>
          </div>

          {/* Help Links */}
          <div className="footer-col">
            <h4 className="footer-col-title">Help & Support</h4>
            <ul className="footer-col-links">
              <li><Link to="/faq">FAQ / Help Center</Link></li>
              <li><Link to="/safety#escrow">Escrow Protection</Link></li>
              <li><Link to="/faq#disputes">Dispute Resolution</Link></li>
              <li><a href="mailto:support@campusmarket.gh">Contact Support</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <span>© {year} CampusMarket · Built for Ghanaian Students 🇬🇭</span>
          <div className="footer-bottom-links">
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/safety">Safety</Link>
            <span className="footer-currency">GHS (₵)</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
