import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';
import BrandLogo from '../components/BrandLogo';
import './AuthPage.css';

const AuthPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [needsVerificationEmail, setNeedsVerificationEmail] = useState('');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regRole, setRegRole] = useState('USER');
  const [regPhone, setRegPhone] = useState('');
  const [regLicense, setRegLicense] = useState('');
  const [regConsent, setRegConsent] = useState(false);

  useEffect(() => {
    setErrorMsg('');
  }, []);

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    setErrorMsg('');
    setSuccessMsg('');
    setNeedsVerificationEmail('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setNeedsVerificationEmail('');

    if (!loginEmail || !loginPassword) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const response = await API.post('/users/login', {
        email: loginEmail.trim().toLowerCase(),
        password: loginPassword
      });

      const userData = response.data;
      localStorage.setItem('rideflow_user', JSON.stringify(userData));
      localStorage.setItem('user', JSON.stringify(userData));

      if (userData.role === 'ADMIN') {
        navigate('/admin');
      } else if (userData.role === 'DRIVER') {
        navigate('/driver');
      } else {
        navigate('/booking');
      }
    } catch (err) {
      if (err.response && err.response.data) {
        const data = err.response.data;
        if (data.needsVerification) {
          setNeedsVerificationEmail(data.email || loginEmail.trim());
          setErrorMsg(data.message || 'Please verify your email before logging in.');
        } else {
          setErrorMsg(data.message || 'Login failed. Please check your credentials.');
        }
      } else {
        setErrorMsg('Login failed. Please check your credentials or backend connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setNeedsVerificationEmail('');

    if (!regName.trim() || !regEmail.trim() || !regPassword) {
      setErrorMsg('Please fill in all mandatory fields.');
      return;
    }

    const cleanedPhone = regPhone.replace(/\D/g, '');
    if (cleanedPhone.length !== 10) {
      setErrorMsg('Phone number must contain exactly 10 digits.');
      return;
    }

    const hasUpper = /[A-Z]/.test(regPassword);
    const hasLower = /[a-z]/.test(regPassword);
    const hasDigit = /[0-9]/.test(regPassword);
    if (regPassword.length < 8 || !hasUpper || !hasLower || !hasDigit) {
      setErrorMsg('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.');
      return;
    }

    if (regRole === 'DRIVER' && !regLicense.trim()) {
      setErrorMsg('Driving license number is required for driver registration.');
      return;
    }

    if (!regConsent) {
      setErrorMsg('Under the DPDP Act 2023, you must explicitly consent to data processing before creating an account.');
      return;
    }

    setLoading(true);
    try {
      const response = await API.post('/users/register', {
        name: regName.trim(),
        email: regEmail.trim().toLowerCase(),
        password: regPassword,
        role: regRole,
        phone: cleanedPhone,
        licenseNumber: regLicense.trim()
      });

      setSuccessMsg(response.data.message || 'Registration successful! Verification code sent to your email.');
      const registeredEmail = regEmail.trim().toLowerCase();

      setTimeout(() => {
        const codeParam = response.data?.verificationCode ? `&code=${response.data.verificationCode}` : '';
        navigate(`/verify-email?email=${encodeURIComponent(registeredEmail)}${codeParam}`, {
          state: {
            email: registeredEmail,
            verificationCode: response.data?.verificationCode
          }
        });
      }, 1500);
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setErrorMsg(err.response.data.message);
      } else {
        setErrorMsg('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="glow-orb orb-1"></div>
      <div className="glow-orb orb-2"></div>
      <div className="glow-orb orb-3"></div>

      <div className="auth-card glass-panel">
        <div className="auth-header">
          <BrandLogo size="lg" onClick={() => navigate('/')} />
          <p className="brand-tagline">Executive Chauffeur & Fleet Platform</p>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => handleTabSwitch('login')}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => handleTabSwitch('register')}
          >
            Register
          </button>
        </div>

        {errorMsg && (
          <div className="alert-box error">
            <div className="alert-content">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" x2="12" y1="8" y2="12" />
                <line x1="12" x2="12.01" y1="16" y2="16" />
              </svg>
              <span>{errorMsg}</span>
            </div>
            {needsVerificationEmail && (
              <div className="verification-prompt">
                <Link
                  to={`/verify-email?email=${encodeURIComponent(needsVerificationEmail)}`}
                  className="verify-action-btn"
                >
                  Verify Email Now →
                </Link>
              </div>
            )}
          </div>
        )}

        {successMsg && (
          <div className="alert-box success">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>{successMsg}</span>
          </div>
        )}

        {activeTab === 'login' && (
          <form className="auth-form" onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="login-email">Email Address</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </span>
                <input
                  id="login-email"
                  type="email"
                  placeholder="name@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div className="label-with-action">
                <label htmlFor="login-password">Password</label>
                <Link to="/forgot-password" className="forgot-inline-link">Forgot Password?</Link>
              </div>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  id="login-password"
                  type={showLoginPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  style={{ paddingRight: '44px' }}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                  title={showLoginPassword ? 'Hide password' : 'Show password'}
                >
                  {showLoginPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m9.88 9.88a3 3 0 1 0 4.24 4.24" />
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                      <line x1="2" x2="22" y1="2" y2="22" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? (
                <span className="spinner-wrapper">
                  <span className="spinner"></span> Signing In...
                </span>
              ) : (
                'Sign In to RideFlow'
              )}
            </button>
          </form>
        )}

        {activeTab === 'register' && (
          <form className="auth-form" onSubmit={handleRegister}>
            <div className="form-group">
              <label htmlFor="reg-name">Full Name</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <input
                  id="reg-name"
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  autoComplete="name"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="reg-email">Email Address</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </span>
                <input
                  id="reg-email"
                  type="email"
                  placeholder="name@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="reg-phone">Phone Number (10 Digits)</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </span>
                <input
                  id="reg-phone"
                  type="tel"
                  placeholder="9876543210"
                  maxLength="10"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, ''))}
                  autoComplete="tel"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="reg-password">Password</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  id="reg-password"
                  type={showRegPassword ? 'text' : 'password'}
                  placeholder="Min 8 chars with upper, lower & digit"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  style={{ paddingRight: '44px' }}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                  title={showRegPassword ? 'Hide password' : 'Show password'}
                >
                  {showRegPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m9.88 9.88a3 3 0 1 0 4.24 4.24" />
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                      <line x1="2" x2="22" y1="2" y2="22" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              <small className="field-hint">
                Must contain at least 8 characters, 1 uppercase, 1 lowercase & 1 digit.
              </small>
            </div>

            <div className="form-group">
              <label>Select Account Type</label>
              <div className="role-selector">
                <label className={`role-card ${regRole === 'USER' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="role"
                    value="USER"
                    checked={regRole === 'USER'}
                    onChange={() => setRegRole('USER')}
                  />
                  <div className="role-content">
                    <span className="role-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </span>
                    <div>
                      <span className="role-title">Passenger</span>
                      <span className="role-desc">Book rides & chauffeurs</span>
                    </div>
                  </div>
                </label>

                <label className={`role-card ${regRole === 'DRIVER' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="role"
                    value="DRIVER"
                    checked={regRole === 'DRIVER'}
                    onChange={() => setRegRole('DRIVER')}
                  />
                  <div className="role-content">
                    <span className="role-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="m4.93 4.93 4.24 4.24" />
                        <path d="m14.83 9.17 4.24-4.24" />
                        <path d="M12 12v9" />
                        <circle cx="12" cy="12" r="2" />
                      </svg>
                    </span>
                    <div>
                      <span className="role-title">Chauffeur</span>
                      <span className="role-desc">Accept rides & earn</span>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {regRole === 'DRIVER' && (
              <div className="form-group">
                <label htmlFor="reg-license">Driving License Number</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="20" height="14" x="2" y="5" rx="2" />
                      <line x1="2" x2="22" y1="10" y2="10" />
                    </svg>
                  </span>
                  <input
                    id="reg-license"
                    type="text"
                    placeholder="e.g. DL-1420110012345"
                    value={regLicense}
                    onChange={(e) => setRegLicense(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            {/* Unbundled DPDP Act 2023 Mandatory Consent Notice */}
            <div className="dpdp-form-consent">
              <label className="dpdp-checkbox-container" htmlFor="reg-dpdp-consent">
                <input
                  type="checkbox"
                  id="reg-dpdp-consent"
                  checked={regConsent}
                  onChange={(e) => setRegConsent(e.target.checked)}
                />
                <span className="dpdp-consent-text">
                  I explicitly agree to the collection and processing of my personal details (name, email, phone number{regRole === 'DRIVER' ? ', driving license & vehicle records' : ''}) as outlined in the{' '}
                  <button
                    type="button"
                    className="dpdp-inline-link"
                    onClick={() => window.dispatchEvent(new CustomEvent('open-privacy-policy'))}
                  >
                    DPDP Privacy Policy
                  </button>
                  {' '}to create my account and dispatch transport services.
                </span>
              </label>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? (
                <span className="spinner-wrapper">
                  <span className="spinner"></span> Creating Account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>
        )}

        <div className="auth-footer-links">
          <Link to="/" className="home-link">← Welcome Page</Link>
          <Link to="/verify-email" className="verify-link">Verify Email Code</Link>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
