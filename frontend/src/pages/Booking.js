import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { ADMIN_PHONE } from '../config/config';
import BrandLogo from '../components/BrandLogo';
import './Booking.css';

const Booking = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);

  // Form Fields
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [pickup, setPickup] = useState('');
  const [pickupLat, setPickupLat] = useState(null);
  const [pickupLng, setPickupLng] = useState(null);
  const [locating, setLocating] = useState(false);
  const [destination, setDestination] = useState('');
  const [rideDate, setRideDate] = useState('');
  const [rideTime, setRideTime] = useState('');
  const [rideType, setRideType] = useState('LOCAL'); // 'LOCAL' or 'OUTSTATION'
  const [vehicleOption, setVehicleOption] = useState('DRIVER_AND_VEHICLE'); // 'ONLY_DRIVER' or 'DRIVER_AND_VEHICLE'
  const [customerCarName, setCustomerCarName] = useState('');
  const [transmission, setTransmission] = useState('MANUAL'); // 'MANUAL' or 'AUTOMATIC'
  const [carDescription, setCarDescription] = useState('');

  // Vehicles
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Bookings list & filter
  const [myBookings, setMyBookings] = useState([]);
  const [historyFilter, setHistoryFilter] = useState('ALL'); // 'ALL', 'UPCOMING', 'ACTIVE', 'COMPLETED', 'CANCELLED'
  const [loading, setLoading] = useState(false);
  const [createdBooking, setCreatedBooking] = useState(null);
  const [formError, setFormError] = useState('');

  // Support Request Modal
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportBookingId, setSupportBookingId] = useState('');
  const [supportProblemType, setSupportProblemType] = useState('Driver Issue');
  const [supportDescription, setSupportDescription] = useState('');
  const [supportSuccess, setSupportSuccess] = useState('');

  // Profile Modal
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  // Platform System Settings
  const [systemSettings, setSystemSettings] = useState({
    contactPhone: ADMIN_PHONE,
    driverOnlyMinDailyPrice: 1200,
    driverOnlyBasePrice: 600,
    driverOnlyIncludedHours: 4,
    driverOnlyExtraHourRate: 100,
    driverOnlyCommissionPercentage: 15
  });

  useEffect(() => {
    API.get('/settings')
      .then((res) => {
        if (res.data) setSystemSettings(res.data);
      })
      .catch(() => {});
  }, []);

  // Route protection
  // Verify Authenticated Customer
  useEffect(() => {
    const stored = localStorage.getItem('rideflow_user') || localStorage.getItem('user');
    let customer = null;
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.role === 'USER') {
          customer = parsed;
        }
      } catch (e) {}
    }
    if (!customer) {
      navigate('/auth', { replace: true });
      return;
    }
    setCurrentUser(customer);
    if (customer.phone) setPhone(customer.phone);
    setProfileName(customer.name || '');
    setProfilePhone(customer.phone || '');
  }, [navigate]);

  // Fetch Vehicles
  const fetchVehicles = useCallback(async () => {
    try {
      const res = await API.get('/vehicles/all');
      setVehicles(res.data);
      if (res.data.length > 0 && !selectedVehicle) {
        const firstAvailable = res.data.find((v) => v.available !== false) || res.data[0];
        setSelectedVehicle(firstAvailable);
      }
    } catch (err) {
      console.error('Vehicle loading failed:', err);
    }
  }, [selectedVehicle]);

  // Fetch User Bookings
  const fetchMyBookings = useCallback(async (userEmail) => {
    if (!userEmail) return;
    try {
      const res = await API.get(`/bookings/user/${userEmail}`);
      setMyBookings(res.data);
    } catch (err) {
      console.error('Failed to fetch user bookings:', err);
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  // Polling every 4 seconds
  const pollTimerRef = useRef(null);
  useEffect(() => {
    if (currentUser?.userEmail || currentUser?.email) {
      const email = currentUser.userEmail || currentUser.email;
      fetchMyBookings(email);

      pollTimerRef.current = setInterval(() => {
        fetchMyBookings(email);
      }, 4000);
    }
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [currentUser, fetchMyBookings]);

  // Phone Validation
  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val.length <= 10) {
      setPhone(val);
      if (val.length === 10) {
        setPhoneError('');
      } else {
        setPhoneError('Phone number must be exactly 10 digits');
      }
    }
  };

  // OpenStreetMap Reverse Geocode
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setPickupLat(lat);
        setPickupLng(lng);

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          );
          const data = await res.json();
          if (data && data.display_name) {
            setPickup(data.display_name);
          } else {
            setPickup(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
          }
        } catch (err) {
          setPickup(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        alert('Could not retrieve current location. Please enter pickup manually.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Create Booking
  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setCreatedBooking(null);

    if (phone.length !== 10) {
      setPhoneError('Phone number must be exactly 10 digits');
      setFormError('Phone number must be exactly 10 digits');
      return;
    }
    if (!pickup.trim()) {
      setFormError('Pickup location is required.');
      return;
    }
    if (rideType === 'OUTSTATION' && !destination.trim()) {
      setFormError('Destination is required for Outstation rides.');
      return;
    }
    if (!rideDate || !rideTime) {
      setFormError('Please select both ride date and time.');
      return;
    }

    if (vehicleOption === 'ONLY_DRIVER') {
      if (!customerCarName.trim()) {
        setFormError('Please enter your car name / model.');
        return;
      }
    } else {
      if (!selectedVehicle) {
        setFormError('Please select a vehicle to rent.');
        return;
      }
      if (selectedVehicle.available === false) {
        setFormError(`"${selectedVehicle.name}" is currently unavailable for booking. Please select an available vehicle or choose "Only Driver" service.`);
        return;
      }
    }

    setLoading(true);
    try {
      const carNameClean = customerCarName.trim();
      const transLabel = transmission === 'AUTOMATIC' ? 'Automatic' : 'Manual';
      const fullCarName = vehicleOption === 'ONLY_DRIVER'
        ? `${carNameClean} (${transLabel})`
        : selectedVehicle.name;
      const descText = vehicleOption === 'ONLY_DRIVER'
        ? (carDescription.trim() ? `${fullCarName} - ${carDescription.trim()}` : fullCarName)
        : '';

      const payload = {
        userId: currentUser.id,
        userName: currentUser.name,
        userEmail: currentUser.userEmail || currentUser.email,
        userPhone: phone,
        pickup: pickup.trim(),
        pickupLat: pickupLat,
        pickupLng: pickupLng,
        destination: destination.trim() || (rideType === 'LOCAL' ? 'Local City Travel' : ''),
        date: rideDate,
        time: rideTime,
        rideType: rideType,
        vehicleOption: vehicleOption,
        vehicleType: vehicleOption === 'ONLY_DRIVER' ? 'CUSTOMER_CAR' : selectedVehicle.type,
        vehicleId: vehicleOption === 'ONLY_DRIVER' ? null : selectedVehicle.id,
        vehicleName: fullCarName,
        vehicleImage: vehicleOption === 'ONLY_DRIVER'
          ? 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80'
          : selectedVehicle.imageUrl,
        customerCarName: vehicleOption === 'ONLY_DRIVER' ? carNameClean : null,
        transmission: vehicleOption === 'ONLY_DRIVER' ? transmission : null,
        description: descText
      };

      const res = await API.post('/bookings/create', payload);
      setCreatedBooking(res.data);

      // Reset form
      setPickup('');
      setPickupLat(null);
      setPickupLng(null);
      setDestination('');
      setRideDate('');
      setRideTime('');
      setCustomerCarName('');
      setCarDescription('');

      const email = currentUser.userEmail || currentUser.email;
      fetchMyBookings(email);
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setFormError(err.response.data.message);
      } else {
        setFormError('Booking failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Cancel Booking
  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;

    try {
      await API.put(`/bookings/${bookingId}/cancel`);
      const email = currentUser.userEmail || currentUser.email;
      fetchMyBookings(email);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel booking.');
    }
  };

  // Submit Support Request
  const handleSubmitSupport = async (e) => {
    e.preventDefault();
    if (!supportDescription.trim()) return;

    try {
      await API.post('/support/create', {
        bookingId: supportBookingId.trim(),
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: 'USER',
        phone: currentUser.phone || phone,
        problemType: supportProblemType,
        description: supportDescription.trim()
      });

      setSupportSuccess('Support request submitted successfully! Admin has been notified.');
      setSupportDescription('');
      setTimeout(() => {
        setShowSupportModal(false);
        setSupportSuccess('');
      }, 1500);
    } catch (err) {
      alert('Failed to submit support request.');
    }
  };

  // Update Profile
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await API.put(`/users/${currentUser.id}/profile`, {
        name: profileName,
        phone: profilePhone
      });
      const updated = { ...currentUser, name: res.data.name, phone: res.data.phone };
      setCurrentUser(updated);
      localStorage.setItem('user', JSON.stringify(updated));
      setProfileSuccess('Profile updated successfully!');
      setTimeout(() => {
        setShowProfileModal(false);
        setProfileSuccess('');
      }, 1200);
    } catch (err) {
      alert('Failed to update profile.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('rideflow_user');
    localStorage.removeItem('user');
    navigate('/');
  };

  // Filter Bookings
  const filteredBookings = myBookings.filter((b) => {
    if (historyFilter === 'UPCOMING') return b.status === 'PENDING' || b.status === 'ASSIGNED';
    if (historyFilter === 'ACTIVE') return b.status === 'ACCEPTED' || b.status === 'REACHED_PICKUP' || b.status === 'STARTED';
    if (historyFilter === 'COMPLETED') return b.status === 'COMPLETED';
    if (historyFilter === 'CANCELLED') return b.status === 'CANCELLED';
    return true; // 'ALL'
  });

  const filteredVehicles = categoryFilter === 'ALL'
    ? vehicles
    : vehicles.filter((v) => v.type === categoryFilter);

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <BrandLogo size="md" onClick={() => navigate('/booking')} />

        <div className="header-actions">
          <a href={`tel:${(systemSettings.contactPhone || ADMIN_PHONE).replace(/\s+/g, '')}`} className="call-admin-btn" title="Call Admin Support">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <span>Call Admin ({systemSettings.contactPhone || ADMIN_PHONE})</span>
          </a>

          <button
            type="button"
            className="report-prob-btn"
            onClick={() => {
              setSupportBookingId('');
              setShowSupportModal(true);
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', verticalAlign: '-2px' }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" x2="12" y1="8" y2="12" />
              <line x1="12" x2="12.01" y1="16" y2="16" />
            </svg>
            Report Problem
          </button>

          <button
            type="button"
            className="profile-btn"
            onClick={() => setShowProfileModal(true)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', verticalAlign: '-2px' }}>
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Profile
          </button>

          <div className="user-welcome">
            <span className="welcome-label">Welcome,</span>
            <span className="user-name">{currentUser?.name || 'Customer'}</span>
          </div>

          <button className="logout-btn" onClick={handleLogout}>
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      <main className="dashboard-body">
        <div className="booking-grid">
          <section className="glass-panel form-panel">
            <div className="panel-title-bar">
              <h2>Book a Ride or Chauffeur</h2>
              <p>Reserve instant local rides or outstation private chauffeurs</p>
            </div>

            {createdBooking && (
              <div className="alert-box success booking-created-box" style={{ padding: '16px 20px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}>
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', color: '#34d399' }}>Booking Confirmed</h4>
                    <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: '#e2e8f0' }}>
                      Thank you for choosing <strong>RideFlow</strong>. Your booking ID is <code>{createdBooking.bookingId}</code>.
                    </p>
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '10px 14px', borderRadius: '8px', fontSize: '0.84rem', color: '#a7f3d0' }}>
                      <strong>Confirmation Email Sent:</strong> A receipt has been dispatched to <strong>{createdBooking.userEmail}</strong>.
                      <br />
                      Chauffeur details and live coordination will be delivered to your email as soon as a driver accepts your trip.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {formError && (
              <div className="alert-box error">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" x2="12" y1="8" y2="12" />
                  <line x1="12" x2="12.01" y1="16" y2="16" />
                </svg>
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleBookingSubmit} className="booking-form">
              <div className="form-group">
                <label htmlFor="user-phone">Phone Number (10 Digits)</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </span>
                  <input
                    id="user-phone"
                    type="tel"
                    placeholder="9876543210"
                    maxLength={10}
                    value={phone}
                    onChange={handlePhoneChange}
                    required
                  />
                </div>
                {phoneError && <span className="field-error">{phoneError}</span>}
              </div>

              <div className="form-group">
                <div className="label-with-action">
                  <label htmlFor="pickup-loc">Pickup Location</label>
                  <button
                    type="button"
                    className="loc-btn"
                    onClick={handleUseCurrentLocation}
                    disabled={locating}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
                      <polygon points="3 11 22 2 13 21 11 13 3 11" />
                    </svg>
                    {locating ? 'Locating...' : 'Use Current Location'}
                  </button>
                </div>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </span>
                  <input
                    id="pickup-loc"
                    type="text"
                    placeholder="Enter pickup address, landmark, station"
                    value={pickup}
                    onChange={(e) => setPickup(e.target.value)}
                    required
                  />
                </div>
              </div>

              {rideType === 'OUTSTATION' && (
                <div className="form-group">
                  <label htmlFor="dest-loc">Destination</label>
                  <div className="input-wrapper">
                    <span className="input-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 19 21 12 17 5 21 12 2" />
                      </svg>
                    </span>
                    <input
                      id="dest-loc"
                      type="text"
                      placeholder="Enter drop destination"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="form-row-2">
                <div className="form-group">
                  <label htmlFor="ride-date">Travel Date</label>
                  <input
                    id="ride-date"
                    type="date"
                    value={rideDate}
                    onChange={(e) => setRideDate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="ride-time">Travel Time</label>
                  <input
                    id="ride-time"
                    type="time"
                    value={rideTime}
                    onChange={(e) => setRideTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Ride Type</label>
                  <div className="pill-group">
                    <button
                      type="button"
                      className={`pill-btn ${rideType === 'LOCAL' ? 'active' : ''}`}
                      onClick={() => setRideType('LOCAL')}
                    >
                      Local
                    </button>
                    <button
                      type="button"
                      className={`pill-btn ${rideType === 'OUTSTATION' ? 'active' : ''}`}
                      onClick={() => setRideType('OUTSTATION')}
                    >
                      Outstation
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>Service Option</label>
                  <div className="pill-group">
                    <button
                      type="button"
                      className={`pill-btn ${vehicleOption === 'ONLY_DRIVER' ? 'active' : ''}`}
                      onClick={() => setVehicleOption('ONLY_DRIVER')}
                    >
                      Only Driver
                    </button>
                    <button
                      type="button"
                      className={`pill-btn ${vehicleOption === 'DRIVER_AND_VEHICLE' ? 'active' : ''}`}
                      onClick={() => setVehicleOption('DRIVER_AND_VEHICLE')}
                    >
                      Driver + Vehicle
                    </button>
                  </div>
                </div>
              </div>

              <div className="service-mode-notice">
                {vehicleOption === 'ONLY_DRIVER' ? (
                  <div className="mode-badge driver-only-badge">
                    <span>
                      <strong>Chauffeur Service:</strong> A certified chauffeur will arrive at your pickup address to drive your personal car.
                      <div className="driver-rate-pill" style={{ marginTop: '6px', fontSize: '0.84rem', color: '#c7d2fe' }}>
                        Base Fare: ₹{systemSettings.driverOnlyBasePrice || 600} (covers up to {systemSettings.driverOnlyIncludedHours || 4} Hours) • ₹{systemSettings.driverOnlyExtraHourRate || 100}/hr extra • Min Daily Price: ₹{systemSettings.driverOnlyMinDailyPrice || 1200}
                      </div>
                    </span>
                  </div>
                ) : (
                  <div className="mode-badge driver-vehicle-badge">
                    <span><strong>Executive Fleet Package:</strong> Fully insured vehicle and professional chauffeur included. Select your vehicle package below.</span>
                  </div>
                )}
              </div>

              {vehicleOption === 'ONLY_DRIVER' ? (
                <div className="customer-car-details-card">
                  <div className="car-card-header">
                    <h4>Your Vehicle Details (For Assigned Chauffeur)</h4>
                    <p>Provide your personal car details so the assigned chauffeur is prepared upon arrival.</p>
                  </div>

                  <div className="form-group" style={{ marginTop: '14px' }}>
                    <label htmlFor="cust-car-name">Car Model / Name <span style={{ color: '#f87171' }}>*</span></label>
                    <div className="input-wrapper">
                      <span className="input-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 10.7 2 11.3 2 12v4c0 .6.4 1 1 1h2" />
                          <circle cx="7" cy="17" r="2" />
                          <circle cx="17" cy="17" r="2" />
                        </svg>
                      </span>
                      <input
                        id="cust-car-name"
                        type="text"
                        placeholder="e.g. Honda City, Hyundai Creta, Swift Dzire, Toyota Innova"
                        value={customerCarName}
                        onChange={(e) => setCustomerCarName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Transmission Type <span style={{ color: '#f87171' }}>*</span></label>
                    <div className="transmission-toggle-group">
                      <button
                        type="button"
                        className={`trans-btn ${transmission === 'MANUAL' ? 'active' : ''}`}
                        onClick={() => setTransmission('MANUAL')}
                      >
                        Manual
                      </button>
                      <button
                        type="button"
                        className={`trans-btn ${transmission === 'AUTOMATIC' ? 'active' : ''}`}
                        onClick={() => setTransmission('AUTOMATIC')}
                      >
                        Automatic
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="cust-car-desc">Car Description / Parking Instructions (Optional)</label>
                    <div className="input-wrapper">
                      <span className="input-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" x2="8" y1="13" y2="13" />
                          <line x1="16" x2="8" y1="17" y2="17" />
                        </svg>
                      </span>
                      <input
                        id="cust-car-desc"
                        type="text"
                        placeholder="e.g. White Sedan, MH12 AB 1234, parked at main entrance"
                        value={carDescription}
                        onChange={(e) => setCarDescription(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="vehicle-selection-section">
                  <div className="vehicle-header-bar">
                    <label>Select Vehicle Package</label>
                    <div className="cat-filter">
                      {['ALL', 'SEDAN', 'SUV', 'LUXURY', 'VINTAGE', 'TRAVELLER'].map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          className={`cat-btn ${categoryFilter === cat ? 'active' : ''}`}
                          onClick={() => setCategoryFilter(cat)}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="vehicles-grid">
                    {filteredVehicles.map((veh) => {
                      const isAvailable = veh.available !== false;
                      const isSelected = selectedVehicle && selectedVehicle.id === veh.id;
                      return (
                        <div
                          key={veh.id}
                          className={`vehicle-card ${isSelected ? 'selected' : ''} ${!isAvailable ? 'unavailable-card' : ''}`}
                          onClick={() => {
                            if (!isAvailable) {
                              setFormError(`"${veh.name}" is currently unavailable for booking. Please pick another vehicle or choose "Only Driver" service.`);
                              return;
                            }
                            setFormError('');
                            setSelectedVehicle(veh);
                          }}
                        >
                          <div className="vehicle-img-container">
                            <img src={veh.imageUrl} alt={veh.name} loading="lazy" />
                            <span className="veh-type-badge">{veh.type}</span>
                            <span className={`veh-booking-status-tag ${isAvailable ? 'tag-available' : 'tag-unavailable'}`}>
                              {isAvailable ? 'Available' : 'Unavailable'}
                            </span>
                          </div>
                          <div className="vehicle-details">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <h4 className="vehicle-name">{veh.name}</h4>
                              <span className={`veh-micro-tag ${isAvailable ? 'micro-green' : 'micro-red'}`}>
                                {isAvailable ? 'Available' : 'Unavailable'}
                              </span>
                            </div>
                            <div className="vehicle-specs-line">
                              <span>{veh.seats || 4} Seats</span>
                              <span>•</span>
                              <span>{veh.ac !== false ? 'AC' : 'Non-AC'}</span>
                            </div>
                            <div className="vehicle-pricing-tag">
                              <span>Pkg: {veh.includedKm || 300} KM / ₹{veh.basePrice ? veh.basePrice.toLocaleString('en-IN') : '5,000'}</span>
                              <span className="extra-km-sub">₹{veh.extraKmPrice || 15}/extra KM</span>
                            </div>
                            <button
                              type="button"
                              disabled={!isAvailable}
                              className={`veh-select-btn ${isSelected ? 'selected' : ''} ${!isAvailable ? 'disabled-btn' : ''}`}
                            >
                              {!isAvailable ? 'Unavailable' : isSelected ? '✓ Selected' : 'Select'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading
                  ? 'Submitting Request...'
                  : (vehicleOption === 'ONLY_DRIVER' ? 'Request Chauffeur (Only Driver)' : 'Reserve Ride (Driver + Vehicle)')}
              </button>
            </form>
          </section>

          {/* RIGHT: User Booking History */}
          <section className="glass-panel history-panel">
            <div className="panel-title-bar">
              <div className="flex-between">
                <h2>My Bookings</h2>
                <span className="live-indicator">
                  <span className="pulse-dot"></span> Live Updates
                </span>
              </div>
              <p>Track ride status, timeline, and driver contact</p>
            </div>

            {/* Filter Tabs */}
            <div className="history-filter-bar">
              {['ALL', 'UPCOMING', 'ACTIVE', 'COMPLETED', 'CANCELLED'].map((f) => (
                <button
                  key={f}
                  type="button"
                  className={`hist-filter-btn ${historyFilter === f ? 'active' : ''}`}
                  onClick={() => setHistoryFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>

            <div className="bookings-list">
              {filteredBookings.length === 0 ? (
                <div className="empty-state">
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto', color: '#818cf8' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                      <line x1="8" y1="21" x2="16" y2="21"></line>
                      <line x1="12" y1="17" x2="12" y2="21"></line>
                    </svg>
                  </div>
                  <h4>No bookings under this filter</h4>
                  <p>Book a ride using the form on the left.</p>
                </div>
              ) : (
                filteredBookings.map((b) => {
                  const isAcceptedOrBeyond = ['ACCEPTED', 'REACHED_PICKUP', 'STARTED', 'COMPLETED'].includes(b.status);
                  const canCancel = ['PENDING', 'ASSIGNED'].includes(b.status);

                  return (
                    <div key={b.id} className="history-card">
                      <div className="history-top">
                        <div>
                          <span className="booking-id-tag">ID: {b.bookingId || b.id}</span>
                          <div className="route-info">
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                              {b.pickup}
                            </span>
                            <span className="route-arrow" style={{ display: 'inline-flex', alignItems: 'center', margin: '0 4px', color: '#64748b' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                            </span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 4 17 4 13 11 17 18 3 18 3 4"></polygon><line x1="3" y1="2" x2="3" y2="22"></line></svg>
                              {b.destination}
                            </span>
                          </div>
                        </div>
                        <span className={`status-badge ${b.status.toLowerCase()}`}>
                          {b.status}
                        </span>
                      </div>

                      {/* Booking Status & Notification Banner */}
                      <div className="booking-status-email-banner" style={{ margin: '12px 0 14px 0', padding: '10px 14px', background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.22)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: b.status === 'COMPLETED' ? '#10b981' : b.status === 'CANCELLED' ? '#ef4444' : '#6366f1', display: 'inline-block' }}></span>
                          <span style={{ fontSize: '0.88rem', color: '#e0e7ff' }}>
                            Status: <strong style={{ color: '#ffffff' }}>{b.status}</strong>
                          </span>
                        </div>
                        <span style={{ fontSize: '0.82rem', color: '#a5b4fc', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                          Driver details & updates sent via email
                        </span>
                      </div>

                      <div className="history-middle">
                        <div className="meta-item">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                          <span>{b.date}</span>
                        </div>
                        <div className="meta-item">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                          <span>{b.time}</span>
                        </div>
                        <div className="meta-item">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
                          <span>{b.rideType}</span>
                        </div>
                        <div className="meta-item">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                          <span>{b.vehicleOption === 'ONLY_DRIVER' || b.vehicleOption === 'DRIVER_ONLY' ? 'Only Driver' : 'Driver + Vehicle'}</span>
                        </div>
                        <div className="meta-item">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
                          <span>
                            {b.vehicleOption === 'ONLY_DRIVER' || b.vehicleOption === 'DRIVER_ONLY'
                              ? (b.customerCarName ? `${b.customerCarName} (${b.transmission || 'Manual'})` : b.vehicleName || 'Customer Car')
                              : (b.vehicleName || b.vehicleType)}
                          </span>
                        </div>
                      </div>

                      {b.description && (b.vehicleOption === 'ONLY_DRIVER' || b.vehicleOption === 'DRIVER_ONLY') && (
                        <div className="history-car-note" style={{ margin: '6px 0 12px 0', padding: '8px 12px', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '8px', fontSize: '0.8rem', color: '#93c5fd', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                          <span><strong>Car Details / Notes:</strong> {b.description}</span>
                        </div>
                      )}

                      {/* Driver Contact Section */}
                      <div className="contact-box">
                        {!b.driverName ? (
                          <div className="awaiting-driver-text" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                            <span>Waiting for driver assignment</span>
                          </div>
                        ) : !isAcceptedOrBeyond ? (
                          <div className="awaiting-acceptance-text">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                              <span>Driver: <strong>{b.driverName}</strong> (Waiting for driver acceptance)</span>
                            </div>
                            <span className="privacy-note">Contact number will be revealed once driver accepts.</span>
                          </div>
                        ) : (
                          <div className="driver-contact-card">
                            <div className="driver-contact-left">
                              <span className="contact-avatar" style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                              </span>
                              <div>
                                <strong className="contact-name">{b.driverName}</strong>
                                <span className="contact-phone" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                                  {b.driverPhone || 'Contact available'}
                                </span>
                              </div>
                            </div>
                            {b.driverPhone && (
                              <a href={`tel:${b.driverPhone}`} className="call-now-btn">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                                Call Driver
                              </a>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Completed Ride Fare & Duration/Distance Banner */}
                      {b.status === 'COMPLETED' && (
                        <div className="completed-fare-banner">
                          <div className="fare-badge">
                            <span className="fare-label">Final Fare:</span>
                            <strong className="fare-amount">₹{b.fare ? b.fare.toLocaleString('en-IN') : '0'}</strong>
                          </div>
                          {(b.vehicleOption === 'ONLY_DRIVER' || b.vehicleOption === 'DRIVER_ONLY') ? (
                            b.actualHours > 0 && (
                              <span className="fare-dist">Total Duration: {b.actualHours} Hours</span>
                            )
                          ) : (
                            b.actualKm > 0 && (
                              <span className="fare-dist">Total Distance: {b.actualKm} KM</span>
                            )
                          )}
                        </div>
                      )}

                      {/* Card Footer Actions */}
                      <div className="history-bottom-actions">
                        {canCancel && (
                          <button
                            type="button"
                            className="cancel-booking-btn"
                            onClick={() => handleCancelBooking(b.id)}
                          >
                            Cancel Booking
                          </button>
                        )}

                        <button
                          type="button"
                          className="card-problem-btn"
                          onClick={() => {
                            setSupportBookingId(b.bookingId || b.id);
                            setShowSupportModal(true);
                          }}
                        >
                          Report Issue
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </main>

      {/* REPORT A PROBLEM MODAL */}
      {showSupportModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Report a Problem / Support</h3>
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
                <label>Problem Type</label>
                <select
                  value={supportProblemType}
                  onChange={(e) => setSupportProblemType(e.target.value)}
                >
                  <option value="Driver Issue">Driver Issue</option>
                  <option value="Customer Issue">Customer Issue</option>
                  <option value="Vehicle Issue">Vehicle Issue</option>
                  <option value="Booking Issue">Booking Issue</option>
                  <option value="Payment Issue">Payment Issue</option>
                  <option value="Location Issue">Location Issue</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows={4}
                  placeholder="Please describe the issue in detail..."
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

      {/* USER PROFILE MODAL */}
      {showProfileModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3>User Profile</h3>
              <button type="button" className="modal-close" onClick={() => setShowProfileModal(false)}>×</button>
            </div>

            {profileSuccess && (
              <div className="alert-box success">
                <span>✓</span>
                <span>{profileSuccess}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="modal-form">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email (Read-Only)</label>
                <input
                  type="text"
                  value={currentUser?.userEmail || currentUser?.email || ''}
                  disabled
                />
              </div>

              <div className="form-group">
                <label>Phone Number (10 Digits)</label>
                <input
                  type="tel"
                  maxLength={10}
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value.replace(/\D/g, ''))}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="modal-cancel-btn" onClick={() => setShowProfileModal(false)}>
                  Close
                </button>
                <button type="submit" className="modal-save-btn">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Booking;
