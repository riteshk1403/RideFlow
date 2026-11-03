import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { ADMIN_PHONE } from '../config/config';
import BrandLogo from '../components/BrandLogo';
import './DriverDashboard.css';

const DriverDashboard = () => {
  const navigate = useNavigate();
  const [currentDriver, setCurrentDriver] = useState(null);
  const [assignedRides, setAssignedRides] = useState([]);
  const [commissionData, setCommissionData] = useState({
    summary: { totalEarnings: 0, totalCommission: 0, paidCommission: 0, pendingCommission: 0 },
    rides: []
  });
  const [availability, setAvailability] = useState(true);
  const [activeTab, setActiveTab] = useState('RIDES'); // 'RIDES', 'COMMISSION'
  const [activeFilter, setActiveFilter] = useState('ACTIVE'); // 'ACTIVE', 'ALL'
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Complete Ride Modal
  const [completeRideModal, setCompleteRideModal] = useState(false);
  const [selectedRideToComplete, setSelectedRideToComplete] = useState(null);
  const [actualKmInput, setActualKmInput] = useState('');
  const [actualHoursInput, setActualHoursInput] = useState('');
  const [completeError, setCompleteError] = useState('');
  const [completedResult, setCompletedResult] = useState(null);

  // Support Request Modal
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportBookingId, setSupportBookingId] = useState('');
  const [supportProblemType, setSupportProblemType] = useState('Customer Issue');
  const [supportDescription, setSupportDescription] = useState('');
  const [supportSuccess, setSupportSuccess] = useState('');
  const [adminPhone, setAdminPhone] = useState(ADMIN_PHONE);

  useEffect(() => {
    API.get('/settings')
      .then((res) => {
        if (res.data?.contactPhone) setAdminPhone(res.data.contactPhone);
      })
      .catch(() => {});
  }, []);

  // Verify Authenticated Driver
  useEffect(() => {
    const stored = localStorage.getItem('rideflow_user') || localStorage.getItem('user');
    let driver = null;
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.role === 'DRIVER') {
          driver = parsed;
        }
      } catch (e) {}
    }
    if (!driver) {
      navigate('/auth', { replace: true });
      return;
    }
    setCurrentDriver(driver);
    setAvailability(driver.available !== undefined ? driver.available : true);
  }, [navigate]);

  // Fetch Assigned Rides
  const fetchDriverRides = useCallback(async (driverOrId) => {
    let dId = null;
    let phone = '';
    let email = '';
    if (typeof driverOrId === 'object' && driverOrId !== null) {
      dId = driverOrId.id || driverOrId._id;
      phone = driverOrId.phone || '';
      email = driverOrId.userEmail || driverOrId.email || '';
    } else if (typeof driverOrId === 'string') {
      dId = driverOrId;
      phone = currentDriver?.phone || '';
      email = currentDriver?.userEmail || currentDriver?.email || '';
    }
    if (!dId) return;
    try {
      const p = encodeURIComponent(phone);
      const em = encodeURIComponent(email);
      const res = await API.get(`/bookings/driver/${dId}?phone=${p}&email=${em}`);
      setAssignedRides(res.data);
    } catch (err) {
      console.error('Failed to fetch assigned driver rides:', err);
    }
  }, [currentDriver]);

  // Fetch Driver Commission History & Stats
  const fetchDriverCommissions = useCallback(async (driverOrId) => {
    let dId = null;
    let phone = '';
    let email = '';
    if (typeof driverOrId === 'object' && driverOrId !== null) {
      dId = driverOrId.id || driverOrId._id;
      phone = driverOrId.phone || '';
      email = driverOrId.userEmail || driverOrId.email || '';
    } else if (typeof driverOrId === 'string') {
      dId = driverOrId;
      phone = currentDriver?.phone || '';
      email = currentDriver?.userEmail || currentDriver?.email || '';
    }
    if (!dId) return;
    try {
      const p = encodeURIComponent(phone);
      const em = encodeURIComponent(email);
      const res = await API.get(`/commissions/driver/${dId}?phone=${p}&email=${em}`);
      setCommissionData(res.data);
    } catch (err) {
      console.error('Failed to fetch driver commissions:', err);
    }
  }, [currentDriver]);

  const pollRef = useRef(null);
  useEffect(() => {
    if (currentDriver?.id || currentDriver?._id) {
      fetchDriverRides(currentDriver);
      fetchDriverCommissions(currentDriver);
      pollRef.current = setInterval(() => {
        fetchDriverRides(currentDriver);
        fetchDriverCommissions(currentDriver);
      }, 4000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [currentDriver, fetchDriverRides, fetchDriverCommissions]);

  // Status Action Handlers
  const handleAcceptRide = async (bookingId) => {
    setLoading(true);
    setMessage('');
    try {
      await API.put(`/bookings/${bookingId}/accept`, {
        driverPhone: currentDriver.phone
      });
      setAvailability(false);
      const updatedUser = { ...currentDriver, available: false };
      setCurrentDriver(updatedUser);
      localStorage.setItem('rideflow_user', JSON.stringify(updatedUser));
      localStorage.setItem('user', JSON.stringify(updatedUser));

      setMessage('Ride accepted! Customer contact details are now unlocked.');
      fetchDriverRides(currentDriver.id);
    } catch (err) {
      setMessage('Failed to accept ride.');
    } finally {
      setLoading(false);
    }
  };

  const handleReachedPickup = async (bookingId) => {
    setLoading(true);
    try {
      await API.put(`/bookings/${bookingId}/reached`);
      setMessage('Marked: Reached Pickup Location.');
      fetchDriverRides(currentDriver.id);
    } catch (err) {
      setMessage('Failed to update status.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartRide = async (bookingId) => {
    setLoading(true);
    try {
      await API.put(`/bookings/${bookingId}/start`);
      setMessage('Ride has started. Safe journey!');
      fetchDriverRides(currentDriver.id);
    } catch (err) {
      setMessage('Failed to start ride.');
    } finally {
      setLoading(false);
    }
  };

  // Open Complete Ride Modal
  const openCompleteModal = (ride) => {
    setSelectedRideToComplete(ride);
    setActualKmInput('');
    setActualHoursInput('');
    setCompleteError('');
    setCompletedResult(null);
    setCompleteRideModal(true);
  };

  // Calculate & Complete Ride
  const handleCalculateAndComplete = async (e) => {
    e.preventDefault();
    setCompleteError('');

    const isDriverOnly = selectedRideToComplete?.vehicleOption === 'ONLY_DRIVER' ||
                         selectedRideToComplete?.vehicleOption === 'DRIVER_ONLY';

    let payload = {};
    if (isDriverOnly) {
      const hours = parseFloat(actualHoursInput);
      if (isNaN(hours) || hours <= 0) {
        setCompleteError('Please enter a valid actual service duration in hours (must be greater than 0).');
        return;
      }
      payload = { actualHours: hours, actualKm: 0 };
    } else {
      const km = parseFloat(actualKmInput);
      if (isNaN(km) || km <= 0) {
        setCompleteError('Please enter a valid actual distance in KM (must be greater than 0).');
        return;
      }
      payload = { actualKm: km, actualHours: 0 };
    }

    setLoading(true);
    try {
      const res = await API.put(`/bookings/${selectedRideToComplete.id}/complete`, payload);

      setCompletedResult(res.data);
      setAvailability(true);
      const updatedUser = { ...currentDriver, available: true };
      setCurrentDriver(updatedUser);
      localStorage.setItem('rideflow_user', JSON.stringify(updatedUser));
      localStorage.setItem('user', JSON.stringify(updatedUser));

      setMessage('Ride completed! Final fare and earnings calculated.');
      fetchDriverRides(currentDriver.id);
      fetchDriverCommissions(currentDriver.id);

      setTimeout(() => {
        setCompleteRideModal(false);
        setSelectedRideToComplete(null);
        setCompletedResult(null);
      }, 3000);
    } catch (err) {
      const errText = err.response?.data?.message || 'Failed to complete ride.';
      setCompleteError(errText);
    } finally {
      setLoading(false);
    }
  };

  // Open Maps Navigation
  const handleOpenPickupLocation = (booking) => {
    let mapUrl = '';
    if (booking.pickupLat && booking.pickupLng) {
      mapUrl = `https://www.google.com/maps/search/?api=1&query=${booking.pickupLat},${booking.pickupLng}`;
    } else {
      mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.pickup)}`;
    }
    window.open(mapUrl, '_blank', 'noopener,noreferrer');
  };

  // Submit Support Request
  const handleSubmitSupport = async (e) => {
    e.preventDefault();
    if (!supportDescription.trim()) return;

    try {
      await API.post('/support/create', {
        bookingId: supportBookingId.trim(),
        userId: currentDriver.id,
        userName: currentDriver.name,
        userRole: 'DRIVER',
        phone: currentDriver.phone,
        problemType: supportProblemType,
        description: supportDescription.trim()
      });

      setSupportSuccess('Support request submitted! Admin will contact you shortly.');
      setSupportDescription('');
      setTimeout(() => {
        setShowSupportModal(false);
        setSupportSuccess('');
      }, 1500);
    } catch (err) {
      alert('Failed to submit support request.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('rideflow_user');
    localStorage.removeItem('user');
    navigate('/');
  };

  const completedCount = assignedRides.filter((r) => r.status === 'COMPLETED').length;

  const filteredRides = assignedRides.filter((ride) => {
    if (activeFilter === 'ACTIVE') {
      return ['ASSIGNED', 'ACCEPTED', 'REACHED_PICKUP', 'STARTED'].includes(ride.status);
    }
    return true; // 'ALL'
  });

  const { totalEarnings, totalCommission, paidCommission, pendingCommission } = commissionData.summary || {
    totalEarnings: 0,
    totalCommission: 0,
    paidCommission: 0,
    pendingCommission: 0
  };

  return (
    <div className="driver-container">
      {/* Header */}
      <header className="dashboard-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <BrandLogo size="md" onClick={() => navigate('/driver')} />
          <span className="role-tag driver-tag">Driver Partner</span>
        </div>

        <div className="header-actions">
          {/* Call Admin */}
          <a href={`tel:${(adminPhone || ADMIN_PHONE).replace(/\s+/g, '')}`} className="call-admin-btn" title="Call Admin Support" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
            <span>Call Admin ({adminPhone || ADMIN_PHONE})</span>
          </a>

          <button
            type="button"
            className="report-prob-btn"
            onClick={() => {
              setSupportBookingId('');
              setShowSupportModal(true);
            }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            <span>Report Issue</span>
          </button>

          <div className="user-welcome">
            <span className="welcome-label">Driver:</span>
            <span className="user-name">{currentDriver?.name}</span>
          </div>

          <button className="logout-btn" onClick={handleLogout} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span>Logout</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          </button>
        </div>
      </header>

      <main className="driver-body">
        {/* Driver Profile & Availability Card */}
        <section className="driver-profile-card">
          <div className="driver-info-left">
            <div className="driver-big-avatar" style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8', fontSize: '1.4rem' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            </div>
            <div>
              <h3>{currentDriver?.name}</h3>
              <p className="driver-sub-info">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                  {currentDriver?.userEmail || currentDriver?.email}
                </span>
                <span>•</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                  {currentDriver?.phone || 'No phone'}
                </span>
                <span>•</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"></rect><line x1="7" y1="8" x2="17" y2="8"></line><line x1="7" y1="12" x2="13" y2="12"></line></svg>
                  License: {currentDriver?.licenseNumber || 'Verified'}
                </span>
              </p>
            </div>
          </div>

          <div className="driver-stats-right">
            <div className="driver-stat-box">
              <span className="stat-num">{completedCount}</span>
              <span className="stat-txt">Trips Completed</span>
            </div>
            <div className="driver-stat-box">
              <span className={`avail-pill ${availability ? 'available' : 'busy'}`}>
                <span className="dot"></span>
                {availability ? 'Available for Assignment' : 'Busy on Active Trip'}
              </span>
            </div>
          </div>
        </section>

        {/* COMMISSION SUMMARY CARDS */}
        <section className="driver-comm-summary-grid">
          <div className="comm-sum-card earnings">
            <div className="sum-icon" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"></rect><line x1="12" y1="8" x2="12" y2="16"></line><path d="M8 12h8"></path></svg>
            </div>
            <div className="sum-content">
              <span className="sum-label">Total Earnings</span>
              <h3 className="sum-val">₹{totalEarnings.toLocaleString('en-IN')}</h3>
              <span className="sum-sub">After commission deduction</span>
            </div>
          </div>

          <div className="comm-sum-card total-comm">
            <div className="sum-icon" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
            </div>
            <div className="sum-content">
              <span className="sum-label">Total Commission</span>
              <h3 className="sum-val">₹{totalCommission.toLocaleString('en-IN')}</h3>
              <span className="sum-sub">Calculated per vehicle rate</span>
            </div>
          </div>

          <div className="comm-sum-card paid-comm">
            <div className="sum-icon" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#34d399' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </div>
            <div className="sum-content">
              <span className="sum-label">Paid Commission</span>
              <h3 className="sum-val">₹{paidCommission.toLocaleString('en-IN')}</h3>
              <span className="sum-sub">Settled with admin</span>
            </div>
          </div>

          <div className="comm-sum-card pending-comm">
            <div className="sum-icon" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            </div>
            <div className="sum-content">
              <span className="sum-label">Pending Commission</span>
              <h3 className="sum-val">₹{pendingCommission.toLocaleString('en-IN')}</h3>
              <span className="sum-sub">Due to admin</span>
            </div>
          </div>
        </section>

        {message && (
          <div className="driver-alert-bar">
            <span>ℹ</span>
            <span>{message}</span>
            <button className="close-alert-btn" onClick={() => setMessage('')}>×</button>
          </div>
        )}

        {/* NAVIGATION TABS: RIDES vs COMMISSION HISTORY */}
        <div className="driver-nav-tabs">
          <button
            type="button"
            className={`driver-nav-tab ${activeTab === 'RIDES' ? 'active' : ''}`}
            onClick={() => setActiveTab('RIDES')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
            <span>Assigned Rides ({assignedRides.length})</span>
          </button>
          <button
            type="button"
            className={`driver-nav-tab ${activeTab === 'COMMISSION' ? 'active' : ''}`}
            onClick={() => setActiveTab('COMMISSION')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
            <span>Commission History ({commissionData.rides?.length || 0})</span>
          </button>
        </div>

        {/* TAB 1: ASSIGNED RIDES */}
        {activeTab === 'RIDES' && (
          <section className="glass-panel rides-panel">
            <div className="rides-header-bar">
              <div>
                <h2>Assigned Trips & Rides</h2>
                <p>Rides dispatched to you. Accept rides to reveal passenger contact information.</p>
              </div>
              <div className="filter-tabs">
                <button
                  type="button"
                  className={`filter-btn ${activeFilter === 'ACTIVE' ? 'active' : ''}`}
                  onClick={() => setActiveFilter('ACTIVE')}
                >
                  Active Rides ({assignedRides.filter((r) => ['ASSIGNED', 'ACCEPTED', 'REACHED_PICKUP', 'STARTED'].includes(r.status)).length})
                </button>
                <button
                  type="button"
                  className={`filter-btn ${activeFilter === 'ALL' ? 'active' : ''}`}
                  onClick={() => setActiveFilter('ALL')}
                >
                  All Trips ({assignedRides.length})
                </button>
              </div>
            </div>

            <div className="rides-grid">
              {filteredRides.length === 0 ? (
                <div className="driver-empty">
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto', color: '#818cf8' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  </div>
                  <h3>No assigned rides at the moment</h3>
                  <p>When the admin assigns a ride to you, it will appear here instantly.</p>
                </div>
              ) : (
                filteredRides.map((ride) => {
                  const isAcceptedOrBeyond = ['ACCEPTED', 'REACHED_PICKUP', 'STARTED', 'COMPLETED'].includes(ride.status);

                  return (
                    <div key={ride.id} className={`ride-card ${ride.status.toLowerCase()}`}>
                      <div className="ride-card-top">
                        <div>
                          <span className="booking-id-tag">ID: {ride.bookingId || ride.id}</span>
                          <h4 className="passenger-name" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                            <span>{ride.userName || 'Passenger'}</span>
                          </h4>
                        </div>
                        <span className={`status-badge ${ride.status.toLowerCase()}`}>
                          {ride.status}
                        </span>
                      </div>

                      <div className="ride-locations">
                        <div className="loc-point">
                          <span className="loc-icon green" style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
                          <div>
                            <span className="point-label">Pickup Location</span>
                            <p className="point-text">{ride.pickup}</p>
                          </div>
                        </div>
                        <div className="loc-divider"></div>
                        <div className="loc-point">
                          <span className="loc-icon red" style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }}></span>
                          <div>
                            <span className="point-label">Drop Destination</span>
                            <p className="point-text">{ride.destination}</p>
                          </div>
                        </div>
                      </div>

                      <div className="ride-specs">
                        <div className="spec-item">
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                            Date:
                          </span>
                          <strong>{ride.date}</strong>
                        </div>
                        <div className="spec-item">
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                            Time:
                          </span>
                          <strong>{ride.time}</strong>
                        </div>
                        <div className="spec-item">
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
                            {(ride.vehicleOption === 'ONLY_DRIVER' || ride.vehicleOption === 'DRIVER_ONLY') ? 'Customer Car:' : 'Vehicle:'}
                          </span>
                          <strong style={{ color: (ride.vehicleOption === 'ONLY_DRIVER' || ride.vehicleOption === 'DRIVER_ONLY') ? '#93c5fd' : 'inherit' }}>
                            {(ride.vehicleOption === 'ONLY_DRIVER' || ride.vehicleOption === 'DRIVER_ONLY')
                              ? (ride.customerCarName ? `${ride.customerCarName} (${ride.transmission || 'Manual'})` : ride.vehicleName || 'Customer Car')
                              : (ride.vehicleName || ride.vehicleType)}
                          </strong>
                        </div>
                        <div className="spec-item">
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
                            Ride Type:
                          </span>
                          <strong>{ride.rideType}</strong>
                        </div>
                        <div className="spec-item">
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                            Service:
                          </span>
                          <strong>
                            {ride.vehicleOption === 'ONLY_DRIVER' || ride.vehicleOption === 'DRIVER_ONLY'
                              ? 'Only Driver'
                              : 'Driver + Vehicle'}
                          </strong>
                        </div>
                        {(ride.description && (ride.vehicleOption === 'ONLY_DRIVER' || ride.vehicleOption === 'DRIVER_ONLY')) && (
                          <div className="spec-item" style={{ gridColumn: '1 / -1', background: 'rgba(59, 130, 246, 0.1)', padding: '6px 10px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#bfdbfe" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                            <span>Car Notes:</span>
                            <strong style={{ color: '#bfdbfe' }}>{ride.description}</strong>
                          </div>
                        )}
                      </div>

                      {/* Completed Ride Summary on Card */}
                      {ride.status === 'COMPLETED' && (
                        <div className="card-completed-summary">
                          <div className="comp-stat">
                            <span>{(ride.vehicleOption === 'ONLY_DRIVER' || ride.vehicleOption === 'DRIVER_ONLY') ? 'Duration:' : 'Actual KM:'}</span>
                            <strong>{(ride.vehicleOption === 'ONLY_DRIVER' || ride.vehicleOption === 'DRIVER_ONLY') ? `${ride.actualHours || 0} Hours` : `${ride.actualKm} KM`}</strong>
                          </div>
                          <div className="comp-stat">
                            <span>Final Fare:</span>
                            <strong>₹{ride.fare?.toLocaleString('en-IN')}</strong>
                          </div>
                          <div className="comp-stat">
                            <span>Earnings:</span>
                            <strong className="earn-color">₹{ride.driverEarnings?.toLocaleString('en-IN')}</strong>
                          </div>
                        </div>
                      )}

                      {/* CUSTOMER CONTACT (Strict Security Rule) */}
                      <div className="customer-contact-section">
                        {!isAcceptedOrBeyond ? (
                          <div className="locked-contact">
                            <span className="lock-icon" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                            </span>
                            <div>
                              <strong>Customer Phone Hidden</strong>
                              <p>Contact details will unlock after you accept this ride.</p>
                            </div>
                          </div>
                        ) : (
                          <div className="unlocked-contact">
                            <div className="cust-info">
                              <span className="call-avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                              </span>
                              <div>
                                <span className="cust-lbl">Customer Contact:</span>
                                <strong className="cust-val">{ride.userName} ({ride.userPhone})</strong>
                              </div>
                            </div>
                            {ride.userPhone && !ride.userPhone.includes('Locked') && (
                              <a href={`tel:${ride.userPhone}`} className="call-customer-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                                <span>Call Customer</span>
                              </a>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Driver Progressive Workflow Actions */}
                      <div className="ride-workflow-actions">
                        {ride.status === 'ASSIGNED' && (
                          <button
                            type="button"
                            className="action-btn accept"
                            onClick={() => handleAcceptRide(ride.id)}
                            disabled={loading}
                            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            <span>Accept Ride</span>
                          </button>
                        )}

                        {ride.status === 'ACCEPTED' && (
                          <div className="btn-group-2">
                            <button
                              type="button"
                              className="action-btn map"
                              onClick={() => handleOpenPickupLocation(ride)}
                              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line></svg>
                              <span>Open Location</span>
                            </button>
                            <button
                              type="button"
                              className="action-btn reached"
                              onClick={() => handleReachedPickup(ride.id)}
                              disabled={loading}
                              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                              <span>Reached Pickup</span>
                            </button>
                          </div>
                        )}

                        {ride.status === 'REACHED_PICKUP' && (
                          <div className="btn-group-2">
                            <button
                              type="button"
                              className="action-btn map"
                              onClick={() => handleOpenPickupLocation(ride)}
                              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line></svg>
                              <span>Open Location</span>
                            </button>
                            <button
                              type="button"
                              className="action-btn start"
                              onClick={() => handleStartRide(ride.id)}
                              disabled={loading}
                              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                              <span>Start Ride</span>
                            </button>
                          </div>
                        )}

                        {ride.status === 'STARTED' && (
                          <button
                            type="button"
                            className="action-btn complete"
                            onClick={() => openCompleteModal(ride)}
                            disabled={loading}
                            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
                            <span>Complete Ride</span>
                          </button>
                        )}

                        {ride.status === 'COMPLETED' && (
                          <div className="trip-completed-badge" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            <span>Trip Completed</span>
                          </div>
                        )}

                        {/* Card Issue Button */}
                        <button
                          type="button"
                          className="driver-report-btn"
                          onClick={() => {
                            setSupportBookingId(ride.bookingId || ride.id);
                            setShowSupportModal(true);
                          }}
                          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                          <span>Report Issue</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        )}

        {/* TAB 2: COMMISSION HISTORY */}
        {activeTab === 'COMMISSION' && (
          <section className="glass-panel comm-panel">
            <div className="panel-title-bar">
              <div>
                <h2>Driver Commission History</h2>
                <p>View final fare, commission deduction, and net earnings for all your completed trips.</p>
              </div>
            </div>

            {commissionData.rides?.length === 0 ? (
              <div className="driver-empty">
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto', color: '#818cf8' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                </div>
                <h3>No completed trips recorded yet</h3>
                <p>When you complete a ride and record actual KM, your commission breakdown will appear here.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="comm-table">
                  <thead>
                    <tr>
                      <th>Booking ID</th>
                      <th>Date</th>
                      <th>Vehicle</th>
                      <th>Duration / Distance</th>
                      <th>Final Fare</th>
                      <th>Comm %</th>
                      <th>Commission</th>
                      <th>Your Earnings</th>
                      <th>Paid Comm</th>
                      <th>Remaining</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissionData.rides.map((r) => (
                      <tr key={r.id}>
                        <td><span className="tbl-id">{r.bookingId || r.id}</span></td>
                        <td>{r.date}</td>
                        <td>{r.vehicleName || r.vehicleType}</td>
                        <td><strong>{(r.vehicleOption === 'ONLY_DRIVER' || r.vehicleOption === 'DRIVER_ONLY') ? `${r.actualHours || 0} Hours` : `${r.actualKm} KM`}</strong></td>
                        <td><strong>₹{r.fare?.toLocaleString('en-IN')}</strong></td>
                        <td>{r.commissionPercentage || 10}%</td>
                        <td>₹{r.commissionAmount?.toLocaleString('en-IN')}</td>
                        <td><strong className="earn-color">₹{r.driverEarnings?.toLocaleString('en-IN')}</strong></td>
                        <td>₹{r.commissionPaid?.toLocaleString('en-IN')}</td>
                        <td><span className={r.commissionRemaining > 0 ? "rem-badge-pending" : "rem-badge-zero"}>₹{r.commissionRemaining?.toLocaleString('en-IN')}</span></td>
                        <td>
                          <span className={`comm-status-pill ${String(r.commissionStatus || 'PENDING').toLowerCase().replace(' ', '-')}`}>
                            {r.commissionStatus || 'PENDING'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </main>

      {/* COMPLETE RIDE MODAL */}
      {completeRideModal && selectedRideToComplete && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
                <span>Complete Ride</span>
              </h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => setCompleteRideModal(false)}
                disabled={loading}
              >
                ×
              </button>
            </div>

            <div className="complete-ride-details">
              <div className="cr-row">
                <span>Booking ID:</span>
                <strong>{selectedRideToComplete.bookingId || selectedRideToComplete.id}</strong>
              </div>
              <div className="cr-row">
                <span>Customer:</span>
                <strong>{selectedRideToComplete.userName}</strong>
              </div>
              <div className="cr-row">
                <span>Pickup:</span>
                <p>{selectedRideToComplete.pickup}</p>
              </div>
              <div className="cr-row">
                <span>Destination:</span>
                <p>{selectedRideToComplete.destination}</p>
              </div>
              <div className="cr-row">
                <span>Vehicle:</span>
                <strong>{selectedRideToComplete.vehicleName || selectedRideToComplete.vehicleType}</strong>
              </div>
            </div>

            {completeError && (
              <div className="alert-box error">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                  {completeError}
                </span>
              </div>
            )}

            {completedResult ? (
              <div className="completed-result-card">
                <div className="cr-success-header">
                  <span>✓</span> Ride Completed Successfully!
                </div>
                <div className="result-stats-grid">
                  <div className="res-stat">
                    <span>Final Fare:</span>
                    <strong>₹{completedResult.fare?.toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="res-stat">
                    <span>Commission ({completedResult.commissionPercentage}%):</span>
                    <strong>₹{completedResult.commissionAmount?.toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="res-stat">
                    <span>Driver Earnings:</span>
                    <strong className="earn-color">₹{completedResult.driverEarnings?.toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="res-stat">
                    <span>{(selectedRideToComplete?.vehicleOption === 'ONLY_DRIVER' || selectedRideToComplete?.vehicleOption === 'DRIVER_ONLY') ? 'Duration Worked:' : 'Distance Completed:'}</span>
                    <strong>{(selectedRideToComplete?.vehicleOption === 'ONLY_DRIVER' || selectedRideToComplete?.vehicleOption === 'DRIVER_ONLY') ? `${completedResult.actualHours || 0} Hours` : `${completedResult.actualKm || 0} KM`}</strong>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCalculateAndComplete} className="modal-form">
                {(selectedRideToComplete?.vehicleOption === 'ONLY_DRIVER' || selectedRideToComplete?.vehicleOption === 'DRIVER_ONLY') ? (
                  <div className="form-group">
                    <label htmlFor="actualHours">Enter Actual Service Duration (Hours):</label>
                    <input
                      id="actualHours"
                      type="number"
                      step="0.5"
                      min="0.5"
                      placeholder="e.g. 5"
                      value={actualHoursInput}
                      onChange={(e) => setActualHoursInput(e.target.value)}
                      required
                      className="km-input"
                      autoFocus
                    />
                    <small className="field-hint">
                      Final fare & commission will be calculated automatically on an hourly & daily basis.
                    </small>
                  </div>
                ) : (
                  <div className="form-group">
                    <label htmlFor="actualKm">Enter Actual Completed Distance (KM):</label>
                    <input
                      id="actualKm"
                      type="number"
                      step="0.1"
                      min="1"
                      placeholder="e.g. 350"
                      value={actualKmInput}
                      onChange={(e) => setActualKmInput(e.target.value)}
                      required
                      className="km-input"
                      autoFocus
                    />
                    <small className="field-hint">
                      Final fare & commission will be calculated automatically based on the vehicle's package.
                    </small>
                  </div>
                )}

                <div className="modal-actions">
                  <button
                    type="button"
                    className="modal-cancel-btn"
                    onClick={() => setCompleteRideModal(false)}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="modal-save-btn calculate-btn" disabled={loading}>
                    {loading ? 'Calculating...' : 'Calculate & Complete Ride'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* SUPPORT MODAL */}
      {showSupportModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Driver Support / Report Problem</h3>
              <button type="button" className="modal-close" onClick={() => setShowSupportModal(false)}>×</button>
            </div>

            {supportSuccess && (
              <div className="alert-box success">
                <span>✓</span>
                <span>{supportSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSubmitSupport} className="modal-form">
              <div className="form-group">
                <label>Booking ID (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. RF202610010001"
                  value={supportBookingId}
                  onChange={(e) => setSupportBookingId(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Problem Category</label>
                <select
                  value={supportProblemType}
                  onChange={(e) => setSupportProblemType(e.target.value)}
                >
                  <option value="Customer Issue">Customer Issue</option>
                  <option value="Location Issue">Location Issue</option>
                  <option value="Vehicle Issue">Vehicle Issue</option>
                  <option value="Booking Issue">Booking Issue</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows={4}
                  placeholder="Describe what happened..."
                  value={supportDescription}
                  onChange={(e) => setSupportDescription(e.target.value)}
                  required
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="modal-cancel-btn" onClick={() => setShowSupportModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="modal-save-btn">
                  Submit Problem
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverDashboard;
