import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(formData.email, formData.password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="auth-page">
      {/* Atmospheric Background */}
      <div className="auth-bg-blob auth-bg-blob-1"></div>
      <div className="auth-bg-blob auth-bg-blob-2"></div>

      <main className="auth-container animate-fade-in">
        {/* Identity Section */}
        <div className="auth-identity">
          <div className="auth-logo-box">
            <span className="material-symbols-outlined icon-filled auth-logo-icon">school</span>
          </div>
          <h1 className="text-headline-lg auth-app-name">CampusMarket</h1>
          <p className="color-on-surface-variant">
            The secure marketplace for your university community.
          </p>
        </div>

        {/* Auth Card */}
        <div className="auth-card">
          <h2 className="text-headline-sm auth-card-title">Sign In</h2>

          <form className="auth-form" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="input-group">
              <label className="input-label" htmlFor="email">University Email</label>
              <div className="input-wrapper">
                <span className="material-symbols-outlined input-icon">alternate_email</span>
                <input
                  id="email"
                  type="email"
                  name="email"
                  className="input-field has-icon-left"
                  placeholder="name@university.edu"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="input-group">
              <div className="auth-password-header">
                <label className="input-label" htmlFor="password">Password</label>
                <Link to="/forgot-password" className="auth-forgot-link text-metadata">
                  Forgot Password?
                </Link>
              </div>
              <div className="input-wrapper">
                <span className="material-symbols-outlined input-icon">lock</span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className="input-field has-icon-left has-icon-right"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="input-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary btn-full auth-submit-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined animate-spin" style={{ fontSize: '20px' }}>
                    progress_activity
                  </span>
                  Signing in...
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                    arrow_forward
                  </span>
                </>
              )}
            </button>
          </form>

          {/* SSO Divider */}
          <div className="auth-divider">
            <hr className="divider" />
          </div>

          <button className="btn btn-ghost btn-full auth-sso-btn">
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google"
              width="20"
              height="20"
            />
            <span>Continue with Student Portal (SSO)</span>
          </button>
        </div>

        {/* Trust Badge */}
        <div className="auth-footer">
          <div className="trust-badge">
            <span className="material-symbols-outlined icon-filled" style={{ fontSize: '16px' }}>
              verified_user
            </span>
            <span>End-to-end encrypted & .edu verified</span>
          </div>
          <p className="text-metadata color-outline auth-footer-text">
            New to CampusMarket?{' '}
            <Link to="/register" className="auth-footer-link">Create an account</Link>
          </p>
        </div>
      </main>

      {/* Footer Links */}
      <footer className="auth-page-footer">
        <a href="#">Terms of Service</a>
        <a href="#">Privacy Policy</a>
        <a href="#">Cookie Settings</a>
      </footer>
    </div>
  );
};

export default Login;
