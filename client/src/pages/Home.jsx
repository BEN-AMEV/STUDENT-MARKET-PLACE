import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api from '../services/api';
import { resolveImageUrl } from '../utils/imageUrl';
import './Home.css';

const CATEGORIES = [
  { name: 'All Items', icon: 'grid_view' },
  { name: 'Textbooks & Study Materials', icon: 'menu_book' },
  { name: 'Electronics & Gadgets', icon: 'devices' },
  { name: 'Fashion & Clothing', icon: 'checkroom' },
  { name: 'Food & Beverages', icon: 'restaurant' },
  { name: 'Services', icon: 'handyman' },
  { name: 'Events & Entertainment', icon: 'event' },
  { name: 'Housing & Roommates', icon: 'home' },
  { name: 'Miscellaneous', icon: 'more_horiz' },
];

const Home = () => {
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();

  // User is a verified seller if email is verified AND student ID is approved
  const isVerifiedSeller =
    user?.isEmailVerified && user?.verificationStatus === 'approved';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Items');
  const [sortOption, setSortOption] = useState('Newest Arrivals');
  const [favorites, setFavorites] = useState({});

  // Real data states
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trendingTags, setTrendingTags] = useState([]);

  // Sort map for API
  const sortMap = {
    'Newest Arrivals': 'newest',
    'Price: Low to High': 'price_asc',
    'Price: High to Low': 'price_desc',
    'Most Popular': 'popular',
  };

  // Fetch listings from API
  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      try {
        const params = { limit: 9, sort: sortMap[sortOption] || 'newest' };
        if (selectedCategory !== 'All Items') params.category = selectedCategory;

        const { data } = await api.get('/listings', { params });
        setListings(data.data || []);
      } catch (error) {
        console.error('Failed to fetch listings:', error);
        setListings([]);
      } finally {
        setLoading(false);
      }
    };
    fetchListings();
  }, [selectedCategory, sortOption]);

  // Fetch trending tags
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const { data } = await api.get('/tags/trending');
        setTrendingTags(data.data || []);
      } catch {
        // Silently fail — trending is non-critical
      }
    };
    fetchTrending();
  }, []);

  const handleFavoriteToggle = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    navigate(`/explore?search=${encodeURIComponent(searchQuery)}`);
  };

  const handleCategoryClick = (catName) => {
    if (catName === 'All Items') {
      setSelectedCategory('All Items');
    } else {
      setSelectedCategory(catName);
    }
  };

  // Helper: get the first image URL for a listing
  const getListingImage = (item) => {
    if (item.images && item.images.length > 0) {
      const raw = item.images[0].thumbnail || item.images[0].url;
      return resolveImageUrl(raw);
    }
    return 'https://images.unsplash.com/photo-1560472355-536de3962603?w=600&h=450&fit=crop';
  };

  return (
    <div className="home-container animate-fade-in">
      {/* Hero Section */}
      <section className="home-hero">
        <div className="home-hero-content">
          <h2 className="text-display-lg home-hero-title">
            Find everything you need for campus life.
          </h2>
          <form className="home-search-bar" onSubmit={handleSearchSubmit}>
            <span className="material-symbols-outlined home-search-icon">search</span>
            <input
              type="text"
              className="home-search-input"
              placeholder="Search textbooks, dorm decor, bikes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="btn btn-primary home-search-btn">
              Search
            </button>
          </form>
          {trendingTags.length > 0 && (
            <div className="home-trending">
              <span className="home-trending-label">Trending:</span>
              {trendingTags.slice(0, 4).map((tag) => (
                <button
                  key={tag.name}
                  onClick={() => {
                    if (CATEGORIES.some((c) => c.name === tag.name)) {
                      setSelectedCategory(tag.name);
                    } else {
                      navigate(`/explore?search=${encodeURIComponent(tag.name)}`);
                    }
                  }}
                  className="home-trending-link"
                >
                  {tag.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Main Content Layout */}
      <div className="home-layout">
        {/* Sidebar */}
        <aside className="home-sidebar hide-mobile">
          <div className="home-sidebar-section">
            <h3 className="home-sidebar-title">Categories</h3>
            <nav className="home-cat-nav">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => handleCategoryClick(cat.name)}
                  className={`home-cat-btn ${
                    selectedCategory === cat.name ? 'active' : ''
                  }`}
                >
                  <span className="material-symbols-outlined">{cat.icon}</span>
                  {cat.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="home-sidebar-section">
            <h3 className="home-sidebar-title">Verification</h3>
            <div className="home-verif-widget">
              <span className="material-symbols-outlined icon-filled home-verif-icon">
                verified_user
              </span>
              <div className="home-verif-text">
                <span className="home-verif-title">Student Verified</span>
                <span className="home-verif-desc">Shop with confidence</span>
              </div>
            </div>
          </div>

          <div className="home-sell-widget">
            <h3 className="home-sell-title">
              {isAuthenticated && !isVerifiedSeller ? 'Want to Sell?' : 'Sell Your Stuff'}
            </h3>
            <p className="home-sell-desc">
              {isAuthenticated && !isVerifiedSeller
                ? 'Verify your student ID to unlock selling features and start listing items.'
                : 'Empty your dorm and fill your wallet. List in seconds.'}
            </p>
            <Link
              to={
                !isAuthenticated
                  ? '/login'
                  : isVerifiedSeller
                    ? '/listings/create'
                    : '/profile'
              }
              className="btn btn-primary btn-small home-sell-btn"
            >
              {isAuthenticated && !isVerifiedSeller ? 'Get Verified to Sell' : 'Start Selling'}
            </Link>
          </div>
        </aside>

        {/* Product Feed */}
        <div className="home-feed">
          <div className="home-feed-header">
            <h2 className="text-headline-md">
              {selectedCategory === 'All Items' ? 'Recently Listed' : selectedCategory}
            </h2>
            <div className="home-sort">
              <span>Sort by:</span>
              <select
                className="home-sort-select"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
              >
                <option>Newest Arrivals</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Most Popular</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-center" style={{ padding: '64px 0' }}>
              <span
                className="material-symbols-outlined animate-spin"
                style={{ fontSize: '48px', color: 'var(--color-primary)' }}
              >
                progress_activity
              </span>
              <p style={{ marginTop: '16px', color: 'var(--color-on-surface-variant)' }}>
                Loading listings...
              </p>
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center" style={{ padding: '48px 0' }}>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: '64px', color: 'var(--color-outline)', opacity: 0.5 }}
              >
                store
              </span>
              <h3 className="text-headline-sm" style={{ marginTop: '16px' }}>
                No listings yet
              </h3>
              <p style={{ marginTop: '8px', color: 'var(--color-on-surface-variant)', maxWidth: '340px', margin: '8px auto 24px auto' }}>
                {selectedCategory !== 'All Items'
                  ? `No items in "${selectedCategory}" yet. Be the first to list one!`
                  : 'No listings are available yet. Be the first to list an item!'}
              </p>
              {isVerifiedSeller ? (
                <Link to="/listings/create" className="btn btn-primary">
                  Post First Listing
                </Link>
              ) : (
                <Link to={isAuthenticated ? '/profile' : '/register'} className="btn btn-primary">
                  {isAuthenticated ? 'Get Verified to Sell' : 'Join CampusMarket'}
                </Link>
              )}
            </div>
          ) : (
            <div className="product-grid">
              {listings.map((item) => (
                <Link key={item._id} to={`/listings/${item._id}`} className="product-card">
                  <div className="product-card-image">
                    <img src={getListingImage(item)} alt={item.title} />
                    <button
                      type="button"
                      className={`product-card-fav ${favorites[item._id] ? 'active' : ''}`}
                      onClick={(e) => handleFavoriteToggle(e, item._id)}
                      aria-label="Add to favorites"
                    >
                      <span className={`material-symbols-outlined ${favorites[item._id] ? 'icon-filled' : ''}`}>
                        favorite
                      </span>
                    </button>
                    {item.seller?.verificationStatus === 'approved' && (
                      <div className="badge badge-verified" style={{ position: 'absolute', bottom: '12px', left: '12px' }}>
                        <span className="material-symbols-outlined icon-filled" style={{ fontSize: '14px' }}>
                          verified
                        </span>
                        <span>Verified</span>
                      </div>
                    )}
                    {item.condition === 'new' && (
                      <div className="badge badge-new" style={{ position: 'absolute', top: '12px', left: '12px' }}>
                        NEW
                      </div>
                    )}
                  </div>
                  <div className="product-card-body">
                    <span className="product-card-category">{item.category}</span>
                    <h3 className="product-card-title">{item.title}</h3>
                    <div className="product-card-footer">
                      <span className="product-card-price">₵{item.price.toLocaleString()}</span>
                      <div className="product-card-location">
                        <span className="material-symbols-outlined">location_on</span>
                        <span>{item.pickupLocation || item.university}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}

              {/* Promotional Card inside grid */}
              <div className="home-promo-card">
                <span className="material-symbols-outlined home-promo-icon">verified_user</span>
                <h3 className="home-promo-title">Want to sell on campus?</h3>
                <p className="home-promo-desc">
                  Verify your Student ID to unlock listing creation and sell items to peers safely.
                </p>
                <Link
                  to={
                    !isAuthenticated
                      ? '/login'
                      : isVerifiedSeller
                        ? '/listings/create'
                        : '/profile'
                  }
                  className="home-promo-btn"
                >
                  {isAuthenticated && !isVerifiedSeller ? 'Get Verified to Sell' : 'List an Item'}
                </Link>
              </div>
            </div>
          )}

          {listings.length > 0 && (
            <div className="home-load-more">
              <Link to="/explore" className="btn btn-ghost">
                Browse All Listings
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
