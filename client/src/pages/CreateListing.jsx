import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import './CreateListing.css';

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
  'UPSA',
  'Other'
];

const CreateListing = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isVerifiedSeller = user?.isEmailVerified && user?.verificationStatus === 'approved';

  if (!isVerifiedSeller) {
    return (
      <div className="container animate-fade-in" style={{ paddingTop: '100px', paddingBottom: '60px', textAlign: 'center' }}>
        <div className="card card-padded" style={{ maxWidth: '540px', margin: '0 auto' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--color-tertiary)' }}>
            lock
          </span>
          <h2 className="text-headline-sm" style={{ marginTop: '16px' }}>Verification Required</h2>
          <p className="text-body-md color-on-surface-variant" style={{ marginTop: '8px' }}>
            You must be a verified student seller to create a listing on CampusMarket.
          </p>
          <button
            className="btn btn-primary"
            style={{ marginTop: '20px' }}
            onClick={() => navigate('/profile')}
          >
            Get Verified to Sell
          </button>
        </div>
      </div>
    );
  }

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form states
  const [type, setType] = useState('product'); // product or service
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [condition, setCondition] = useState('new');
  const [description, setDescription] = useState('');
  const [university, setUniversity] = useState('University of Ghana');
  const [pickupLocation, setPickupLocation] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState(user?.whatsappNumber || '');
  const [images, setImages] = useState([]);

  const handleImageAdd = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (images.length >= 5) {
      toast.error('You can upload up to 5 images only.');
      return;
    }

    // Creating mock object URL for frontend display
    const previewUrl = URL.createObjectURL(file);
    setImages([...images, { file, previewUrl }]);
    toast.success('Image added!');
  };

  const handleImageRemove = (index) => {
    const newImages = [...images];
    URL.revokeObjectURL(newImages[index].previewUrl);
    newImages.splice(index, 1);
    setImages(newImages);
    toast.success('Image removed.');
  };

  const handleNextStep = () => {
    if (currentStep === 1 && !type) {
      toast.error('Please select a listing type to continue.');
      return;
    }
    if (currentStep === 2) {
      if (!title.trim() || title.trim().length < 3) {
        toast.error('Please enter a title with at least 3 characters.');
        return;
      }
      if (!category) {
        toast.error('Please select a category.');
        return;
      }
      if (!price || isNaN(price) || parseFloat(price) <= 0) {
        toast.error('Please enter a valid positive price.');
        return;
      }
      if (!description.trim() || description.trim().length < 10) {
        toast.error('Please enter a description with at least 10 characters.');
        return;
      }
    }
    setCurrentStep(currentStep + 1);
  };

  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pickupLocation.trim()) {
      toast.error('Please specify a meetup or pickup location.');
      return;
    }

    setLoading(true);
    try {
      // Map condition display values to backend enum values
      const conditionMap = { 'New': 'new', 'Like New': 'like_new', 'Used': 'used' };
      const mappedCondition = type === 'service' ? 'n/a' : (conditionMap[condition] || 'new');

      // Build multipart FormData
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('price', parseFloat(price));
      formData.append('type', type);
      formData.append('condition', mappedCondition);
      formData.append('category', category);
      formData.append('university', university);
      formData.append('pickupLocation', pickupLocation.trim());
      if (whatsappNumber.trim()) {
        formData.append('whatsappNumber', whatsappNumber.trim());
      }

      // Append image files
      for (const img of images) {
        formData.append('images', img.file);
      }

      const { data } = await api.post('/listings', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Listing published successfully!');
      // Navigate to the new listing's detail page
      navigate(`/listings/${data.data._id}`);
    } catch (error) {
      const apiErrors = error.response?.data?.errors;
      const message = apiErrors && apiErrors.length > 0
        ? apiErrors.map((err) => err.message).join('. ')
        : error.response?.data?.message || 'Failed to create listing.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-container animate-fade-in">
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h1 className="text-headline-lg create-title">List an Item</h1>
        <p className="create-subtitle">Reach verified student buyers on your campus</p>
      </div>

      {/* Steps indicator */}
      <div className="create-steps">
        <div className={`create-step-item ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
          {currentStep > 1 ? <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check</span> : '1'}
        </div>
        <div className={`create-step-item ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
          {currentStep > 2 ? <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check</span> : '2'}
        </div>
        <div className={`create-step-item ${currentStep >= 3 ? 'active' : ''}`}>
          3
        </div>
      </div>

      {/* Step Contents */}
      <div className="card card-padded">
        <form onSubmit={handleSubmit}>
          {/* STEP 1: Select Type */}
          {currentStep === 1 && (
            <div className="create-section">
              <h2 className="text-headline-sm">Select Listing Type</h2>
              <div className="create-type-grid">
                <div
                  className={`create-type-card ${type === 'product' ? 'active' : ''}`}
                  onClick={() => setType('product')}
                >
                  <span className="material-symbols-outlined create-type-icon">shopping_bag</span>
                  <div>
                    <h3 className="text-headline-sm">Physical Product</h3>
                    <p className="text-body-sm color-on-surface-variant" style={{ marginTop: '4px' }}>
                      Textbooks, electronics, clothing, dorm decor, bikes, microwave
                    </p>
                  </div>
                </div>

                <div
                  className={`create-type-card ${type === 'service' ? 'active' : ''}`}
                  onClick={() => setType('service')}
                >
                  <span className="material-symbols-outlined create-type-icon">handyman</span>
                  <div>
                    <h3 className="text-headline-sm">Service or Skill</h3>
                    <p className="text-body-sm color-on-surface-variant" style={{ marginTop: '4px' }}>
                      Tutoring, photography, graphic design, writing, room cleaning
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Main Details */}
          {currentStep === 2 && (
            <div className="create-section">
              <h2 className="text-headline-sm">Listing Details</h2>

              {/* Title */}
              <div className="input-group">
                <label className="input-label" htmlFor="title">Listing Title</label>
                <input
                  type="text"
                  id="title"
                  className="input-field"
                  placeholder="e.g. MacBook Air M2 2022"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={70}
                  required
                />
              </div>

              {/* Category & Price */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div className="input-group">
                  <label className="input-label" htmlFor="category">Category</label>
                  <select
                    id="category"
                    className="input-field"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                  >
                    <option value="">Select Category</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="price">Price (₵)</label>
                  <input
                    type="number"
                    id="price"
                    className="input-field"
                    placeholder="e.g. 550"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    min="1"
                    required
                  />
                </div>
              </div>

              {/* Condition (Only for products) */}
              {type === 'product' && (
                <div className="input-group">
                  <label className="input-label">Condition</label>
                  <div className="create-condition-group">
                    {['New', 'Like New', 'Used'].map((cond) => (
                      <button
                        key={cond}
                        type="button"
                        onClick={() => setCondition(cond)}
                        className={`create-condition-pill ${condition === cond ? 'active' : ''}`}
                      >
                        {cond}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="input-group">
                <label className="input-label" htmlFor="description">Description</label>
                <textarea
                  id="description"
                  className="input-field"
                  placeholder="Describe your item or service details, specifications, features, and why you are selling it..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  style={{ height: 'auto', padding: '12px' }}
                  required
                ></textarea>
              </div>

              {/* Photo Uploader */}
              <div className="input-group">
                <label className="input-label">Photos (Up to 5)</label>
                <div className="create-uploader-grid">
                  {images.map((img, index) => (
                    <div key={index} className="create-image-preview animate-scale-in">
                      <img src={img.previewUrl} alt={`Upload ${index + 1}`} />
                      <button
                        type="button"
                        onClick={() => handleImageRemove(index)}
                        className="create-image-remove"
                        aria-label="Remove image"
                      >
                        <span className="material-symbols-outlined">close</span>
                      </button>
                    </div>
                  ))}

                  {images.length < 5 && (
                    <label className="create-uploader-card">
                      <span className="material-symbols-outlined create-uploader-icon">add_a_photo</span>
                      <span className="text-metadata">Add Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageAdd}
                        style={{ display: 'none' }}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Location & Publish */}
          {currentStep === 3 && (
            <div className="create-section">
              <h2 className="text-headline-sm">Meetup & Pickup Info</h2>

              {/* University */}
              <div className="input-group">
                <label className="input-label" htmlFor="university">University Campus</label>
                <select
                  id="university"
                  className="input-field"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  required
                >
                  {UNIVERSITIES.map((univ) => (
                    <option key={univ} value={univ}>{univ}</option>
                  ))}
                </select>
              </div>

              {/* Pickup location description */}
              <div className="input-group">
                <label className="input-label" htmlFor="pickupLocation">Meetup Location details</label>
                <input
                  type="text"
                  id="pickupLocation"
                  className="input-field"
                  placeholder="e.g. Balme Library main doors or North Hall Lounge"
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  required
                />
                <span className="input-hint">
                  <span className="material-symbols-outlined">security</span>
                  For your safety, always pick a public, well-lit place on campus.
                </span>
              </div>

              {/* WhatsApp contact */}
              <div className="input-group">
                <label className="input-label" htmlFor="whatsappNumber">
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', verticalAlign: 'text-bottom', color: '#25D366' }}>chat</span>
                  {' '}WhatsApp Contact Number
                </label>
                <input
                  type="tel"
                  id="whatsappNumber"
                  className="input-field"
                  placeholder="e.g. 0501234567 or +233501234567"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  maxLength={20}
                />
                <span className="input-hint">
                  <span className="material-symbols-outlined">info</span>
                  Buyers will use this to contact you on WhatsApp. Leave blank to use your profile number.
                </span>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="create-form-nav">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                className="btn btn-ghost"
                disabled={loading}
              >
                Back
              </button>
            ) : (
              <div />
            )}

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="btn btn-primary"
              >
                Continue
              </button>
            ) : (
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                    Publishing...
                  </>
                ) : (
                  <>
                    Publish Listing
                    <span className="material-symbols-outlined">campaign</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateListing;
