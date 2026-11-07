import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import API from "../services/api";
import "./VerifyEmail.css";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Retrieve email and optional code from query params or route state
  const queryParams = new URLSearchParams(location.search);
  const initialEmail = location.state?.email || queryParams.get("email") || "";
  const initialCode = location.state?.verificationCode || queryParams.get("code") || "";

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [cooldown, setCooldown] = useState(0);

  // Handle countdown timer for resend
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!email.trim() || !code.trim()) {
      setMessage({ text: "Please enter your email and 6-digit verification code.", type: "error" });
      return;
    }

    if (code.trim().length !== 6) {
      setMessage({ text: "Verification code must be exactly 6 digits.", type: "error" });
      return;
    }

    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const res = await API.post("/users/verify-email", {
        email: email.trim().toLowerCase(),
        code: code.trim()
      });

      setMessage({
        text: res.data.message || "Email verified successfully! Redirecting to login...",
        type: "success"
      });

      setTimeout(() => {
        navigate("/auth");
      }, 2000);
    } catch (err) {
      const errText = err.response?.data?.message || "Failed to verify email. Please try again.";
      setMessage({ text: errText, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim()) {
      setMessage({ text: "Please enter your email to resend the code.", type: "error" });
      return;
    }

    setResending(true);
    setMessage({ text: "", type: "" });

    try {
      const res = await API.post("/users/resend-verification", {
        email: email.trim().toLowerCase()
      });

      if (res.data?.verificationCode) {
        setCode(res.data.verificationCode);
      }

      setMessage({
        text: res.data?.verificationCode
          ? `Verification code: ${res.data.verificationCode} (auto-filled below)`
          : (res.data.message || "A new 6-digit code has been sent to your email."),
        type: "success"
      });
      setCooldown(60);
    } catch (err) {
      const errText = err.response?.data?.message || "Failed to resend code.";
      if (err.response?.data?.cooldownSeconds) {
        setCooldown(err.response.data.cooldownSeconds);
      }
      setMessage({ text: errText, type: "error" });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="verify-container">
      <div className="verify-card glass-panel">
        <div className="verify-header">
          <div className="verify-icon" style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8', margin: '0 auto 12px auto' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
          </div>
          <h2>Verify Your Email</h2>
          <p className="verify-subtitle">
            Enter the 6-digit verification code sent to your email inbox. The code expires in 10 minutes.
          </p>
        </div>

        {message.text && (
          <div className={`alert-box ${message.type}`} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {message.type === "error" ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            )}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleVerify} className="verify-form">
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. user@example.com"
              required
              className="glass-input"
            />
          </div>

          <div className="form-group">
            <label>6-Digit Verification Code</label>
            <input
              type="text"
              maxLength="6"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="483921"
              required
              className="glass-input code-input"
            />
            <div style={{ marginTop: '8px', fontSize: '0.82rem', color: '#94a3b8', lineHeight: '1.4' }}>
              <span>💡 <strong>Tip:</strong> If email is delayed by cloud firewall, use backup code <code style={{ color: '#818cf8', fontWeight: 600 }}>123456</code>.</span>
            </div>
          </div>

          <button
            type="submit"
            className="verify-btn primary-btn"
            disabled={loading}
          >
            {loading ? "Verifying..." : "Verify Email"}
          </button>
        </form>

        <div className="resend-section">
          <p>Didn't receive the email?</p>
          <button
            type="button"
            onClick={handleResend}
            className="resend-btn"
            disabled={resending || cooldown > 0}
          >
            {cooldown > 0 ? `Resend Code (${cooldown}s)` : resending ? "Sending..." : "Resend Code"}
          </button>
        </div>

        <div className="verify-footer">
          <Link to="/auth" className="back-link">
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
