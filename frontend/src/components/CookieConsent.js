import React, { useState, useEffect } from 'react';
import { dpdpTranslations } from './dpdpTranslations';
import './CookieConsent.css';

const STORAGE_KEY = 'dpdp_user_consent_v1';

export const getStoredConsent = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

const CookieConsent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [lang, setLang] = useState('en');

  // DPDP Consent Categories: Strictly necessary is mandatory, others default to false (un-ticked)
  const [strictlyNecessary] = useState(true);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const saved = getStoredConsent();
    if (!saved) {
      // First visit: Display the consent banner
      setIsOpen(true);
    } else {
      if (saved.language) setLang(saved.language);
      setAnalytics(Boolean(saved.analytics));
      setMarketing(Boolean(saved.marketing));
    }

    const handleOpenBanner = () => setIsOpen(true);
    window.addEventListener('open-cookie-banner', handleOpenBanner);
    return () => window.removeEventListener('open-cookie-banner', handleOpenBanner);
  }, []);

  const t = dpdpTranslations[lang] || dpdpTranslations.en;

  const saveConsent = (analyticsVal, marketingVal) => {
    const record = {
      strictlyNecessary: true,
      analytics: analyticsVal,
      marketing: marketingVal,
      language: lang,
      timestamp: new Date().toISOString(),
      actVersion: 'DPDP Act, 2023'
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    setAnalytics(analyticsVal);
    setMarketing(marketingVal);
    setIsOpen(false);

    // Notify other components or analytics scripts
    window.dispatchEvent(new CustomEvent('dpdp-consent-updated', { detail: record }));
  };

  const handleAcceptAll = () => saveConsent(true, true);
  const handleRejectNonEssential = () => saveConsent(false, false);
  const handleSavePreferences = () => saveConsent(analytics, marketing);

  const handleOpenPrivacyPolicy = (e) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('open-privacy-policy'));
  };

  return (
    <>
      {/* Persistent Floating Privacy Widget (DPDP Section 6(4) revocation & settings) */}
      <button
        type="button"
        className="dpdp-floating-trigger"
        onClick={() => setIsOpen(true)}
        title={t.badgeTitle}
        aria-label={t.badgeTitle}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
        <span>{t.badgeTitle}</span>
      </button>

      {/* Cookie Consent Modal Banner */}
      {isOpen && (
        <div className="dpdp-backdrop" role="dialog" aria-modal="true" aria-labelledby="dpdp-modal-title">
          <div className="dpdp-panel">
            <div className="dpdp-header">
              <div className="dpdp-header-left">
                <div className="dpdp-shield-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </div>
                <div className="dpdp-title-group">
                  <h3 id="dpdp-modal-title">{t.bannerTitle}</h3>
                  <span className="dpdp-badge-dpdp">DPDP Act, 2023 Compliant</span>
                </div>
              </div>

              <div className="dpdp-header-actions">
                <select
                  value={lang}
                  onChange={(e) => setLang(e.target.value)}
                  className="dpdp-lang-select"
                  aria-label="Select Language"
                >
                  <option value="en">English</option>
                  <option value="hi">हिन्दी (Hindi)</option>
                  <option value="ta">தமிழ் (Tamil)</option>
                </select>

                <button
                  type="button"
                  className="dpdp-close-btn"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="dpdp-body">
              <p className="dpdp-description">{t.bannerDescription}</p>

              <button
                type="button"
                className="dpdp-policy-text-btn"
                onClick={handleOpenPrivacyPolicy}
              >
                {t.privacyPolicyLink} →
              </button>

              <div className="dpdp-categories">
                {/* Strictly Necessary */}
                <div className="dpdp-card">
                  <div className="dpdp-card-header">
                    <div className="dpdp-card-info">
                      <span className="dpdp-card-title">{t.strictlyNecessaryTitle}</span>
                      <span className="dpdp-always-active-pill">{t.alwaysActive}</span>
                    </div>
                    <label className="dpdp-switch">
                      <input type="checkbox" checked={strictlyNecessary} disabled />
                      <span className="dpdp-slider"></span>
                    </label>
                  </div>
                  <p className="dpdp-card-desc">{t.strictlyNecessaryDesc}</p>
                </div>

                {/* Analytics & Performance */}
                <div className="dpdp-card">
                  <div className="dpdp-card-header">
                    <div className="dpdp-card-info">
                      <span className="dpdp-card-title">{t.analyticsTitle}</span>
                    </div>
                    <label className="dpdp-switch">
                      <input
                        type="checkbox"
                        checked={analytics}
                        onChange={(e) => setAnalytics(e.target.checked)}
                      />
                      <span className="dpdp-slider"></span>
                    </label>
                  </div>
                  <p className="dpdp-card-desc">{t.analyticsDesc}</p>
                </div>

                {/* Marketing */}
                <div className="dpdp-card">
                  <div className="dpdp-card-header">
                    <div className="dpdp-card-info">
                      <span className="dpdp-card-title">{t.marketingTitle}</span>
                    </div>
                    <label className="dpdp-switch">
                      <input
                        type="checkbox"
                        checked={marketing}
                        onChange={(e) => setMarketing(e.target.checked)}
                      />
                      <span className="dpdp-slider"></span>
                    </label>
                  </div>
                  <p className="dpdp-card-desc">{t.marketingDesc}</p>
                </div>
              </div>
            </div>

            <div className="dpdp-footer">
              <button
                type="button"
                className="dpdp-btn dpdp-btn-reject"
                onClick={handleRejectNonEssential}
              >
                {t.rejectNonEssential}
              </button>
              <button
                type="button"
                className="dpdp-btn dpdp-btn-save"
                onClick={handleSavePreferences}
              >
                {t.savePreferences}
              </button>
              <button
                type="button"
                className="dpdp-btn dpdp-btn-accept"
                onClick={handleAcceptAll}
              >
                {t.acceptAll}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CookieConsent;
