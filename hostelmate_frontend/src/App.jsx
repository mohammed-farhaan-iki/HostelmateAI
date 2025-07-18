// src/App.jsx
import React, { useState, createContext, useContext, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Outlet, Navigate } from 'react-router-dom';
import './index.css';
import { ToastContainer } from 'react-toastify'; // <--- IMPORTANT: Import ToastContainer
import 'react-toastify/dist/ReactToastify.css'; // <--- IMPORTANT: Import Toastify CSS

// Import Layout component
import Layout from './components/Layout.jsx';

// Import page components
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import PropertiesListPage from './pages/PropertiesListPage.jsx';
import UnitsPage from './pages/UnitsPage.jsx';
import BedsPage from './pages/BedsPage.jsx';
import TenantsPage from './pages/TenantsPage.jsx';
import BookingAgreementsPage from './pages/BookingAgreementsPage.jsx';
import PaymentsPage from './pages/PaymentsPage.jsx';
import ExpensesPage from './pages/ExpensesPage.jsx';
import SubscriptionPlansPage from './pages/SubscriptionPlansPage.jsx';
import SubscriptionsPage from './pages/SubscriptionsPage.jsx';
import SubscriptionRequiredPage from './pages/SubscriptionRequiredPage.jsx';
import PaymentGatewayPage from './pages/PaymentGatewayPage.jsx';

// --- Auth Context ---
const AuthContext = createContext(null);

// Custom hook to use Auth Context (Exported for use in other components like Layout)
export const useAuth = () => {
  return useContext(AuthContext);
};

// --- API Configuration ---
const API_BASE_URL = 'http://127.0.0.1:8000'; // Your Django backend URL

