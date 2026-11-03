import React, { useState, useEffect } from 'react';
import './PrivacyPolicyModal.css';

const PrivacyPolicyModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-privacy-policy', handleOpen);
    return () => window.removeEventListener('open-privacy-policy', handleOpen);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="pp-backdrop" role="dialog" aria-modal="true" aria-labelledby="pp-title">
      <div className="pp-modal">
        <div className="pp-header">
          <div className="pp-header-title">
            <div className="pp-icon-badge">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <div>
              <h2 id="pp-title">Privacy Policy & DPDP Notice</h2>
              <div className="pp-subtitle">
                Compliant with Digital Personal Data Protection Act, 2023 (DPDP Act, 2023) • Effective Date: October 2023
              </div>
            </div>
          </div>
          <button
            type="button"
            className="pp-close-btn"
            onClick={() => setIsOpen(false)}
            aria-label="Close Privacy Policy"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="pp-content">
          <div className="pp-intro-card">
            RideFlow Technologies ("RideFlow", "We", "Our", or "Us") serves as a <strong>Data Fiduciary</strong> under the Digital Personal Data Protection Act, 2023. We are committed to safeguarding your personal data with transparency, purpose limitation, and uncompromising security.
          </div>

          {/* Section 1 */}
          <div className="pp-section">
            <h3>1. Purpose of Personal Data Collection (Section 4 & 6)</h3>
            <p>We collect and process personal data exclusively for specified, lawful purposes directly tied to providing chauffeur and ride-hailing services:</p>
            <ul>
              <li><strong>Passenger Accounts:</strong> Name, verified email address, phone number, and pickup/destination coordinates to dispatch rides, calculate transparent fares, and process journey confirmations.</li>
              <li><strong>Chauffeur / Driver Accounts:</strong> Name, phone number, email address, commercial driving license number, vehicle details, and real-time GPS locations to match booking requests, verify driver authenticity, and ensure passenger security.</li>
              <li><strong>Customer Support & Inquiries:</strong> Communications history and query records to resolve transit complaints, refund requests, or service inquiries.</li>
            </ul>
          </div>

          {/* Section 2 */}
          <div className="pp-section">
            <h3>2. Lawful Grounds for Processing & Consent (Section 6)</h3>
            <p>
              Your personal data is processed solely on the basis of your <strong>free, specific, informed, unconditional, and unambiguous consent</strong> with a clear affirmative action (as mandated by Section 6(1) of the DPDP Act).
            </p>
            <p>
              We do not utilize pre-ticked checkboxes or bundled consent agreements. You retain full autonomy over non-essential processing (such as marketing communications and analytical cookies).
            </p>
          </div>

          {/* Section 3 */}
          <div className="pp-section">
            <h3>3. Your Statutory Rights as a Data Principal (Sections 11–14)</h3>
            <p>Under the DPDP Act 2023, you hold comprehensive rights regarding your personal data:</p>
            <ul>
              <li><strong>Right to Access Information (Section 11):</strong> Request a summary of personal data being processed, processing activities, and identities of data fiduciaries or data processors with whom your data has been shared.</li>
              <li><strong>Right to Correction & Completion (Section 12):</strong> Rectify inaccurate personal data, update obsolete information, or complete incomplete records.</li>
              <li><strong>Right to Erasure / Forgotten (Section 12):</strong> Mandate the erasure of your personal data when the original purpose of collection is fulfilled or when you withdraw your consent.</li>
              <li><strong>Right of Grievance Redressal (Section 13):</strong> Access a speedy, readily accessible grievance redressal mechanism provided by our designated Grievance Officer.</li>
              <li><strong>Right to Nominate (Section 14):</strong> Designate any individual who, in the event of death or incapacity, shall exercise your rights as a Data Principal.</li>
            </ul>
          </div>

          {/* Section 4 */}
          <div className="pp-section">
            <h3>4. Right to Withdraw Consent (Section 6(4))</h3>
            <p>
              You have the unconditional right to withdraw your consent at any time with ease comparable to granting it.
            </p>
            <p>
              You can withdraw consent by clicking the persistent <strong>"Privacy & Consent"</strong> widget located at the bottom-left corner of any page or by contacting our Grievance Redressal Officer. Upon withdrawal, we will cease processing your personal data within 48 hours, unless retention is legally obligated by Indian transport or taxation regulations.
            </p>
          </div>

          {/* Section 5 */}
          <div className="pp-section">
            <h3>5. Data Retention & Purpose Limitation (Section 8(7))</h3>
            <p>
              We adhere strictly to data minimization and purpose limitation. Personal data is retained only for the duration required to satisfy the operational purpose (or statutory tax/commercial transit requirements in India) and is thereafter permanently and securely erased or anonymized.
            </p>
          </div>

          {/* Section 6 */}
          <div className="pp-section">
            <h3>6. Designated Grievance Redressal Officer (Section 8(9) & Section 13)</h3>
            <p>
              If you have questions, complaints, or wish to exercise your statutory rights under the DPDP Act 2023, please reach out directly to our appointed Grievance Redressal Officer:
            </p>

            <div className="pp-officer-box">
              <div className="pp-officer-grid">
                <div className="pp-officer-item">
                  <span className="pp-officer-label">Designated Officer</span>
                  <span className="pp-officer-val">Shraddha K. (Data Protection & Privacy Officer)</span>
                </div>
                <div className="pp-officer-item">
                  <span className="pp-officer-label">Official Grievance Email</span>
                  <span className="pp-officer-val">
                    <a href="mailto:grievance@rideflow.in" style={{ color: '#818cf8', textDecoration: 'none' }}>
                      grievance@rideflow.in
                    </a>
                  </span>
                </div>
                <div className="pp-officer-item">
                  <span className="pp-officer-label">Turnaround Time</span>
                  <span className="pp-officer-val">Acknowledged in 24 hrs; resolved in 7 business days</span>
                </div>
                <div className="pp-officer-item">
                  <span className="pp-officer-label">Physical Office</span>
                  <span className="pp-officer-val">RideFlow Mobility HQ, Cyber City, Gurugram, India</span>
                </div>
              </div>
            </div>

            <p style={{ marginTop: '14px', fontSize: '0.85rem', color: '#94a3b8' }}>
              <strong>Escalation to Regulatory Authority:</strong> If you are dissatisfied with our Grievance Officer's resolution or if your grievance is not resolved within the prescribed timeline, you have the right under Section 13(3) of the Act to lodge a formal complaint with the <strong>Data Protection Board of India (DPBI)</strong>.
            </p>
          </div>
        </div>

        <div className="pp-footer">
          <button
            type="button"
            className="pp-btn-close"
            onClick={() => setIsOpen(false)}
          >
            I Understand & Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyModal;
