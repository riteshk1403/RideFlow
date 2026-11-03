import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { ADMIN_PHONE } from '../config/config';
import BrandLogo from '../components/BrandLogo';
import './WelcomePage.css';

const WelcomePage = () => {
  const navigate = useNavigate();
  const [contactPhone, setContactPhone] = useState(ADMIN_PHONE);
  const [contactEmail, setContactEmail] = useState('support@rideflow.com');
  const [heroMode, setHeroMode] = useState('CHAUFFEUR');

  useEffect(() => {
    API.get('/settings')
      .then((res) => {
        if (res.data?.contactPhone) setContactPhone(res.data.contactPhone);
        if (res.data?.contactEmail) setContactEmail(res.data.contactEmail);
      })
      .catch(() => {});
  }, []);

  const handleGetStarted = () => {
    navigate('/auth');
  };

  const handleExploreServices = () => {
    const el = document.getElementById('services-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="welcome-container">
      <div className="glow-orb orb-1"></div>
      <div className="glow-orb orb-2"></div>
      <div className="glow-orb orb-3"></div>

      <header className="welcome-nav">
        <BrandLogo onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />

        <div className="nav-actions">
          <a href={`tel:${contactPhone.replace(/\s+/g, '')}`} className="nav-contact-btn" title="Call Admin Support">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <span>{contactPhone}</span>
          </a>
          <button type="button" className="nav-login-btn" onClick={() => navigate('/auth')}>
            Sign In
          </button>
          <button type="button" className="nav-signup-btn" onClick={() => navigate('/auth')}>
            Book Ride
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>
      </header>

      <section className="welcome-hero-split">
        <div className="hero-split-left">
          <div className="hero-pill-badge">
            <span className="pill-pulse"></span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Verified Chauffeurs & Executive Fleet
          </div>

          <h1 className="hero-heading">
            Your Journey.<br />
            <span>Our Responsibility.</span>
          </h1>

          <p className="hero-subtitle">
            Hire verified, police-cleared chauffeurs for your personal vehicle, or reserve our curated luxury fleet with instant dispatch and guaranteed transparent pricing.
          </p>

          <div className="hero-mode-switcher">
            <button
              type="button"
              className={`mode-switch-btn ${heroMode === 'CHAUFFEUR' ? 'active' : ''}`}
              onClick={() => setHeroMode('CHAUFFEUR')}
            >
              <div className="mode-btn-icon-wrapper">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="m4.93 4.93 4.24 4.24" />
                  <path d="m14.83 9.17 4.24-4.24" />
                  <path d="M12 12v9" />
                  <circle cx="12" cy="12" r="2" />
                </svg>
              </div>
              <div className="mode-btn-text">
                <strong>Hire Driver Only</strong>
                <small>For your personal car (Manual / Automatic)</small>
              </div>
            </button>
            <button
              type="button"
              className={`mode-switch-btn ${heroMode === 'CAB' ? 'active' : ''}`}
              onClick={() => setHeroMode('CAB')}
            >
              <div className="mode-btn-icon-wrapper">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 10.7 2 11.3 2 12v4c0 .6.4 1 1 1h2" />
                  <circle cx="7" cy="17" r="2" />
                  <circle cx="17" cy="17" r="2" />
                </svg>
              </div>
              <div className="mode-btn-text">
                <strong>Rent Cab + Driver</strong>
                <small>Sedans, SUVs, Luxury & Outstation</small>
              </div>
            </button>
          </div>

          <div className="hero-cta-group">
            <button type="button" className="hero-primary-btn" onClick={handleGetStarted}>
              {heroMode === 'CHAUFFEUR' ? 'Book Chauffeur For My Car' : 'Reserve Executive Ride'}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
            <button type="button" className="hero-secondary-btn" onClick={handleExploreServices}>
              Explore Fleet & Pricing
            </button>
          </div>

          <div className="hero-trust-bar">
            <div className="trust-stat">
              <div className="stat-heading">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="#fbbf24" stroke="#fbbf24" strokeWidth="1">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <strong>4.98 / 5</strong>
              </div>
              <span>Customer Satisfaction</span>
            </div>
            <div className="trust-divider"></div>
            <div className="trust-stat">
              <div className="stat-heading">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <polyline points="9 12 11 14 15 10" />
                </svg>
                <strong>100% Certified</strong>
              </div>
              <span>Police-Cleared Chauffeurs</span>
            </div>
            <div className="trust-divider"></div>
            <div className="trust-stat">
              <div className="stat-heading">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <strong>15-Min Arrival</strong>
              </div>
              <span>Fast Urban Dispatch</span>
            </div>
          </div>
        </div>

        <div className="hero-split-right">
          <div className="hero-scene-stage">
            <div className="scene-image-wrapper">
              <img
                src={
                  heroMode === 'CHAUFFEUR'
                    ? 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1200&q=85'
                    : 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=85'
                }
                alt={heroMode === 'CHAUFFEUR' ? 'Professional Chauffeur' : 'Executive Sedan and Chauffeur'}
                className="scene-main-photo"
              />
              <div className="scene-overlay-gradient"></div>

              <div className="floating-badge driver-badge">
                <div className="badge-avatar-box">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="m4.93 4.93 4.24 4.24" />
                    <path d="m14.83 9.17 4.24-4.24" />
                    <path d="M12 12v9" />
                    <circle cx="12" cy="12" r="2" />
                  </svg>
                </div>
                <div className="badge-info">
                  <div className="badge-title-row">
                    <strong>Rajesh Sharma</strong>
                    <span className="badge-verified-tag">Verified Chauffeur</span>
                  </div>
                  <span className="badge-sub-text">4.97 Rating (1,840 trips) • Police Cleared</span>
                  <div className="badge-live-pulse">
                    <span className="live-dot-green"></span>
                    <span>Arrived at Pickup Location</span>
                  </div>
                </div>
              </div>

              <div className="floating-badge customer-badge">
                <div className="badge-avatar-box customer-avatar">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div className="badge-info">
                  <div className="badge-title-row">
                    <strong>Priya M.</strong>
                    <span className="badge-role-tag">Passenger</span>
                  </div>
                  <span className="badge-sub-text">
                    {heroMode === 'CHAUFFEUR' ? 'Personal Car: Hyundai Creta (Automatic)' : 'Selected: Mercedes E-Class Sedan'}
                  </span>
                  <span className="badge-route-tag">Airport ➔ Business Bay</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="services-section" className="section-block">
        <div className="section-header">
          <h2>Why Choose RideFlow</h2>
          <p>Engineered for effortless corporate travel, personal chauffeur service, and privacy-first coordination.</p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-box">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <h3>Seamless Booking</h3>
            <p>Book with GPS pickup detection, clear package fares, and instant booking confirmation in seconds.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <polyline points="9 12 11 14 15 10" />
              </svg>
            </div>
            <h3>Certified Chauffeurs</h3>
            <p>Every driver undergoes strict background verification and driving assessment for complete peace of mind.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="3 11 22 2 13 21 11 13 3 11" />
              </svg>
            </div>
            <h3>Live Ride Tracking</h3>
            <p>Follow status milestones from driver dispatch to destination arrival with audible chime alerts.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </div>
            <h3>Dedicated Admin Support</h3>
            <p>Direct telephone assistance and responsive ticket resolution for riders and drivers around the clock.</p>
          </div>
        </div>
      </section>

      <section className="section-block how-it-works-section">
        <div className="section-header">
          <h2>How It Works</h2>
          <p>Streamlined four-step dispatch connecting passengers and chauffeurs safely.</p>
        </div>

        <div className="workflow-steps">
          <div className="workflow-step">
            <span className="step-num">01</span>
            <h4>Create Account</h4>
            <p>Register as a passenger or chauffeur partner with email verification.</p>
          </div>

          <div className="workflow-arrow">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>

          <div className="workflow-step">
            <span className="step-num">02</span>
            <h4>Select Service</h4>
            <p>Choose Chauffeur Only for your personal car, or book our premium fleet.</p>
          </div>

          <div className="workflow-arrow">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>

          <div className="workflow-step">
            <span className="step-num">03</span>
            <h4>Chauffeur Dispatched</h4>
            <p>The platform assigns the nearest available certified chauffeur.</p>
          </div>

          <div className="workflow-arrow">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>

          <div className="workflow-step">
            <span className="step-num">04</span>
            <h4>Smooth Journey</h4>
            <p>Chauffeur arrives on time, verifies your ride, and delivers a comfortable travel experience.</p>
          </div>
        </div>
      </section>

      <section className="section-block">
        <div className="section-header">
          <h2>Curated Fleet Categories</h2>
          <p>Explore vehicles ready for urban travel, outstation business, and luxury events.</p>
        </div>

        <div className="vehicle-showcase-grid">
          <div className="showcase-card">
            <div className="showcase-img-box">
              <img src="https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80" alt="Executive Sedan" />
              <span className="showcase-badge">SEDAN</span>
            </div>
            <div className="showcase-details">
              <h4>Executive Sedan</h4>
              <p>4 Seats • Climate Control • Comfortable city and airport transfers</p>
            </div>
          </div>

          <div className="showcase-card">
            <div className="showcase-img-box">
              <img src="https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80" alt="Premium SUV" />
              <span className="showcase-badge">SUV</span>
            </div>
            <div className="showcase-details">
              <h4>Premium SUV</h4>
              <p>7 Seats • High Clearance • Spacious family and highway travel</p>
            </div>
          </div>

          <div className="showcase-card">
            <div className="showcase-img-box">
              <img src="https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=600&q=80" alt="Luxury Fleet" />
              <span className="showcase-badge">LUXURY</span>
            </div>
            <div className="showcase-details">
              <h4>Luxury Class</h4>
              <p>4 Seats • Handcrafted Interiors • Corporate and VIP hospitality</p>
            </div>
          </div>

          <div className="showcase-card">
            <div className="showcase-img-box">
              <img src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80" alt="Vintage Classics" />
              <span className="showcase-badge">VINTAGE</span>
            </div>
            <div className="showcase-details">
              <h4>Vintage Classics</h4>
              <p>Timeless aesthetic for weddings and memorable milestones</p>
            </div>
          </div>

          <div className="showcase-card">
            <div className="showcase-img-box">
              <img src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80" alt="Group Traveller" />
              <span className="showcase-badge">TRAVELLER</span>
            </div>
            <div className="showcase-details">
              <h4>Group Traveller</h4>
              <p>12+ Seats • Executive group travel and delegations</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="welcome-footer">
        <div className="footer-top">
          <BrandLogo size="sm" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />

          <div className="footer-links">
            <a href={`tel:${contactPhone.replace(/\s+/g, '')}`} className="footer-link">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <span>{contactPhone}</span>
            </a>
            <a href={`mailto:${contactEmail}`} className="footer-link">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              <span>{contactEmail}</span>
            </a>
            <button type="button" className="footer-link-btn" onClick={() => navigate('/auth')}>
              Sign In
            </button>
            <button type="button" className="footer-link-btn" onClick={() => navigate('/auth')}>
              Register
            </button>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2026 RideFlow Mobility Technologies. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default WelcomePage;
