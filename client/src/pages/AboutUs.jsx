import { Link } from 'react-router-dom';
import './Docs.css';

const AboutUs = () => {
  return (
    <div className="docs-page animate-fade-in">
      <div className="docs-hero">
        <div className="docs-hero-inner container">
          <div className="docs-hero-badge">
            <span className="material-symbols-outlined">storefront</span>
            Our Story
          </div>
          <h1 className="docs-hero-title">About CampusMarket</h1>
          <p className="docs-hero-sub">
            Ghana's first student-only peer-to-peer marketplace — built for campuses, by students.
          </p>
        </div>
      </div>

      <div className="docs-container container">

        {/* Mission */}
        <section className="docs-section">
          <div className="docs-section-icon accent">
            <span className="material-symbols-outlined">flag</span>
          </div>
          <h2>Our Mission</h2>
          <p>
            CampusMarket exists to solve a real problem every Ghanaian student faces: how to safely buy 
            and sell items within your university community without getting scammed, overcharged, or 
            left chasing a stranger for your money.
          </p>
          <p>
            We believe that when students support students — trading textbooks, electronics, clothing, 
            and services directly between themselves — the whole campus economy thrives.
          </p>
        </section>

        {/* How It Started */}
        <section className="docs-section">
          <div className="docs-section-icon">
            <span className="material-symbols-outlined">history_edu</span>
          </div>
          <h2>How It Started</h2>
          <p>
            CampusMarket was born out of frustration. After seeing too many students get scammed 
            selling items in WhatsApp groups, Facebook Marketplace, and unverified student forums, 
            we set out to build something better.
          </p>
          <p>
            We started with a simple question: <em>"What if students could trade safely, 
            pay securely, and always know who they're dealing with?"</em> The answer is CampusMarket.
          </p>
        </section>

        {/* Values Grid */}
        <section className="docs-section">
          <h2>What We Stand For</h2>
          <div className="docs-values-grid">
            <div className="docs-value-card">
              <span className="material-symbols-outlined docs-value-icon">verified_user</span>
              <h3>Trust & Verification</h3>
              <p>Every seller is a verified student. We verify student ID cards so you always know who you're transacting with.</p>
            </div>
            <div className="docs-value-card">
              <span className="material-symbols-outlined docs-value-icon">lock</span>
              <h3>Escrow Protection</h3>
              <p>All payments are held in 24-hour escrow. Sellers only get paid after you confirm you received your item in good condition.</p>
            </div>
            <div className="docs-value-card">
              <span className="material-symbols-outlined docs-value-icon">people</span>
              <h3>Community First</h3>
              <p>CampusMarket is built exclusively for students. No businesses, no middlemen — just peer-to-peer student trading.</p>
            </div>
            <div className="docs-value-card">
              <span className="material-symbols-outlined docs-value-icon">local_shipping</span>
              <h3>Campus Meetups</h3>
              <p>All exchanges happen on campus in safe, public, well-lit locations — reducing risk and making transactions convenient.</p>
            </div>
          </div>
        </section>

        {/* Universities */}
        <section className="docs-section">
          <div className="docs-section-icon">
            <span className="material-symbols-outlined">school</span>
          </div>
          <h2>Campuses We Serve</h2>
          <p>We currently support students from:</p>
          <ul className="docs-list">
            <li>University of Ghana (UG), Legon</li>
            <li>Kwame Nkrumah University of Science & Technology (KNUST)</li>
            <li>University of Cape Coast (UCC)</li>
            <li>Ashesi University</li>
            <li>University of Professional Studies, Accra (UPSA)</li>
            <li>And growing — contact us to add your campus!</li>
          </ul>
        </section>

        {/* Contact */}
        <section className="docs-section docs-contact-section">
          <h2>Get in Touch</h2>
          <p>Have questions, feedback, or want to partner with us to launch at your campus?</p>
          <div className="docs-contact-grid">
            <a href="mailto:support@campusmarket.gh" className="docs-contact-card">
              <span className="material-symbols-outlined">alternate_email</span>
              <div>
                <strong>Email Us</strong>
                <span>support@campusmarket.gh</span>
              </div>
            </a>
            <Link to="/faq" className="docs-contact-card">
              <span className="material-symbols-outlined">help</span>
              <div>
                <strong>Help Center</strong>
                <span>Browse FAQ & guides</span>
              </div>
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
};

export default AboutUs;
