import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './utils/authService';
import { pageview, trackAuthentication } from './utils/analytics';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/Login';
import Signup from './components/Signup';
import ForgotPassword from './components/ForgotPassword';
import Home from './pages/Home';
import TestView from './pages/TestView';
import TestResult from './pages/TestResult';
import Performance from './pages/Performance';
import UserProfile from './pages/UserProfile';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import Snapshot2025 from './pages/Snapshot2025';
import CurrentAffairsQuiz from './pages/CurrentAffairsQuiz';
import UntimedPractice from './pages/UntimedPractice';
import FeedbackButton from './components/FeedbackButton';
import './App.css';

// Loading component
const AppLoading = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p className="text-gray-600">Loading application...</p>
    </div>
  </div>
);

// Auth redirect component for authenticated users
const AuthRedirect = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <AppLoading />;
  }

  if (isAuthenticated) {
    const from = location.state?.from?.pathname || '/';
    return <Navigate to={from} replace />;
  }

  return children;
};

// Layout components
const AuthenticatedLayout = ({ children }) => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  
  return (
    <>
      {!isAdminRoute && <Navbar />}
      {children}
      {!isAdminRoute && <FeedbackButton />}
    </>
  );
};

const PublicLayout = ({ children }) => {
  const location = useLocation();
  const isAuthPage = ['/login', '/signup', '/forgot-password'].includes(location.pathname);
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isSnapshotPage = location.pathname === '/2025-snapshot';
  const isCurrentAffairsQuiz = location.pathname === '/jan-2026-current-affairs';
  
  return (
    <>
      {!isAuthPage && !isAdminRoute && !isSnapshotPage && !isCurrentAffairsQuiz && <Navbar />}
      {children}
      {!isAuthPage && !isAdminRoute && <FeedbackButton />}
    </>
  );
};

// Main App Content
const AppContent = () => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!loading) {
      const getPageTitle = (pathname) => {
        switch (pathname) {
          case '/': return 'Home - Civils Coach';
          case '/login': return 'Login - Civils Coach';
          case '/signup': return 'Sign Up - Civils Coach';
          case '/forgot-password': return 'Reset Password - Civils Coach';
          case '/2025-snapshot': return '2025 Year in Review Quiz - Civils Coach';
          case '/jan-2026-current-affairs': return 'January 2026 Current Affairs Quiz - Civils Coach';
          case '/admin': return 'Admin Login - Civils Coach';
          case '/admin/dashboard': return 'Admin Dashboard - Civils Coach';
          case '/performance': return 'Performance Analytics - Civils Coach';
          case '/profile': return 'User Profile - Civils Coach';
          case '/test-result': return 'Test Results - Civils Coach';
          case '/untimed-practice': return 'Untimed Practice - Civils Coach';
          default:
            if (pathname.startsWith('/test/')) return 'Taking Test - Civils Coach';
            return 'Civils Coach - UPSC Preparation';
        }
      };

      const pageTitle = getPageTitle(location.pathname);
      pageview(location.pathname + location.search, pageTitle);

      if (location.pathname === '/login' && isAuthenticated) {
        trackAuthentication('login_success', { label: 'password_login' });
      } else if (location.pathname === '/signup' && isAuthenticated) {
        trackAuthentication('signup_success', { label: 'new_account' });
      }
    }
  }, [location, loading, isAuthenticated]);

  if (loading) {
    return <AppLoading />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Authentication Routes */}
        <Route 
          path="/signup" 
          element={
            <AuthRedirect>
              <PublicLayout>
                <Signup />
              </PublicLayout>
            </AuthRedirect>
          } 
        />

        <Route 
          path="/login" 
          element={
            <AuthRedirect>
              <PublicLayout>
                <Login />
              </PublicLayout>
            </AuthRedirect>
          } 
        />

        <Route 
          path="/forgot-password" 
          element={
            <AuthRedirect>
              <PublicLayout>
                <ForgotPassword />
              </PublicLayout>
            </AuthRedirect>
          } 
        />
        
        {/* Public Routes */}
        <Route 
          path="/2025-snapshot" 
          element={
            <PublicLayout>
              <Snapshot2025 />
            </PublicLayout>
          } 
        />

        <Route 
          path="/jan-2026-current-affairs" 
          element={
            <PublicLayout>
              <CurrentAffairsQuiz />
            </PublicLayout>
          } 
        />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />

        {/* Protected Routes */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <Home />
              </AuthenticatedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/test/:id" 
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <TestView />
              </AuthenticatedLayout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/untimed-practice" 
          element={
            <ProtectedRoute>
              <UntimedPractice />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/test-result" 
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <TestResult />
              </AuthenticatedLayout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/performance/analysis/:recordId"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <TestResult />
              </AuthenticatedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/performance" 
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <Performance />
              </AuthenticatedLayout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <UserProfile />
              </AuthenticatedLayout>
            </ProtectedRoute>
          } 
        />

        {/* Terms and Privacy pages */}
        <Route 
          path="/terms" 
          element={
            <PublicLayout>
              <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
                <div className="max-w-4xl w-full">
                  <div className="bg-white shadow rounded-lg p-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>
                    <p className="text-gray-600">Terms of Service content will be added soon.</p>
                  </div>
                </div>
              </div>
            </PublicLayout>
          } 
        />
        
        <Route 
          path="/privacy" 
          element={
            <PublicLayout>
              <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
                <div className="max-w-4xl w-full">
                  <div className="bg-white shadow rounded-lg p-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
                    <p className="text-gray-600">Privacy Policy content will be added soon.</p>
                  </div>
                </div>
              </div>
            </PublicLayout>
          } 
        />

        {/* Help and Support pages */}
        <Route 
          path="/help" 
          element={
            <PublicLayout>
              <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
                <div className="max-w-4xl w-full">
                  <div className="bg-white shadow rounded-lg p-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-6">Help & Support</h1>
                    <div className="space-y-4">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Contact Us</h2>
                        <p className="text-gray-600">Email: support@civilscoach.com</p>
                        <p className="text-gray-600">Response time: Within 24 hours</p>
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Getting Started</h2>
                        <p className="text-gray-600">
                          Create your account, verify your email and phone, then start taking practice tests 
                          to prepare for civil services examinations.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </PublicLayout>
          } 
        />

        {/* About page */}
        <Route 
          path="/about" 
          element={
            <PublicLayout>
              <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
                <div className="max-w-4xl w-full">
                  <div className="bg-white shadow rounded-lg p-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-6">About Civils Coach</h1>
                    <div className="space-y-6 text-gray-600">
                      <p>
                        Civils Coach is a comprehensive online platform designed to help aspirants prepare 
                        effectively for civil services examinations.
                      </p>
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Our Features</h2>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Practice Tests with Previous Year Questions</li>
                          <li>Detailed Performance Analytics</li>
                          <li>Timed Test Environment</li>
                          <li>Progress Tracking</li>
                          <li>Subject-wise Question Banks</li>
                          <li>Untimed Practice for Self-Paced Learning</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </PublicLayout>
          } 
        />

        {/* Fallback Routes */}
        <Route 
          path="*" 
          element={
            isAuthenticated ? (
              <Navigate to="/" replace />
            ) : (
              <Navigate to="/signup" replace />
            )
          } 
        />
      </Routes>
    </div>
  );
};

function App() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <AppLoading />;
  }

  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;