import { useState } from 'react';
import { Link } from 'react-router-dom';
import './Docs.css';

const FAQS = [
  {
    category: 'Getting Started',
    icon: 'rocket_launch',
    items: [
      {
        q: 'What is CampusMarket?',
        a: 'CampusMarket is a student-only peer-to-peer marketplace for Ghanaian university students. You can buy and sell textbooks, electronics, clothing, services, and more — all within your campus community.'
      },
      {
        q: 'Who can use CampusMarket?',
        a: 'Only verified students at supported Ghanaian universities can create seller accounts. Anyone can browse listings, but to buy or sell you need to register and verify your student status.'
      },
      {
        q: 'Which universities are supported?',
        a: 'We currently support University of Ghana (Legon), KNUST, University of Cape Coast, Ashesi University, and UPSA. We\'re expanding — contact us to bring CampusMarket to your campus.'
      },
      {
        q: 'Is CampusMarket free to use?',
        a: 'Browsing and buying is completely free. Sellers pay a 3% platform fee on completed sales only — there are no listing fees, monthly fees, or hidden charges.'
      },
    ]
  },
  {
    category: 'Accounts & Verification',
    icon: 'verified_user',
    items: [
      {
        q: 'How do I become a verified seller?',
        a: 'After registering, go to your Profile page and upload a clear photo of your student ID card. Our admin team reviews it within 24–48 hours. Once approved, you can list items for sale.'
      },
      {
        q: 'I didn\'t receive my email verification OTP. What do I do?',
        a: 'Check your spam/junk folder first. If it\'s not there, click "Resend Code" on the verification page. If you still don\'t receive it, make sure you registered with a valid email address you can access.'
      },
      {
        q: 'Can I use Google Sign-In?',
        a: 'Yes! You can sign in with your Google account. If your university email is a Google account (e.g., Gmail), this is the fastest way to get started.'
      },
      {
        q: 'I forgot my password. How do I reset it?',
        a: 'Click "Forgot Password" on the login page, enter your registered email, and we\'ll send a reset link. The link is valid for 30 minutes.'
      },
    ]
  },
  {
    category: 'Buying',
    icon: 'shopping_bag',
    items: [
      {
        q: 'How do I buy an item?',
        a: 'Browse listings on the Explore page, click on an item you like, review the details, and click "Buy Now". You\'ll be taken to checkout where you can pay via Paystack (card, MoMo) or arrange cash on delivery.'
      },
      {
        q: 'Is it safe to pay online through CampusMarket?',
        a: 'Yes. All online payments go through Paystack, Ghana\'s most trusted payment processor. Your money is held in escrow for 24 hours — the seller only gets paid after you confirm you received the item in good condition.'
      },
      {
        q: 'What is the escrow protection?',
        a: 'When you pay online, your money is held safely in escrow (not sent to the seller immediately). After you confirm receipt of the item in your Dashboard, the seller receives their payment. If something is wrong, you can raise a dispute within 24 hours to freeze the payout.'
      },
      {
        q: 'Can I pay with Mobile Money (MoMo)?',
        a: 'Yes! CampusMarket supports MTN Mobile Money, Vodafone Cash, and AirtelTigo Money through Paystack. You can also pay with Visa/Mastercard or arrange cash on delivery.'
      },
      {
        q: 'How do I contact the seller?',
        a: 'Once you\'re on a listing page, click the WhatsApp button to message the seller directly. After placing an order, you\'ll also see a WhatsApp contact button on your order confirmation.'
      },
    ]
  },
  {
    category: 'Selling',
    icon: 'sell',
    items: [
      {
        q: 'How do I list an item for sale?',
        a: 'You must first be a verified seller (upload your student ID in Profile settings). Once verified, click "Sell" in the navigation, fill in your item details, add photos, set your price and meetup location, then publish.'
      },
      {
        q: 'How many photos can I add?',
        a: 'You can add up to 5 photos per listing. We recommend adding clear, well-lit photos from multiple angles to attract more buyers.'
      },
      {
        q: 'When do I get paid?',
        a: 'For Paystack orders: payment is released to your registered Mobile Money or bank account within 24 hours of the buyer confirming receipt (or automatically after 24 hours if no dispute is raised). For cash orders: you collect payment directly at the meetup.'
      },
      {
        q: 'How do I set up my payout account?',
        a: 'Go to Profile → Payment Settings. Add your MTN MoMo number, Vodafone Cash, AirtelTigo number, or bank account details. This is where your earnings will be sent.'
      },
      {
        q: 'What is the 3% platform fee?',
        a: 'CampusMarket deducts 3% from the selling price when a Paystack payment is completed. For example, if you sell an item for GHS 100, you receive GHS 97. There are no upfront or listing fees.'
      },
    ]
  },
  {
    category: 'Disputes & Refunds',
    icon: 'balance',
    id: 'disputes',
    items: [
      {
        q: 'What if the item is not as described?',
        a: 'If the item is significantly different from the listing, don\'t confirm receipt. Go to your Dashboard → Orders, find the order, and click "Raise Dispute". Provide a clear reason and any evidence. Our team will investigate within 24 hours.'
      },
      {
        q: 'How long do I have to raise a dispute?',
        a: 'You have 24 hours from the time of payment to raise a dispute. After 24 hours, the payment is automatically released to the seller.'
      },
      {
        q: 'What happens after I raise a dispute?',
        a: 'The seller\'s payout is immediately frozen. Our team reviews both sides within 24 hours. Depending on the outcome, we may issue a full refund, partial refund, or release payment to the seller.'
      },
      {
        q: 'Can I get a refund on a cash order?',
        a: 'Cash transactions are peer-to-peer and happen outside our payment system. We recommend only paying cash after inspecting the item. For cash order disputes, we can mediate but cannot force a refund.'
      },
    ]
  },
  {
    category: 'Safety',
    icon: 'security',
    items: [
      {
        q: 'Is it safe to meet strangers from CampusMarket?',
        a: 'All sellers are verified students at your university. Always meet in public campus areas during daytime, inspect the item before paying, and feel free to bring a friend. Read our full Safety Guidelines.'
      },
      {
        q: 'How do I report a scammer or suspicious listing?',
        a: 'Click the flag/report icon on any listing or user profile. For urgent safety issues, email safety@campusmarket.gh. We respond to all safety reports within 24 hours.'
      },
      {
        q: 'Someone asked me to pay via direct MoMo instead of the platform. Is this normal?',
        a: 'NO. This is a classic scam. Legitimate CampusMarket sellers never ask you to pay outside the platform. Always pay through the CampusMarket checkout to ensure escrow protection. Report the user immediately.'
      },
    ]
  },
];

