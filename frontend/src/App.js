import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import WelcomePage from './pages/WelcomePage';
import AuthPage from './pages/AuthPage';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Booking from './pages/Booking';
import DriverDashboard from './pages/DriverDashboard';
import AdminDashboard from './pages/AdminDashboard';
import CookieConsent from './components/CookieConsent';
import PrivacyPolicyModal from './components/PrivacyPolicyModal';

// Helper to safely fetch logged-in user from localStorage
const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('rideflow_user') || localStorage.getItem('user');
    if (!raw) return null;
    const user = JSON.parse(raw);
    return user && user.role ? user : null;
  } catch (e) {
    localStorage.removeItem('rideflow_user');
    localStorage.removeItem('user');
    return null;
  }
};

// Realistic role-based protection: requires genuine logged-in user with matching role
const ProtectedRoute = ({ allowedRole, children }) => {
  const user = getStoredUser();
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  if (user.role !== allowedRole) {
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
    if (user.role === 'DRIVER') return <Navigate to="/driver" replace />;
    return <Navigate to="/booking" replace />;
  }
  return children;
};

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Role-protected dashboards */}
        <Route
          path="/booking"
          element={
            <ProtectedRoute allowedRole="USER">
              <Booking />
            </ProtectedRoute>
          }
        />
        <Route
          path="/driver"
          element={
            <ProtectedRoute allowedRole="DRIVER">
              <DriverDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRole="ADMIN">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* DPDP Act 2023 Compliance Components */}
      <CookieConsent />
      <PrivacyPolicyModal />
    </Router>
  );
}

export default App;
