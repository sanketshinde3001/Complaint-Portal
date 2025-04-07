import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// adminOnly prop determines if the route requires admin privileges
const ProtectedRoute = ({ adminOnly = false }) => {
  const { isLoggedIn, isAdmin, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    // Show a loading indicator while checking auth status
    return <div className="text-center mt-10">Loading authentication status...</div>;
  }

  // Redirect logged-in users trying to access the landing page ('/')
  if (isLoggedIn && location.pathname === '/') {
      return <Navigate to="/home" replace />;
  }

  // If user is not logged in, redirect non-landing page access to login
  if (!isLoggedIn && location.pathname !== '/') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If the route requires admin and the user is not an admin (and is logged in)
  if (isLoggedIn && adminOnly && !isAdmin) {
    return <Navigate to="/home" replace />; // Redirect non-admins from admin routes to home
  }

  // If checks pass (or it's the landing page for a logged-out user), render the child routes/component
  // Note: This component wrapping non-protected routes like '/' might need adjustment
  // if landing page should be accessible *only* when logged out.
  // The current logic allows logged-out users to see '/' and redirects logged-in users from '/'.
  return <Outlet />;
};

export default ProtectedRoute;

// IMPORTANT NOTE: This setup assumes '/' (LandingPage) is NOT wrapped by ProtectedRoute in App.jsx.
// If '/' IS wrapped, the logic needs adjustment to allow logged-out access to '/'.
// Based on the App.jsx structure, '/' is NOT wrapped, so this logic should work.
