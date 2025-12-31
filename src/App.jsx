import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './utils/authService';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import OTPLogin from './components/OTPLogin';
import Home from './pages/Home';
import TestView from './pages/TestView';
import TestResult from './pages/TestResult';
import Performance from './pages/Performance';
import UserProfile from './pages/UserProfile';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import Snapshot2025 from './pages/Snapshot2025';
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

// Login redirect component
const LoginRedirect = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <AppLoading />;
  }

  if (isAuthenticated) {
    // If user is authenticated and trying to access login, redirect to intended page or home
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
    </>
  );
};

const PublicLayout = ({ children }) => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isSnapshotPage = location.pathname === '/2025-snapshot';
  
  return (
    <>
      {!isLoginPage && !isAdminRoute && !isSnapshotPage && <Navbar />}
      {children}
    </>
  );
};

// Main App Content
const AppContent = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <AppLoading />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={
            <LoginRedirect>
              <PublicLayout>
                <OTPLogin />
              </PublicLayout>
            </LoginRedirect>
          } 
        />
        
        {/* 2025 Snapshot - Advertisement Quiz */}
        <Route 
          path="/2025-snapshot" 
          element={
            <PublicLayout>
              <Snapshot2025 />
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

        {/* Enhanced TestResult route for detailed analysis */}
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
          path="/performance" 
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <Performance />
              </AuthenticatedLayout>
            </ProtectedRoute>
          } 
        />

        {/* New User Profile route */}
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

        {/* Fallback route */}
        <Route 
          path="*" 
          element={
            isAuthenticated ? (
              <Navigate to="/" replace />
            ) : (
              <Navigate to="/login" replace />
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