const FAQ = () => {
  const [openItems, setOpenItems] = useState({});

  const toggle = (catIdx, itemIdx) => {
    const key = `${catIdx}-${itemIdx}`;
    setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="docs-page animate-fade-in">
      <div className="docs-hero">
        <div className="docs-hero-inner container">
          <div className="docs-hero-badge">
            <span className="material-symbols-outlined">help</span>
            Help Center
          </div>
          <h1 className="docs-hero-title">Frequently Asked Questions</h1>
          <p className="docs-hero-sub">
            Everything you need to know about buying and selling on CampusMarket.
          </p>
        </div>
      </div>

      <div className="docs-container container">

        {/* Quick links */}
        <div className="faq-quick-links">
          {FAQS.map((cat, ci) => (
            <a key={ci} href={`#cat-${ci}`} className="faq-quick-chip">
              <span className="material-symbols-outlined">{cat.icon}</span>
              {cat.category}
            </a>
          ))}
        </div>

        {/* Categories */}
        {FAQS.map((cat, catIdx) => (
          <section key={catIdx} id={cat.id || `cat-${catIdx}`} className="docs-section faq-category">
            <div className="faq-category-header">
              <span className="material-symbols-outlined faq-category-icon">{cat.icon}</span>
              <h2>{cat.category}</h2>
            </div>
            <div className="faq-list">
              {cat.items.map((item, itemIdx) => {
                const key = `${catIdx}-${itemIdx}`;
                const isOpen = !!openItems[key];
                return (
                  <div key={itemIdx} className={`faq-item ${isOpen ? 'open' : ''}`}>
                    <button
                      className="faq-question"
                      onClick={() => toggle(catIdx, itemIdx)}
                      aria-expanded={isOpen}
                    >
                      <span>{item.q}</span>
                      <span className="material-symbols-outlined faq-chevron">
                        {isOpen ? 'expand_less' : 'expand_more'}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="faq-answer animate-fade-in">
                        <p>{item.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        {/* Still need help */}
        <section className="docs-section docs-contact-section">
          <h2>Still Need Help?</h2>
          <p>Can't find the answer you're looking for? Our support team is here to help.</p>
          <div className="docs-contact-grid">
            <a href="https://wa.me/233509254483" target="_blank" rel="noopener noreferrer" className="docs-contact-card">
              <span className="material-symbols-outlined" style={{ color: '#25D366' }}>chat</span>
              <div>
                <strong>WhatsApp Support</strong>
                <span>+233 50 925 4483</span>
              </div>
            </a>
            <a href="mailto:support@campusmarket.gh" className="docs-contact-card">
              <span className="material-symbols-outlined">alternate_email</span>
              <div>
                <strong>Email Support</strong>
                <span>support@campusmarket.gh</span>
              </div>
            </a>
            <a href="mailto:safety@campusmarket.gh" className="docs-contact-card">
              <span className="material-symbols-outlined">security</span>
              <div>
                <strong>Safety Reports</strong>
                <span>safety@campusmarket.gh</span>
              </div>
            </a>
            <Link to="/safety" className="docs-contact-card">
              <span className="material-symbols-outlined">shield</span>
              <div>
                <strong>Safety Guidelines</strong>
                <span>Stay safe every transaction</span>
              </div>
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
};

export default FAQ;
