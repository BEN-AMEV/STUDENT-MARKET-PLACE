import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import api from '../services/api';
import './Profile.css';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const TABS = [
  { key: 'about', label: 'About', icon: 'person' },
  { key: 'payout', label: 'Payout Account', icon: 'payments' },
  { key: 'verification', label: 'Verification', icon: 'verified_user' },
  { key: 'listings', label: 'Listings', icon: 'storefront' },
  { key: 'reviews', label: 'Reviews', icon: 'rate_review' },
];

const GHANA_PROVIDERS = [
  { name: 'MTN Mobile Money', code: 'MTN', type: 'mobile_money' },
  { name: 'Telecel Cash (Vodafone)', code: 'VOD', type: 'mobile_money' },
  { name: 'AirtelTigo Money', code: 'ATL', type: 'mobile_money' },
  { name: 'Bank Account (Ghana)', code: '044', type: 'nuban' },
];

const resolveUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
};

const Profile = () => {
  const { user, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('about');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingId, setIsUploadingId] = useState(false);
  const [isSavingPayout, setIsSavingPayout] = useState(false);

  // Edit form state
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    department: user?.department || '',
    year: user?.year || '',
    bio: user?.bio || '',
    whatsappNumber: user?.whatsappNumber || '',
  });

  // Payout form state
  const [payoutForm, setPayoutForm] = useState({
    paymentType: user?.payoutDetails?.paymentType || 'mobile_money',
    bankCode: user?.payoutDetails?.bankCode || 'MTN',
    accountNumber: user?.payoutDetails?.accountNumber || '',
    accountName: user?.payoutDetails?.accountName || (user ? `${user.firstName} ${user.lastName}` : ''),
  });

  // Student ID upload
  const [idPreview, setIdPreview] = useState(null);
  const [idFile, setIdFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const avatarInputRef = useRef(null);
  const idInputRef = useRef(null);

  // ─── Handlers ─────────────────────────────────────────────

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel → reset form
      setFormData({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        department: user?.department || '',
        year: user?.year || '',
        bio: user?.bio || '',
        whatsappNumber: user?.whatsappNumber || '',
      });
    }
    setIsEditing(!isEditing);
  };

  const handleFormChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const { data } = await api.put('/users/me', formData);
      updateUser(data.data);
      toast.success('Profile updated!');
      setIsEditing(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Please select a JPEG, PNG, or WebP image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5 MB.');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const { data } = await api.post('/users/me/avatar', fd);
      updateUser(data.data);
      toast.success('Avatar updated!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Avatar upload failed.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Student ID file selection
  const handleIdFileSelect = (file) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Only JPEG, PNG, or WebP images are allowed.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('ID image must be under 10 MB.');
      return;
    }
    setIdFile(file);
    setIdPreview(URL.createObjectURL(file));
  };

  const handleIdInputChange = (e) => {
    handleIdFileSelect(e.target.files?.[0]);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    handleIdFileSelect(file);
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleClearIdPreview = () => {
    setIdFile(null);
    setIdPreview(null);
    if (idInputRef.current) idInputRef.current.value = '';
  };

  const handleSubmitStudentId = async () => {
    if (!idFile) {
      toast.error('Please select an image of your Student ID.');
      return;
    }
    setIsUploadingId(true);
    try {
      const fd = new FormData();
      fd.append('studentId', idFile);
      const { data } = await api.post('/users/me/verify-student', fd);
      updateUser(data.data);
      setIdFile(null);
      setIdPreview(null);
      toast.success('Student ID submitted for verification!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Submission failed.');
    } finally {
      setIsUploadingId(false);
    }
  };

  // ─── Derived ──────────────────────────────────────────────
  const verificationStatus = user?.verificationStatus || 'not_submitted';
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : '';

  // ─── Render Helpers ───────────────────────────────────────

  const renderAboutTab = () => {
    if (isEditing) {
      return (
        <form onSubmit={handleSaveProfile} className="profile-section animate-fade-in-up">
          <div className="profile-section-header">
            <h3 className="profile-section-title">
              <span className="material-symbols-outlined">edit</span>
              Edit Profile
            </h3>
          </div>

          <div className="profile-edit-grid">
            <div className="input-group">
              <label className="input-label">First Name</label>
              <input
                type="text"
                name="firstName"
                className="input-field"
                value={formData.firstName}
                onChange={handleFormChange}
                required
                maxLength={50}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Last Name</label>
              <input
                type="text"
                name="lastName"
                className="input-field"
                value={formData.lastName}
                onChange={handleFormChange}
                required
                maxLength={50}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Department</label>
              <input
                type="text"
                name="department"
                className="input-field"
                placeholder="e.g. Computer Science"
                value={formData.department}
                onChange={handleFormChange}
                maxLength={100}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Year of Study</label>
              <select
                name="year"
                className="input-field"
                value={formData.year}
                onChange={handleFormChange}
              >
                <option value="">Select year</option>
                <option value="1">Year 1</option>
                <option value="2">Year 2</option>
                <option value="3">Year 3</option>
                <option value="4">Year 4</option>
                <option value="5">Year 5+</option>
                <option value="postgrad">Postgraduate</option>
              </select>
            </div>

            <div className="input-group profile-edit-full">
              <label className="input-label">Bio</label>
              <textarea
                name="bio"
                className="input-field"
                placeholder="Write a short bio about yourself..."
                value={formData.bio}
                onChange={handleFormChange}
                maxLength={500}
                rows={4}
              />
              <span className="text-metadata color-outline" style={{ alignSelf: 'flex-end' }}>
                {formData.bio.length}/500
              </span>
            </div>

            <div className="input-group profile-edit-full">
              <label className="input-label">
                <span className="material-symbols-outlined" style={{ fontSize: '18px', verticalAlign: 'text-bottom', color: '#25D366' }}>chat</span>
                {' '}WhatsApp Number
              </label>
              <input
                type="tel"
                name="whatsappNumber"
                className="input-field"
                placeholder="e.g. 0501234567 or +233501234567"
                value={formData.whatsappNumber}
                onChange={handleFormChange}
                maxLength={20}
              />
              <span className="text-metadata color-outline" style={{ marginTop: '4px', fontSize: '12px' }}>
                Buyers will use this to contact you directly on WhatsApp. Ghanaian numbers starting with 0 are auto-formatted.
              </span>
            </div>

            <div className="profile-edit-actions">
              <button type="button" className="btn btn-ghost btn-small" onClick={handleEditToggle}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-small" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <span className="material-symbols-outlined animate-spin" style={{ fontSize: '18px' }}>
                      progress_activity
                    </span>
                    Saving…
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check</span>
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      );
    }

    return (
      <>
        {/* Bio */}
        <div className="profile-section animate-fade-in-up">
          <div className="profile-section-header">
            <h3 className="profile-section-title">
              <span className="material-symbols-outlined">info</span>
              Bio
            </h3>
            <button className="btn btn-ghost btn-small" onClick={handleEditToggle}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
              Edit
            </button>
          </div>
          {user?.bio ? (
            <p className="profile-bio">{user.bio}</p>
          ) : (
            <p className="profile-bio profile-bio-empty">
              No bio yet — click Edit to tell others about yourself.
            </p>
          )}
        </div>

        {/* Details */}
        <div className="profile-section animate-fade-in-up stagger-1">
          <div className="profile-section-header">
            <h3 className="profile-section-title">
              <span className="material-symbols-outlined">badge</span>
              Details
            </h3>
          </div>
          <div className="profile-info-grid">
            <div className="profile-info-item">
              <span className="profile-info-label">Email</span>
              <span className="profile-info-value">{user?.email}</span>
            </div>
            <div className="profile-info-item">
              <span className="profile-info-label">University</span>
              <span className="profile-info-value">{user?.university || '—'}</span>
            </div>
            <div className="profile-info-item">
              <span className="profile-info-label">Department</span>
              <span className="profile-info-value">{user?.department || '—'}</span>
            </div>
            <div className="profile-info-item">
              <span className="profile-info-label">Year</span>
              <span className="profile-info-value">
                {user?.year ? `Year ${user.year}` : '—'}
              </span>
            </div>
            <div className="profile-info-item">
              <span className="profile-info-label">Member Since</span>
              <span className="profile-info-value">{memberSince}</span>
            </div>
            <div className="profile-info-item">
              <span className="profile-info-label">Rating</span>
              <span className="profile-info-value">
                {user?.avgRating > 0 ? (
                  <>
                    <span className="material-symbols-outlined icon-filled" style={{ fontSize: '16px', color: '#f59e0b', verticalAlign: 'text-top' }}>
                      star
                    </span>{' '}
                    {user.avgRating.toFixed(1)} ({user.reviewCount})
                  </>
                ) : (
                  'No ratings yet'
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="profile-section animate-fade-in-up stagger-2">
          <div className="profile-section-header">
            <h3 className="profile-section-title">
              <span className="material-symbols-outlined">insights</span>
              Stats
            </h3>
          </div>
          <div className="profile-stats">
            <div className="profile-stat">
              <span className="profile-stat-value">{user?.reviewCount || 0}</span>
              <span className="profile-stat-label">Reviews</span>
            </div>
            <div className="profile-stat">
              <span className="profile-stat-value">
                {user?.avgRating ? user.avgRating.toFixed(1) : '0.0'}
              </span>
              <span className="profile-stat-label">Avg Rating</span>
            </div>
            <div className="profile-stat">
              <span className="profile-stat-value">
                {user?.isEmailVerified ? '✓' : '✗'}
              </span>
              <span className="profile-stat-label">Email</span>
            </div>
            <div className="profile-stat">
              <span className="profile-stat-value">
                {verificationStatus === 'approved' ? '✓' : '✗'}
              </span>
              <span className="profile-stat-label">Student ID</span>
            </div>
          </div>
        </div>
      </>
    );
  };

  const renderVerificationTab = () => {
    const statusConfig = {
      not_submitted: {
        className: 'verification-not-submitted',
        icon: 'upload_file',
        title: 'Student ID Not Submitted',
        text: 'Upload a clear photo of your Student ID card to get verified. A verified badge builds trust with buyers and sellers on campus.',
        showUpload: true,
      },
      pending: {
        className: 'verification-pending',
        icon: 'hourglass_top',
        title: 'Verification In Progress',
        text: 'Your Student ID has been submitted and is being reviewed by an admin. This usually takes 1–2 business days. You\'ll be notified once it\'s approved.',
        showUpload: false,
      },
      approved: {
        className: 'verification-approved',
        icon: 'check_circle',
        title: 'Student ID Verified',
        text: 'Your identity has been verified! You now have access to all platform features including selling, messaging, and secure payments.',
        showUpload: false,
      },
      rejected: {
        className: 'verification-rejected',
        icon: 'cancel',
        title: 'Verification Rejected',
        text: user?.verificationNote
          ? `Your submission was rejected: "${user.verificationNote}". Please upload a clearer image.`
          : 'Your submission was rejected. Please upload a clearer image of your Student ID.',
        showUpload: true,
      },
    };

    const config = statusConfig[verificationStatus] || statusConfig.not_submitted;

    return (
      <div className="profile-section animate-fade-in-up">
        <div className="profile-section-header">
          <h3 className="profile-section-title">
            <span className="material-symbols-outlined">verified_user</span>
            Student Verification
          </h3>
        </div>

        <div className={`verification-card ${config.className}`}>
          <div className="verification-card-icon">
            <span className="material-symbols-outlined icon-filled">{config.icon}</span>
          </div>
          <div className="verification-card-body">
            <h4 className="verification-card-title">{config.title}</h4>
            <p className="verification-card-text">{config.text}</p>

            {config.showUpload && (
              <>
                <div
                  className={`upload-dropzone ${dragOver ? 'drag-over' : ''}`}
                  onClick={() => idInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  <span className="material-symbols-outlined">cloud_upload</span>
                  <p className="upload-dropzone-text">
                    Drag & drop your Student ID here, or <strong>click to browse</strong>
                  </p>
                  <p className="upload-dropzone-hint">JPEG, PNG, or WebP • Max 5 MB</p>
                  <input
                    ref={idInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleIdInputChange}
                    style={{ display: 'none' }}
                  />
                </div>

                {idPreview && (
                  <div className="upload-preview">
                    <img src={idPreview} alt="Student ID preview" />
                    <button className="upload-preview-remove" onClick={handleClearIdPreview}>
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>
                )}

                {idFile && (
                  <div style={{ marginTop: 'var(--space-md)' }}>
                    <button
                      className="btn btn-primary btn-small"
                      onClick={handleSubmitStudentId}
                      disabled={isUploadingId}
                    >
                      {isUploadingId ? (
                        <>
                          <span className="material-symbols-outlined animate-spin" style={{ fontSize: '18px' }}>
                            progress_activity
                          </span>
                          Submitting…
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>send</span>
                          Submit for Verification
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}

            {verificationStatus === 'approved' && (
              <div style={{ marginTop: 'var(--space-sm)' }}>
                <span className="badge badge-verified">
                  <span className="material-symbols-outlined icon-filled" style={{ fontSize: '14px' }}>
                    verified
                  </span>
                  Student Verified
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const isVerifiedSeller = user?.isEmailVerified && user?.verificationStatus === 'approved';

  const renderListingsTab = () => (
    <div className="profile-section animate-fade-in-up">
      <div className="profile-section-header">
        <h3 className="profile-section-title">
          <span className="material-symbols-outlined">storefront</span>
          My Listings
        </h3>
        {isVerifiedSeller ? (
          <Link to="/listings/create" className="btn btn-primary btn-small">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
            New Listing
          </Link>
        ) : (
          <button className="btn btn-ghost btn-small" onClick={() => setActiveTab('verification')}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>lock</span>
            Get Verified to Sell
          </button>
        )}
      </div>
      <div className="profile-empty">
        <span className="material-symbols-outlined">inventory_2</span>
        <h4 className="profile-empty-title">
          {isVerifiedSeller ? 'No listings yet' : 'Seller Verification Required'}
        </h4>
        <p className="profile-empty-text">
          {isVerifiedSeller
            ? 'Start selling on campus by creating your first listing.'
            : 'You must submit and get your Student ID verified before you can post listings.'}
        </p>
        {!isVerifiedSeller && (
          <button
            className="btn btn-primary btn-small"
            style={{ marginTop: '12px' }}
            onClick={() => setActiveTab('verification')}
          >
            Verify Student ID Now
          </button>
        )}
      </div>
    </div>
  );

  const handleSavePayout = async (e) => {
    e.preventDefault();
    if (!payoutForm.accountNumber.trim() || !payoutForm.accountName.trim()) {
      toast.error('Please provide both account number and account name.');
      return;
    }
    setIsSavingPayout(true);
    try {
      const selectedProv = GHANA_PROVIDERS.find(p => p.code === payoutForm.bankCode);
      const paymentType = selectedProv?.type || 'mobile_money';

      const { data } = await api.post('/users/me/payout-account', {
        ...payoutForm,
        paymentType,
      });

      updateUser({
        ...user,
        payoutDetails: data.data.payoutDetails,
      });

      toast.success('Payout account connected successfully! 💰');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to connect payout account.');
    } finally {
      setIsSavingPayout(false);
    }
  };

  const renderPayoutTab = () => {
    const isConnected = !!user?.payoutDetails?.paystackRecipientCode;
    const currentProvider = GHANA_PROVIDERS.find(p => p.code === (user?.payoutDetails?.bankCode || 'MTN'));

    return (
      <div className="profile-section animate-fade-in-up">
        <div className="profile-section-header">
          <div>
            <h3 className="profile-section-title">
              <span className="material-symbols-outlined">payments</span>
              Seller Payout Settings
            </h3>
            <p className="text-body-sm color-on-surface-variant" style={{ marginTop: '4px' }}>
              Connect your Mobile Money or Bank Account to receive automatic payouts for your campus sales.
            </p>
          </div>
        </div>

        {/* Info / Escrow Policy Card */}
        <div className="card card-padded" style={{ backgroundColor: 'var(--color-surface-container-low)', marginBottom: '24px', borderLeft: '4px solid var(--color-primary)' }}>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: '26px' }}>verified</span>
            <div>
              <h4 className="text-body-md font-semibold" style={{ margin: 0 }}>Automated 24-Hour Seller Payouts</h4>
              <p className="text-body-sm color-on-surface-variant" style={{ marginTop: '4px', lineHeight: '1.5' }}>
                When a student buys your item online, funds are held in secure escrow. Once 24 hours elapse without complaint (or the buyer confirms receipt), our system automatically transfers your net earnings (97%) directly to your Mobile Money or Bank account via Paystack.
              </p>
            </div>
          </div>
        </div>

        {/* Current status */}
        {isConnected && (
          <div className="card card-padded" style={{ backgroundColor: 'rgba(37, 211, 102, 0.08)', border: '1px solid rgba(37, 211, 102, 0.3)', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <span className="badge badge-status-live" style={{ background: '#25D366', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>check_circle</span>
                  Active Payout Account
                </span>
                <h4 className="text-headline-sm" style={{ marginTop: '8px', marginBottom: '2px' }}>
                  {user.payoutDetails.accountName}
                </h4>
                <p className="text-body-sm color-outline">
                  {currentProvider?.name || user.payoutDetails.bankCode} • {user.payoutDetails.accountNumber}
                </p>
              </div>
              <span className="text-metadata color-outline" style={{ fontFamily: 'monospace' }}>
                ID: {user.payoutDetails.paystackRecipientCode}
              </span>
            </div>
          </div>
        )}

        {/* Setup Form */}
        <form onSubmit={handleSavePayout} className="profile-edit-form">
          <div className="profile-edit-grid">
            <div className="input-group">
              <label className="input-label">Payout Provider / Network</label>
              <select
                name="bankCode"
                className="input-field"
                value={payoutForm.bankCode}
                onChange={(e) => setPayoutForm({ ...payoutForm, bankCode: e.target.value })}
                required
              >
                {GHANA_PROVIDERS.map((prov) => (
                  <option key={prov.code} value={prov.code}>
                    {prov.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Account / Mobile Money Number</label>
              <input
                type="text"
                name="accountNumber"
                className="input-field"
                placeholder="e.g. 024XXXXXXX or 050XXXXXXX"
                value={payoutForm.accountNumber}
                onChange={(e) => setPayoutForm({ ...payoutForm, accountNumber: e.target.value })}
                required
              />
            </div>

            <div className="input-group profile-edit-full">
              <label className="input-label">Account Holder Full Name</label>
              <input
                type="text"
                name="accountName"
                className="input-field"
                placeholder="Must match the registered name on your MoMo or Bank"
                value={payoutForm.accountName}
                onChange={(e) => setPayoutForm({ ...payoutForm, accountName: e.target.value })}
                required
              />
              <span className="text-metadata color-outline" style={{ marginTop: '4px', fontSize: '12px' }}>
                Ensure this name matches your mobile money ID to prevent transfer failures.
              </span>
            </div>

            <div className="profile-edit-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSavingPayout}
              >
                {isSavingPayout ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                    Connecting to Paystack...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">account_balance_wallet</span>
                    {isConnected ? 'Update Payout Details' : 'Connect Payout Account'}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  };

  const renderReviewsTab = () => (
    <div className="profile-section animate-fade-in-up">
      <div className="profile-section-header">
        <h3 className="profile-section-title">
          <span className="material-symbols-outlined">rate_review</span>
          Reviews Received
        </h3>
      </div>
      <div className="profile-empty">
        <span className="material-symbols-outlined">reviews</span>
        <h4 className="profile-empty-title">No reviews yet</h4>
        <p className="profile-empty-text">
          Reviews from buyers will appear here after your first completed transaction.
        </p>
      </div>
    </div>
  );

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'about':
        return renderAboutTab();
      case 'payout':
        return renderPayoutTab();
      case 'verification':
        return renderVerificationTab();
      case 'listings':
        return renderListingsTab();
      case 'reviews':
        return renderReviewsTab();
      default:
        return renderAboutTab();
    }
  };

  // ─── Main Render ──────────────────────────────────────────

  return (
    <div className="container animate-fade-in">
      <div className="profile-page">
        {/* ── Profile Header ──────────────────────────────── */}
        <div className="profile-header">
          <div className="profile-banner">
            <div className="profile-banner-pattern" />
          </div>

          <div className="profile-header-body">
            {/* Avatar */}
            <div className="profile-avatar-wrapper">
              <div className="profile-avatar" style={{ position: 'relative' }}>
                {isUploadingAvatar && (
                  <div className="profile-loading-overlay">
                    <span className="material-symbols-outlined animate-spin" style={{ fontSize: '28px', color: 'var(--color-primary)' }}>
                      progress_activity
                    </span>
                  </div>
                )}
                {user?.avatarUrl ? (
                  <img src={resolveUrl(user.avatarUrl)} alt={`${user.firstName}'s avatar`} />
                ) : (
                  user?.firstName?.charAt(0).toUpperCase()
                )}
              </div>
              <label className="profile-avatar-upload" title="Change avatar">
                <span className="material-symbols-outlined">photo_camera</span>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarChange}
                />
              </label>
            </div>

            {/* Name & badges */}
            <div className="profile-name-row">
              <h1 className="profile-name">
                {user?.firstName} {user?.lastName}
              </h1>
              {verificationStatus === 'approved' && (
                <span className="badge badge-verified" title="Student Verified">
                  <span className="material-symbols-outlined icon-filled" style={{ fontSize: '14px' }}>
                    verified
                  </span>
                  Verified
                </span>
              )}
            </div>

            {/* Meta info */}
            <div className="profile-meta">
              <span className="profile-meta-item">
                <span className="material-symbols-outlined">school</span>
                {user?.university}
              </span>
              {user?.department && (
                <span className="profile-meta-item">
                  <span className="material-symbols-outlined">apartment</span>
                  {user.department}
                </span>
              )}
              <span className="profile-meta-item">
                <span className="material-symbols-outlined">calendar_month</span>
                Joined {memberSince}
              </span>
            </div>
          </div>
        </div>

        {/* ── Tabs ────────────────────────────────────────── */}
        <nav className="profile-tabs" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={activeTab === tab.key}
              className={`profile-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <span className="material-symbols-outlined">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>

        {/* ── Tab Content ─────────────────────────────────── */}
        {renderActiveTab()}
      </div>
    </div>
  );
};

export default Profile;
