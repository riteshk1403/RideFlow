import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';
import BrandLogo from '../components/BrandLogo';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [devCode, setDevCode] = useState('');

  const handleSendResetCode = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setDevCode('');

    if (!email.trim()) {
      setErrorMsg('Please enter your registered email address.');
      return;
    }

    setLoading(true);
    try {
      const response = await API.post('/users/forgot-password', {
        email: email.trim()
      });

      setSuccessMsg(response.data.message || 'A password reset code has been sent.');
      const resetCode = response.data.resetCode || response.data.devCode;
      if (resetCode) {
        setDevCode(resetCode);
      }

      setTimeout(() => {
        navigate(`/reset-password?email=${encodeURIComponent(email.trim())}${resetCode ? `&code=${resetCode}` : ''}`);
      }, 2500);
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setErrorMsg(err.response.data.message);
      } else {
        setErrorMsg('Failed to send reset code. Please verify your email.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-container">
      <div className="glow-orb orb-1"></div>
      <div className="glow-orb orb-2"></div>

      <div className="forgot-card">
        <div className="forgot-header">
          <BrandLogo size="lg" onClick={() => navigate('/')} />
          <h2>Forgot Password?</h2>
          <p>Enter your registered email address to receive a secure one-time verification code.</p>
        </div>

        {errorMsg && (
          <div className="alert-box error">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" x2="12" y1="8" y2="12" />
              <line x1="12" x2="12.01" y1="16" y2="16" />
            </svg>
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="alert-box success">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <div>
              <p style={{ margin: 0 }}>{successMsg}</p>
              {devCode && (
                <div className="dev-code-hint">
                  <strong>Verification Code:</strong> <code>{devCode}</code>
                </div>
              )}
              <p className="redirect-note">Redirecting to Reset Password screen...</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSendResetCode} className="forgot-form">
          <div className="form-group">
            <label htmlFor="forgot-email">Email Address</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </span>
              <input
                id="forgot-email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? (
              <span className="spinner-wrapper">
                <span className="spinner"></span> Sending Code...
              </span>
            ) : (
              'Send Verification Code'
            )}
          </button>

          <div className="forgot-footer-links">
            <Link to="/auth" className="sub-link">
              ← Back to Sign In
            </Link>
            <Link to="/reset-password" className="sub-link">
              Already have a code?
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
