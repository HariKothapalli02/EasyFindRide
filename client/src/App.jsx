import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ProfilePage from './pages/ProfilePage';
import BookingsPage from './pages/BookingsPage';
import SupportPage from './pages/SupportPage';
import WalletPage from './pages/WalletPage';
import TrackingPage from './pages/TrackingPage';
import CabPoolDetails from './pages/CabPoolDetails';
import CabPoolTracking from './pages/CabPoolTracking';
import DriverCreatePoolRide from './components/pool/DriverCreatePoolRide';
import FloatingTracker from './components/FloatingTracker';
import GlobalRequestPopup from './components/GlobalRequestPopup';
import './styles/globals.css';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" />;
  return children;
};

const MainLayout = ({ children }) => {
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = () => {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          setIsAdmin(user.role === 'admin');
        } catch (e) {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    };

    checkAdmin();
    // Listen for storage changes and route transitions
    window.addEventListener('storage', checkAdmin);
    return () => window.removeEventListener('storage', checkAdmin);
  }, [location]);

  return (
    <div className={isAdmin ? "w-full min-h-screen bg-grayBg relative overflow-x-hidden" : "app-wrapper"}>
      {children}
    </div>
  );
};

function App() {
  return (
    <Router>
      <MainLayout>
        <FloatingTracker />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/bookings" element={<ProtectedRoute><BookingsPage /></ProtectedRoute>} />
          <Route path="/support" element={<ProtectedRoute><SupportPage /></ProtectedRoute>} />
          <Route path="/wallet" element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />
          <Route path="/tracking" element={<ProtectedRoute><TrackingPage /></ProtectedRoute>} />
          <Route path="/pool/create" element={<ProtectedRoute><DriverCreatePoolRide /></ProtectedRoute>} />
          <Route path="/pool/search" element={<ProtectedRoute><CabPoolDetails /></ProtectedRoute>} />
          <Route path="/pool/track/:poolRideId" element={<ProtectedRoute><CabPoolTracking /></ProtectedRoute>} />
        </Routes>
      </MainLayout>
    </Router>
  );
}

export default App;
