import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import BrandLogo from '../components/BrandLogo';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [currentAdmin, setCurrentAdmin] = useState(null);

  // Data states
  const [bookings, setBookings] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [supportRequests, setSupportRequests] = useState([]);
  const [commissionData, setCommissionData] = useState({
    summary: { totalFare: 0, totalCommission: 0, paidCommission: 0, pendingCommission: 0 },
    driverStats: [],
    bookings: []
  });
  const [paymentHistory, setPaymentHistory] = useState([]);

  // Active Tab
  const [activeTab, setActiveTab] = useState('BOOKINGS'); // 'BOOKINGS', 'COMMISSION', 'DRIVERS', 'VEHICLES', 'SUPPORT'

  // Booking Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Commission Search & Filter
  const [commSearchQuery, setCommSearchQuery] = useState('');
  const [commStatusFilter, setCommStatusFilter] = useState('ALL');

  // Driver Assignment Map { [bookingId]: driverId }
  const [driverAssignments, setDriverAssignments] = useState({});

  // Notification Toast
  const [notification, setNotification] = useState(null);
  const previousBookingsRef = useRef([]);

  // Vehicle Modal State
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [editingVehicleId, setEditingVehicleId] = useState(null);
  const [vehName, setVehName] = useState('');
  const [vehType, setVehType] = useState('SEDAN');
  const [vehImageUrl, setVehImageUrl] = useState('');
  const [vehSeats, setVehSeats] = useState(4);
  const [vehAc, setVehAc] = useState(true);
  const [vehIncludedKm, setVehIncludedKm] = useState(300);
  const [vehBasePrice, setVehBasePrice] = useState(5000);
  const [vehExtraKmPrice, setVehExtraKmPrice] = useState(15);
  const [vehCommissionPercentage, setVehCommissionPercentage] = useState(10);
  const [vehAvailable, setVehAvailable] = useState(true);
  const [modalError, setModalError] = useState('');

  // Record Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState(null);
  const [paymentAmountInput, setPaymentAmountInput] = useState('');
  const [paymentDateInput, setPaymentDateInput] = useState(new Date().toISOString().split('T')[0]);
  const [paymentNoteInput, setPaymentNoteInput] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState('');
  const [savingPayment, setSavingPayment] = useState(false);

  // Platform Settings & Commission State
  const [settings, setSettings] = useState({
    contactPhone: '+91 98765 43210',
    contactEmail: 'support@rideflow.com',
    driverOnlyMinDailyPrice: 1200,
    driverOnlyBasePrice: 600,
    driverOnlyIncludedHours: 4,
    driverOnlyExtraHourRate: 100,
    driverOnlyIncludedKm: 40,
    driverOnlyExtraKmPrice: 10,
    driverOnlyCommissionPercentage: 15,
    defaultVehicleCommissionPercentage: 10
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState('');
  const [settingsError, setSettingsError] = useState('');

  // Verify Authenticated Admin
  useEffect(() => {
    const stored = localStorage.getItem('rideflow_user') || localStorage.getItem('user');
    let admin = null;
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.role === 'ADMIN') {
          admin = parsed;
        }
      } catch (e) {}
    }
    if (!admin) {
      navigate('/auth', { replace: true });
      return;
    }
    setCurrentAdmin(admin);
  }, [navigate]);

  // Audio Notification Chime
  const playNotificationSound = useCallback(() => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);

        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.45);
      }
    } catch (e) {}
  }, []);

  // Fetch all admin data
  const fetchData = useCallback(async () => {
    try {
      const [bookingsRes, driversRes, vehiclesRes, supportRes, commRes, paymentsRes] = await Promise.all([
        API.get('/bookings/all'),
        API.get('/users/drivers'),
        API.get('/vehicles/all'),
        API.get('/support/all'),
        API.get('/commissions/all').catch(() => ({ data: { summary: {}, driverStats: [], bookings: [] } })),
        API.get('/commissions/payments').catch(() => ({ data: [] }))
      ]);

      const newBookings = bookingsRes.data;

      // Smart Notification Detection
      if (previousBookingsRef.current.length > 0) {
        // 1. Check for newly created booking
        if (newBookings.length > previousBookingsRef.current.length) {
          const newest = newBookings[0];
          setNotification({
            type: 'NEW_BOOKING',
            message: `New Booking Created: ${newest.bookingId || newest.id} by ${newest.userName || 'Customer'}`
          });
          playNotificationSound();
        } else {
          // 2. Check for status transitions
          for (const newB of newBookings) {
            const oldB = previousBookingsRef.current.find((b) => b.id === newB.id);
            if (oldB && oldB.status !== newB.status) {
              if (newB.status === 'ACCEPTED') {
                setNotification({
                  type: 'ACCEPTED',
                  message: `Driver ${newB.driverName || ''} ACCEPTED Booking ${newB.bookingId || newB.id}`
                });
                playNotificationSound();
              } else if (newB.status === 'REACHED_PICKUP') {
                setNotification({
                  type: 'REACHED',
                  message: `Driver REACHED pickup for Booking ${newB.bookingId || newB.id}`
                });
                playNotificationSound();
              } else if (newB.status === 'STARTED') {
                setNotification({
                  type: 'STARTED',
                  message: `Trip STARTED for Booking ${newB.bookingId || newB.id}`
                });
                playNotificationSound();
              } else if (newB.status === 'COMPLETED') {
                setNotification({
                  type: 'COMPLETED',
                  message: `Trip COMPLETED: ${newB.bookingId || newB.id} | Fare: ₹${newB.fare}`
                });
                playNotificationSound();
              }
              break;
            }
          }
        }
      }

      previousBookingsRef.current = newBookings;
      setBookings(newBookings);
      setDrivers(driversRes.data);
      setVehicles(vehiclesRes.data);
      setSupportRequests(supportRes.data);
      if (commRes.data) setCommissionData(commRes.data);
      if (paymentsRes.data) setPaymentHistory(paymentsRes.data);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    }
  }, [playNotificationSound]);

  // Polling every 4 seconds
  const pollRef = useRef(null);
  useEffect(() => {
    fetchData();
    pollRef.current = setInterval(() => {
      fetchData();
    }, 4000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchData]);

  // Assign Driver
  const handleAssignDriver = async (bookingId) => {
    const driverId = driverAssignments[bookingId];
    if (!driverId) {
      alert('Please select a driver from the dropdown first.');
      return;
    }

    const driverObj = drivers.find((d) => (d.id === driverId || d._id === driverId));
    try {
      await API.put(`/bookings/${bookingId}/assign`, {
        driverId: driverId,
        driverName: driverObj?.name || 'Assigned Driver',
        driverPhone: driverObj?.phone || ''
      });

      fetchData();
      alert('Driver assigned successfully! Status is now ASSIGNED.');
    } catch (err) {
      alert('Failed to assign driver.');
    }
  };

  // Support Status Update
  const handleUpdateSupportStatus = async (id, newStatus) => {
    try {
      await API.put(`/support/${id}/status`, { status: newStatus });
      fetchData();
    } catch (err) {
      alert('Failed to update support status.');
    }
  };

  // Vehicle Management Handlers
  const openAddVehicleModal = () => {
    setEditingVehicleId(null);
    setVehName('');
    setVehType('SEDAN');
    setVehImageUrl('');
    setVehSeats(4);
    setVehAc(true);
    setVehIncludedKm(300);
    setVehBasePrice(5000);
    setVehExtraKmPrice(15);
    setVehCommissionPercentage(10);
    setVehAvailable(true);
    setModalError('');
    setShowVehicleModal(true);
  };

  const openEditVehicleModal = (veh) => {
    setEditingVehicleId(veh.id);
    setVehName(veh.name);
    setVehType(veh.type);
    setVehImageUrl(veh.imageUrl || '');
    setVehSeats(veh.seats || 4);
    setVehAc(veh.ac !== false);
    setVehIncludedKm(veh.includedKm !== undefined ? veh.includedKm : 300);
    setVehBasePrice(veh.basePrice !== undefined ? veh.basePrice : 5000);
    setVehExtraKmPrice(veh.extraKmPrice !== undefined ? veh.extraKmPrice : 15);
    setVehCommissionPercentage(veh.commissionPercentage !== undefined ? veh.commissionPercentage : 10);
    setVehAvailable(veh.available !== false);
    setModalError('');
    setShowVehicleModal(true);
  };

  const handleSaveVehicle = async (e) => {
    e.preventDefault();
    if (!vehName.trim()) {
      setModalError('Vehicle name is required.');
      return;
    }

    if (vehIncludedKm < 0 || vehBasePrice < 0 || vehExtraKmPrice < 0) {
      setModalError('Pricing values cannot be negative.');
      return;
    }

    try {
      const payload = {
        name: vehName.trim(),
        type: vehType,
        imageUrl: vehImageUrl.trim(),
        seats: parseInt(vehSeats, 10) || 4,
        ac: vehAc,
        includedKm: parseFloat(vehIncludedKm) || 300,
        basePrice: parseFloat(vehBasePrice) || 5000,
        extraKmPrice: parseFloat(vehExtraKmPrice) || 15,
        commissionPercentage: parseFloat(vehCommissionPercentage) || 10,
        available: vehAvailable
      };

      if (editingVehicleId) {
        await API.put(`/vehicles/${editingVehicleId}`, payload);
      } else {
        await API.post('/vehicles/add', payload);
      }

      setShowVehicleModal(false);
      fetchData();
    } catch (err) {
      setModalError('Failed to save vehicle.');
    }
  };

  const handleToggleVehicleAvailability = async (id) => {
    try {
      await API.patch(`/vehicles/${id}/toggle-availability`);
      fetchData();
    } catch (err) {
      alert('Failed to update vehicle availability status.');
    }
  };

  const handleDeleteVehicle = async (id) => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) return;
    try {
      await API.delete(`/vehicles/${id}`);
      fetchData();
    } catch (err) {
      alert('Failed to delete vehicle.');
    }
  };

  // Open Payment Modal
  const openRecordPaymentModal = (booking) => {
    setSelectedBookingForPayment(booking);
    setPaymentAmountInput(booking.commissionRemaining || '');
    setPaymentDateInput(new Date().toISOString().split('T')[0]);
    setPaymentNoteInput('');
    setPaymentError('');
    setPaymentSuccess('');
    setShowPaymentModal(true);
  };

  // Submit Manual Payment
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setPaymentError('');
    setPaymentSuccess('');

    const amount = parseFloat(paymentAmountInput);
    if (isNaN(amount) || amount <= 0) {
      setPaymentError('Payment amount must be greater than 0.');
      return;
    }

    if (amount > selectedBookingForPayment.commissionRemaining) {
      setPaymentError(`Payment amount cannot exceed remaining commission of ₹${selectedBookingForPayment.commissionRemaining}.`);
      return;
    }

    setSavingPayment(true);
    try {
      await API.post('/commissions/payment', {
        bookingId: selectedBookingForPayment.bookingId || selectedBookingForPayment.id,
        driverId: selectedBookingForPayment.driverId,
        paymentAmount: amount,
        paymentDate: paymentDateInput,
        note: paymentNoteInput.trim()
      });

      setPaymentSuccess('Commission payment recorded successfully!');
      fetchData();

      setTimeout(() => {
        setShowPaymentModal(false);
        setSelectedBookingForPayment(null);
        setPaymentSuccess('');
      }, 1500);
    } catch (err) {
      setPaymentError(err.response?.data?.message || 'Failed to record commission payment.');
    } finally {
      setSavingPayment(false);
    }
  };

  // Fetch System Settings on Mount
  useEffect(() => {
    API.get('/settings')
      .then((res) => {
        if (res.data) {
          setSettings({
            contactPhone: res.data.contactPhone || '+91 98765 43210',
            contactEmail: res.data.contactEmail || 'support@rideflow.com',
            driverOnlyMinDailyPrice: res.data.driverOnlyMinDailyPrice ?? 1200,
            driverOnlyBasePrice: res.data.driverOnlyBasePrice ?? 600,
            driverOnlyIncludedHours: res.data.driverOnlyIncludedHours ?? 4,
            driverOnlyExtraHourRate: res.data.driverOnlyExtraHourRate ?? 100,
            driverOnlyIncludedKm: res.data.driverOnlyIncludedKm ?? 40,
            driverOnlyExtraKmPrice: res.data.driverOnlyExtraKmPrice ?? 10,
            driverOnlyCommissionPercentage: res.data.driverOnlyCommissionPercentage ?? 15,
            defaultVehicleCommissionPercentage: res.data.defaultVehicleCommissionPercentage ?? 10
          });
        }
      })
      .catch((err) => console.error('Failed to load settings:', err));
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsError('');
    setSettingsSuccess('');
    try {
      const res = await API.put('/settings', {
        contactPhone: settings.contactPhone,
        contactEmail: settings.contactEmail,
        driverOnlyMinDailyPrice: parseFloat(settings.driverOnlyMinDailyPrice) || 0,
        driverOnlyBasePrice: parseFloat(settings.driverOnlyBasePrice) || 0,
        driverOnlyIncludedHours: parseFloat(settings.driverOnlyIncludedHours) || 0,
        driverOnlyExtraHourRate: parseFloat(settings.driverOnlyExtraHourRate) || 0,
        driverOnlyIncludedKm: parseFloat(settings.driverOnlyIncludedKm) || 0,
        driverOnlyExtraKmPrice: parseFloat(settings.driverOnlyExtraKmPrice) || 0,
        driverOnlyCommissionPercentage: parseFloat(settings.driverOnlyCommissionPercentage) || 0,
        defaultVehicleCommissionPercentage: parseFloat(settings.defaultVehicleCommissionPercentage) || 0
      });
      setSettings(res.data);
      setSettingsSuccess('Platform settings and commission rates saved successfully!');
      setTimeout(() => setSettingsSuccess(''), 4000);
    } catch (err) {
      setSettingsError(err.response?.data?.message || 'Failed to save settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('rideflow_user');
    localStorage.removeItem('user');
    navigate('/');
  };

  // Statistics
  const totalBookings = bookings.length;
  const pendingBookings = bookings.filter((b) => b.status === 'PENDING').length;
  const assignedBookings = bookings.filter((b) => b.status === 'ASSIGNED').length;
  const acceptedBookings = bookings.filter((b) => b.status === 'ACCEPTED').length;
  const ongoingBookings = bookings.filter((b) => b.status === 'REACHED_PICKUP' || b.status === 'STARTED').length;
  const completedBookings = bookings.filter((b) => b.status === 'COMPLETED').length;
  const cancelledBookings = bookings.filter((b) => b.status === 'CANCELLED').length;
  const totalDrivers = drivers.length;
  const availableDrivers = drivers.filter((d) => d.available).length;
  const totalVehicles = vehicles.length;

  const totalFare = commissionData.summary?.totalFare || 0;
  const totalCommission = commissionData.summary?.totalCommission || 0;
  const paidCommission = commissionData.summary?.paidCommission || 0;
  const pendingCommission = commissionData.summary?.pendingCommission || 0;
  const driverOnlyCommission = commissionData.summary?.driverOnlyCommission ??
    (commissionData.bookings || [])
      .filter((b) => b.vehicleOption === 'ONLY_DRIVER' || b.vehicleOption === 'DRIVER_ONLY')
      .reduce((acc, curr) => acc + (curr.commissionAmount || 0), 0);
  const vehicleCommission = commissionData.summary?.vehicleCommission ??
    (commissionData.bookings || [])
      .filter((b) => b.vehicleOption !== 'ONLY_DRIVER' && b.vehicleOption !== 'DRIVER_ONLY')
      .reduce((acc, curr) => acc + (curr.commissionAmount || 0), 0);

  // Filter & Search Bookings
  const filteredBookings = bookings.filter((b) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q ||
      (b.bookingId && b.bookingId.toLowerCase().includes(q)) ||
      (b.userName && b.userName.toLowerCase().includes(q)) ||
      (b.userPhone && b.userPhone.includes(q)) ||
      (b.driverName && b.driverName.toLowerCase().includes(q));

    let matchesStatus = true;
    if (statusFilter === 'PENDING') matchesStatus = b.status === 'PENDING';
    else if (statusFilter === 'ASSIGNED') matchesStatus = b.status === 'ASSIGNED';
    else if (statusFilter === 'ACCEPTED') matchesStatus = b.status === 'ACCEPTED';
    else if (statusFilter === 'ONGOING') matchesStatus = b.status === 'REACHED_PICKUP' || b.status === 'STARTED';
    else if (statusFilter === 'COMPLETED') matchesStatus = b.status === 'COMPLETED';
    else if (statusFilter === 'CANCELLED') matchesStatus = b.status === 'CANCELLED';

    return matchesSearch && matchesStatus;
  });

  // Filter & Search Commission Bookings
  const filteredCommissionBookings = (commissionData.bookings || []).filter((b) => {
    const q = commSearchQuery.toLowerCase().trim();
    const matchesSearch = !q ||
      (b.bookingId && b.bookingId.toLowerCase().includes(q)) ||
      (b.driverName && b.driverName.toLowerCase().includes(q)) ||
      (b.userName && b.userName.toLowerCase().includes(q));

    let matchesStatus = true;
    if (commStatusFilter === 'DRIVER_ONLY') {
      matchesStatus = b.vehicleOption === 'ONLY_DRIVER' || b.vehicleOption === 'DRIVER_ONLY';
    } else if (commStatusFilter === 'CAB_DRIVER') {
      matchesStatus = b.vehicleOption !== 'ONLY_DRIVER' && b.vehicleOption !== 'DRIVER_ONLY';
    } else if (commStatusFilter !== 'ALL') {
      matchesStatus = String(b.commissionStatus || '').toUpperCase() === commStatusFilter;
    }

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="admin-container">
      {/* Header */}
      <header className="dashboard-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <BrandLogo size="md" onClick={() => navigate('/admin')} />
          <span className="admin-pill">Admin Center</span>
        </div>

        <div className="header-actions">
          <div className="user-welcome">
            <span className="welcome-label">Admin:</span>
            <span className="user-name">{currentAdmin?.name || 'Administrator'}</span>
          </div>

          <button className="logout-btn" onClick={handleLogout} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span>Logout</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          </button>
        </div>
      </header>

      {/* Floating Notification */}
      {notification && (
        <div className="admin-toast-banner">
          <span>{notification.message}</span>
          <button className="toast-dismiss" onClick={() => setNotification(null)}>×</button>
        </div>
      )}

      <main className="admin-body">
        {/* KPI Statistics Bar */}
        <section className="admin-kpi-bar">
          <div className="kpi-card">
            <span className="kpi-label">Total Rides</span>
            <h3 className="kpi-value">{totalBookings}</h3>
            <span className="kpi-sub">{completedBookings} Done • {cancelledBookings} Cancelled</span>
          </div>
          <div className="kpi-card pending">
            <span className="kpi-label">Pending</span>
            <h3 className="kpi-value">{pendingBookings}</h3>
            <span className="kpi-sub">Needs Dispatch</span>
          </div>
          <div className="kpi-card active">
            <span className="kpi-label">Active Trips</span>
            <h3 className="kpi-value">{assignedBookings + acceptedBookings + ongoingBookings}</h3>
            <span className="kpi-sub">In Progress</span>
          </div>
          <div className="kpi-card success">
            <span className="kpi-label">Fleet & Drivers</span>
            <h3 className="kpi-value">{totalVehicles} / {totalDrivers}</h3>
            <span className="kpi-sub">{availableDrivers} Drivers Ready</span>
          </div>
          <div className="kpi-card comm-kpi">
            <span className="kpi-label">Total Fare</span>
            <h3 className="kpi-value">₹{totalFare.toLocaleString('en-IN')}</h3>
            <span className="kpi-sub">All completed rides</span>
          </div>
          <div className="kpi-card comm-kpi highlight">
            <span className="kpi-label">Total Commission</span>
            <h3 className="kpi-value">₹{totalCommission.toLocaleString('en-IN')}</h3>
            <span className="kpi-sub">₹{pendingCommission.toLocaleString('en-IN')} Pending</span>
          </div>
        </section>

        {/* Tab Navigation */}
        <div className="admin-tab-bar">
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'BOOKINGS' ? 'active' : ''}`}
            onClick={() => setActiveTab('BOOKINGS')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            <span>Bookings ({bookings.length})</span>
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'COMMISSION' ? 'active' : ''}`}
            onClick={() => setActiveTab('COMMISSION')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
            <span>Commission Management ({commissionData.bookings?.length || 0})</span>
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'DRIVERS' ? 'active' : ''}`}
            onClick={() => setActiveTab('DRIVERS')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            <span>Driver Directory ({drivers.length})</span>
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'VEHICLES' ? 'active' : ''}`}
            onClick={() => setActiveTab('VEHICLES')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
            <span>Fleet & Pricing ({vehicles.length})</span>
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'SUPPORT' ? 'active' : ''}`}
            onClick={() => setActiveTab('SUPPORT')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            <span>Support Requests ({supportRequests.length})</span>
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'SETTINGS' ? 'active' : ''}`}
            onClick={() => setActiveTab('SETTINGS')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            <span>Settings & Commission</span>
          </button>
        </div>

        {/* TAB 1: BOOKING MANAGEMENT */}
        {activeTab === 'BOOKINGS' && (
          <section className="glass-panel admin-panel">
            <div className="panel-title-bar flex-between">
              <div>
                <h2>Ride Dispatch & Booking Center</h2>
                <p>Manage customer bookings, dispatch certified drivers, and track lifecycle</p>
              </div>
              <span className="live-indicator">
                <span className="pulse-dot"></span> Live Polling Active
              </span>
            </div>

            {/* Search & Filter Bar */}
            <div className="booking-controls-bar">
              <div className="search-input-box">
                <span className="search-icon" style={{ display: 'inline-flex', alignItems: 'center' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                </span>
                <input
                  type="text"
                  placeholder="Search by Booking ID, Customer, Phone, or Driver..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="status-filter-pills">
                {['ALL', 'PENDING', 'ASSIGNED', 'ACCEPTED', 'ONGOING', 'COMPLETED', 'CANCELLED'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    className={`st-pill ${statusFilter === st ? 'active' : ''}`}
                    onClick={() => setStatusFilter(st)}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Booking ID</th>
                    <th>Customer</th>
                    <th>Route</th>
                    <th>Date & Time</th>
                    <th>Ride & Vehicle</th>
                    <th>Status</th>
                    <th>Fare & Comm</th>
                    <th>Assigned Driver</th>
                    <th>Dispatch Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="table-empty">
                        No bookings match your search or filter.
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.map((b) => (
                      <tr key={b.id}>
                        <td>
                          <span className="tbl-id">{b.bookingId || b.id}</span>
                        </td>
                        <td>
                          <div className="tbl-user-cell">
                            <strong>{b.userName || 'Passenger'}</strong>
                            <span className="tbl-phone" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                              {b.userPhone}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="tbl-route-cell">
                            <span className="tbl-loc green">Pickup: {b.pickup}</span>
                            <span className="tbl-loc red">Drop: {b.destination}</span>
                          </div>
                        </td>
                        <td>
                          <span className="tbl-date">{b.date}</span>
                          <span className="tbl-time">{b.time}</span>
                        </td>
                        <td>
                          <div className="tbl-veh-cell">
                            <strong>{b.vehicleName || b.vehicleType}</strong>
                            <span className="tbl-sub">
                              {b.rideType} • {b.vehicleOption === 'ONLY_DRIVER' || b.vehicleOption === 'DRIVER_ONLY' ? 'Only Driver' : 'Driver + Vehicle'}
                              {b.transmission && ` (${b.transmission})`}
                            </span>
                            {b.description && (b.vehicleOption === 'ONLY_DRIVER' || b.vehicleOption === 'DRIVER_ONLY') && (
                              <span style={{ fontSize: '0.73rem', color: '#93c5fd', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                                {b.description}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className={`status-badge ${b.status.toLowerCase()}`}>
                            {b.status}
                          </span>
                        </td>
                        <td>
                          {b.status === 'COMPLETED' ? (
                            <div className="tbl-fare-cell">
                              <span className="fare-tag">₹{b.fare?.toLocaleString('en-IN')}</span>
                              <span className={`comm-tag ${(b.vehicleOption === 'ONLY_DRIVER' || b.vehicleOption === 'DRIVER_ONLY') ? 'driver-only-comm-tag' : ''}`}>
                                {(b.vehicleOption === 'ONLY_DRIVER' || b.vehicleOption === 'DRIVER_ONLY') ? 'Driver-Only: ' : 'Comm: '}₹{b.commissionAmount}
                              </span>
                            </div>
                          ) : (
                            <span className="text-dim">—</span>
                          )}
                        </td>
                        <td>
                          {b.driverName ? (
                            <div className="tbl-driver-cell">
                              <strong>{b.driverName}</strong>
                              <span className="tbl-phone" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                                {b.driverPhone || 'No contact'}
                              </span>
                            </div>
                          ) : (
                            <span className="unassigned-text">Unassigned</span>
                          )}
                        </td>
                        <td>
                          {b.status === 'PENDING' ? (
                            <div className="dispatch-action-group">
                              <select
                                className="driver-select-dropdown"
                                value={driverAssignments[b.id] || ''}
                                onChange={(e) =>
                                  setDriverAssignments({
                                    ...driverAssignments,
                                    [b.id]: e.target.value
                                  })
                                }
                              >
                                <option value="">-- Choose Driver --</option>
                                {drivers.map((d) => (
                                  <option key={d.id || d._id} value={d.id || d._id}>
                                    {d.name} ({d.userEmail || d.email}) - {d.phone} {d.available ? '[Available]' : '[Busy/Offline]'}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                className="assign-btn"
                                onClick={() => handleAssignDriver(b.id)}
                              >
                                Dispatch
                              </button>
                            </div>
                          ) : (
                            <span className="action-completed-label">Dispatched</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* TAB 2: COMMISSION MANAGEMENT */}
        {activeTab === 'COMMISSION' && (
          <section className="glass-panel admin-panel">
            <div className="panel-title-bar flex-between">
              <div>
                <h2>Driver Commission Management & Settlement</h2>
                <p>Track earnings, platform commission, driver settlements, and record manual payments</p>
              </div>
            </div>

            {/* Commission Summary Cards */}
            <div className="comm-overview-cards">
              <div className="comm-overview-card total">
                <span className="cov-label">Total Commission</span>
                <h3 className="cov-val">₹{totalCommission.toLocaleString('en-IN')}</h3>
                <span className="cov-sub">From ₹{totalFare.toLocaleString('en-IN')} total fare</span>
              </div>
              <div className="comm-overview-card driver-only-card" style={{ borderColor: 'rgba(59, 130, 246, 0.4)', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(30, 58, 138, 0.25))' }}>
                <span className="cov-label" style={{ color: '#93c5fd' }}>Driver-Only Comm</span>
                <h3 className="cov-val" style={{ color: '#60a5fa' }}>₹{driverOnlyCommission.toLocaleString('en-IN')}</h3>
                <span className="cov-sub">From customer car driver service</span>
              </div>
              <div className="comm-overview-card vehicle-comm-card" style={{ borderColor: 'rgba(168, 85, 247, 0.4)', background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.12), rgba(88, 28, 135, 0.25))' }}>
                <span className="cov-label" style={{ color: '#d8b4fe' }}>Fleet Rental Comm</span>
                <h3 className="cov-val" style={{ color: '#c084fc' }}>₹{vehicleCommission.toLocaleString('en-IN')}</h3>
                <span className="cov-sub">From car + driver packages</span>
              </div>
              <div className="comm-overview-card paid">
                <span className="cov-label">Paid Commission</span>
                <h3 className="cov-val">₹{paidCommission.toLocaleString('en-IN')}</h3>
                <span className="cov-sub">Settled by drivers</span>
              </div>
              <div className="comm-overview-card pending">
                <span className="cov-label">Pending Commission</span>
                <h3 className="cov-val">₹{pendingCommission.toLocaleString('en-IN')}</h3>
                <span className="cov-sub">Outstanding balance</span>
              </div>
            </div>

            {/* DRIVER-WISE COMMISSION TABLE */}
            <div className="admin-sub-section">
              <h3>Driver-Wise Commission Summary</h3>
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Driver</th>
                      <th>Completed Trips</th>
                      <th>Total Fare</th>
                      <th>Total Commission</th>
                      <th style={{ color: '#60a5fa' }}>Driver-Only Comm</th>
                      <th>Paid Commission</th>
                      <th>Remaining Due</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(!commissionData.driverStats || commissionData.driverStats.length === 0) ? (
                      <tr>
                        <td colSpan="8" className="table-empty">No driver completed rides recorded yet.</td>
                      </tr>
                    ) : (
                      commissionData.driverStats.map((ds) => {
                        const dOnlyComm = ds.driverOnlyCommission ??
                          (commissionData.bookings || [])
                            .filter((b) => (b.driverId === ds.driverId) && (b.vehicleOption === 'ONLY_DRIVER' || b.vehicleOption === 'DRIVER_ONLY'))
                            .reduce((sum, b) => sum + (b.commissionAmount || 0), 0);
                        const dOnlyRides = ds.driverOnlyRides ??
                          (commissionData.bookings || [])
                            .filter((b) => (b.driverId === ds.driverId) && (b.vehicleOption === 'ONLY_DRIVER' || b.vehicleOption === 'DRIVER_ONLY'))
                            .length;
                        return (
                          <tr key={ds.driverId}>
                            <td><strong>{ds.driverName}</strong></td>
                            <td>{ds.completedRides}</td>
                            <td>₹{ds.totalFare?.toLocaleString('en-IN')}</td>
                            <td><strong>₹{ds.totalCommission?.toLocaleString('en-IN')}</strong></td>
                            <td>
                              <span style={{ color: '#93c5fd', fontWeight: 600 }}>
                                ₹{dOnlyComm.toLocaleString('en-IN')}
                                {dOnlyRides > 0 && <span style={{ fontSize: '0.75rem', marginLeft: '4px', opacity: 0.8 }}>({dOnlyRides} trips)</span>}
                              </span>
                            </td>
                            <td>₹{ds.paidCommission?.toLocaleString('en-IN')}</td>
                            <td>
                              <strong className={ds.remainingCommission > 0 ? "text-danger" : "text-muted"}>
                                ₹{ds.remainingCommission?.toLocaleString('en-IN')}
                              </strong>
                            </td>
                            <td>
                              <span className={`comm-status-pill ${ds.status.toLowerCase().replace(' ', '-')}`}>
                                {ds.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* COMPLETED BOOKINGS COMMISSION & RECORD PAYMENT */}
            <div className="admin-sub-section">
              <div className="flex-between">
                <h3>Completed Trips & Commission Ledger</h3>
              </div>

              {/* Search & Filter */}
              <div className="booking-controls-bar">
                <div className="search-input-box">
                  <span className="search-icon" style={{ display: 'inline-flex', alignItems: 'center' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Search by Booking ID, Driver, Customer..."
                    value={commSearchQuery}
                    onChange={(e) => setCommSearchQuery(e.target.value)}
                  />
                </div>

                <div className="status-filter-pills">
                  {[
                    { label: 'ALL', val: 'ALL' },
                    { label: 'DRIVER ONLY', val: 'DRIVER_ONLY' },
                    { label: 'CAB + DRIVER', val: 'CAB_DRIVER' },
                    { label: 'PENDING', val: 'PENDING' },
                    { label: 'PARTIALLY PAID', val: 'PARTIALLY PAID' },
                    { label: 'PAID', val: 'PAID' }
                  ].map((st) => (
                    <button
                      key={st.val}
                      type="button"
                      className={`st-pill ${commStatusFilter === st.val ? 'active' : ''}`}
                      onClick={() => setCommStatusFilter(st.val)}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Booking ID</th>
                      <th>Date</th>
                      <th>Driver</th>
                      <th>Service Type</th>
                      <th>Actual KM</th>
                      <th>Total Fare</th>
                      <th>Comm %</th>
                      <th style={{ color: '#60a5fa' }}>Driver-Only Comm</th>
                      <th>Total Commission</th>
                      <th>Driver Earnings</th>
                      <th>Paid</th>
                      <th>Remaining</th>
                      <th>Status</th>
                      <th>Payment Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCommissionBookings.length === 0 ? (
                      <tr>
                        <td colSpan="14" className="table-empty">No completed rides match your criteria.</td>
                      </tr>
                    ) : (
                      filteredCommissionBookings.map((b) => {
                        const isDriverOnly = b.vehicleOption === 'ONLY_DRIVER' || b.vehicleOption === 'DRIVER_ONLY';
                        return (
                          <tr key={b.id}>
                            <td><span className="tbl-id">{b.bookingId || b.id}</span></td>
                            <td>{b.date}</td>
                            <td><strong>{b.driverName || 'Driver'}</strong></td>
                            <td>
                              {isDriverOnly ? (
                                <span style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#93c5fd', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  Driver Only
                                </span>
                              ) : (
                                <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#6ee7b7', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  Cab + Driver
                                </span>
                              )}
                            </td>
                            <td>{b.actualKm} KM</td>
                            <td><strong>₹{b.fare?.toLocaleString('en-IN')}</strong></td>
                            <td>{b.commissionPercentage || 10}%</td>
                            <td>
                              {isDriverOnly ? (
                                <strong style={{ color: '#60a5fa', fontWeight: 700 }}>
                                  ₹{b.commissionAmount?.toLocaleString('en-IN')}
                                </strong>
                              ) : (
                                <span className="text-dim" style={{ opacity: 0.4 }}>—</span>
                              )}
                            </td>
                            <td>₹{b.commissionAmount?.toLocaleString('en-IN')}</td>
                            <td><strong className="text-success">₹{b.driverEarnings?.toLocaleString('en-IN')}</strong></td>
                            <td>₹{b.commissionPaid?.toLocaleString('en-IN')}</td>
                            <td>
                              <strong className={b.commissionRemaining > 0 ? "text-danger" : "text-muted"}>
                                ₹{b.commissionRemaining?.toLocaleString('en-IN')}
                              </strong>
                            </td>
                            <td>
                              <span className={`comm-status-pill ${String(b.commissionStatus || 'PENDING').toLowerCase().replace(' ', '-')}`}>
                                {b.commissionStatus || 'PENDING'}
                              </span>
                            </td>
                            <td>
                              {b.commissionRemaining > 0 ? (
                                <button
                                  type="button"
                                  className="record-pay-btn"
                                  onClick={() => openRecordPaymentModal(b)}
                                >
                                  Record Payment
                                </button>
                              ) : (
                                <span className="action-completed-label">Settled</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* PAYMENT HISTORY TABLE */}
            <div className="admin-sub-section">
              <h3>Manual Commission Settlement History</h3>
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Payment ID</th>
                      <th>Driver</th>
                      <th>Booking ID</th>
                      <th>Amount Received</th>
                      <th>Payment Date</th>
                      <th>Note / Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentHistory.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="table-empty">No payments recorded yet.</td>
                      </tr>
                    ) : (
                      paymentHistory.map((p) => (
                        <tr key={p.id}>
                          <td><span className="tbl-id">{p.id}</span></td>
                          <td><strong>{p.driverName || 'Driver'}</strong></td>
                          <td><span className="tbl-id">{p.bookingId}</span></td>
                          <td><strong className="text-success">+₹{p.paymentAmount?.toLocaleString('en-IN')}</strong></td>
                          <td>{p.paymentDate}</td>
                          <td><span className="text-dim">{p.note || 'Manual settlement'}</span></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* TAB 3: DRIVER DIRECTORY */}
        {activeTab === 'DRIVERS' && (
          <section className="glass-panel admin-panel">
            <div className="panel-title-bar">
              <h2>Driver Partner Directory</h2>
              <p>Certified fleet drivers, contact numbers, licenses, and availability status</p>
            </div>

            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Driver Name</th>
                    <th>Email Address</th>
                    <th>Phone Number</th>
                    <th>License Number</th>
                    <th>Availability</th>
                    <th>Completed Trips</th>
                  </tr>
                </thead>
                <tbody>
                  {drivers.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="table-empty">No drivers registered in the system.</td>
                    </tr>
                  ) : (
                    drivers.map((d) => {
                      const completedCount = bookings.filter((b) => b.driverId === d.id && b.status === 'COMPLETED').length;
                      return (
                        <tr key={d.id}>
                          <td><strong>{d.name}</strong></td>
                          <td>{d.userEmail || d.email}</td>
                          <td>{d.phone || 'N/A'}</td>
                          <td><span className="license-tag">{d.licenseNumber || 'Verified'}</span></td>
                          <td>
                            <span className={`avail-pill ${d.available ? 'available' : 'busy'}`}>
                              <span className="dot"></span>
                              {d.available ? 'Available' : 'Busy on Trip'}
                            </span>
                          </td>
                          <td>
                            <strong>{completedCount} Trips</strong>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* TAB 4: FLEET & PRICING MANAGEMENT */}
        {activeTab === 'VEHICLES' && (
          <section className="glass-panel admin-panel">
            <div className="panel-title-bar flex-between">
              <div>
                <h2>Fleet & Pricing Package Configuration</h2>
                <p>Define vehicle pricing packages: included distance, base price, extra KM rate, and commission percentage</p>
              </div>
              <button
                type="button"
                className="add-vehicle-btn"
                onClick={openAddVehicleModal}
              >
                + Add New Vehicle
              </button>
            </div>

            <div className="admin-vehicles-grid">
              {vehicles.map((v) => (
                <div key={v.id} className={`admin-veh-card ${v.available === false ? 'is-unavailable' : ''}`}>
                  <div className="admin-veh-img-box">
                    <img src={v.imageUrl} alt={v.name} />
                    <span className="veh-type-badge">{v.type}</span>
                    <span className={`veh-avail-badge ${v.available !== false ? 'status-available' : 'status-unavailable'}`}>
                      {v.available !== false ? 'Available' : 'Currently Unavailable'}
                    </span>
                  </div>
                  <div className="admin-veh-info">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h4>{v.name}</h4>
                      <span className={`veh-status-pill ${v.available !== false ? 'pill-green' : 'pill-red'}`}>
                        {v.available !== false ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                    <p className="admin-veh-specs">
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
                        {v.seats || 4} Seats
                      </span>
                      <span>•</span>
                      <span>{v.ac !== false ? 'AC Included' : 'Non-AC'}</span>
                    </p>

                    {/* Pricing Package Information */}
                    <div className="admin-veh-pricing-box">
                      <div className="pv-row">
                        <span>Fleet Availability:</span>
                        <strong className={v.available !== false ? 'text-success' : 'text-danger'}>
                          {v.available !== false ? 'Available for Booking' : 'Currently Unavailable'}
                        </strong>
                      </div>
                      <div className="pv-row">
                        <span>Included Distance:</span>
                        <strong>{v.includedKm || 300} KM</strong>
                      </div>
                      <div className="pv-row">
                        <span>Base Package Price:</span>
                        <strong className="text-success">₹{(v.basePrice || 5000).toLocaleString('en-IN')}</strong>
                      </div>
                      <div className="pv-row">
                        <span>Extra KM Price:</span>
                        <strong>₹{v.extraKmPrice || 15} / KM</strong>
                      </div>
                      <div className="pv-row">
                        <span>Platform Commission:</span>
                        <strong>{v.commissionPercentage || 10}%</strong>
                      </div>
                    </div>

                    <div className="admin-veh-actions">
                      <button
                        type="button"
                        className={`toggle-avail-btn ${v.available !== false ? 'btn-make-unavail' : 'btn-make-avail'}`}
                        onClick={() => handleToggleVehicleAvailability(v.id)}
                        title={v.available !== false ? 'Click to tag as Currently Unavailable' : 'Click to tag as Available'}
                      >
                        {v.available !== false ? 'Mark Unavailable' : 'Mark Available'}
                      </button>
                      <button
                        type="button"
                        className="edit-veh-btn"
                        onClick={() => openEditVehicleModal(v)}
                      >
                        Edit Pricing
                      </button>
                      <button
                        type="button"
                        className="del-veh-btn"
                        onClick={() => handleDeleteVehicle(v.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TAB 5: SUPPORT REQUESTS */}
        {activeTab === 'SUPPORT' && (
          <section className="glass-panel admin-panel">
            <div className="panel-title-bar">
              <h2>Customer & Driver Problem Reports</h2>
              <p>Resolve tickets raised by riders or drivers</p>
            </div>

            <div className="support-tickets-list">
              {supportRequests.length === 0 ? (
                <div className="driver-empty">
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto', color: '#818cf8' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                  </div>
                  <h3>No support tickets pending</h3>
                  <p>All tickets are resolved or no problems have been reported.</p>
                </div>
              ) : (
                supportRequests.map((req) => (
                  <div key={req.id} className={`support-ticket-card status-${req.status.toLowerCase()}`}>
                    <div className="ticket-header">
                      <div>
                        <span className="ticket-id-tag">Ticket: {req.id}</span>
                        {req.bookingId && <span className="ticket-booking-ref">Ref Booking: {req.bookingId}</span>}
                      </div>
                      <span className={`ticket-status ${req.status.toLowerCase()}`}>{req.status}</span>
                    </div>

                    <div className="ticket-body">
                      <div className="ticket-user-line">
                        <strong>{req.userName} ({req.userRole})</strong>
                        <span>•</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                          {req.phone}
                        </span>
                        <span>•</span>
                        <span className="ticket-category-tag">{req.problemType}</span>
                      </div>
                      <p className="ticket-desc">{req.description}</p>
                      <span className="ticket-time">Reported: {req.createdAt}</span>
                    </div>

                    <div className="ticket-actions">
                      {req.status === 'OPEN' && (
                        <button
                          type="button"
                          className="sup-action-btn in-progress"
                          onClick={() => handleUpdateSupportStatus(req.id, 'IN_PROGRESS')}
                        >
                          Mark In Progress
                        </button>
                      )}
                      {req.status !== 'RESOLVED' && (
                        <button
                          type="button"
                          className="sup-action-btn resolve"
                          onClick={() => handleUpdateSupportStatus(req.id, 'RESOLVED')}
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {/* TAB 6: SETTINGS & COMMISSION */}
        {activeTab === 'SETTINGS' && (
          <section className="glass-panel admin-panel settings-panel">
            <div className="panel-title-bar flex-between">
              <div>
                <h2>Platform Settings & Commission Rates</h2>
                <p>Configure company contact channels, set Driver-Only trip rates, and manage platform commission percentages.</p>
              </div>
            </div>

            {settingsError && (
              <div className="alert-box error">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                  {settingsError}
                </span>
              </div>
            )}

            {settingsSuccess && (
              <div className="alert-box success">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  {settingsSuccess}
                </span>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="settings-form">
              <div className="settings-grid">
                {/* CARD 1: Support & Contact Details */}
                <div className="settings-card glass-panel">
                  <div className="settings-card-header">
                    <span className="sc-icon" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                    </span>
                    <div>
                      <h3>Official Contact Information</h3>
                      <p>Company support telephone and email displayed across the entire platform.</p>
                    </div>
                  </div>

                  <div className="settings-card-body">
                    <div className="form-group">
                      <label htmlFor="cfgPhone">Admin / Support Phone Number (Click-to-Call)</label>
                      <input
                        id="cfgPhone"
                        type="text"
                        placeholder="e.g. +91 98765 43210"
                        value={settings.contactPhone}
                        onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                        required
                      />
                      <small className="field-hint">
                        Syncs dynamically to Welcome Page top nav & footer, Customer booking screen, and Driver assistance button.
                      </small>
                    </div>

                    <div className="form-group">
                      <label htmlFor="cfgEmail">Support / Admin Email Address</label>
                      <input
                        id="cfgEmail"
                        type="email"
                        placeholder="support@rideflow.com"
                        value={settings.contactEmail}
                        onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                        required
                      />
                      <small className="field-hint">
                        Official contact email for inbound passenger and driver communications.
                      </small>
                    </div>
                  </div>
                </div>

                {/* CARD 2: Driver-Only Hourly & Daily Pricing & Commission */}
                <div className="settings-card glass-panel">
                  <div className="settings-card-header">
                    <span className="sc-icon" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    </span>
                    <div>
                      <h3>Driver-Only Pricing & Hourly Commission</h3>
                      <p>Rates when a customer brings their personal vehicle and hires only a driver (Hourly & Daily model).</p>
                    </div>
                  </div>

                  <div className="settings-card-body">
                    <div className="form-row-2">
                      <div className="form-group">
                        <label htmlFor="dMinDaily">Minimum Booking Price for 1 Day (₹)</label>
                        <input
                          id="dMinDaily"
                          type="number"
                          min="0"
                          step="50"
                          placeholder="e.g. 1200"
                          value={settings.driverOnlyMinDailyPrice}
                          onChange={(e) => setSettings({ ...settings, driverOnlyMinDailyPrice: e.target.value })}
                          required
                        />
                        <small className="field-hint">Guaranteed minimum driver booking fare for full day (8+ hours)</small>
                      </div>

                      <div className="form-group highlight-comm">
                        <label htmlFor="dComm">Driver-Only Commission Rate (%)</label>
                        <input
                          id="dComm"
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          placeholder="e.g. 15"
                          value={settings.driverOnlyCommissionPercentage}
                          onChange={(e) => setSettings({ ...settings, driverOnlyCommissionPercentage: e.target.value })}
                          required
                        />
                        <small className="field-hint">Platform commission percentage deducted from driver earnings</small>
                      </div>
                    </div>

                    <div className="form-row-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                      <div className="form-group">
                        <label htmlFor="dBase">Base Service Fare (₹)</label>
                        <input
                          id="dBase"
                          type="number"
                          min="0"
                          step="10"
                          placeholder="e.g. 600"
                          value={settings.driverOnlyBasePrice}
                          onChange={(e) => setSettings({ ...settings, driverOnlyBasePrice: e.target.value })}
                          required
                        />
                        <small className="field-hint">Starting base charge for driver</small>
                      </div>

                      <div className="form-group">
                        <label htmlFor="dHours">Included Duration (Hours)</label>
                        <input
                          id="dHours"
                          type="number"
                          min="0"
                          step="0.5"
                          placeholder="e.g. 4"
                          value={settings.driverOnlyIncludedHours}
                          onChange={(e) => setSettings({ ...settings, driverOnlyIncludedHours: e.target.value })}
                          required
                        />
                        <small className="field-hint">Hours covered within base service fare</small>
                      </div>

                      <div className="form-group">
                        <label htmlFor="dExtraHour">Extra Hour Rate (₹/Hour)</label>
                        <input
                          id="dExtraHour"
                          type="number"
                          min="0"
                          step="10"
                          placeholder="e.g. 100"
                          value={settings.driverOnlyExtraHourRate}
                          onChange={(e) => setSettings({ ...settings, driverOnlyExtraHourRate: e.target.value })}
                          required
                        />
                        <small className="field-hint">Hourly rate charged beyond included hours</small>
                      </div>
                    </div>

                    {/* Live Commission Simulator Box */}
                    <div className="sim-box">
                      <div className="sim-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                        <span>Live Driver-Only Fare & Commission Simulation (Sample 6 Hours Booking):</span>
                      </div>
                      <div className="sim-grid">
                        <div className="sim-item">
                          <span>Total Customer Fare:</span>
                          <strong>
                            ₹{(
                              (parseFloat(settings.driverOnlyBasePrice) || 0) +
                              Math.max(0, 6 - (parseFloat(settings.driverOnlyIncludedHours) || 0)) * (parseFloat(settings.driverOnlyExtraHourRate) || 0)
                            ).toLocaleString('en-IN')}
                          </strong>
                        </div>
                        <div className="sim-item comm-highlight">
                          <span>Platform Commission ({settings.driverOnlyCommissionPercentage}%):</span>
                          <strong>
                            ₹{(
                              Math.round(
                                ((parseFloat(settings.driverOnlyBasePrice) || 0) +
                                  Math.max(0, 6 - (parseFloat(settings.driverOnlyIncludedHours) || 0)) * (parseFloat(settings.driverOnlyExtraHourRate) || 0)) *
                                  ((parseFloat(settings.driverOnlyCommissionPercentage) || 0) / 100) *
                                  100
                              ) / 100
                            ).toLocaleString('en-IN')}
                          </strong>
                        </div>
                        <div className="sim-item">
                          <span>Driver Net Payout:</span>
                          <strong>
                            ₹{(
                              Math.round(
                                ((parseFloat(settings.driverOnlyBasePrice) || 0) +
                                  Math.max(0, 6 - (parseFloat(settings.driverOnlyIncludedHours) || 0)) * (parseFloat(settings.driverOnlyExtraHourRate) || 0)) *
                                  (1 - (parseFloat(settings.driverOnlyCommissionPercentage) || 0) / 100) *
                                  100
                              ) / 100
                            ).toLocaleString('en-IN')}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CARD 3: Fleet Default Commission */}
                <div className="settings-card glass-panel">
                  <div className="settings-card-header">
                    <span className="sc-icon" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
                    </span>
                    <div>
                      <h3>Fleet Vehicle Default Commission</h3>
                      <p>Default platform cut for rental vehicle packages that do not have custom rate overrides.</p>
                    </div>
                  </div>

                  <div className="settings-card-body">
                    <div className="form-group">
                      <label htmlFor="vehDefComm">Default Fleet Commission Percentage (%)</label>
                      <input
                        id="vehDefComm"
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        placeholder="e.g. 10"
                        value={settings.defaultVehicleCommissionPercentage}
                        onChange={(e) => setSettings({ ...settings, defaultVehicleCommissionPercentage: e.target.value })}
                        required
                      />
                      <small className="field-hint">
                        Note: You can also customize commission individually for each vehicle in the <strong>Fleet & Pricing</strong> tab.
                      </small>
                    </div>
                  </div>
                </div>
              </div>

              <div className="settings-footer-bar">
                <button type="submit" className="save-settings-btn" disabled={savingSettings} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                  <span>{savingSettings ? 'Saving Settings...' : 'Save Platform Settings & Commission Rates'}</span>
                </button>
              </div>
            </form>
          </section>
        )}
      </main>

      {/* VEHICLE MODAL */}
      {showVehicleModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3>{editingVehicleId ? 'Edit Vehicle & Pricing Package' : 'Add New Vehicle & Pricing Package'}</h3>
              <button type="button" className="modal-close" onClick={() => setShowVehicleModal(false)}>×</button>
            </div>

            {modalError && (
              <div className="alert-box error">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                  {modalError}
                </span>
              </div>
            )}

            <form onSubmit={handleSaveVehicle} className="modal-form">
              <div className="form-group">
                <label>Vehicle Name</label>
                <input
                  type="text"
                  placeholder="e.g. Toyota Innova Crysta"
                  value={vehName}
                  onChange={(e) => setVehName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Vehicle Category</label>
                <select value={vehType} onChange={(e) => setVehType(e.target.value)}>
                  <option value="SEDAN">SEDAN</option>
                  <option value="SUV">SUV</option>
                  <option value="LUXURY">LUXURY</option>
                  <option value="VINTAGE">VINTAGE</option>
                  <option value="TRAVELLER">TRAVELLER</option>
                </select>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Seating Capacity</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={vehSeats}
                    onChange={(e) => setVehSeats(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Air Conditioning (AC)</label>
                  <select value={vehAc ? 'true' : 'false'} onChange={(e) => setVehAc(e.target.value === 'true')}>
                    <option value="true">AC Included</option>
                    <option value="false">Non-AC</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Vehicle Availability Status</label>
                <select
                  value={vehAvailable ? 'true' : 'false'}
                  onChange={(e) => setVehAvailable(e.target.value === 'true')}
                  style={{
                    borderColor: vehAvailable ? '#22c55e' : '#ef4444',
                    background: vehAvailable ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)'
                  }}
                >
                  <option value="true">Available (Ready for Customer Bookings)</option>
                  <option value="false">Currently Unavailable (Maintenance / Not in Service)</option>
                </select>
                <small style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                  Tagging a car as "Currently Unavailable" disables it on the customer booking screen so passengers cannot book it.
                </small>
              </div>

              {/* PRICING PACKAGE FIELDS */}
              <div className="modal-sub-heading">Pricing Package Configuration</div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Included Distance (KM)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 300"
                    value={vehIncludedKm}
                    onChange={(e) => setVehIncludedKm(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Base Package Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 8000"
                    value={vehBasePrice}
                    onChange={(e) => setVehBasePrice(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Extra KM Price (₹/KM)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 18"
                    value={vehExtraKmPrice}
                    onChange={(e) => setVehExtraKmPrice(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Commission Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="e.g. 10"
                    value={vehCommissionPercentage}
                    onChange={(e) => setVehCommissionPercentage(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="vehImgInput">Image URL</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="vehImgInput"
                    type="text"
                    inputMode="url"
                    autoComplete="off"
                    spellCheck="false"
                    placeholder="https://images.unsplash.com/..."
                    value={vehImageUrl}
                    onChange={(e) => setVehImageUrl(e.target.value)}
                    style={{ paddingRight: vehImageUrl ? '70px' : '14px', cursor: 'text' }}
                  />
                  {vehImageUrl && (
                    <button
                      type="button"
                      onClick={() => setVehImageUrl('')}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: 'none',
                        color: '#94a3b8',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        cursor: 'pointer'
                      }}
                    >
                      Clear
                    </button>
                  )}
                </div>
                <small style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                  Paste a direct image link (JPEG, PNG, WebP, or Unsplash)
                </small>
              </div>

              {vehImageUrl && vehImageUrl.trim().length > 10 && (vehImageUrl.trim().startsWith('http://') || vehImageUrl.trim().startsWith('https://') || vehImageUrl.trim().startsWith('data:image/')) && (
                <div className="preview-container">
                  <div className="preview-header">
                    <span className="preview-label">Live Preview:</span>
                    <span className="preview-hint">Image preview from link</span>
                  </div>
                  <div className="preview-img-wrapper">
                    <img
                      src={vehImageUrl.trim()}
                      alt="Preview"
                      className="veh-preview-img"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const err = e.currentTarget.parentElement?.querySelector('.preview-error-msg');
                        if (err) err.style.display = 'block';
                      }}
                      onLoad={(e) => {
                        e.currentTarget.style.display = 'block';
                        const err = e.currentTarget.parentElement?.querySelector('.preview-error-msg');
                        if (err) err.style.display = 'none';
                      }}
                    />
                    <div className="preview-error-msg" style={{ display: 'none' }}>
                      Unable to load image preview from this URL. Please verify the link.
                    </div>
                  </div>
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="modal-cancel-btn" onClick={() => setShowVehicleModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="modal-save-btn">
                  {editingVehicleId ? 'Save Package Changes' : 'Save New Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD COMMISSION PAYMENT MODAL */}
      {showPaymentModal && selectedBookingForPayment && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Record Commission Payment</h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowPaymentModal(false)}
                disabled={savingPayment}
              >
                ×
              </button>
            </div>

            <div className="complete-ride-details">
              <div className="cr-row">
                <span>Driver:</span>
                <strong>{selectedBookingForPayment.driverName}</strong>
              </div>
              <div className="cr-row">
                <span>Booking ID:</span>
                <strong>{selectedBookingForPayment.bookingId || selectedBookingForPayment.id}</strong>
              </div>
              <div className="cr-row">
                <span>Total Commission:</span>
                <strong>₹{selectedBookingForPayment.commissionAmount?.toLocaleString('en-IN')}</strong>
              </div>
              <div className="cr-row">
                <span>Already Paid:</span>
                <strong className="text-success">₹{selectedBookingForPayment.commissionPaid?.toLocaleString('en-IN')}</strong>
              </div>
              <div className="cr-row">
                <span>Remaining Due:</span>
                <strong className="text-danger">₹{selectedBookingForPayment.commissionRemaining?.toLocaleString('en-IN')}</strong>
              </div>
            </div>

            {paymentError && (
              <div className="alert-box error">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                  {paymentError}
                </span>
              </div>
            )}

            {paymentSuccess && (
              <div className="alert-box success">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  {paymentSuccess}
                </span>
              </div>
            )}

            <form onSubmit={handleRecordPayment} className="modal-form">
              <div className="form-group">
                <label htmlFor="payAmt">Payment Amount (₹):</label>
                <input
                  id="payAmt"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={selectedBookingForPayment.commissionRemaining}
                  placeholder="Enter amount paid"
                  value={paymentAmountInput}
                  onChange={(e) => setPaymentAmountInput(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="payDate">Payment Date:</label>
                <input
                  id="payDate"
                  type="date"
                  value={paymentDateInput}
                  onChange={(e) => setPaymentDateInput(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="payNote">Payment Note / Reference (Optional):</label>
                <input
                  id="payNote"
                  type="text"
                  placeholder="e.g. Cash settlement, UPI Txn 12345"
                  value={paymentNoteInput}
                  onChange={(e) => setPaymentNoteInput(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={() => setShowPaymentModal(false)}
                  disabled={savingPayment}
                >
                  Cancel
                </button>
                <button type="submit" className="modal-save-btn" disabled={savingPayment}>
                  {savingPayment ? 'Saving...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