// --- Auth Provider Component ---
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken') || null);
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refreshToken') || null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeAuth = async () => {
      if (accessToken) {
        await fetchUser();
      }
      setLoadingAuth(false);
    };
    initializeAuth();
  }, [accessToken]);

  const fetchUser = async () => {
    if (!accessToken) {
      setUser(null);
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/auth/users/me/`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      if (response.ok) {
        const userData = await response.json();
        console.log("Fetched user data:", userData); // <--- Debug user data
        setUser(userData);
      } else if (response.status === 401) {
        console.log("Access token expired, attempting refresh...");
        await refreshAccessToken();
      } else {
        console.error('Failed to fetch user data with status:', response.status, await response.json());
        logout();
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      logout();
    }
  };

  const refreshAccessToken = async () => {
    if (!refreshToken) {
      console.log("No refresh token available, logging out.");
      logout();
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/auth/jwt/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });
      if (response.ok) {
        const data = await response.json();
        setAccessToken(data.access);
        localStorage.setItem('accessToken', data.access);
        console.log("Access token refreshed.");
        await fetchUser(); // Re-fetch user data with new access token
      } else {
        console.error("Failed to refresh token:", response.status, await response.json());
        logout();
      }
    } catch (error) {
      console.error('Failed to refresh token:', error);
      logout();
    }
  };


  const login = async (username, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/jwt/create/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        setAccessToken(data.access);
        setRefreshToken(data.refresh);
        localStorage.setItem('accessToken', data.access);
        localStorage.setItem('refreshToken', data.refresh);
        await fetchUser(); // Fetch user details immediately after login
        navigate('/dashboard');
        return true;
      } else {
        const errorData = await response.json();
        console.error('Login failed:', errorData);
        alert(`Login failed: ${JSON.stringify(errorData)}`);
        return false;
      }
    } catch (error) {
      console.error('Login request failed:', error);
      alert('Login request failed. Please check your network connection.');
      return false;
    }
    return true;
  };

  const logout = () => {
    console.log("Logging out...");
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigate('/login');
  };

  const authContextValue = {
    user,
    accessToken,
    refreshToken,
    login,
    logout,
    isAuthenticated: !!user,
    loadingAuth,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// --- Protected Route Component ---
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loadingAuth, user } = useAuth();
  const navigate = useNavigate();

  // Debugging: Log the user object and its superuser status
  useEffect(() => {
      if (!loadingAuth) {
          console.log("ProtectedRoute - User object:", user);
          console.log("ProtectedRoute - user.is_superuser:", user ? user.is_superuser : "User is null/undefined");
          console.log("ProtectedRoute - user.has_active_subscription:", user ? user.has_active_subscription : "User is null/undefined");
      }
  }, [loadingAuth, user]); // Log whenever auth state or user object changes

  // 1. Still loading authentication state
  if (loadingAuth) {
    console.log("ProtectedRoute: Loading authentication...");
    return <div className="text-center p-8 text-xl font-semibold">Loading authentication...</div>;
  }

  // 2. Not authenticated at all
  if (!isAuthenticated) {
    console.log("ProtectedRoute: Not authenticated, redirecting to login.");
    return <Navigate to="/login" replace />;
  }

  // At this point, isAuthenticated is true, and user object should be loaded (or null if auth failed silently)

  // 3. Superuser bypass (Admins always have access)
  if (user && user.is_superuser) { // <--- This is the line we're debugging
      console.log("ProtectedRoute: User is superuser, granting access.");
      return children;
  }

  // 4. Check for active subscription for regular users
  if (user && !user.has_active_subscription) {
    const currentPath = window.location.pathname;
    console.log(`ProtectedRoute: User (${user.username}) has no active subscription. Current path: ${currentPath}`);
    // List of pages accessible without an active subscription for regular users
    const allowedPathsWithoutSubscription = [
      '/subscription-plans',
      '/subscriptions', // To view/create their own subscription
      '/subscription-required',
      '/payment-gateway'
    ];

    if (!allowedPathsWithoutSubscription.includes(currentPath)) {
      console.log("ProtectedRoute: Redirecting to /subscription-required.");
      return <Navigate to="/subscription-required" replace />;
    }
  }

  // If none of the above conditions trigger a redirect, grant access
  console.log("ProtectedRoute: Granting access to", window.location.pathname);
  return children;
};

// --- Main App Component ---
function App() {
  return (
    <Router>
      <AuthProvider>
        {/* ToastContainer must be rendered once at the root of your app */}
        <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
        <Routes>
          {/* Public Routes (Login, Register, Subscription Required, Payment Gateway) */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/subscription-required" element={<SubscriptionRequiredPage />} />
          <Route path="/payment-gateway" element={<PaymentGatewayPage />} />

          {/* Authenticated Routes - Wrapped by Layout and ProtectedRoute */}
          <Route element={<Layout><Outlet /></Layout>}>
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/properties" element={<ProtectedRoute><PropertiesListPage /></ProtectedRoute>} />
            <Route path="/units" element={<ProtectedRoute><UnitsPage /></ProtectedRoute>} />
            <Route path="/beds" element={<ProtectedRoute><BedsPage /></ProtectedRoute>} />
            <Route path="/tenants" element={<ProtectedRoute><TenantsPage /></ProtectedRoute>} />
            <Route path="/bookings" element={<ProtectedRoute><BookingAgreementsPage /></ProtectedRoute>} />
            <Route path="/payments" element={<ProtectedRoute><PaymentsPage /></ProtectedRoute>} />
            <Route path="/expenses" element={<ProtectedRoute><ExpensesPage /></ProtectedRoute>} />
            <Route path="/subscription-plans" element={<ProtectedRoute><SubscriptionPlansPage /></ProtectedRoute>} />
            <Route path="/subscriptions" element={<ProtectedRoute><SubscriptionsPage /></ProtectedRoute>} />

            {/* Default redirect for authenticated users */}
            <Route path="/" element={<ProtectedRoute><Navigate to="/dashboard" replace /></ProtectedRoute>} />
          </Route>

          {/* Catch-all for undefined routes, redirects to login if not found */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;