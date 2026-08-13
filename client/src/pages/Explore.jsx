import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api from '../services/api';
import { resolveImageUrl } from '../utils/imageUrl';
import './Explore.css';

const CATEGORIES = [
  'Textbooks & Study Materials',
  'Electronics & Gadgets',
  'Fashion & Clothing',
  'Food & Beverages',
  'Services',
  'Events & Entertainment',
  'Housing & Roommates',
  'Miscellaneous'
];

const UNIVERSITIES = [
  'University of Ghana',
  'KNUST',
  'University of Cape Coast',
  'Ashesi University',
  'UPSA'
];

const Explore = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchParamQuery = searchParams.get('search') || '';
  const categoryParam = searchParams.get('category') || '';

  // Local filter states
  const [searchQuery, setSearchQuery] = useState(searchParamQuery);
  const [selectedCategories, setSelectedCategories] = useState(
    categoryParam ? [categoryParam] : []
  );
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedConditions, setSelectedConditions] = useState([]);
  const [selectedUniversities, setSelectedUniversities] = useState([]);
  const [sortOption, setSortOption] = useState('Newest Arrivals');
  const [favorites, setFavorites] = useState({});

  // Data states
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  // Map sort display value to backend enum
  const sortMap = {
    'Newest Arrivals': 'newest',
    'Price: Low to High': 'price_asc',
    'Price: High to Low': 'price_desc',
    'Most Popular': 'popular',
  };

  // Map condition display value to backend enum
  const conditionMap = {
    'New': 'new',
    'Like New': 'like_new',
    'Used': 'used',
  };

  // Fetch listings from the API
  const fetchListings = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };

      if (searchParamQuery) params.search = searchParamQuery;
      if (selectedCategories.length === 1) params.category = selectedCategories[0];
      if (selectedConditions.length === 1) params.condition = conditionMap[selectedConditions[0]] || selectedConditions[0];
      if (selectedUniversities.length === 1) params.university = selectedUniversities[0];
      if (minPrice) params.minPrice = parseFloat(minPrice);
      if (maxPrice) params.maxPrice = parseFloat(maxPrice);
      params.sort = sortMap[sortOption] || 'newest';

      const { data } = await api.get('/listings', { params });
      setListings(data.data || []);
      setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (error) {
      console.error('Failed to fetch listings:', error);
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, [searchParamQuery, selectedCategories, selectedConditions, selectedUniversities, minPrice, maxPrice, sortOption]);

  // Refetch when filters change
  useEffect(() => {
    fetchListings(1);
  }, [fetchListings]);

  // Sync search input with URL param
  useEffect(() => {
    setSearchQuery(searchParamQuery);
  }, [searchParamQuery]);

  // Sync category from URL param
  useEffect(() => {
    if (categoryParam && !selectedCategories.includes(categoryParam)) {
      setSelectedCategories([categoryParam]);
    }
  }, [categoryParam]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchParams(searchQuery ? { search: searchQuery } : {});
  };

  const handleCategoryChange = (cat) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleConditionChange = (cond) => {
    setSelectedConditions(prev =>
      prev.includes(cond) ? prev.filter(c => c !== cond) : [...prev, cond]
    );
  };

  const handleUniversityChange = (univ) => {
    setSelectedUniversities(prev =>
      prev.includes(univ) ? prev.filter(u => u !== univ) : [...prev, univ]
    );
  };

  const handleFavoriteToggle = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategories([]);
    setMinPrice('');
    setMaxPrice('');
    setSelectedConditions([]);
    setSelectedUniversities([]);
    setSearchParams({});
  };

  // Client-side filtering for multi-select (API only supports single category/condition/university)
  let filteredListings = listings;

  if (selectedCategories.length > 1) {
    filteredListings = filteredListings.filter(item =>
      selectedCategories.includes(item.category)
    );
  }

  if (selectedConditions.length > 1) {
    const mappedConditions = selectedConditions.map(c => conditionMap[c] || c);
    filteredListings = filteredListings.filter(item =>
      mappedConditions.includes(item.condition)
    );
  }

  if (selectedUniversities.length > 1) {
    filteredListings = filteredListings.filter(item =>
      selectedUniversities.includes(item.university)
    );
  }

  // Helper: get the first image URL for a listing
  const getListingImage = (item) => {
    if (item.images && item.images.length > 0) {
      const raw = item.images[0].thumbnail || item.images[0].url;
      return resolveImageUrl(raw);
    }
    return 'https://images.unsplash.com/photo-1560472355-536de3962603?w=600&h=450&fit=crop';
  };

  return (
    <div className="explore-container animate-fade-in">
      {/* Search Header */}
      <form onSubmit={handleSearchSubmit} className="explore-search-box">
        <input
          type="text"
          className="explore-search-input"
          placeholder="Search items by name or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button type="submit" className="btn btn-primary explore-search-btn">
          Search
        </button>
      </form>

      {/* Main Grid layout */}
      <div className="explore-layout">
        {/* Sidebar Filters */}
        <aside className="explore-sidebar">
          <div className="explore-filter-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
              <span className="text-label-caps" style={{ color: 'var(--color-on-surface)' }}>Filters</span>
              <button onClick={clearAllFilters} className="explore-clear-btn">
                Clear All
              </button>
            </div>

            {/* Categories */}
            <div className="explore-filter-section">
              <h4 className="explore-filter-title">Categories</h4>
              <div className="explore-filter-list">
                {CATEGORIES.map(cat => (
                  <label key={cat} className="explore-filter-option">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat)}
                      onChange={() => handleCategoryChange(cat)}
                    />
                    <span>{cat}</span>
                  </label>
                ))}
              </div>
            </div>

            <hr className="divider" style={{ margin: '16px 0' }} />

            {/* Price Range */}
            <div className="explore-filter-section">
              <h4 className="explore-filter-title">Price Range (₵)</h4>
              <div className="explore-price-inputs">
                <input
                  type="number"
                  className="explore-price-input"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
                <span className="color-outline">-</span>
                <input
                  type="number"
                  className="explore-price-input"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>
            </div>

            <hr className="divider" style={{ margin: '16px 0' }} />

            {/* Condition */}
            <div className="explore-filter-section">
              <h4 className="explore-filter-title">Condition</h4>
              <div className="explore-filter-list">
                {['New', 'Like New', 'Used'].map(cond => (
                  <label key={cond} className="explore-filter-option">
                    <input
                      type="checkbox"
                      checked={selectedConditions.includes(cond)}
                      onChange={() => handleConditionChange(cond)}
                    />
                    <span>{cond}</span>
                  </label>
                ))}
              </div>
            </div>

            <hr className="divider" style={{ margin: '16px 0' }} />

            {/* Campuses */}
            <div className="explore-filter-section">
              <h4 className="explore-filter-title">University Campuses</h4>
              <div className="explore-filter-list">
                {UNIVERSITIES.map(univ => (
                  <label key={univ} className="explore-filter-option">
                    <input
                      type="checkbox"
                      checked={selectedUniversities.includes(univ)}
                      onChange={() => handleUniversityChange(univ)}
                    />
                    <span>{univ}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Product Grid Feed */}
        <div className="explore-feed">
          <div className="explore-feed-header">
            <h3 className="text-body-sm color-on-surface-variant">
              Showing <strong>{filteredListings.length}</strong> {pagination.total > filteredListings.length ? `of ${pagination.total} ` : ''}items
            </h3>
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
            <div className="card card-padded text-center" style={{ padding: '64px 0' }}>
              <span className="material-symbols-outlined animate-spin" style={{ fontSize: '48px', color: 'var(--color-primary)' }}>
                progress_activity
              </span>
              <p style={{ marginTop: '16px' }}>Loading listings...</p>
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="card card-padded text-center" style={{ padding: '64px 0' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '64px', color: 'var(--color-outline)', opacity: 0.5 }}>
                search_off
              </span>
              <h3 className="text-headline-sm" style={{ marginTop: '16px' }}>No matches found</h3>
              <p className="color-on-surface-variant" style={{ maxWidth: '350px', margin: '8px auto 24px auto' }}>
                Try relaxing your search terms or clearing your sidebar filters to see more results.
              </p>
              <button onClick={clearAllFilters} className="btn btn-primary">
                Clear All Filters
              </button>
            </div>
          ) : (
            <>
              <div className="product-grid">
                {filteredListings.map(item => (
                  <Link key={item._id} to={`/listings/${item._id}`} className="product-card">
                    <div className="product-card-image">
                      <img
                        src={getListingImage(item)}
                        alt={item.title}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1560472355-536de3962603?w=600&h=450&fit=crop';
                        }}
                      />
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
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '32px' }}>
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => fetchListings(page)}
                      className={`btn ${page === pagination.page ? 'btn-primary' : 'btn-outline'}`}
                      style={{ minWidth: '40px', padding: '8px 12px' }}
                    >
                      {page}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Explore;
